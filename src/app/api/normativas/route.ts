import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/normativas - List regulations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filters
    const tipo = searchParams.get('tipo');
    const organismo = searchParams.get('organismo');
    const activo = searchParams.get('activo');
    const search = searchParams.get('search');
    const vigentes = searchParams.get('vigentes');
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (tipo) {
      where.tipo = tipo;
    }

    if (organismo) {
      where.organismo = organismo;
    }

    if (activo !== null) {
      where.activo = activo === 'true';
    }

    if (vigentes === 'true') {
      where.fechaVigencia = { gte: new Date() };
    }

    if (search) {
      where.OR = [
        { titulo: { contains: search } },
        { descripcion: { contains: search } },
        { numero: { contains: search } },
      ];
    }

    // Get total count
    const total = await db.normativa.count({ where });

    // Get regulations
    const normativas = await db.normativa.findMany({
      where,
      orderBy: [
        { fechaPublicacion: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    });

    // Parse etiquetas if present
    const normativasParsed = normativas.map((n) => ({
      ...n,
      etiquetas: n.etiquetas ? JSON.parse(n.etiquetas) : [],
    }));

    // Get types for filter
    const tipos = await db.normativa.groupBy({
      by: ['tipo'],
      where: { tipo: { not: null }, activo: true },
      _count: { id: true },
    });

    // Get organisms for filter
    const organismos = await db.normativa.groupBy({
      by: ['organismo'],
      where: { organismo: { not: null }, activo: true },
      _count: { id: true },
    });

    return NextResponse.json({
      data: normativasParsed,
      filtros: {
        tipos: tipos.filter((t) => t.tipo).map((t) => ({
          nombre: t.tipo,
          count: t._count.id,
        })),
        organismos: organismos.filter((o) => o.organismo).map((o) => ({
          nombre: o.organismo,
          count: o._count.id,
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
    console.error('Error fetching regulations:', error);
    return NextResponse.json(
      { error: 'Error al obtener las normativas' },
      { status: 500 }
    );
  }
}

// POST /api/normativas - Create new regulation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      titulo,
      descripcion,
      tipo,
      numero,
      fechaPublicacion,
      fechaVigencia,
      organismo,
      archivoUrl,
      etiquetas,
      activo,
    } = body;

    // Validate required fields
    if (!titulo) {
      return NextResponse.json(
        { error: 'Falta campo requerido: titulo' },
        { status: 400 }
      );
    }

    // Create regulation
    const normativa = await db.normativa.create({
      data: {
        titulo,
        descripcion,
        tipo,
        numero,
        fechaPublicacion: fechaPublicacion ? new Date(fechaPublicacion) : null,
        fechaVigencia: fechaVigencia ? new Date(fechaVigencia) : null,
        organismo,
        archivoUrl,
        etiquetas: etiquetas ? JSON.stringify(etiquetas) : null,
        activo: activo !== false,
      },
    });

    return NextResponse.json({
      ...normativa,
      etiquetas: normativa.etiquetas ? JSON.parse(normativa.etiquetas) : [],
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating regulation:', error);
    return NextResponse.json(
      { error: 'Error al crear la normativa' },
      { status: 500 }
    );
  }
}
