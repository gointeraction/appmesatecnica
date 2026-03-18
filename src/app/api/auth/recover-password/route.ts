import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import nodemailer from 'nodemailer'

const OTP_TTL_MINUTES = 10

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

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
    })
  }
  const testAccount = await nodemailer.createTestAccount()
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  })
}

async function sendRecoveryEmail(email: string, code: string): Promise<void> {
  const from = process.env.SMTP_FROM || 'noreply@mesatecnica.cavecom-e.org'
  const transporter = await createTransporter()

  const info = await transporter.sendMail({
    from: `"Mesa Técnica de Criptoactivos" <${from}>`,
    to: email,
    subject: `Recuperación de contraseña`,
    text: `Tu código para recuperar la contraseña es: ${code}\nVálido por ${OTP_TTL_MINUTES} minutos.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#1e293b;color:#f1f5f9;border-radius:12px;">
        <h2 style="color:#f59e0b;margin-bottom:8px;">Mesa Técnica de Criptoactivos</h2>
        <p>Has solicitado recuperar tu contraseña.</p>
        <p>Tu código de seguridad es:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;background:#0f172a;padding:16px 24px;border-radius:8px;text-align:center;color:#f59e0b;margin:16px 0;">
          ${code}
        </div>
        <p style="color:#94a3b8;font-size:14px;">Válido por <strong>${OTP_TTL_MINUTES} minutos</strong>. Si no solicitaste este cambio, ignora este correo.</p>
      </div>
    `,
  })

  // Dev log
  if (!process.env.SMTP_HOST) {
    console.log(`\n╔════════════════════════════════════════╗`)
    console.log(`║  RECOVERY OTP para ${email}`)
    console.log(`║  Código: ${code}   (válido ${OTP_TTL_MINUTES} min)`)
    console.log(`║  Ver email: ${nodemailer.getTestMessageUrl(info)}`)
    console.log(`╚════════════════════════════════════════╝\n`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, message: 'Email inválido' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const user = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (!user || !user.activo) {
      // Prevents email enumeration
      return NextResponse.json({
        success: true,
        message: 'Si el correo es válido, recibirá las instrucciones.',
      })
    }

    // Clean previous OTPs
    await db.otpCode.deleteMany({
      where: {
        email: normalizedEmail,
        OR: [{ used: true }, { expiresAt: { lt: new Date() } }],
      },
    })

    const code = generateOTP()
    await db.otpCode.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
      },
    })

    await sendRecoveryEmail(normalizedEmail, code)

    return NextResponse.json({
      success: true,
      message: 'Instrucciones enviadas a su correo electrónico.',
    })
  } catch (error) {
    console.error('[RECOVERY POST]', error)
    return NextResponse.json({ success: false, message: 'Error interno' }, { status: 500 })
  }
}
