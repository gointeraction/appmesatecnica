import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/dictamenes/[id] - Get a single dictamen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const dictamen = await db.dictamen.findUnique({
      where: { id },
      include: {
        consulta: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
            descripcion: true,
            estado: true,
            tipo: true,
            prioridad: true,
            empresa: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                empresa: true,
              },
            },
          },
        },
        asesor: {
          select: {
            id: true,
            profesion: true,
            especialidad: true,
            biografia: true,
            user: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                imagenUrl: true,
              },
            },
          },
        },
        plantilla: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            variables: true,
          },
        },
      },
    });

    if (!dictamen) {
      return NextResponse.json(
        { error: "Dictamen no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(dictamen);
  } catch (error) {
    console.error("Error fetching dictamen:", error);
    return NextResponse.json(
      { error: "Error al obtener el dictamen" },
      { status: 500 }
    );
  }
}

// PUT /api/dictamenes/[id] - Update a dictamen
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      titulo,
      contenido,
      conclusion,
      recomendaciones,
      fundamentos,
      esFinal,
      plantillaId,
    } = body;

    // Check if dictamen exists
    const existingDictamen = await db.dictamen.findUnique({
      where: { id },
    });

    if (!existingDictamen) {
      return NextResponse.json(
        { error: "Dictamen no encontrado" },
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

    const dictamen = await db.dictamen.update({
      where: { id },
      data: {
        ...(titulo !== undefined && { titulo }),
        ...(contenido !== undefined && { contenido }),
        ...(conclusion !== undefined && { conclusion }),
        ...(recomendaciones !== undefined && { recomendaciones }),
        ...(fundamentos !== undefined && { fundamentos }),
        ...(esFinal !== undefined && { esFinal }),
        ...(plantillaId !== undefined && { plantillaId }),
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
    if (esFinal && !existingDictamen.esFinal) {
      await db.consulta.update({
        where: { id: existingDictamen.consultaId },
        data: { estado: "DICTAMEN" },
      });
    }

    return NextResponse.json(dictamen);
  } catch (error) {
    console.error("Error updating dictamen:", error);
    return NextResponse.json(
      { error: "Error al actualizar el dictamen" },
      { status: 500 }
    );
  }
}
