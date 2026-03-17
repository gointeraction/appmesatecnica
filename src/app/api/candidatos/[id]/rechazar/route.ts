import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EstadoCandidato } from "@prisma/client";

// POST /api/candidatos/[id]/rechazar - Reject a candidate with reason
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { revisadoPor, motivo, observaciones } = body;

    // Validate required fields
    if (!motivo) {
      return NextResponse.json(
        { error: "El motivo del rechazo es requerido" },
        { status: 400 }
      );
    }

    // Check if candidato exists
    const candidato = await db.candidatoAsesor.findUnique({
      where: { id },
    });

    if (!candidato) {
      return NextResponse.json(
        { error: "Candidato no encontrado" },
        { status: 404 }
      );
    }

    // Check if candidato is in a state that can be rejected
    const rejectableStates = [
      EstadoCandidato.PENDIENTE,
      EstadoCandidato.EN_REVISION,
      EstadoCandidato.ENTREVISTA,
      EstadoCandidato.EVALUACION,
    ];

    if (!rejectableStates.includes(candidato.estado)) {
      return NextResponse.json(
        { error: "El candidato no puede ser rechazado en su estado actual" },
        { status: 400 }
      );
    }

    // Update candidato status to RECHAZADO
    const updatedCandidato = await db.candidatoAsesor.update({
      where: { id },
      data: {
        estado: EstadoCandidato.RECHAZADO,
        fechaRevision: new Date(),
        revisadoPor,
        observaciones: observaciones
          ? `Motivo: ${motivo}. ${observaciones}`
          : `Motivo: ${motivo}`,
      },
    });

    return NextResponse.json({
      message: "Candidato rechazado",
      data: updatedCandidato,
    });
  } catch (error) {
    console.error("Error rejecting candidato:", error);
    return NextResponse.json(
      { error: "Error al rechazar el candidato" },
      { status: 500 }
    );
  }
}
