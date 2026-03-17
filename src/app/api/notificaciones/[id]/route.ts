import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EstadoNotificacion } from '@prisma/client';

interface RouteParams {
  params: {
    id: string;
  };
}

// PUT /api/notificaciones/[id] - Update notification status (mark as read)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    const { estado, archivar } = body;

    // Check if notification exists
    const existingNotificacion = await db.notificacion.findUnique({
      where: { id },
    });

    if (!existingNotificacion) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (estado) {
      updateData.estado = estado as EstadoNotificacion;
    } else if (archivar) {
      updateData.estado = EstadoNotificacion.ARCHIVADA;
    } else {
      // Default: mark as read
      updateData.estado = EstadoNotificacion.LEIDA;
    }

    // Update notification
    const updatedNotificacion = await db.notificacion.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedNotificacion);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la notificación' },
      { status: 500 }
    );
  }
}

// DELETE /api/notificaciones/[id] - Delete notification
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Check if notification exists
    const existingNotificacion = await db.notificacion.findUnique({
      where: { id },
    });

    if (!existingNotificacion) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }

    // Delete notification
    await db.notificacion.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Notificación eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la notificación' },
      { status: 500 }
    );
  }
}
