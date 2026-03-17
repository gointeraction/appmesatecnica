import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EstadoNotificacion } from '@prisma/client';

// GET /api/notificaciones - List user notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filters
    const userId = searchParams.get('userId');
    const estado = searchParams.get('estado') as EstadoNotificacion | null;
    const tipo = searchParams.get('tipo');
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (estado) {
      where.estado = estado;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    // Get total count
    const total = await db.notificacion.count({ where });

    // Get notifications
    const notificaciones = await db.notificacion.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Get unread count for user
    const noLeidas = userId ? await db.notificacion.count({
      where: {
        userId,
        estado: EstadoNotificacion.NO_LEIDA,
      },
    }) : 0;

    return NextResponse.json({
      data: notificaciones,
      noLeidas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Error al obtener las notificaciones' },
      { status: 500 }
    );
  }
}

// POST /api/notificaciones - Create new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      userId,
      titulo,
      mensaje,
      tipo,
      enlace,
    } = body;

    // Validate required fields
    if (!userId || !titulo || !mensaje) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: userId, titulo, mensaje' },
        { status: 400 }
      );
    }

    // Validate user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'El usuario no existe' },
        { status: 404 }
      );
    }

    // Create notification
    const notificacion = await db.notificacion.create({
      data: {
        userId,
        titulo,
        mensaje,
        tipo: tipo || 'INFO',
        enlace,
        estado: EstadoNotificacion.NO_LEIDA,
      },
    });

    return NextResponse.json(notificacion, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Error al crear la notificación' },
      { status: 500 }
    );
  }
}
