import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EstadoCandidato } from "@prisma/client";

// GET /api/candidatos - List candidates with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const especialidad = searchParams.get("especialidad");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const where: Record<string, unknown> = {};

    if (estado && Object.values(EstadoCandidato).includes(estado as EstadoCandidato)) {
      where.estado = estado;
    }

    if (especialidad) {
      where.especialidad = { contains: especialidad };
    }

    const candidatos = await db.candidatoAsesor.findMany({
      where,
      orderBy: {
        fechaPostulacion: "desc",
      },
      ...(limit && { take: parseInt(limit) }),
      ...(offset && { skip: parseInt(offset) }),
    });

    const total = await db.candidatoAsesor.count({ where });

    return NextResponse.json({
      data: candidatos,
      meta: {
        total,
        limit: limit ? parseInt(limit) : null,
        offset: offset ? parseInt(offset) : null,
      },
    });
  } catch (error) {
    console.error("Error fetching candidatos:", error);
    return NextResponse.json(
      { error: "Error al obtener los candidatos" },
      { status: 500 }
    );
  }
}

// POST /api/candidatos - Create a new candidate application (public endpoint)
export async function POST(request: NextRequest) {
  try {
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
    } = body;

    // Validate required fields
    if (!nombre || !apellido || !email || !telefono || !profesion || !especialidad) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: nombre, apellido, email, telefono, profesion, especialidad" },
        { status: 400 }
      );
    }

    // Check if email is already registered as a candidate
    const existingCandidato = await db.candidatoAsesor.findFirst({
      where: { email },
    });

    if (existingCandidato) {
      return NextResponse.json(
        { error: "Ya existe una postulación con este correo electrónico" },
        { status: 400 }
      );
    }

    // Check if email is already registered as a user
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    let userId: string | undefined = existingUser?.id;

    // Create user if doesn't exist (as EMPRESA_AFILIADA initially)
    if (!existingUser) {
      const newUser = await db.user.create({
        data: {
          email,
          nombre,
          apellido,
          telefono,
          password: "", // Will be set when approved
          rol: "EMPRESA_AFILIADA",
          activo: false, // Not active until approved
        },
      });
      userId = newUser.id;
    }

    const candidato = await db.candidatoAsesor.create({
      data: {
        userId: userId!,
        nombre,
        apellido,
        email,
        telefono,
        profesion,
        especialidad,
        experiencia,
        biografia,
        cvUrl,
        cartasRecomendacion: cartasRecomendacion ? JSON.stringify(cartasRecomendacion) : null,
        estado: EstadoCandidato.PENDIENTE,
      },
    });

    return NextResponse.json(candidato, { status: 201 });
  } catch (error) {
    console.error("Error creating candidato:", error);
    return NextResponse.json(
      { error: "Error al crear la postulación" },
      { status: 500 }
    );
  }
}
