import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/kb - List knowledge base articles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filters
    const categoria = searchParams.get('categoria');
    const publicado = searchParams.get('publicado');
    const destacado = searchParams.get('destacado');
    const search = searchParams.get('search');
    const autorId = searchParams.get('autorId');
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (categoria) {
      where.categoria = categoria;
    }

    if (publicado !== null) {
      where.publicado = publicado === 'true';
    }

    if (destacado !== null) {
      where.esDestacado = destacado === 'true';
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
    const total = await db.articuloKB.count({ where });

    // Get articles
    const articulos = await db.articuloKB.findMany({
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
        { esDestacado: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    });

    // Get categories for filter
    const categorias = await db.articuloKB.groupBy({
      by: ['categoria'],
      where: { categoria: { not: null } },
      _count: { id: true },
    });

    return NextResponse.json({
      data: articulos,
      categorias: categorias.filter((c) => c.categoria).map((c) => ({
        nombre: c.categoria,
        count: c._count.id,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching knowledge base articles:', error);
    return NextResponse.json(
      { error: 'Error al obtener los artículos' },
      { status: 500 }
    );
  }
}

// POST /api/kb - Create new article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      titulo,
      contenido,
      resumen,
      categoria,
      etiquetas,
      esDestacado,
      publicado,
      autorId,
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

    // Create article
    const articulo = await db.articuloKB.create({
      data: {
        titulo,
        contenido,
        resumen,
        categoria,
        etiquetas: etiquetas ? JSON.stringify(etiquetas) : null,
        esDestacado: esDestacado || false,
        publicado: publicado || false,
        autorId,
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

    return NextResponse.json(articulo, { status: 201 });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      { error: 'Error al crear el artículo' },
      { status: 500 }
    );
  }
}
