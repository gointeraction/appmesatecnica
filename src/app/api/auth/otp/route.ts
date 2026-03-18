/**
 * API de OTP (One-Time Password) - Mesa Técnica de Criptoactivos
 * POST /api/auth/otp       → Genera y envía el OTP al correo
 * PUT  /api/auth/otp       → Verifica el OTP ingresado
 *
 * Almacenamiento: tabla OtpCode en la base de datos (SQLite via Prisma)
 * Email: Nodemailer (SMTP real si SMTP_HOST está configurado, consola si no)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import nodemailer from 'nodemailer'

const OTP_TTL_MINUTES = 10
const MAX_ATTEMPTS = 5

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Crea un transporter Nodemailer.
 * - Si SMTP_HOST está definido → usa SMTP real
 * - Si no → usa ethereal (modo dev, muestra enlace en consola)
 */
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

  // Modo desarrollo: cuenta Ethereal temporal (mensajes visibles en ethereal.email)
  const testAccount = await nodemailer.createTestAccount()
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  })
}

async function sendOTPEmail(email: string, code: string): Promise<void> {
  const from = process.env.SMTP_FROM || 'noreply@mesatecnica.cavecom-e.org'

  const transporter = await createTransporter()

  const info = await transporter.sendMail({
    from: `"Mesa Técnica de Criptoactivos" <${from}>`,
    to: email,
    subject: `Tu código de verificación: ${code}`,
    text: `Tu código OTP es: ${code}\nVálido por ${OTP_TTL_MINUTES} minutos.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#1e293b;color:#f1f5f9;border-radius:12px;">
        <h2 style="color:#f59e0b;margin-bottom:8px;">Mesa Técnica de Criptoactivos</h2>
        <p style="color:#94a3b8;margin-bottom:24px;">Cámara Venezolana de Comercio Electrónico</p>
        <p>Tu código de verificación es:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;background:#0f172a;padding:16px 24px;border-radius:8px;text-align:center;color:#f59e0b;margin:16px 0;">
          ${code}
        </div>
        <p style="color:#94a3b8;font-size:14px;">Válido por <strong>${OTP_TTL_MINUTES} minutos</strong>. No compartas este código con nadie.</p>
      </div>
    `,
  })

  if (!process.env.SMTP_HOST) {
    // En modo dev, mostrar el enlace de Ethereal para ver el email
    console.log(`\n╔════════════════════════════════════════╗`)
    console.log(`║  OTP para ${email}`)
    console.log(`║  Código: ${code}   (válido ${OTP_TTL_MINUTES} min)`)
    console.log(`║  Ver email: ${nodemailer.getTestMessageUrl(info)}`)
    console.log(`╚════════════════════════════════════════╝\n`)
  }
}

/** POST — Genera y envía OTP */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, message: 'Email inválido' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Verificar que el usuario existe y está activo
    const user = await db.user.findUnique({ where: { email: normalizedEmail } })
    // Por seguridad no revelamos si el usuario existe o no
    if (!user || !user.activo) {
      return NextResponse.json({
        success: true,
        message: 'Si el correo es válido, recibirá el código.',
      })
    }

    // Limpiar OTPs anteriores y expirados de este email
    await db.otpCode.deleteMany({
      where: {
        email: normalizedEmail,
        OR: [
          { used: true },
          { expiresAt: { lt: new Date() } },
        ],
      },
    })

    const code = generateOTP()
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)

    // Guardar OTP en la base de datos
    await db.otpCode.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt,
      },
    })

    await sendOTPEmail(normalizedEmail, code)

    return NextResponse.json({
      success: true,
      message: `Código OTP enviado. Válido por ${OTP_TTL_MINUTES} minutos.`,
    })
  } catch (error) {
    console.error('[OTP POST]', error)
    return NextResponse.json({ success: false, message: 'Error interno' }, { status: 500 })
  }
}

/** PUT — Verifica el OTP */
export async function PUT(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ success: false, message: 'Datos incompletos' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Buscar OTP activo (no usado, no expirado)
    const entry = await db.otpCode.findFirst({
      where: {
        email: normalizedEmail,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!entry) {
      return NextResponse.json(
        { success: false, message: 'Código no encontrado o expirado' },
        { status: 400 }
      )
    }

    // Incrementar intentos
    const updatedEntry = await db.otpCode.update({
      where: { id: entry.id },
      data: { attempts: { increment: 1 } },
    })

    if (updatedEntry.attempts > MAX_ATTEMPTS) {
      // Marcar como usado para inutilizarlo
      await db.otpCode.update({ where: { id: entry.id }, data: { used: true } })
      return NextResponse.json(
        { success: false, message: 'Demasiados intentos. Solicite un nuevo código.' },
        { status: 429 }
      )
    }

    if (entry.code !== code.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: `Código incorrecto. Intento ${updatedEntry.attempts}/${MAX_ATTEMPTS}.`,
        },
        { status: 400 }
      )
    }

    // Código correcto — marcar como usado para que no sea reutilizable
    await db.otpCode.update({ where: { id: entry.id }, data: { used: true } })

    return NextResponse.json({ success: true, message: 'Código verificado correctamente.' })
  } catch (error) {
    console.error('[OTP PUT]', error)
    return NextResponse.json({ success: false, message: 'Error interno' }, { status: 500 })
  }
}
