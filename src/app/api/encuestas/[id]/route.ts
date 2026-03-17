import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/encuestas/[id] - Get individual survey
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const encuesta = await db.encuestaSatisfaccion.findUnique({
      where: { id },
      include: {
        consulta: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
            tipo: true,
            createdAt: true,
          },
        },
        user: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            empresa: true,
            email: true,
          },
        },
      },
    });

    if (!encuesta) {
      return NextResponse.json(
        { error: 'Encuesta no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(encuesta);
  } catch (error) {
    console.error('Error fetching survey:', error);
    return NextResponse.json(
      { error: 'Error al obtener la encuesta' },
      { status: 500 }
    );
  }
}

// PUT /api/encuestas/[id] - Update survey
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    const {
      calificacion,
      tiempoRespuesta,
      calidadRespuesta,
      comunicacion,
      comentarios,
      recomendaria,
    } = body;

    // Check if survey exists
    const existingEncuesta = await db.encuestaSatisfaccion.findUnique({
      where: { id },
    });

    if (!existingEncuesta) {
      return NextResponse.json(
        { error: 'Encuesta no encontrada' },
        { status: 404 }
      );
    }

    // Validate calificacion range if provided
    if (calificacion && (calificacion < 1 || calificacion > 5)) {
      return NextResponse.json(
        { error: 'La calificación debe estar entre 1 y 5' },
        { status: 400 }
      );
    }

    // Validate other ratings if provided
    if (tiempoRespuesta && (tiempoRespuesta < 1 || tiempoRespuesta > 5)) {
      return NextResponse.json(
        { error: 'La calificación de tiempo de respuesta debe estar entre 1 y 5' },
        { status: 400 }
      );
    }

    if (calidadRespuesta && (calidadRespuesta < 1 || calidadRespuesta > 5)) {
      return NextResponse.json(
        { error: 'La calificación de calidad debe estar entre 1 y 5' },
        { status: 400 }
      );
    }

    if (comunicacion && (comunicacion < 1 || comunicacion > 5)) {
      return NextResponse.json(
        { error: 'La calificación de comunicación debe estar entre 1 y 5' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (calificacion) updateData.calificacion = calificacion;
    if (tiempoRespuesta !== undefined) updateData.tiempoRespuesta = tiempoRespuesta;
    if (calidadRespuesta !== undefined) updateData.calidadRespuesta = calidadRespuesta;
    if (comunicacion !== undefined) updateData.comunicacion = comunicacion;
    if (comentarios !== undefined) updateData.comentarios = comentarios;
    if (recomendaria !== undefined) updateData.recomendaria = recomendaria;

    // Update survey
    const updatedEncuesta = await db.encuestaSatisfaccion.update({
      where: { id },
      data: updateData,
      include: {
        consulta: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
          },
        },
        user: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            empresa: true,
          },
        },
      },
    });

    return NextResponse.json(updatedEncuesta);
  } catch (error) {
    console.error('Error updating survey:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la encuesta' },
      { status: 500 }
    );
  }
}

// DELETE /api/encuestas/[id] - Delete survey
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Check if survey exists
    const existingEncuesta = await db.encuestaSatisfaccion.findUnique({
      where: { id },
    });

    if (!existingEncuesta) {
      return NextResponse.json(
        { error: 'Encuesta no encontrada' },
        { status: 404 }
      );
    }

    // Delete survey
    await db.encuestaSatisfaccion.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Encuesta eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting survey:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la encuesta' },
      { status: 500 }
    );
  }
}
