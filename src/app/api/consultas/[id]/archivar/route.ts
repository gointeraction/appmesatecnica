import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EstadoConsulta } from '@prisma/client';
import nodemailer from 'nodemailer';

async function createTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  // Fallback to console or test account for development
  return null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Get consultation details including empresa and dictamen
    const consulta = await db.consulta.findUnique({
      where: { id },
      include: {
        empresa: true,
        dictamenes: {
          where: { esFinal: true },
          take: 1,
          orderBy: { createdAt: 'desc' }
        },
        documentos: true
      }
    });

    if (!consulta) {
      return NextResponse.json({ error: 'Consulta no encontrada' }, { status: 404 });
    }

    if (consulta.estado !== EstadoConsulta.CERRADA) {
      return NextResponse.json({ error: 'Solo se pueden archivar consultas cerradas' }, { status: 400 });
    }

    // 2. Mark as archived
    await db.consulta.update({
      where: { id },
      data: { archivada: true }
    });

    // 3. Send email to the company
    const transporter = await createTransporter();
    const resultDoc = consulta.dictamenes[0];
    const docsList = consulta.documentos.map(d => `- ${d.nombre}: ${process.env.NEXT_PUBLIC_APP_URL || ''}/uploads/${d.ruta}`).join('\n');

    if (transporter && consulta.empresa?.email) {
      const from = process.env.SMTP_FROM || 'noreply@mesatecnica.cavecom-e.org';
      
      await transporter.sendMail({
        from: `"Mesa Técnica" <${from}>`,
        to: consulta.empresa.email,
        subject: `Resultado Final: Consulta ${consulta.codigo}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e293b;">Resultado de su Consulta</h2>
            <p>Estimado/a ${consulta.empresa.nombre},</p>
            <p>Su consulta con código <strong>${consulta.codigo}</strong> ha sido procesada y archivada satisfactoriamente.</p>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin-top: 0; font-size: 16px;">Resumen del Resultado:</h3>
              <p style="font-size: 14px; color: #475569;">${resultDoc?.conclusion || 'La consulta ha sido resuelta según los términos discutidos.'}</p>
            </div>

            ${consulta.documentos.length > 0 ? `
              <h3 style="font-size: 16px;">Documentación Anexa:</h3>
              <ul style="font-size: 14px; color: #2563eb;">
                ${consulta.documentos.map(d => `<li><a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/api/documentos/${d.id}">${d.nombre}</a></li>`).join('')}
              </ul>
            ` : ''}

            <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
              Este es un correo automático, por favor no responda a este mensaje.
            </p>
          </div>
        `
      });
    }

    return NextResponse.json({ message: 'Consulta archivada y notificación enviada' });
  } catch (error) {
    console.error('[ARCHIVAR PUT]', error);
    return NextResponse.json({ error: 'Error al archivar la consulta' }, { status: 500 });
  }
}
