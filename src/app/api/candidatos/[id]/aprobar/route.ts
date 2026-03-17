import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EstadoCandidato, RolUsuario } from "@prisma/client";

// POST /api/candidatos/[id]/aprobar - Approve a candidate and create user+asesor
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { revisadoPor, comiteId, observaciones } = body;

    // Check if candidato exists
    const candidato = await db.candidatoAsesor.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!candidato) {
      return NextResponse.json(
        { error: "Candidato no encontrado" },
        { status: 404 }
      );
    }

    // Check if candidato is in a state that can be approved
    const approvedStates = [
      EstadoCandidato.PENDIENTE,
      EstadoCandidato.EN_REVISION,
      EstadoCandidato.ENTREVISTA,
      EstadoCandidato.EVALUACION,
      EstadoCandidato.APROBADO,
    ];

    if (!approvedStates.includes(candidato.estado)) {
      return NextResponse.json(
        { error: "El candidato no puede ser aprobado en su estado actual" },
        { status: 400 }
      );
    }

    // If comiteId is provided, verify it exists
    if (comiteId) {
      const comite = await db.comite.findUnique({
        where: { id: comiteId },
      });

      if (!comite) {
        return NextResponse.json(
          { error: "El comité no existe" },
          { status: 404 }
        );
      }
    }

    // Use a transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // Update user role to ASESOR and activate account
      const updatedUser = await tx.user.update({
        where: { id: candidato.userId },
        data: {
          rol: RolUsuario.ASESOR,
          activo: true,
        },
      });

      // Create asesor profile
      const asesor = await tx.asesor.create({
        data: {
          userId: candidato.userId,
          profesion: candidato.profesion,
          especialidad: candidato.especialidad,
          biografia: candidato.biografia,
          comiteId: comiteId || null,
          activo: true,
        },
      });

      // Update candidato status to INCORPORADO
      const updatedCandidato = await tx.candidatoAsesor.update({
        where: { id },
        data: {
          estado: EstadoCandidato.INCORPORADO,
          fechaRevision: new Date(),
          revisadoPor,
          observaciones,
        },
      });

      return { updatedUser, asesor, updatedCandidato };
    });

    return NextResponse.json({
      message: "Candidato aprobado e incorporado exitosamente",
      data: {
        candidato: result.updatedCandidato,
        asesor: result.asesor,
        user: {
          id: result.updatedUser.id,
          nombre: result.updatedUser.nombre,
          apellido: result.updatedUser.apellido,
          email: result.updatedUser.email,
          rol: result.updatedUser.rol,
        },
      },
    });
  } catch (error) {
    console.error("Error approving candidato:", error);
    return NextResponse.json(
      { error: "Error al aprobar el candidato" },
      { status: 500 }
    );
  }
}
