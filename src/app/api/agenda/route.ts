import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TipoEvento } from '@prisma/client';

// GET /api/agenda - List calendar events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filters
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    const tipo = searchParams.get('tipo') as TipoEvento | null;
    const usuarioId = searchParams.get('usuarioId');
    const creadoPor = searchParams.get('creadoPor');
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (fechaInicio && fechaFin) {
      where.fechaInicio = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin),
      };
    } else if (fechaInicio) {
      where.fechaInicio = { gte: new Date(fechaInicio) };
    } else if (fechaFin) {
      where.fechaInicio = { lte: new Date(fechaFin) };
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (creadoPor) {
      where.creadoPorId = creadoPor;
    }

    if (usuarioId) {
      where.participantes = { some: { userId: usuarioId } };
    }

    // Get total count
    const total = await db.eventoAgenda.count({ where });

    // Get events
    const eventos = await db.eventoAgenda.findMany({
      where,
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
                imagenUrl: true,
              },
            },
          },
        },
        _count: {
          select: { participantes: true },
        },
      },
      orderBy: {
        fechaInicio: 'asc',
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      data: eventos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Error al obtener los eventos' },
      { status: 500 }
    );
  }
}

// POST /api/agenda - Create new event
export async function POST(request: NextRequest) {
  try {
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
      creadoPorId,
      participantesIds,
    } = body;

    // Validate required fields
    if (!titulo || !fechaInicio || !creadoPorId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: titulo, fechaInicio, creadoPorId' },
        { status: 400 }
      );
    }

    // Validate creator exists
    const creador = await db.user.findUnique({
      where: { id: creadoPorId },
    });

    if (!creador) {
      return NextResponse.json(
        { error: 'El usuario creador no existe' },
        { status: 404 }
      );
    }

    // Validate fechaFin is after fechaInicio
    if (fechaFin && new Date(fechaFin) < new Date(fechaInicio)) {
      return NextResponse.json(
        { error: 'La fecha de fin debe ser posterior a la fecha de inicio' },
        { status: 400 }
      );
    }

    // Create event
    const evento = await db.eventoAgenda.create({
      data: {
        titulo,
        descripcion,
        tipo: (tipo || 'REUNION') as TipoEvento,
        fechaInicio: new Date(fechaInicio),
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        ubicacion,
        esVirtual: esVirtual || false,
        enlaceVirtual,
        recordatorio: recordatorio !== false,
        creadoPorId,
        participantes: participantesIds ? {
          create: participantesIds.map((userId: string) => ({
            userId,
          })),
        } : undefined,
      },
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

    return NextResponse.json(evento, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Error al crear el evento' },
      { status: 500 }
    );
  }
}
