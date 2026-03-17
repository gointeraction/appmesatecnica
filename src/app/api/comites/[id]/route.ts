import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RolUsuario } from '@prisma/client';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/comites/[id] - Get individual committee
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const includeAsesores = searchParams.get('includeAsesores') === 'true';

    const include: any = {
      lider: {
        include: {
          user: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          asesores: true,
          consultas: true,
        },
      },
    };

    if (includeAsesores) {
      include.asesores = {
        include: {
          user: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
            },
          },
        },
      };
    }

    const comite = await db.comite.findUnique({
      where: { id },
      include,
    });

    if (!comite) {
      return NextResponse.json(
        { error: 'Comité no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(comite);
  } catch (error) {
    console.error('Error fetching committee:', error);
    return NextResponse.json(
      { error: 'Error al obtener el comité' },
      { status: 500 }
    );
  }
}

// PUT /api/comites/[id] - Update committee
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    const {
      nombre,
      descripcion,
      color,
      icono,
      liderId,
      activo,
      userId, // User ID making the request (for authorization)
    } = body;

    // Check if committee exists
    const existingComite = await db.comite.findUnique({
      where: { id },
    });

    if (!existingComite) {
      return NextResponse.json(
        { error: 'Comité no encontrado' },
        { status: 404 }
      );
    }

    // Authorization check
    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { rol: true },
      });

      if (!user || user.rol !== RolUsuario.ADMIN) {
        return NextResponse.json(
          { error: 'Solo los administradores pueden modificar comités' },
          { status: 403 }
        );
      }
    }

    // Validate lider if provided
    if (liderId !== undefined) {
      if (liderId) {
        const lider = await db.asesor.findUnique({
          where: { id: liderId },
        });

        if (!lider) {
          return NextResponse.json(
            { error: 'El asesor líder especificado no existe' },
            { status: 404 }
          );
        }

        if (!lider.activo) {
          return NextResponse.json(
            { error: 'El asesor líder no está activo' },
            { status: 400 }
          );
        }
      }
    }

    // Check for duplicate name if changing name
    if (nombre && nombre !== existingComite.nombre) {
      const duplicateName = await db.comite.findFirst({
        where: {
          nombre,
          id: { not: id },
        },
      });

      if (duplicateName) {
        return NextResponse.json(
          { error: 'Ya existe otro comité con ese nombre' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (color !== undefined) updateData.color = color;
    if (icono !== undefined) updateData.icono = icono;
    if (liderId !== undefined) updateData.liderId = liderId || null;
    if (activo !== undefined) updateData.activo = activo;

    // Update committee
    const updatedComite = await db.comite.update({
      where: { id },
      data: updateData,
      include: {
        lider: {
          include: {
            user: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            asesores: true,
            consultas: true,
          },
        },
      },
    });

    return NextResponse.json(updatedComite);
  } catch (error) {
    console.error('Error updating committee:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el comité' },
      { status: 500 }
    );
  }
}

// DELETE /api/comites/[id] - Delete committee (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Check if committee exists
    const existingComite = await db.comite.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            consultas: true,
          },
        },
      },
    });

    if (!existingComite) {
      return NextResponse.json(
        { error: 'Comité no encontrado' },
        { status: 404 }
      );
    }

    // Authorization check
    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { rol: true },
      });

      if (!user || user.rol !== RolUsuario.ADMIN) {
        return NextResponse.json(
          { error: 'Solo los administradores pueden eliminar comités' },
          { status: 403 }
        );
      }
    }

    // Check if committee has active consultations
    if (existingComite._count.consultas > 0) {
      // Soft delete instead of hard delete
      const deactivatedComite = await db.comite.update({
        where: { id },
        data: { activo: false },
      });

      return NextResponse.json({
        message: 'Comité desactivado (tiene consultas asociadas)',
        data: deactivatedComite,
      });
    }

    // Hard delete if no consultations
    await db.comite.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Comité eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error deleting committee:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el comité' },
      { status: 500 }
    );
  }
}
