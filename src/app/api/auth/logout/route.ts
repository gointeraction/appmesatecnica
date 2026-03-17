/**
 * API de Logout - Mesa Técnica de Criptoactivos
 * POST /api/auth/logout
 * 
 * Cierra la sesión del usuario
 */

import { NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth'

interface LogoutResponse {
  success: boolean
  message: string
}

export async function POST(): Promise<NextResponse<LogoutResponse>> {
  try {
    // Destruir la sesión
    await destroySession()

    return NextResponse.json(
      {
        success: true,
        message: 'Sesión cerrada exitosamente'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error en logout:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error al cerrar sesión'
      },
      { status: 500 }
    )
  }
}
