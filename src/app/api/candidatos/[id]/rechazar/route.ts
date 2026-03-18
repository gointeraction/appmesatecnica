import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EstadoCandidato } from "@prisma/client";
import { sendEmail } from "@/lib/mail";

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
    const rejectableStates: string[] = [
      EstadoCandidato.PENDIENTE,
      EstadoCandidato.EN_REVISION,
      EstadoCandidato.ENTREVISTA,
      EstadoCandidato.EVALUACION,
      'SOLICITUD_INFORMACION',
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

    // Send Rejection Email
    await sendEmail({
      to: candidato.email,
      subject: "Información sobre su postulación - Mesa Técnica de Criptoactivos",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;background:#f8fafc;color:#1e293b;border-radius:12px;border:1px solid #e2e8f0;">
          <h2 style="color:#00459E;margin-bottom:8px;">Mesa Técnica de Criptoactivos</h2>
          <p style="color:#64748b;margin-bottom:24px;">Cámara Venezolana de Comercio Electrónico</p>
          
          <p>Estimado(a) <strong>${candidato.nombre}</strong>,</p>
          
          <p>Agradecemos sinceramente su interés en unirse a la Mesa Técnica de Criptoactivos y el tiempo dedicado a su postulación.</p>
          
          <div style="background:#ffffff;padding:24px;border-radius:8px;border-top:4px solid #ef4444;margin:24px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <p>Tras una cuidadosa revisión de su perfil y los requerimientos actuales de nuestros comités, lamentamos informarle que en esta oportunidad no continuaremos con su proceso.</p>
            <p style="color:#64748b;font-size:14px;margin-top:16px;"><em>Su perfil se mantendrá en nuestra base de datos para futuras oportunidades donde su experiencia pueda alinearse con nuevas necesidades de la Mesa.</em></p>
          </div>
          
          <p>Le deseamos el mayor de los éxitos en sus proyectos profesionales y agradecemos nuevamente su aporte al ecosistema de criptoactivos.</p>
          
          <hr style="border:0;border-top:1px solid #e2e8f0;margin:32px 0;" />
          <p style="font-weight:bold;color:#1e293b;">Atentamente,</p>
          <p style="color:#64748b;">Consejo Directivo - Mesa Técnica de Criptoactivos</p>
          
          <p style="color:#94a3b8;font-size:11px;text-align:center;margin-top:32px;">Este mensaje es confidencial e institucional de CAVECOM-E.</p>
        </div>
      `,
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
