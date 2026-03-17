import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TipoEvento } from '@prisma/client';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/agenda/[id] - Get individual event
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const evento = await db.eventoAgenda.findUnique({
      where: { id },
      include: {
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            imagenUrl: true,
          },
        },
        participantes: {
          include: {
            user: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                imagenUrl: true,
                cargo: true,
                empresa: true,
              },
            },
          },
        },
      },
    });

    if (!evento) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(evento);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Error al obtener el evento' },
      { status: 500 }
    );
  }
}

// PUT /api/agenda/[id] - Update event
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    const {
      titulo,
      descripcion,
      tipo,
      fechaInicio,
      fechaFin,
      ubicacion,
      esVirtual,
      enlaceVirtual,
      recordatorio,
      participantesIds,
    } = body;

    // Check if event exists
    const existingEvento = await db.eventoAgenda.findUnique({
      where: { id },
    });

    if (!existingEvento) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Validate fechaFin is after fechaInicio if both provided
    const finalFechaInicio = fechaInicio ? new Date(fechaInicio) : existingEvento.fechaInicio;
    const finalFechaFin = fechaFin !== undefined ? (fechaFin ? new Date(fechaFin) : null) : existingEvento.fechaFin;

    if (finalFechaFin && finalFechaFin < finalFechaInicio) {
      return NextResponse.json(
        { error: 'La fecha de fin debe ser posterior a la fecha de inicio' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (titulo) updateData.titulo = titulo;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (tipo) updateData.tipo = tipo as TipoEvento;
    if (fechaInicio) updateData.fechaInicio = new Date(fechaInicio);
    if (fechaFin !== undefined) updateData.fechaFin = fechaFin ? new Date(fechaFin) : null;
    if (ubicacion !== undefined) updateData.ubicacion = ubicacion;
    if (esVirtual !== undefined) updateData.esVirtual = esVirtual;
    if (enlaceVirtual !== undefined) updateData.enlaceVirtual = enlaceVirtual;
    if (recordatorio !== undefined) updateData.recordatorio = recordatorio;

    // Update event
    const updatedEvento = await db.eventoAgenda.update({
      where: { id },
      data: updateData,
      include: {
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        participantes: {
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
      },
    });

    // Update participants if provided
    if (participantesIds && Array.isArray(participantesIds)) {
      // Delete existing participants
      await db.eventoParticipante.deleteMany({
        where: { eventoId: id },
      });

      // Create new participants
      if (participantesIds.length > 0) {
        await db.eventoParticipante.createMany({
          data: participantesIds.map((userId: string) => ({
            eventoId: id,
            userId,
          })),
        });
      }

      // Fetch updated event with participants
      const refreshedEvento = await db.eventoAgenda.findUnique({
        where: { id },
        include: {
          creadoPor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
            },
          },
          participantes: {
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
        },
      });

      return NextResponse.json(refreshedEvento);
    }

    return NextResponse.json(updatedEvento);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el evento' },
      { status: 500 }
    );
  }
}

// DELETE /api/agenda/[id] - Delete event
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Check if event exists
    const existingEvento = await db.eventoAgenda.findUnique({
      where: { id },
    });

    if (!existingEvento) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Delete participants first (cascade)
    await db.eventoParticipante.deleteMany({
      where: { eventoId: id },
    });

    // Delete event
    await db.eventoAgenda.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Evento eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el evento' },
      { status: 500 }
    );
  }
}
