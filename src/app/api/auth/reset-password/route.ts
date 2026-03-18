import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

const MAX_ATTEMPTS = 5

export async function PUT(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json({ success: false, message: 'Datos incompletos' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Buscamos el código OTP válido (no usado, no expirado) para este correo
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

    // Incrementar en 1 el contador de intentos
    const updatedEntry = await db.otpCode.update({
      where: { id: entry.id },
      data: { attempts: { increment: 1 } },
    })

    if (updatedEntry.attempts > MAX_ATTEMPTS) {
      // Marcar OTP como usado para revocarlo por completo
      await db.otpCode.update({ where: { id: entry.id }, data: { used: true } })
      return NextResponse.json(
        { success: false, message: 'Demasiados intentos. Solicite un nuevo código de recuperación.' },
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

    // Código correcto
    // 1. Marcar OTP como usado
    await db.otpCode.update({ where: { id: entry.id }, data: { used: true } })

    // 2. Hashear la nueva contraseña y actualizar el usuario
    const hashedPassword = await hashPassword(newPassword)
    await db.user.update({
      where: { email: normalizedEmail },
      data: { password: hashedPassword }
    })

    return NextResponse.json({ success: true, message: 'Contraseña actualizada correctamente.' })
  } catch (error) {
    console.error('[RESET_PASSWORD PUT]', error)
    return NextResponse.json({ success: false, message: 'Error interno' }, { status: 500 })
  }
}
