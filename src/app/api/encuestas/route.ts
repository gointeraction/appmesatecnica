import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/encuestas - List satisfaction surveys
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filters
    const consultaId = searchParams.get('consultaId');
    const userId = searchParams.get('userId');
    const minCalificacion = searchParams.get('minCalificacion');
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (consultaId) {
      where.consultaId = consultaId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (minCalificacion) {
      where.calificacion = { gte: parseInt(minCalificacion, 10) };
    }

    // Get total count
    const total = await db.encuestaSatisfaccion.count({ where });

    // Get surveys
    const encuestas = await db.encuestaSatisfaccion.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Calculate average ratings
    const promedios = await db.encuestaSatisfaccion.aggregate({
      where,
      _avg: {
        calificacion: true,
        tiempoRespuesta: true,
        calidadRespuesta: true,
        comunicacion: true,
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      data: encuestas,
      promedios: {
        calificacion: promedios._avg.calificacion || 0,
        tiempoRespuesta: promedios._avg.tiempoRespuesta || 0,
        calidadRespuesta: promedios._avg.calidadRespuesta || 0,
        comunicacion: promedios._avg.comunicacion || 0,
        total: promedios._count.id,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching surveys:', error);
    return NextResponse.json(
      { error: 'Error al obtener las encuestas' },
      { status: 500 }
    );
  }
}

// POST /api/encuestas - Create new survey
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      consultaId,
      userId,
      calificacion,
      tiempoRespuesta,
      calidadRespuesta,
      comunicacion,
      comentarios,
      recomendaria,
    } = body;

    // Validate required fields
    if (!consultaId || !userId || !calificacion) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: consultaId, userId, calificacion' },
        { status: 400 }
      );
    }

    // Validate calificacion range
    if (calificacion < 1 || calificacion > 5) {
      return NextResponse.json(
        { error: 'La calificación debe estar entre 1 y 5' },
        { status: 400 }
      );
    }

    // Check if consulta exists
    const consulta = await db.consulta.findUnique({
      where: { id: consultaId },
    });

    if (!consulta) {
      return NextResponse.json(
        { error: 'La consulta no existe' },
        { status: 404 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'El usuario no existe' },
        { status: 404 }
      );
    }

    // Check if survey already exists for this consulta/user
    const existingSurvey = await db.encuestaSatisfaccion.findUnique({
      where: {
        consultaId_userId: { consultaId, userId },
      },
    });

    if (existingSurvey) {
      return NextResponse.json(
        { error: 'Ya existe una encuesta para esta consulta y usuario' },
        { status: 409 }
      );
    }

    // Create survey
    const encuesta = await db.encuestaSatisfaccion.create({
      data: {
        consultaId,
        userId,
        calificacion,
        tiempoRespuesta,
        calidadRespuesta,
        comunicacion,
        comentarios,
        recomendaria,
      },
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

    return NextResponse.json(encuesta, { status: 201 });
  } catch (error) {
    console.error('Error creating survey:', error);
    return NextResponse.json(
      { error: 'Error al crear la encuesta' },
      { status: 500 }
    );
  }
}
