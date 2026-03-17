import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RolUsuario } from '@prisma/client';

// GET /api/asesores - List technical advisors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const activo = searchParams.get('activo');
    const comiteId = searchParams.get('comiteId');
    const search = searchParams.get('search');
    const especialidad = searchParams.get('especialidad');
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (activo !== null) {
      where.activo = activo === 'true';
    }
    
    if (comiteId) {
      where.comiteId = comiteId;
    }
    
    if (especialidad) {
      where.especialidad = { contains: especialidad };
    }
    
    if (search) {
      where.OR = [
        { profesion: { contains: search } },
        { especialidad: { contains: search } },
        { biografia: { contains: search } },
        { user: { 
          OR: [
            { nombre: { contains: search } },
            { apellido: { contains: search } },
            { email: { contains: search } },
          ],
        },
      },
      ];
    }

    // Get total count
    const total = await db.asesor.count({ where });

    // Get advisors
    const asesores = await db.asesor.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
            imagenUrl: true,
            activo: true,
          },
        },
        comite: {
          select: {
            id: true,
            nombre: true,
            color: true,
            icono: true,
          },
        },
        comitesLiderados: {
          select: {
            id: true,
            nombre: true,
            color: true,
          },
        },
        _count: {
          select: {
            consultasPrincipal: true,
            consultasApoyo: true,
            dictamenes: true,
            mensajes: true,
          },
        },
      },
      orderBy: [
        { activo: 'desc' },
        { user: { nombre: 'asc' } },
      ],
      skip,
      take: limit,
    });

    return NextResponse.json({
      data: asesores,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching advisors:', error);
    return NextResponse.json(
      { error: 'Error al obtener los asesores' },
      { status: 500 }
    );
  }
}

// POST /api/asesores - Create technical advisor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      userId,
      profesion,
      especialidad,
      biografia,
      comiteId,
      userIdsAdmin, // For authorization (admin making the request)
    } = body;

    // Validate required fields
    if (!userId || !profesion || !especialidad) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: userId, profesion, especialidad' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'El usuario especificado no existe' },
        { status: 404 }
      );
    }

    // Check if user is already an advisor
    const existingAsesor = await db.asesor.findUnique({
      where: { userId },
    });

    if (existingAsesor) {
      return NextResponse.json(
        { error: 'El usuario ya está registrado como asesor' },
        { status: 400 }
      );
    }

    // Validate comite if provided
    if (comiteId) {
      const comite = await db.comite.findUnique({
        where: { id: comiteId },
      });

      if (!comite) {
        return NextResponse.json(
          { error: 'El comité especificado no existe' },
          { status: 404 }
        );
      }

      if (!comite.activo) {
        return NextResponse.json(
          { error: 'El comité no está activo' },
          { status: 400 }
        );
      }
    }

    // Update user role to ASESOR if not already
    if (user.rol !== RolUsuario.ASESOR && user.rol !== RolUsuario.ADMIN) {
      await db.user.update({
        where: { id: userId },
        data: { rol: RolUsuario.ASESOR },
      });
    }

    // Create advisor profile
    const asesor = await db.asesor.create({
      data: {
        userId,
        profesion,
        especialidad,
        biografia,
        comiteId,
      },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
            imagenUrl: true,
          },
        },
        comite: {
          select: {
            id: true,
            nombre: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json(asesor, { status: 201 });
  } catch (error) {
    console.error('Error creating advisor:', error);
    return NextResponse.json(
      { error: 'Error al crear el asesor' },
      { status: 500 }
    );
  }
}
