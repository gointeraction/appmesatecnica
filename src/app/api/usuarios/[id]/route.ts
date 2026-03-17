/**
 * API de Usuario Individual - Mesa Técnica de Criptoactivos
 * GET /api/usuarios/[id] - Obtiene un usuario por ID
 * PUT /api/usuarios/[id] - Actualiza un usuario
 * DELETE /api/usuarios/[id] - Desactiva un usuario (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, hasRole, hashPassword } from '@/lib/auth'
import type { User, RolUsuario } from '@prisma/client'

// Tipos para las respuestas
interface UserResponse {
  success: boolean
  message: string
  user?: Omit<User, 'password'>
}

// Roles permitidos para ver usuarios
const ALLOWED_ROLES_VIEW: RolUsuario[] = ['ADMIN', 'SECRETARIA_TECNICA']

// Roles permitidos para editar usuarios
const ALLOWED_ROLES_EDIT: RolUsuario[] = ['ADMIN']

// Validación de contraseña (opcional en actualización)
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

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/usuarios/[id]
 * Obtiene un usuario por ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<UserResponse>> {
  try {
    // Verificar autenticación
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

    const { id } = await params

    // Los usuarios pueden ver su propio perfil
    // ADMIN y SECRETARIA_TECNICA pueden ver cualquier perfil
    if (currentUser.id !== id && !hasRole(currentUser.rol, ALLOWED_ROLES_VIEW)) {
      return NextResponse.json(
        {
          success: false,
          message: 'No tiene permisos para ver este usuario.'
        },
        { status: 403 }
      )
    }

    // Buscar usuario
    const user = await db.user.findUnique({
      where: { id },
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
      }
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Usuario no encontrado'
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Usuario obtenido exitosamente',
        user
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error al obtener usuario:', error)
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
 * PUT /api/usuarios/[id]
 * Actualiza un usuario
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<UserResponse>> {
  try {
    // Verificar autenticación
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

    const { id } = await params

    // Los usuarios pueden editar su propio perfil (campos limitados)
    // ADMIN puede editar cualquier usuario y cualquier campo
    const isOwnProfile = currentUser.id === id
    const isAdmin = hasRole(currentUser.rol, ALLOWED_ROLES_EDIT)

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: 'No tiene permisos para editar este usuario.'
        },
        { status: 403 }
      )
    }

    // Parsear el cuerpo de la petición
    const body = await request.json()
    const { 
      email, 
      password, 
      nombre, 
      apellido, 
      telefono, 
      cargo, 
      empresa, 
      rol, 
      activo,
      imagenUrl 
    } = body

    // Verificar que el usuario existe
    const existingUser = await db.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Usuario no encontrado'
        },
        { status: 404 }
      )
    }

    // Construir datos de actualización
    const updateData: {
      email?: string
      password?: string
      nombre?: string
      apellido?: string | null
      telefono?: string | null
      cargo?: string | null
      empresa?: string | null
      rol?: RolUsuario
      activo?: boolean
      imagenUrl?: string | null
    } = {}

    // Campos que cualquiera puede editar de su propio perfil
    if (nombre !== undefined) {
      updateData.nombre = nombre.trim()
    }
    if (apellido !== undefined) {
      updateData.apellido = apellido?.trim() || null
    }
    if (telefono !== undefined) {
      updateData.telefono = telefono?.trim() || null
    }
    if (imagenUrl !== undefined) {
      updateData.imagenUrl = imagenUrl?.trim() || null
    }

    // Campos que solo ADMIN puede editar
    if (isAdmin) {
      if (email !== undefined) {
        const normalizedEmail = email.toLowerCase().trim()
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
        // Verificar si el email ya está en uso por otro usuario
        const emailInUse = await db.user.findFirst({
          where: { 
            email: normalizedEmail,
            NOT: { id }
          }
        })
        if (emailInUse) {
          return NextResponse.json(
            {
              success: false,
              message: 'El email ya está en uso por otro usuario'
            },
            { status: 409 }
          )
        }
        updateData.email = normalizedEmail
      }

      if (cargo !== undefined) {
        updateData.cargo = cargo?.trim() || null
      }
      if (empresa !== undefined) {
        updateData.empresa = empresa?.trim() || null
      }
      if (rol !== undefined) {
        const validRoles: RolUsuario[] = ['ADMIN', 'SECRETARIA_TECNICA', 'ASESOR', 'EMPRESA_AFILIADA']
        if (!validRoles.includes(rol)) {
          return NextResponse.json(
            {
              success: false,
              message: 'Rol inválido'
            },
            { status: 400 }
          )
        }
        updateData.rol = rol
      }
      if (activo !== undefined) {
        updateData.activo = activo
      }
    }

    // Contraseña (cualquier usuario puede cambiar su propia contraseña)
    if (password) {
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
      updateData.password = await hashPassword(password)
    }

    // Verificar que hay algo que actualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No hay datos para actualizar'
        },
        { status: 400 }
      )
    }

    // Actualizar usuario
    const updatedUser = await db.user.update({
      where: { id },
      data: updateData
    })

    // Retornar respuesta exitosa (sin la contraseña)
    const { password: _, ...safeUser } = updatedUser
    
    return NextResponse.json(
      {
        success: true,
        message: 'Usuario actualizado exitosamente',
        user: safeUser
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
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
 * DELETE /api/usuarios/[id]
 * Desactiva un usuario (soft delete) - Solo ADMIN
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<UserResponse>> {
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

    if (!hasRole(currentUser.rol, ALLOWED_ROLES_EDIT)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Solo los administradores pueden desactivar usuarios.'
        },
        { status: 403 }
      )
    }

    const { id } = await params

    // No permitir que un admin se desactive a sí mismo
    if (currentUser.id === id) {
      return NextResponse.json(
        {
          success: false,
          message: 'No puede desactivar su propia cuenta.'
        },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe
    const existingUser = await db.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Usuario no encontrado'
        },
        { status: 404 }
      )
    }

    // Desactivar usuario (soft delete)
    const updatedUser = await db.user.update({
      where: { id },
      data: { activo: false }
    })

    // Retornar respuesta exitosa (sin la contraseña)
    const { password: _, ...safeUser } = updatedUser
    
    return NextResponse.json(
      {
        success: true,
        message: 'Usuario desactivado exitosamente',
        user: safeUser
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error al desactivar usuario:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}
