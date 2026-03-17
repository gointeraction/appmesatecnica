import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RolUsuario } from '@prisma/client';

// GET /api/comites - List committees
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const activo = searchParams.get('activo');
    const includeAsesores = searchParams.get('includeAsesores') === 'true';

    const where: any = {};
    
    if (activo !== null) {
      where.activo = activo === 'true';
    }

    const include: any = {
      _count: {
        select: {
          asesores: true,
          consultas: true,
        },
      },
    };

    if (includeAsesores) {
      include.asesores = {
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
      };
    }

    // Always include leader info
    include.lider = {
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
    };

    const comites = await db.comite.findMany({
      where,
      include,
      orderBy: {
        nombre: 'asc',
      },
    });

    return NextResponse.json(comites);
  } catch (error) {
    console.error('Error fetching committees:', error);
    return NextResponse.json(
      { error: 'Error al obtener los comités' },
      { status: 500 }
    );
  }
}

// POST /api/comites - Create committee (ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      nombre,
      descripcion,
      color,
      icono,
      liderId,
      userId, // User ID making the request (for authorization)
    } = body;

    // Validate required fields
    if (!nombre) {
      return NextResponse.json(
        { error: 'El campo nombre es requerido' },
        { status: 400 }
      );
    }

    // Authorization check
    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { rol: true },
      });

      if (!user || user.rol !== RolUsuario.ADMIN) {
        return NextResponse.json(
          { error: 'Solo los administradores pueden crear comités' },
          { status: 403 }
        );
      }
    }

    // Validate lider if provided
    if (liderId) {
      const lider = await db.asesor.findUnique({
        where: { id: liderId },
        include: { user: true },
      });

      if (!lider) {
        return NextResponse.json(
          { error: 'El asesor líder especificado no existe' },
          { status: 404 }
        );
      }

      if (!lider.activo) {
        return NextResponse.json(
          { error: 'El asesor líder no está activo' },
          { status: 400 }
        );
      }
    }

    // Check if committee name already exists
    const existingComite = await db.comite.findFirst({
      where: { nombre },
    });

    if (existingComite) {
      return NextResponse.json(
        { error: 'Ya existe un comité con ese nombre' },
        { status: 400 }
      );
    }

    // Create committee
    const comite = await db.comite.create({
      data: {
        nombre,
        descripcion,
        color: color || '#3B82F6',
        icono,
        liderId,
      },
      include: {
        lider: {
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
        _count: {
          select: {
            asesores: true,
            consultas: true,
          },
        },
      },
    });

    return NextResponse.json(comite, { status: 201 });
  } catch (error) {
    console.error('Error creating committee:', error);
    return NextResponse.json(
      { error: 'Error al crear el comité' },
      { status: 500 }
    );
  }
}
