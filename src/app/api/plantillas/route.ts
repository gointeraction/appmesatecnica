import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TipoPlantilla } from '@prisma/client';

// GET /api/plantillas - List opinion templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filters
    const tipo = searchParams.get('tipo') as TipoPlantilla | null;
    const activa = searchParams.get('activa');
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (tipo) {
      where.tipo = tipo;
    }

    if (activa !== null) {
      where.activa = activa === 'true';
    }

    // Get total count
    const total = await db.plantillaDictamen.count({ where });

    // Get templates
    const plantillas = await db.plantillaDictamen.findMany({
      where,
      include: {
        _count: {
          select: { dictamenes: true },
        },
      },
      orderBy: [
        { tipo: 'asc' },
        { nombre: 'asc' },
      ],
      skip,
      take: limit,
    });

    // Parse variables if present
    const plantillasParsed = plantillas.map((p) => ({
      ...p,
      variables: p.variables ? JSON.parse(p.variables) : [],
    }));

    return NextResponse.json({
      data: plantillasParsed,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Error al obtener las plantillas' },
      { status: 500 }
    );
  }
}

// POST /api/plantillas - Create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      nombre,
      tipo,
      contenido,
      variables,
      activa,
    } = body;

    // Validate required fields
    if (!nombre || !tipo || !contenido) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: nombre, tipo, contenido' },
        { status: 400 }
      );
    }

    // Create template
    const plantilla = await db.plantillaDictamen.create({
      data: {
        nombre,
        tipo: tipo as TipoPlantilla,
        contenido,
        variables: variables ? JSON.stringify(variables) : null,
        activa: activa !== false,
      },
    });

    return NextResponse.json({
      ...plantilla,
      variables: plantilla.variables ? JSON.parse(plantilla.variables) : [],
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Error al crear la plantilla' },
      { status: 500 }
    );
  }
}
