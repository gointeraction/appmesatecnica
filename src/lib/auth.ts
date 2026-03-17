import { cookies } from 'next/headers'
import { db } from './db'
import bcrypt from 'bcryptjs'

const SESSION_COOKIE_NAME = 'session_token'
const SESSION_USER_ID_COOKIE = 'session_user_id'
const SESSION_DURATION_DAYS = 7

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createSession(userId: string): Promise<string> {
  const token = bcrypt.hashSync(userId + Date.now().toString(), 10)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)
  
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
  })
  
  // Also store userId in a separate cookie for easy access
  cookieStore.set(SESSION_USER_ID_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
  })
  
  return token
}

export async function updateLastAccess(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { ultimoAcceso: new Date() }
  })
}

export async function getSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  
  if (!token) return null
  
  // For now, we'll use a simple approach - store userId in a separate cookie
  const userIdCookie = cookieStore.get('session_user_id')?.value
  if (!userIdCookie) return null
  
  return { userId: userIdCookie }
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null
  
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      nombre: true,
      apellido: true,
      rol: true,
      activo: true,
      telefono: true,
      empresa: true,
      cargo: true,
      imagenUrl: true,
      ultimoAcceso: true,
      createdAt: true,
    },
  })
  
  return user
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
  cookieStore.delete('session_user_id')
}

export function hasRole(user: { rol: string }, allowedRoles: string[]): boolean {
  return allowedRoles.includes(user.rol)
}

export function isAdmin(user: { rol: string }): boolean {
  return user.rol === 'ADMIN'
}

export function isSecretariaTecnica(user: { rol: string }): boolean {
  return user.rol === 'SECRETARIA_TECNICA'
}

export function isAsesor(user: { rol: string }): boolean {
  return user.rol === 'ASESOR'
}

export function isEmpresaAfiliada(user: { rol: string }): boolean {
  return user.rol === 'EMPRESA_AFILIADA'
}
