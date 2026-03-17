/**
 * API de Usuarios - Mesa Técnica de Criptoactivos
 * GET /api/usuarios - Lista todos los usuarios (ADMIN, SECRETARIA_TECNICA)
 * POST /api/usuarios - Crea un nuevo usuario (ADMIN)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, hasRole, hashPassword } from '@/lib/auth'
import type { User, RolUsuario } from '@prisma/client'

// Tipos para las respuestas
interface UserListResponse {
  success: boolean
  message: string
  users?: Omit<User, 'password'>[]
  total?: number
}

interface UserCreateResponse {
  success: boolean
  message: string
  user?: Omit<User, 'password'>
}

// Roles permitidos para listar usuarios
const ALLOWED_ROLES_LIST: RolUsuario[] = ['ADMIN', 'SECRETARIA_TECNICA']

// Solo ADMIN puede crear usuarios
const ALLOWED_ROLES_CREATE: RolUsuario[] = ['ADMIN']

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

/**
 * GET /api/usuarios
 * Lista todos los usuarios con filtros opcionales
 */
export async function GET(request: NextRequest): Promise<NextResponse<UserListResponse>> {
  try {
    // Verificar autenticación y permisos
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'No autorizado. Inicie sesión para continuar.'
        },
        { status: 401 }
      )
    }

    if (!hasRole(currentUser.rol, ALLOWED_ROLES_LIST)) {
      return NextResponse.json(
        {
          success: false,
          message: 'No tiene permisos para ver la lista de usuarios.'
        },
        { status: 403 }
      )
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const rol = searchParams.get('rol') as RolUsuario | null
    const activo = searchParams.get('activo')
    const buscar = searchParams.get('buscar')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Construir filtros
    const where: {
      rol?: RolUsuario
      activo?: boolean
      OR?: Array<{
        nombre?: { contains: string; mode: 'insensitive' }
        apellido?: { contains: string; mode: 'insensitive' }
        email?: { contains: string; mode: 'insensitive' }
        empresa?: { contains: string; mode: 'insensitive' }
      }>
    } = {}

    if (rol && ['ADMIN', 'SECRETARIA_TECNICA', 'ASESOR', 'EMPRESA_AFILIADA'].includes(rol)) {
      where.rol = rol
    }

    if (activo !== null && activo !== '') {
      where.activo = activo === 'true'
    }

    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar, mode: 'insensitive' } },
        { apellido: { contains: buscar, mode: 'insensitive' } },
        { email: { contains: buscar, mode: 'insensitive' } },
        { empresa: { contains: buscar, mode: 'insensitive' } }
      ]
    }

    // Obtener total de registros
    const total = await db.user.count({ where })

    // Obtener usuarios (sin passwords)
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        cargo: true,
        empresa: true,
        rol: true,
        activo: true,
        imagenUrl: true,
        ultimoAcceso: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Usuarios obtenidos exitosamente',
        users,
        total
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/usuarios
 * Crea un nuevo usuario (solo ADMIN)
 */
export async function POST(request: NextRequest): Promise<NextResponse<UserCreateResponse>> {
  try {
    // Verificar autenticación y permisos
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'No autorizado. Inicie sesión para continuar.'
        },
        { status: 401 }
      )
    }

    if (!hasRole(currentUser.rol, ALLOWED_ROLES_CREATE)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Solo los administradores pueden crear usuarios.'
        },
        { status: 403 }
      )
    }

    // Parsear el cuerpo de la petición
    const body = await request.json()
    const { email, password, nombre, apellido, telefono, cargo, empresa, rol, activo } = body

    // Validar campos requeridos
    if (!email || !password || !nombre || !rol) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email, contraseña, nombre y rol son requeridos'
        },
        { status: 400 }
      )
    }

    // Validar rol
    const validRoles: RolUsuario[] = ['ADMIN', 'SECRETARIA_TECNICA', 'ASESOR', 'EMPRESA_AFILIADA']
    if (!validRoles.includes(rol)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Rol inválido. Roles permitidos: ADMIN, SECRETARIA_TECNICA, ASESOR, EMPRESA_AFILIADA'
        },
        { status: 400 }
      )
    }

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim()

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
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

    // Crear el usuario
    const newUser = await db.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        nombre: nombre.trim(),
        apellido: apellido?.trim() || null,
        telefono: telefono?.trim() || null,
        cargo: cargo?.trim() || null,
        empresa: empresa?.trim() || null,
        rol,
        activo: activo !== undefined ? activo : true
      }
    })

    // Retornar respuesta exitosa (sin la contraseña)
    const { password: _, ...safeUser } = newUser
    
    return NextResponse.json(
      {
        success: true,
        message: 'Usuario creado exitosamente',
        user: safeUser
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al crear usuario:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}
