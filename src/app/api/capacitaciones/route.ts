import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/capacitaciones - List training/webinars
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filters
    const categoria = searchParams.get('categoria');
    const nivel = searchParams.get('nivel');
    const activo = searchParams.get('activo');
    const fechaProxima = searchParams.get('fechaProxima');
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (categoria) {
      where.categoria = categoria;
    }

    if (nivel) {
      where.nivel = nivel;
    }

    if (activo !== null) {
      where.activo = activo === 'true';
    }

    if (fechaProxima === 'true') {
      where.fechaProgramada = { gte: new Date() };
    }

    // Get total count
    const total = await db.capacitacion.count({ where });

    // Get trainings
    const capacitaciones = await db.capacitacion.findMany({
      where,
      orderBy: [
        { fechaProgramada: 'asc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    });

    // Parse materials if present
    const capacitacionesParsed = capacitaciones.map((c) => ({
      ...c,
      materiales: c.materiales ? JSON.parse(c.materiales) : [],
    }));

    // Get categories for filter
    const categorias = await db.capacitacion.groupBy({
      by: ['categoria'],
      where: { categoria: { not: null }, activo: true },
      _count: { id: true },
    });

    // Get levels for filter
    const niveles = await db.capacitacion.groupBy({
      by: ['nivel'],
      where: { nivel: { not: null }, activo: true },
      _count: { id: true },
    });

    return NextResponse.json({
      data: capacitacionesParsed,
      filtros: {
        categorias: categorias.filter((c) => c.categoria).map((c) => ({
          nombre: c.categoria,
          count: c._count.id,
        })),
        niveles: niveles.filter((n) => n.nivel).map((n) => ({
          nombre: n.nivel,
          count: n._count.id,
        })),
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching trainings:', error);
    return NextResponse.json(
      { error: 'Error al obtener las capacitaciones' },
      { status: 500 }
    );
  }
}

// POST /api/capacitaciones - Create new training
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      titulo,
      descripcion,
      contenido,
      categoria,
      nivel,
      duracion,
      instructor,
      enlaceVideo,
      materiales,
      activo,
      fechaProgramada,
    } = body;

    // Validate required fields
    if (!titulo) {
      return NextResponse.json(
        { error: 'Falta campo requerido: titulo' },
        { status: 400 }
      );
    }

    // Create training
    const capacitacion = await db.capacitacion.create({
      data: {
        titulo,
        descripcion,
        contenido,
        categoria,
        nivel,
        duracion,
        instructor,
        enlaceVideo,
        materiales: materiales ? JSON.stringify(materiales) : null,
        activo: activo !== false,
        fechaProgramada: fechaProgramada ? new Date(fechaProgramada) : null,
      },
    });

    return NextResponse.json({
      ...capacitacion,
      materiales: capacitacion.materiales ? JSON.parse(capacitacion.materiales) : [],
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating training:', error);
    return NextResponse.json(
      { error: 'Error al crear la capacitación' },
      { status: 500 }
    );
  }
}
