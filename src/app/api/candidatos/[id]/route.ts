import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EstadoCandidato } from "@prisma/client";

// GET /api/candidatos/[id] - Get a single candidate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const candidato = await db.candidatoAsesor.findUnique({
      where: { id },
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
      },
    });

    if (!candidato) {
      return NextResponse.json(
        { error: "Candidato no encontrado" },
        { status: 404 }
      );
    }

    // Parse cartasRecomendacion if it's a JSON string
    const response = {
      ...candidato,
      cartasRecomendacion: candidato.cartasRecomendacion
        ? JSON.parse(candidato.cartasRecomendacion)
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching candidato:", error);
    return NextResponse.json(
      { error: "Error al obtener el candidato" },
      { status: 500 }
    );
  }
}

// PUT /api/candidatos/[id] - Update a candidate
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      nombre,
      apellido,
      email,
      telefono,
      profesion,
      especialidad,
      experiencia,
      biografia,
      cvUrl,
      cartasRecomendacion,
      estado,
      entrevistaFecha,
      evaluacionNotas,
      observaciones,
    } = body;

    // Check if candidato exists
    const existingCandidato = await db.candidatoAsesor.findUnique({
      where: { id },
    });

    if (!existingCandidato) {
      return NextResponse.json(
        { error: "Candidato no encontrado" },
        { status: 404 }
      );
    }

    // If email is being changed, check for duplicates
    if (email && email !== existingCandidato.email) {
      const duplicateEmail = await db.candidatoAsesor.findFirst({
        where: {
          email,
          NOT: { id },
        },
      });

      if (duplicateEmail) {
        return NextResponse.json(
          { error: "Ya existe una postulación con este correo electrónico" },
          { status: 400 }
        );
      }
    }

    const candidato = await db.candidatoAsesor.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(apellido !== undefined && { apellido }),
        ...(email !== undefined && { email }),
        ...(telefono !== undefined && { telefono }),
        ...(profesion !== undefined && { profesion }),
        ...(especialidad !== undefined && { especialidad }),
        ...(experiencia !== undefined && { experiencia }),
        ...(biografia !== undefined && { biografia }),
        ...(cvUrl !== undefined && { cvUrl }),
        ...(cartasRecomendacion !== undefined && {
          cartasRecomendacion: cartasRecomendacion ? JSON.stringify(cartasRecomendacion) : null,
        }),
        ...(estado !== undefined && { estado: estado as EstadoCandidato }),
        ...(entrevistaFecha !== undefined && { entrevistaFecha: entrevistaFecha ? new Date(entrevistaFecha) : null }),
        ...(evaluacionNotas !== undefined && { evaluacionNotas }),
        ...(observaciones !== undefined && { observaciones }),
      },
    });

    return NextResponse.json(candidato);
  } catch (error) {
    console.error("Error updating candidato:", error);
    return NextResponse.json(
      { error: "Error al actualizar el candidato" },
      { status: 500 }
    );
  }
}
