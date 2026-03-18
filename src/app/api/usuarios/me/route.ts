/**
 * API de Usuario Actual - Mesa Técnica de Criptoactivos
 * GET /api/usuarios/me - Obtiene los datos del usuario autenticado
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'No autorizado'
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        user
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error en /api/usuarios/me:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}
