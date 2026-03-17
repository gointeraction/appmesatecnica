import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/documentos - List documents with optional consultaId filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const consultaId = searchParams.get("consultaId");
    const esPublico = searchParams.get("esPublico");
    const tipo = searchParams.get("tipo");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const where: Record<string, unknown> = {};

    if (consultaId) {
      where.consultaId = consultaId;
    }

    if (esPublico !== null) {
      where.esPublico = esPublico === "true";
    }

    if (tipo) {
      where.tipo = { contains: tipo };
    }

    const documentos = await db.documento.findMany({
      where,
      include: {
        consulta: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
            estado: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      ...(limit && { take: parseInt(limit) }),
      ...(offset && { skip: parseInt(offset) }),
    });

    const total = await db.documento.count({ where });

    return NextResponse.json({
      data: documentos,
      meta: {
        total,
        limit: limit ? parseInt(limit) : null,
        offset: offset ? parseInt(offset) : null,
      },
    });
  } catch (error) {
    console.error("Error fetching documentos:", error);
    return NextResponse.json(
      { error: "Error al obtener los documentos" },
      { status: 500 }
    );
  }
}

// POST /api/documentos - Create a new document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      consultaId,
      nombre,
      nombreOriginal,
      tipo,
      tamano,
      ruta,
      descripcion,
      esPublico,
      creadoPor,
    } = body;

    // Validate required fields
    if (!consultaId || !nombre || !nombreOriginal || !tipo || !tamano || !ruta) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: consultaId, nombre, nombreOriginal, tipo, tamano, ruta" },
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

    const documento = await db.documento.create({
      data: {
        consultaId,
        nombre,
        nombreOriginal,
        tipo,
        tamano,
        ruta,
        descripcion,
        esPublico: esPublico ?? false,
        creadoPor,
      },
      include: {
        consulta: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
            estado: true,
          },
        },
      },
    });

    return NextResponse.json(documento, { status: 201 });
  } catch (error) {
    console.error("Error creating documento:", error);
    return NextResponse.json(
      { error: "Error al crear el documento" },
      { status: 500 }
    );
  }
}
