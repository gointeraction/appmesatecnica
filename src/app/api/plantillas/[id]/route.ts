import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TipoPlantilla } from '@prisma/client';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/plantillas/[id] - Get individual template
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const plantilla = await db.plantillaDictamen.findUnique({
      where: { id },
      include: {
        _count: {
          select: { dictamenes: true },
        },
      },
    });

    if (!plantilla) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...plantilla,
      variables: plantilla.variables ? JSON.parse(plantilla.variables) : [],
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Error al obtener la plantilla' },
      { status: 500 }
    );
  }
}

// PUT /api/plantillas/[id] - Update template
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    const {
      nombre,
      tipo,
      contenido,
      variables,
      activa,
    } = body;

    // Check if template exists
    const existingPlantilla = await db.plantillaDictamen.findUnique({
      where: { id },
    });

    if (!existingPlantilla) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (nombre) updateData.nombre = nombre;
    if (tipo) updateData.tipo = tipo as TipoPlantilla;
    if (contenido) updateData.contenido = contenido;
    if (variables !== undefined) updateData.variables = variables ? JSON.stringify(variables) : null;
    if (activa !== undefined) updateData.activa = activa;

    // Update template
    const updatedPlantilla = await db.plantillaDictamen.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...updatedPlantilla,
      variables: updatedPlantilla.variables ? JSON.parse(updatedPlantilla.variables) : [],
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la plantilla' },
      { status: 500 }
    );
  }
}

// DELETE /api/plantillas/[id] - Delete template
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Check if template exists
    const existingPlantilla = await db.plantillaDictamen.findUnique({
      where: { id },
      include: {
        _count: {
          select: { dictamenes: true },
        },
      },
    });

    if (!existingPlantilla) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    // Check if template is being used
    if (existingPlantilla._count.dictamenes > 0) {
      // Instead of deleting, deactivate
      const deactivatedPlantilla = await db.plantillaDictamen.update({
        where: { id },
        data: { activa: false },
      });

      return NextResponse.json({
        message: 'Plantilla desactivada (tiene dictámenes asociados)',
        data: deactivatedPlantilla,
      });
    }

    // Delete template
    await db.plantillaDictamen.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Plantilla eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la plantilla' },
      { status: 500 }
    );
  }
}
