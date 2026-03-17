import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RolUsuario } from '@prisma/client';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/asesores/[id] - Get individual advisor
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const asesor = await db.asesor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
            imagenUrl: true,
            cargo: true,
            activo: true,
            ultimoAcceso: true,
          },
        },
        comite: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            color: true,
            icono: true,
          },
        },
        comitesLiderados: {
          select: {
            id: true,
            nombre: true,
            color: true,
          },
        },
        _count: {
          select: {
            consultasPrincipal: true,
            consultasApoyo: true,
            dictamenes: true,
            mensajes: true,
          },
        },
      },
    });

    if (!asesor) {
      return NextResponse.json(
        { error: 'Asesor no encontrado' },
        { status: 404 }
      );
    }

    // Get recent consultations where this advisor is principal or support
    const consultasRecientes = await db.consulta.findMany({
      where: {
        OR: [
          { asesorPrincipalId: id },
          { asesoresApoyo: { some: { asesorId: id } } },
        ],
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        codigo: true,
        titulo: true,
        estado: true,
        prioridad: true,
        createdAt: true,
        empresa: {
          select: {
            id: true,
            nombre: true,
            empresa: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...asesor,
      consultasRecientes,
    });
  } catch (error) {
    console.error('Error fetching advisor:', error);
    return NextResponse.json(
      { error: 'Error al obtener el asesor' },
      { status: 500 }
    );
  }
}

// PUT /api/asesores/[id] - Update advisor
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    const {
      profesion,
      especialidad,
      biografia,
      comiteId,
      activo,
    } = body;

    // Check if advisor exists
    const existingAsesor = await db.asesor.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingAsesor) {
      return NextResponse.json(
        { error: 'Asesor no encontrado' },
        { status: 404 }
      );
    }

    // Validate comite if provided
    if (comiteId !== undefined && comiteId !== null) {
      const comite = await db.comite.findUnique({
        where: { id: comiteId },
      });

      if (!comite) {
        return NextResponse.json(
          { error: 'El comité especificado no existe' },
          { status: 404 }
        );
      }

      if (!comite.activo) {
        return NextResponse.json(
          { error: 'El comité no está activo' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (profesion !== undefined) updateData.profesion = profesion;
    if (especialidad !== undefined) updateData.especialidad = especialidad;
    if (biografia !== undefined) updateData.biografia = biografia;
    if (comiteId !== undefined) updateData.comiteId = comiteId || null;
    if (activo !== undefined) {
      updateData.activo = activo;
      
      // Also update user active status
      await db.user.update({
        where: { id: existingAsesor.userId },
        data: { activo },
      });
    }

    // Update advisor
    const updatedAsesor = await db.asesor.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
            imagenUrl: true,
            activo: true,
          },
        },
        comite: {
          select: {
            id: true,
            nombre: true,
            color: true,
          },
        },
        comitesLiderados: {
          select: {
            id: true,
            nombre: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json(updatedAsesor);
  } catch (error) {
    console.error('Error updating advisor:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el asesor' },
      { status: 500 }
    );
  }
}

// DELETE /api/asesores/[id] - Delete advisor (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Check if advisor exists
    const existingAsesor = await db.asesor.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            consultasPrincipal: true,
            comitesLiderados: true,
          },
        },
      },
    });

    if (!existingAsesor) {
      return NextResponse.json(
        { error: 'Asesor no encontrado' },
        { status: 404 }
      );
    }

    // Check if advisor has active consultations as principal
    if (existingAsesor._count.consultasPrincipal > 0) {
      // Soft delete instead
      const deactivatedAsesor = await db.asesor.update({
        where: { id },
        data: { activo: false },
      });

      // Also deactivate user
      await db.user.update({
        where: { id: existingAsesor.userId },
        data: { activo: false },
      });

      return NextResponse.json({
        message: 'Asesor desactivado (tiene consultas asociadas como principal)',
        data: deactivatedAsesor,
      });
    }

    // Check if advisor is a committee leader
    if (existingAsesor._count.comitesLiderados > 0) {
      // Remove leadership from committees first
      await db.comite.updateMany({
        where: { liderId: id },
        data: { liderId: null },
      });
    }

    // Soft delete
    const deactivatedAsesor = await db.asesor.update({
      where: { id },
      data: { activo: false },
    });

    // Also deactivate user
    await db.user.update({
      where: { id: existingAsesor.userId },
      data: { activo: false },
    });

    return NextResponse.json({
      message: 'Asesor desactivado exitosamente',
      data: deactivatedAsesor,
    });
  } catch (error) {
    console.error('Error deleting advisor:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el asesor' },
      { status: 500 }
    );
  }
}
