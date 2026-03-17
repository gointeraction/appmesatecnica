/**
 * Store de Autenticación - Mesa Técnica de Criptoactivos
 * Gestión del estado de autenticación con Zustand
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { RolUsuario } from '@prisma/client'

// Interfaz del usuario en el store
export interface AuthUser {
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

// Estado del store de autenticación
interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Acciones
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  setUser: (user: AuthUser | null) => void
  updateUser: (updates: Partial<AuthUser>) => void
  checkAuth: () => Promise<void>
}

// Respuesta del API de login
interface LoginResponse {
  success: boolean
  message: string
  user?: AuthUser
}

// Respuesta del API de logout
interface LogoutResponse {
  success: boolean
  message: string
}

/**
 * Store de Zustand para la autenticación
 * Incluye persistencia en localStorage para mantener la sesión
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      /**
       * Inicia sesión con email y contraseña
       */
      login: async (email: string, password: string) => {
        set({ isLoading: true })
        
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
          })

          const data: LoginResponse = await response.json()

          if (data.success && data.user) {
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false
            })
            return { success: true, message: data.message }
          }

          set({ isLoading: false })
          return { success: false, message: data.message }
        } catch (error) {
          console.error('Error en login:', error)
          set({ isLoading: false })
          return { success: false, message: 'Error de conexión' }
        }
      },

      /**
       * Cierra la sesión del usuario
       */
      logout: async () => {
        set({ isLoading: true })
        
        try {
          await fetch('/api/auth/logout', {
            method: 'POST'
          })
        } catch (error) {
          console.error('Error en logout:', error)
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          })
        }
      },

      /**
       * Establece el usuario actual
       */
      setUser: (user: AuthUser | null) => {
        set({
          user,
          isAuthenticated: !!user
        })
      },

      /**
       * Actualiza datos parciales del usuario
       */
      updateUser: (updates: Partial<AuthUser>) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates }
          })
        }
      },

      /**
       * Verifica el estado de autenticación con el servidor
       */
      checkAuth: async () => {
        set({ isLoading: true })
        
        try {
          const response = await fetch('/api/usuarios/me', {
            method: 'GET',
            credentials: 'include'
          })

          // Si el endpoint no existe (404), intentar obtener el usuario actual
          // de otra manera o mantener el estado del store
          if (response.status === 404) {
            // El store persistente ya tiene el usuario, mantenerlo
            set({ isLoading: false })
            return
          }

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.user) {
              set({
                user: data.user,
                isAuthenticated: true,
                isLoading: false
              })
            } else {
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false
              })
            }
          } else {
            // Sesión inválida o expirada
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false
            })
          }
        } catch (error) {
          console.error('Error al verificar autenticación:', error)
          set({ isLoading: false })
        }
      }
    }),
    {
      name: 'mesa-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

// Hooks de utilidad para roles
export const useUserRole = () => useAuthStore((state) => state.user?.rol)
export const useIsAdmin = () => useAuthStore((state) => state.user?.rol === 'ADMIN')
export const useIsSecretariaTecnica = () => useAuthStore((state) => state.user?.rol === 'SECRETARIA_TECNICA')
export const useIsAsesor = () => useAuthStore((state) => state.user?.rol === 'ASESOR')
export const useIsEmpresaAfiliada = () => useAuthStore((state) => state.user?.rol === 'EMPRESA_AFILIADA')

// Hook para verificar si el usuario tiene uno de varios roles
export const useHasRole = (roles: RolUsuario[]) => {
  const userRole = useAuthStore((state) => state.user?.rol)
  return userRole ? roles.includes(userRole) : false
}

// Hook para obtener el nombre completo del usuario
export const useUserFullName = () => {
  const user = useAuthStore((state) => state.user)
  if (!user) return ''
  return user.apellido ? `${user.nombre} ${user.apellido}` : user.nombre
}

// Exportar el tipo del store para uso externo
export type { AuthState }
