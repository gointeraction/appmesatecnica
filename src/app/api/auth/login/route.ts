/**
 * API de Login - Mesa Técnica de Criptoactivos
 * POST /api/auth/login
 * 
 * Autentica un usuario y crea una sesión
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSession, updateLastAccess } from '@/lib/auth'
import type { RolUsuario } from '@prisma/client'

// Interfaz para la respuesta del login
interface LoginResponse {
  success: boolean
  message: string
  user?: {
    id: string
    email: string
    nombre: string
    apellido: string | null
    rol: RolUsuario
    empresa: string | null
    cargo: string | null
    telefono: string | null
    imagenUrl: string | null
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse>> {
  try {
    // Parsear el cuerpo de la petición
    const body = await request.json()
    const { email, password } = body

    // Validar campos requeridos
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email y contraseña son requeridos'
        },
        { status: 400 }
      )
    }

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim()

    // Buscar usuario por email
    const user = await db.user.findUnique({
      where: { email: normalizedEmail }
    })

    // Usuario no encontrado
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Credenciales inválidas'
        },
        { status: 401 }
      )
    }

    // Verificar si el usuario está activo
    if (!user.activo) {
      return NextResponse.json(
        {
          success: false,
          message: 'Usuario inactivo. Contacte al administrador.'
        },
        { status: 403 }
      )
    }

    // Verificar contraseña
    const isValidPassword = await verifyPassword(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Credenciales inválidas'
        },
        { status: 401 }
      )
    }

    // Crear sesión
    await createSession(user.id)

    // Actualizar fecha de último acceso
    await updateLastAccess(user.id)

    // Retornar respuesta exitosa (sin la contraseña)
    return NextResponse.json(
      {
        success: true,
        message: 'Inicio de sesión exitoso',
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          rol: user.rol,
          empresa: user.empresa,
          cargo: user.cargo,
          telefono: user.telefono,
          imagenUrl: user.imagenUrl
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}
