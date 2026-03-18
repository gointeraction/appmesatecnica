import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/mail";

// POST /api/candidatos/[id]/solicitar-info - Request more info from a candidate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { mensaje } = body;

    if (!mensaje) {
      return NextResponse.json(
        { error: "El mensaje para el candidato es requerido" },
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

    // Update candidato status
    const updatedCandidato = await db.candidatoAsesor.update({
      where: { id },
      data: {
        estado: 'SOLICITUD_INFORMACION' as any, // Cast to any because types might be out of sync
        observaciones: candidato.observaciones 
          ? `${candidato.observaciones}\n\n[PROCESO] Información solicitada: ${mensaje}`
          : `[PROCESO] Información solicitada: ${mensaje}`,
      },
    });

    // Send Email
    await sendEmail({
      to: candidato.email,
      subject: "Información adicional requerida - Mesa Técnica de Criptoactivos",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;background:#f8fafc;color:#1e293b;border-radius:12px;border:1px solid #e2e8f0;">
          <h2 style="color:#00459E;margin-bottom:8px;">Mesa Técnica de Criptoactivos</h2>
          <p style="color:#64748b;margin-bottom:24px;">Cámara Venezolana de Comercio Electrónico</p>
          
          <p>Estimado(a) <strong>${candidato.nombre}</strong>,</p>
          
          <p>Gracias por su interés en formar parte de nuestra Mesa Técnica de Criptoactivos.</p>
          
          <div style="background:#ffffff;padding:24px;border-radius:8px;border-left:4px solid #00459E;margin:24px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <p style="margin-top:0;font-weight:bold;color:#1e293b;">El Consejo Directivo solicita la siguiente información adicional:</p>
            <p style="white-space:pre-wrap;color:#334155;">${mensaje}</p>
          </div>
          
          <p>Por favor, responda a este correo con la información solicitada para que podamos continuar con su proceso de evaluación.</p>
          
          <hr style="border:0;border-top:1px solid #e2e8f0;margin:32px 0;" />
          <p style="color:#64748b;font-size:12px;text-align:center;">Este es un mensaje institucional de la Mesa Técnica de Criptoactivos de CAVECOM-E.</p>
        </div>
      `,
    });

    return NextResponse.json({
      message: "Solicitud de información enviada",
      data: updatedCandidato,
    });
  } catch (error) {
    console.error("Error requesting info from candidato:", error);
    return NextResponse.json(
      { error: "Error al solicitar información" },
      { status: 500 }
    );
  }
}
