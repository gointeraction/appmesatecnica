import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/mensajes - List messages with optional consultaId filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const consultaId = searchParams.get("consultaId");
    const userId = searchParams.get("userId");
    const esPrivado = searchParams.get("esPrivado");
    const esRespuestaOficial = searchParams.get("esRespuestaOficial");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const where: Record<string, unknown> = {};

    if (consultaId) {
      where.consultaId = consultaId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (esPrivado !== null) {
      where.esPrivado = esPrivado === "true";
    }

    if (esRespuestaOficial !== null) {
      where.esRespuestaOficial = esRespuestaOficial === "true";
    }

    const messages = await db.mensaje.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            rol: true,
            imagenUrl: true,
          },
        },
        consulta: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      ...(limit && { take: parseInt(limit) }),
      ...(offset && { skip: parseInt(offset) }),
    });

    const total = await db.mensaje.count({ where });

    return NextResponse.json({
      data: messages,
      meta: {
        total,
        limit: limit ? parseInt(limit) : null,
        offset: offset ? parseInt(offset) : null,
      },
    });
  } catch (error) {
    console.error("Error fetching mensajes:", error);
    return NextResponse.json(
      { error: "Error al obtener los mensajes" },
      { status: 500 }
    );
  }
}

// POST /api/mensajes - Create a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { consultaId, userId, contenido, esPrivado, esRespuestaOficial } = body;

    // Validate required fields
    if (!consultaId || !userId || !contenido) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: consultaId, userId, contenido" },
        { status: 400 }
      );
    }

    // Verify consulta exists
    const consulta = await db.consulta.findUnique({
      where: { id: consultaId },
    });

    if (!consulta) {
      return NextResponse.json(
        { error: "La consulta no existe" },
        { status: 404 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "El usuario no existe" },
        { status: 404 }
      );
    }

    const mensaje = await db.mensaje.create({
      data: {
        consultaId,
        userId,
        contenido,
        esPrivado: esPrivado ?? false,
        esRespuestaOficial: esRespuestaOficial ?? false,
      },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            rol: true,
            imagenUrl: true,
          },
        },
        consulta: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
          },
        },
      },
    });

    return NextResponse.json(mensaje, { status: 201 });
  } catch (error) {
    console.error("Error creating mensaje:", error);
    return NextResponse.json(
      { error: "Error al crear el mensaje" },
      { status: 500 }
    );
  }
}
