/**
 * API de Registro Público - Mesa Técnica de Criptoactivos
 * POST /api/auth/register
 * 
 * Registro público para empresas afiliadas (rol EMPRESA_AFILIADA)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSession, updateLastAccess } from '@/lib/auth'
import type { RolUsuario } from '@prisma/client'

// Interfaz para la respuesta del registro
interface RegisterResponse {
  success: boolean
  message: string
  user?: {
    id: string
    email: string
    nombre: string
    apellido: string | null
    rol: RolUsuario
    empresa: string | null
  }
}

// Validación de contraseña
function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'La contraseña debe tener al menos 8 caracteres' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'La contraseña debe contener al menos una mayúscula' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'La contraseña debe contener al menos una minúscula' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'La contraseña debe contener al menos un número' }
  }
  return { valid: true }
}

// Validación de email
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function POST(request: NextRequest): Promise<NextResponse<RegisterResponse>> {
  try {
    // Parsear el cuerpo de la petición
    const body = await request.json()
    const { email, password, nombre, apellido, telefono, empresa, cargo } = body

    // Validar campos requeridos
    if (!email || !password || !nombre) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email, contraseña y nombre son requeridos'
        },
        { status: 400 }
      )
    }

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim()

    // Validar formato de email
    if (!validateEmail(normalizedEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Formato de email inválido'
        },
        { status: 400 }
      )
    }

    // Validar contraseña
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: passwordValidation.message || 'Contraseña inválida'
        },
        { status: 400 }
      )
    }

    // Verificar si el email ya está registrado
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'El email ya está registrado'
        },
        { status: 409 }
      )
    }

    // Hashear la contraseña
    const hashedPassword = await hashPassword(password)

    // Crear el usuario con rol EMPRESA_AFILIADA
    const newUser = await db.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        nombre: nombre.trim(),
        apellido: apellido?.trim() || null,
        telefono: telefono?.trim() || null,
        empresa: empresa?.trim() || null,
        cargo: cargo?.trim() || null,
        rol: 'EMPRESA_AFILIADA', // Solo empresas afiliadas pueden registrarse públicamente
        activo: true
      }
    })

    // Crear sesión automáticamente después del registro
    await createSession(newUser.id)
    await updateLastAccess(newUser.id)

    // Retornar respuesta exitosa (sin la contraseña)
    return NextResponse.json(
      {
        success: true,
        message: 'Registro exitoso. Bienvenido a la Mesa Técnica de Criptoactivos.',
        user: {
          id: newUser.id,
          email: newUser.email,
          nombre: newUser.nombre,
          apellido: newUser.apellido,
          rol: newUser.rol,
          empresa: newUser.empresa
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}
