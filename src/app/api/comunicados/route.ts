import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/comunicados - List official announcements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filters
    const publicado = searchParams.get('publicado');
    const esUrgente = searchParams.get('esUrgente');
    const autorId = searchParams.get('autorId');
    const search = searchParams.get('search');
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (publicado !== null) {
      where.publicado = publicado === 'true';
    }

    if (esUrgente !== null) {
      where.esUrgente = esUrgente === 'true';
    }

    if (autorId) {
      where.autorId = autorId;
    }

    if (search) {
      where.OR = [
        { titulo: { contains: search } },
        { contenido: { contains: search } },
        { resumen: { contains: search } },
      ];
    }

    // Get total count
    const total = await db.comunicado.count({ where });

    // Get announcements
    const comunicados = await db.comunicado.findMany({
      where,
      include: {
        autor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            imagenUrl: true,
          },
        },
      },
      orderBy: [
        { esUrgente: 'desc' },
        { fechaPublicacion: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    });

    // Parse destinatarios if present
    const comunicadosParsed = comunicados.map((c) => ({
      ...c,
      destinatarios: c.destinatarios ? JSON.parse(c.destinatarios) : null,
    }));

    return NextResponse.json({
      data: comunicadosParsed,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Error al obtener los comunicados' },
      { status: 500 }
    );
  }
}

// POST /api/comunicados - Create new announcement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      titulo,
      contenido,
      resumen,
      esUrgente,
      publicado,
      fechaPublicacion,
      autorId,
      destinatarios,
    } = body;

    // Validate required fields
    if (!titulo || !contenido || !autorId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: titulo, contenido, autorId' },
        { status: 400 }
      );
    }

    // Validate author exists
    const autor = await db.user.findUnique({
      where: { id: autorId },
    });

    if (!autor) {
      return NextResponse.json(
        { error: 'El autor no existe' },
        { status: 404 }
      );
    }

    // Create announcement
    const comunicado = await db.comunicado.create({
      data: {
        titulo,
        contenido,
        resumen,
        esUrgente: esUrgente || false,
        publicado: publicado || false,
        fechaPublicacion: (publicado && !fechaPublicacion) ? new Date() : (fechaPublicacion ? new Date(fechaPublicacion) : null),
        autorId,
        destinatarios: destinatarios ? JSON.stringify(destinatarios) : null,
      },
      include: {
        autor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...comunicado,
      destinatarios: comunicado.destinatarios ? JSON.parse(comunicado.destinatarios) : null,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { error: 'Error al crear el comunicado' },
      { status: 500 }
    );
  }
}
