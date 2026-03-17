import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/dictamenes - List dictamenes with optional consultaId filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const consultaId = searchParams.get("consultaId");
    const asesorId = searchParams.get("asesorId");
    const esFinal = searchParams.get("esFinal");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const where: Record<string, unknown> = {};

    if (consultaId) {
      where.consultaId = consultaId;
    }

    if (asesorId) {
      where.asesorId = asesorId;
    }

    if (esFinal !== null) {
      where.esFinal = esFinal === "true";
    }

    const dictamenes = await db.dictamen.findMany({
      where,
      include: {
        consulta: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
            estado: true,
            tipo: true,
          },
        },
        asesor: {
          select: {
            id: true,
            profesion: true,
            especialidad: true,
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
        plantilla: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      ...(limit && { take: parseInt(limit) }),
      ...(offset && { skip: parseInt(offset) }),
    });

    const total = await db.dictamen.count({ where });

    return NextResponse.json({
      data: dictamenes,
      meta: {
        total,
        limit: limit ? parseInt(limit) : null,
        offset: offset ? parseInt(offset) : null,
      },
    });
  } catch (error) {
    console.error("Error fetching dictamenes:", error);
    return NextResponse.json(
      { error: "Error al obtener los dictamenes" },
      { status: 500 }
    );
  }
}

// POST /api/dictamenes - Create a new dictamen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      consultaId,
      asesorId,
      plantillaId,
      titulo,
      contenido,
      conclusion,
      recomendaciones,
      fundamentos,
      esFinal,
    } = body;

    // Validate required fields
    if (!consultaId || !asesorId || !titulo || !contenido) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: consultaId, asesorId, titulo, contenido" },
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

    // Verify asesor exists
    const asesor = await db.asesor.findUnique({
      where: { id: asesorId },
    });

    if (!asesor) {
      return NextResponse.json(
        { error: "El asesor no existe" },
        { status: 404 }
      );
    }

    // If plantillaId is provided, verify it exists
    if (plantillaId) {
      const plantilla = await db.plantillaDictamen.findUnique({
        where: { id: plantillaId },
      });

      if (!plantilla) {
        return NextResponse.json(
          { error: "La plantilla no existe" },
          { status: 404 }
        );
      }
    }

    // Get the current version number for this consulta
    const existingDictamenes = await db.dictamen.count({
      where: { consultaId },
    });

    const dictamen = await db.dictamen.create({
      data: {
        consultaId,
        asesorId,
        plantillaId,
        titulo,
        contenido,
        conclusion,
        recomendaciones,
        fundamentos,
        version: existingDictamenes + 1,
        esFinal: esFinal ?? false,
      },
      include: {
        consulta: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
            estado: true,
            tipo: true,
          },
        },
        asesor: {
          select: {
            id: true,
            profesion: true,
            especialidad: true,
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
        plantilla: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
          },
        },
      },
    });

    // If dictamen is marked as final, update consulta status to DICTAMEN
    if (esFinal) {
      await db.consulta.update({
        where: { id: consultaId },
        data: { estado: "DICTAMEN" },
      });
    }

    return NextResponse.json(dictamen, { status: 201 });
  } catch (error) {
    console.error("Error creating dictamen:", error);
    return NextResponse.json(
      { error: "Error al crear el dictamen" },
      { status: 500 }
    );
  }
}
