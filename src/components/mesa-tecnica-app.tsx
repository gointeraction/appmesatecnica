'use client'

import { v4 as uuidv4 } from 'uuid'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  LayoutDashboard, Users, MessageSquare, Settings, LogOut, Menu, X, Bell,
  Search, Plus, ChevronRight, ChevronDown, FileText, Calendar, BookOpen,
  AlertTriangle, CheckCircle, Clock, User as UserIcon, Building, Shield, Briefcase,
  Upload, Send, Eye, Edit, Trash2, Check, XCircle, Filter, Download,
  ChevronLeft, MoreVertical, UserPlus, ClipboardList, TrendingUp, BarChart3,
  Award, Target, Zap, Globe, Lock, Mail, Phone, MapPin, Briefcase as BriefcaseIcon,
  GraduationCap, FileCheck, AlertCircle, Info, Star, ThumbsUp, ThumbsDown,
  ExternalLink, Copy, RefreshCw, Archive, Play, Video, File, FolderOpen,
  Newspaper, Megaphone, HelpCircle, Layers, Hash, ArrowRight, UserCheck,
  GripVertical, List, LayoutGrid
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { format, formatDistanceToNow, addDays, differenceInHours, differenceInBusinessDays, isPast, isToday, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Criptobot } from './criptobot'
import { ForoModule } from './foro-module'

import type {
  User, Asesor, Comite, Consulta, Mensaje, Dictamen, Documento,
  CandidatoAsesor, EventoAgenda, ArticuloKB, Notificacion, Configuracion,
  PlantillaDictamen, Estadisticas, EstadoConsulta, TipoConsulta, PrioridadConsulta, RolUsuario, SlaTipo
} from '@/types'

// ============ UTILITY FUNCTIONS ============
const fetchApi = async <T,>(url: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Error de conexión' }))
    throw new Error(error.error || 'Error en la solicitud')
  }
  return res.json()
}

const getEstadoColor = (estado: EstadoConsulta) => {
  const colors: Record<EstadoConsulta, string> = {
    RECIBIDA: 'bg-gray-500',
    CLASIFICADA: 'bg-blue-500',
    ASIGNADA: 'bg-yellow-500',
    EN_PROCESO: 'bg-orange-500',
    DICTAMEN: 'bg-purple-500',
    CERRADA: 'bg-green-500',
  }
  return colors[estado]
}

const getPrioridadColor = (prioridad: PrioridadConsulta) => {
  const colors: Record<PrioridadConsulta, string> = {
    BAJA: 'bg-gray-400',
    MEDIA: 'bg-blue-400',
    ALTA: 'bg-orange-400',
    URGENTE: 'bg-red-500 animate-pulse',
  }
  return colors[prioridad]
}

const getRolBadgeColor = (rol: RolUsuario) => {
  const colors: Record<RolUsuario, string> = {
    ADMIN: 'bg-red-500',
    SECRETARIA_TECNICA: 'bg-purple-500',
    ASESOR: 'bg-blue-500',
    EMPRESA_AFILIADA: 'bg-green-500',
  }
  return colors[rol]
}

const getSlaStatus = (slaFecha: string) => {
  const now = new Date()
  const sla = new Date(slaFecha)
  const hoursRemaining = differenceInHours(sla, now)
  
  if (isPast(sla)) return { status: 'vencido', color: 'text-red-500', label: 'Vencido' }
  if (hoursRemaining <= 24) return { status: 'urgente', color: 'text-orange-500', label: 'Urgente' }
  if (hoursRemaining <= 72) return { status: 'proximo', color: 'text-yellow-500', label: 'Próximo' }
  return { status: 'ok', color: 'text-green-500', label: 'En tiempo' }
}

// ============ PASSWORD RECOVERY COMPONENT ============
function PasswordRecoveryForm({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const res = await fetchApi<{ success: boolean; message: string }>('/api/auth/recover-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      toast.success(res.message)
      setStep(2)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al solicitar recuperación')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !newPassword || !confirmPassword) return
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)
    try {
      const res = await fetchApi<{ success: boolean; message: string }>('/api/auth/reset-password', {
        method: 'PUT',
        body: JSON.stringify({ email, code, newPassword }),
      })
      toast.success(res.message)
      onBack() // Regresa al login exitosamente
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al restablecer contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="text-center relative">
            <button onClick={onBack} className="absolute left-4 top-4 text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">Recuperar Contraseña</CardTitle>
            <CardDescription className="text-slate-400">
              {step === 1 ? 'Ingresa tu correo para recibir un código de seguridad' 
               : 'Ingresa el código y tu nueva contraseña'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rec-email" className="text-slate-300">Correo electrónico</Label>
                  <Input
                    id="rec-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar Código'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyAndReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-slate-300">Código de 6 dígitos</Label>
                  <Input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="text-center tracking-[0.5em] text-lg font-bold bg-slate-700/50 border-slate-600 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-pass" className="text-slate-300">Nueva Contraseña</Label>
                  <Input
                    id="new-pass"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conf-pass" className="text-slate-300">Confirmar Contraseña</Label>
                  <Input
                    id="conf-pass"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700" disabled={loading}>
                  {loading ? 'Actualizando...' : 'Restablecer Contraseña'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// ============ LOGIN COMPONENT ============
function LoginForm({ onLogin, onRegister, onCandidate, onConsultation }: {
  onLogin: (user: User) => void
  onRegister: () => void
  onCandidate: () => void
  onConsultation: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)

  useEffect(() => {
    const savedEmail = localStorage.getItem('mesa_tecnica_email')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await fetchApi<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (rememberMe) {
        localStorage.setItem('mesa_tecnica_email', email)
      } else {
        localStorage.removeItem('mesa_tecnica_email')
      }
      onLogin(data.user)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  if (showRecovery) {
    return <PasswordRecoveryForm onBack={() => setShowRecovery(false)} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">Mesa Técnica de Criptoactivos</CardTitle>
            <CardDescription className="text-slate-400">
              Cámara Venezolana de Comercio Electrónico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-slate-300">Contraseña</Label>
                  <button 
                    type="button" 
                    onClick={() => setShowRecovery(true)}
                    className="text-sm text-slate-400 hover:text-amber-500 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="flex items-center space-x-2 pb-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe} 
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)} 
                  className="border-slate-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white data-[state=checked]:border-amber-500"
                />
                <Label htmlFor="remember" className="text-sm font-normal text-slate-400 cursor-pointer">
                  Recordar contraseña
                </Label>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                disabled={loading}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// ============ STATS CARD ============
function StatCard({ title, value, icon: Icon, description, trend, color = 'blue' }: {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
  trend?: { value: number; isPositive: boolean }
  color?: string
}) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    amber: 'from-amber-500 to-amber-600',
  }

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${colorClasses[color]} opacity-10 rounded-bl-full`} />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && (
          <div className={`flex items-center text-xs mt-1 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
            <TrendingUp className={`w-3 h-3 mr-1 ${!trend.isPositive && 'rotate-180'}`} />
            {trend.value}% vs mes anterior
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============ DASHBOARD MODULE ============
function DashboardModule() {
  const [stats, setStats] = useState<Estadisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchApi<Estadisticas>('/api/estadisticas')
        setStats(data)
      } catch (error) {
        toast.error('Error al cargar estadísticas')
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-12 bg-muted" />
            <CardContent className="h-20 bg-muted mt-2" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Bienvenido, {user?.nombre}</h2>
        <p className="text-muted-foreground">Resumen de la Mesa Técnica de Criptoactivos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Consultas"
          value={stats?.totalConsultas || 0}
          icon={MessageSquare}
          color="blue"
        />
        <StatCard
          title="Pendientes de Clasificación"
          value={stats?.consultasPorEstado?.RECIBIDA || 0}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="En Proceso"
          value={(stats?.consultasPorEstado?.ASIGNADA || 0) + (stats?.consultasPorEstado?.EN_PROCESO || 0)}
          icon={Zap}
          color="purple"
        />
        <StatCard
          title="SLA Vencidos"
          value={stats?.slaVencidos || 0}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Consultas por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.consultasPorEstado && Object.entries(stats.consultasPorEstado).map(([estado, cantidad]) => (
                <div key={estado} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getEstadoColor(estado as EstadoConsulta)}`} />
                  <span className="flex-1 text-sm">{estado.replace('_', ' ')}</span>
                  <Badge variant="secondary">{cantidad}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Consultas por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.consultasPorTipo && Object.entries(stats.consultasPorTipo).map(([tipo, cantidad]) => (
                <div key={tipo} className="flex items-center justify-between">
                  <span className="text-sm">{tipo}</span>
                  <Badge variant="outline">{cantidad}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rendimiento del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-blue-500">{stats?.tiempoPromedioRespuesta || 0}h</div>
              <div className="text-sm text-muted-foreground">Tiempo Promedio Respuesta</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-green-500">{stats?.slaCumplidos || 0}</div>
              <div className="text-sm text-muted-foreground">SLA Cumplidos</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-amber-500">{stats?.asesoresActivos || 0}</div>
              <div className="text-sm text-muted-foreground">Asesores Activos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============ CONSULTAS KANBAN MODULE ============
function ConsultasModule() {
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null)
  const [filterComite, setFilterComite] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [cargandoMensajes, setCargandoMensajes] = useState(false)
  const [enviandoMensaje, setEnviandoMensaje] = useState(false)
  const [comites, setComites] = useState<Comite[]>([])
  const { user } = useAuthStore()
  const [isBrowser, setIsBrowser] = useState(false)
  const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST'>('KANBAN')

  useEffect(() => {
    setIsBrowser(true)
  }, [])

  const loadConsultas = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterComite && filterComite !== 'all') params.append('comite', filterComite)
      if (searchQuery) params.append('search', searchQuery)
      const data = await fetchApi<{ data: (Consulta & { archivada: boolean })[] }>(`/api/consultas?${params.toString()}`)
      setConsultas((data.data || []).filter(c => !c.archivada))
    } catch (error) {
      toast.error('Error al cargar consultas')
    } finally {
      setLoading(false)
    }
  }, [filterComite, searchQuery])

  // Fetch initial data
  useEffect(() => {
    fetchApi<{ data: Comite[] }>('/api/comites').then(data => setComites(data.data || []))
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadConsultas()
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery, filterComite, loadConsultas])

  const handleUpdateEstado = async (id: string, nuevoEstado: EstadoConsulta, previousState?: Consulta[]) => {
    try {
      await fetchApi(`/api/consultas/${id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      toast.success(`Estado actualizado a ${nuevoEstado.replace('_', ' ')}`)
      // No necesitamos recargar todo si fue un Drag, pero por seguridad:
      if (!previousState) loadConsultas()
    } catch (error) {
      toast.error('Error al actualizar estado')
      if (previousState) setConsultas(previousState)
      else loadConsultas()
    }
  }

  useEffect(() => {
    if (selectedConsulta) {
      const loadMensajes = async () => {
        setCargandoMensajes(true)
        try {
          const res = await fetchApi<{ data: Mensaje[] }>(`/api/mensajes?consultaId=${selectedConsulta.id}`)
          setMensajes(res.data || [])
        } catch (error) {
          toast.error('Error al cargar historial de aportes')
        } finally {
          setCargandoMensajes(false)
        }
      }
      loadMensajes()
    } else {
      setMensajes([])
      setNuevoMensaje('')
    }
  }, [selectedConsulta])

  const handleEnviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !selectedConsulta || !user) return
    
    setEnviandoMensaje(true)
    try {
      const msj = await fetchApi<Mensaje>('/api/mensajes', {
        method: 'POST',
        body: JSON.stringify({
          consultaId: selectedConsulta.id,
          userId: user.id,
          contenido: nuevoMensaje.trim()
        })
      })
      
      setMensajes(prev => [...prev, msj])
      setNuevoMensaje('')
      toast.success('Aporte agregado')
    } catch (error) {
      toast.error('Error al enviar aporte')
    } finally {
      setEnviandoMensaje(false)
    }
  }

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const consultaId = draggableId
    const nuevoEstado = destination.droppableId as EstadoConsulta
    const previousConsultas = [...consultas]

    // Optimistic UI update
    setConsultas(prev => prev.map(c => 
      c.id === consultaId ? { ...c, estado: nuevoEstado } : c
    ))

    // Usar la función compartida con lógica de reversión
    handleUpdateEstado(consultaId, nuevoEstado, previousConsultas)
  }

  const columns: EstadoConsulta[] = ['RECIBIDA', 'CLASIFICADA', 'ASIGNADA', 'EN_PROCESO', 'DICTAMEN', 'CERRADA']

  const getConsultasByEstado = (estado: EstadoConsulta) => 
    consultas.filter(c => c.estado === estado)

  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Consultas</h2>
          <p className="text-muted-foreground">Pipeline de atención técnica</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar consulta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 lg:w-64"
          />
          <Select value={filterComite} onValueChange={setFilterComite}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por comité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los comités</SelectItem>
              {comites.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex border rounded-lg p-1 bg-muted/30">
            <Button 
              variant={viewMode === 'KANBAN' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 px-2"
              onClick={() => setViewMode('KANBAN')}
            >
              <LayoutGrid className="w-4 h-4 mr-1" /> Kanban
            </Button>
            <Button 
              variant={viewMode === 'LIST' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 px-2"
              onClick={() => setViewMode('LIST')}
            >
              <List className="w-4 h-4 mr-1" /> Lista
            </Button>
          </div>
        </div>
      </div>

      {isBrowser ? (
        viewMode === 'KANBAN' ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {columns.map(column => (
                <Droppable key={column} droppableId={column}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex-shrink-0 w-72 flex flex-col h-[calc(100vh-270px)]"
                    >
                      <div className={`rounded-t-lg p-2 text-white text-sm font-medium ${getEstadoColor(column)}`}>
                        <div className="flex items-center justify-between">
                          <span>{column.replace('_', ' ')}</span>
                          <Badge variant="secondary" className="bg-white/20">
                            {getConsultasByEstado(column).length}
                          </Badge>
                        </div>
                      </div>
                      <ScrollArea className={`flex-1 rounded-b-lg border border-t-0 ${snapshot.isDraggingOver ? 'bg-muted/50' : 'bg-muted/30'}`}>
                        <div className="p-2 space-y-2 min-h-[100px] h-full">
                          {getConsultasByEstado(column).map((consulta, index) => {
                            const slaStatus = getSlaStatus(consulta.slaFecha)
                            return (
                              <Draggable key={consulta.id} draggableId={consulta.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    style={{...provided.draggableProps.style, paddingBottom: '0.01px'}}
                                  >
                                    <Card
                                      className={`relative group hover:shadow-md transition-shadow ${snapshot.isDragging ? 'shadow-xl ring-2 ring-primary scale-105 z-50' : ''}`}
                                    >
                                      <div 
                                        {...provided.dragHandleProps}
                                        className="absolute right-2 top-2 p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Arrastrar para cambiar estado"
                                      >
                                        <GripVertical className="w-4 h-4" />
                                      </div>
                                      <CardContent 
                                        className="p-3 cursor-pointer"
                                        onClick={() => setSelectedConsulta(consulta)}
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs text-muted-foreground font-mono">{consulta.codigo}</p>
                                            <p className="font-medium text-sm truncate">{consulta.titulo}</p>
                                          </div>
                                          <Badge className={`${getPrioridadColor(consulta.prioridad)} text-white text-xs`}>
                                            {consulta.prioridad}
                                          </Badge>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                          <Building className="w-3 h-3" />
                                          <span className="truncate">{consulta.empresa?.nombre || 'Sin empresa'}</span>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                          <div className="flex items-center gap-1">
                                            <Clock className={`w-3 h-3 ${slaStatus.color}`} />
                                            <span className={`text-xs ${slaStatus.color}`}>{slaStatus.label}</span>
                                          </div>
                                          <span className="text-xs text-muted-foreground">
                                            {format(new Date(consulta.createdAt), 'dd/MM', { locale: es })}
                                          </span>
                                        </div>
                                        {consulta.comites && consulta.comites.length > 0 && (
                                          <div className="mt-2 flex flex-wrap gap-1">
                                            {consulta.comites.map(cc => (
                                              <Badge key={cc.id} variant="outline" className="text-xs">
                                                {cc.comite?.nombre?.substring(0, 10)}...
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  </div>
                                )}
                              </Draggable>
                            )
                          })}
                          {provided.placeholder}
                          {getConsultasByEstado(column).length === 0 && !snapshot.isDraggingOver && (
                            <div className="text-center text-muted-foreground text-sm py-8">
                              Sin consultas
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead className="text-right">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consultas.length > 0 ? (
                  consultas.map((consulta) => {
                    const slaStatus = getSlaStatus(consulta.slaFecha)
                    return (
                      <TableRow 
                        key={consulta.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedConsulta(consulta)}
                      >
                        <TableCell className="font-mono text-xs">{consulta.codigo}</TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">{consulta.titulo}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{consulta.empresa?.nombre || '-'}</TableCell>
                        <TableCell>
                          <Badge className={`${getPrioridadColor(consulta.prioridad)} text-white text-[10px]`}>
                            {consulta.prioridad}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getEstadoColor(consulta.estado)} text-white text-[10px]`}>
                            {consulta.estado.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className={`w-3 h-3 ${slaStatus.color}`} />
                            <span className={`text-xs ${slaStatus.color}`}>{slaStatus.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs whitespace-nowrap">
                          {format(new Date(consulta.createdAt), 'dd/MM/yyyy', { locale: es })}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No se encontraron consultas con los filtros seleccionados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )
      ) : null}

      {/* Consulta Detail Dialog */}
      <Dialog open={!!selectedConsulta} onOpenChange={() => setSelectedConsulta(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedConsulta && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">{selectedConsulta.codigo}</span>
                      {selectedConsulta.titulo}
                    </DialogTitle>
                    <DialogDescription>
                      Creada {format(new Date(selectedConsulta.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                    </DialogDescription>
                  </div>
                  <Badge className={`${getEstadoColor(selectedConsulta.estado)} text-white`}>
                    {selectedConsulta.estado.replace('_', ' ')}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <p className="font-medium">{selectedConsulta.tipo}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Prioridad</Label>
                    <Badge className={`${getPrioridadColor(selectedConsulta.prioridad)} text-white`}>
                      {selectedConsulta.prioridad}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Empresa</Label>
                    <p className="font-medium">{selectedConsulta.empresa?.nombre || 'Sin asignar'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Asesor Principal</Label>
                    <p className="font-medium">{selectedConsulta.asesorPrincipal?.user?.nombre || 'Sin asignar'}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Descripción</Label>
                  <p className="mt-1 text-sm bg-muted/50 p-3 rounded-lg">{selectedConsulta.descripcion}</p>
                </div>

                {selectedConsulta.comites && selectedConsulta.comites.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Comités Asignados</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedConsulta.comites.map(cc => (
                        <Badge key={cc.id} style={{ backgroundColor: cc.comite?.color || '#888' }} className="text-white">
                          {cc.comite?.nombre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions based on role and status */}
                {user?.rol !== 'EMPRESA_AFILIADA' && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    {selectedConsulta.estado === 'RECIBIDA' && (
                      <Button onClick={() => handleUpdateEstado(selectedConsulta.id, 'CLASIFICADA')}>
                        <CheckCircle className="w-4 h-4 mr-2" /> Clasificar
                      </Button>
                    )}
                    {selectedConsulta.estado === 'CLASIFICADA' && (
                      <Button onClick={() => handleUpdateEstado(selectedConsulta.id, 'ASIGNADA')}>
                        <Users className="w-4 h-4 mr-2" /> Asignar
                      </Button>
                    )}
                    {selectedConsulta.estado === 'ASIGNADA' && (
                      <Button onClick={() => handleUpdateEstado(selectedConsulta.id, 'EN_PROCESO')}>
                        <Zap className="w-4 h-4 mr-2" /> Iniciar Proceso
                      </Button>
                    )}
                    {selectedConsulta.estado === 'EN_PROCESO' && (
                      <Button onClick={() => handleUpdateEstado(selectedConsulta.id, 'DICTAMEN')}>
                        <FileText className="w-4 h-4 mr-2" /> Emitir Dictamen
                      </Button>
                    )}
                    {selectedConsulta.estado === 'DICTAMEN' && (
                      <Button onClick={() => handleUpdateEstado(selectedConsulta.id, 'CERRADA')}>
                        <CheckCircle className="w-4 h-4 mr-2" /> Cerrar Consulta
                      </Button>
                    )}
                    {selectedConsulta.estado === 'CERRADA' && !((selectedConsulta as any).archivada) && (
                      <Button 
                        variant="secondary"
                        className="bg-slate-700 hover:bg-slate-800 text-white gap-2"
                        onClick={async () => {
                          if (confirm('¿Desea archivar esta consulta y notificar por correo el resultado a la empresa?')) {
                            try {
                              await fetchApi(`/api/consultas/${selectedConsulta.id}/archivar`, { method: 'PUT' });
                              toast.success('Consulta archivada y notificada');
                              setSelectedConsulta(null);
                              loadConsultas();
                            } catch (error) {
                              toast.error('Error al archivar');
                            }
                          }
                        }}
                      >
                        <Archive className="w-4 h-4" /> Archivar y Notificar Resultado
                      </Button>
                    )}
                  </div>
                )}

                {/* Aportes Section */}
                <div className="pt-4 border-t mt-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-500" />
                    Historial de Aportes
                  </h3>
                  <ScrollArea className="h-[200px] mb-4 pr-4 rounded-md border bg-muted/20">
                    {cargandoMensajes ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">Cargando aportes...</div>
                    ) : mensajes.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">Aún no hay aportes en esta consulta.</div>
                    ) : (
                      <div className="space-y-4 p-4">
                        {mensajes.map((msg) => (
                          <div key={msg.id} className={`flex flex-col ${msg.userId === user?.id ? 'items-end' : 'items-start'}`}>
                            <div className={`p-3 rounded-lg max-w-[85%] text-sm ${msg.userId === user?.id ? 'bg-amber-500/10 border border-amber-500/20 text-right' : 'bg-muted border border-slate-700/50'}`}>
                              <p className="whitespace-pre-wrap">{msg.contenido}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground opacity-70">
                                <span className="font-semibold">{msg.user?.nombre || 'Usuario'}</span>
                                <span>•</span>
                                <span>{format(new Date(msg.createdAt), "dd/MM h:mm a", { locale: es })}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  
                  <div className="flex gap-2">
                    <Textarea 
                      placeholder="Escribe un aporte, observación o conclusión para esta consulta..." 
                      className="min-h-[60px] resize-none text-sm bg-slate-800"
                      value={nuevoMensaje}
                      onChange={(e) => setNuevoMensaje(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleEnviarMensaje()
                        }
                      }}
                    />
                    <Button 
                      onClick={handleEnviarMensaje} 
                      disabled={!nuevoMensaje.trim() || enviandoMensaje}
                      className="self-end h-auto aspect-square p-2 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {enviandoMensaje ? <CheckCircle className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============ ASESORES MODULE ============
function AsesoresModule() {
  const [asesores, setAsesores] = useState<Asesor[]>([])
  const [comites, setComites] = useState<Comite[]>([])
  const [loading, setLoading] = useState(true)
  const [filterComite, setFilterComite] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // New States for Profile and Assignation
  const { user: currentUser } = useAuthStore()
  const [selectedAsesor, setSelectedAsesor] = useState<Asesor | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [consultasLibres, setConsultasLibres] = useState<Consulta[]>([])
  const [selectedConsultaId, setSelectedConsultaId] = useState<string>('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [asesoresData, comitesData] = await Promise.all([
          fetchApi<{ data: Asesor[] }>('/api/asesores'),
          fetchApi<{ data: Comite[] }>('/api/comites'),
        ])
        setAsesores(asesoresData.data || [])
        setComites(comitesData.data || [])
      } catch (error) {
        toast.error('Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredAsesores = asesores.filter(a => {
    const matchesComite = !filterComite || a.comiteId === filterComite
    const matchesSearch = !searchTerm || 
      a.user?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.especialidad?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesComite && matchesSearch
  })

  const loadConsultasLibres = async () => {
    try {
      const res = await fetchApi<{ data: Consulta[] }>('/api/consultas')
      // Filtrar las que están recién recibidas o clasificadas, pero sin asesor
      const asignables = (res.data || []).filter(c => 
        !c.asesorPrincipalId && 
        (c.estado === 'RECIBIDA' || c.estado === 'CLASIFICADA')
      )
      setConsultasLibres(asignables)
    } catch (error) {
      console.error(error)
    }
  }

  const handleOpenAssignModal = () => {
    loadConsultasLibres()
    setShowProfileModal(false)
    setShowAssignModal(true)
  }

  const handleAssignConsulta = async () => {
    if (!selectedAsesor || !selectedConsultaId) return
    setAssigning(true)
    try {
      const res = await fetchApi<{ message?: string }>(`/api/consultas/${selectedConsultaId}/asignar`, {
        method: 'POST',
        body: JSON.stringify({
          asesorPrincipalId: selectedAsesor.id,
        })
      })
      toast.success(res.message || 'Consulta asignada al asesor exitosamente')
      setShowAssignModal(false)
      // Refrescar asesores si queremos ver cambio en stats (opcional)
      const asesoresData = await fetchApi<{ data: Asesor[] }>('/api/asesores')
      setAsesores(asesoresData.data || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al asignar consulta')
    } finally {
      setAssigning(false)
    }
  }

  const handleCardClick = (asesor: Asesor) => {
    setSelectedAsesor(asesor)
    setShowProfileModal(true)
  }

  if (loading) return <div className="flex items-center justify-center h-64">Cargando...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Directorio de Asesores</h2>
          <p className="text-muted-foreground">Equipo técnico de la Mesa</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Buscar por nombre o especialidad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterComite} onValueChange={setFilterComite}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por comité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los comités</SelectItem>
            {comites.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAsesores.map(asesor => (
          <Card 
            key={asesor.id} 
            className="overflow-hidden cursor-pointer hover:border-amber-500 transition-colors"
            onClick={() => handleCardClick(asesor)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {asesor.user?.nombre?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg">{asesor.user?.nombre}</CardTitle>
                  <CardDescription>{asesor.profesion}</CardDescription>
                </div>
                {asesor.activo ? (
                  <Badge className="bg-green-500 text-white">Activo</Badge>
                ) : (
                  <Badge variant="secondary">Inactivo</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Especialidad</Label>
                <p className="text-sm">{asesor.especialidad}</p>
              </div>
              {asesor.comite && (
                <div>
                  <Label className="text-xs text-muted-foreground">Comité</Label>
                  <Badge style={{ backgroundColor: asesor.comite.color }} className="text-white mt-1">
                    {asesor.comite.nombre}
                  </Badge>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-500">{asesor.consultasAtendidas || 0}</p>
                  <p className="text-xs text-muted-foreground">Consultas</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-amber-500">{asesor.calificacionPromedio?.toFixed(1) || '-'}</p>
                  <p className="text-xs text-muted-foreground">Calificación</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAsesores.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          No se encontraron asesores
        </div>
      )}

      {/* Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedAsesor && (
            <>
              <DialogHeader>
                <DialogTitle>Perfil del Asesor</DialogTitle>
                <DialogDescription>Detalles e información de contacto</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
                      {selectedAsesor.user?.nombre?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{selectedAsesor.user?.nombre} {(selectedAsesor.user as any)?.apellido}</h3>
                    <p className="text-muted-foreground">{selectedAsesor.profesion}</p>
                    {selectedAsesor.activo ? (
                      <Badge className="bg-green-500 text-white mt-1">Activo</Badge>
                    ) : (
                      <Badge variant="secondary" className="mt-1">Inactivo</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground font-semibold">Especialidad</Label>
                    <p className="text-sm mt-1">{selectedAsesor.especialidad}</p>
                  </div>

                  {selectedAsesor.biografia && (
                    <div>
                      <Label className="text-muted-foreground font-semibold">Biografía</Label>
                      <p className="text-sm mt-1">{selectedAsesor.biografia}</p>
                    </div>
                  )}

                  {selectedAsesor.comite && (
                    <div>
                      <Label className="text-muted-foreground font-semibold">Comité</Label>
                      <div>
                        <Badge style={{ backgroundColor: selectedAsesor.comite.color }} className="text-white mt-1">
                          {selectedAsesor.comite.nombre}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-500">{selectedAsesor.consultasAtendidas || 0}</p>
                      <p className="text-xs text-muted-foreground uppercase">Consultas Atendidas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-500">{selectedAsesor.calificacionPromedio?.toFixed(1) || '-'}</p>
                      <p className="text-xs text-muted-foreground uppercase">Calificación Promedio</p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto gap-2"
                    asChild
                  >
                    <a href={`mailto:${selectedAsesor?.user?.email || ''}`}>
                      <Mail className="w-4 h-4" /> Enviar Correo
                    </a>
                  </Button>
                  {(currentUser?.rol === 'ADMIN' || currentUser?.rol === 'SECRETARIA_TECNICA') && (
                    <Button 
                      className="w-full sm:w-auto gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                      onClick={handleOpenAssignModal}
                    >
                      <Briefcase className="w-4 h-4" /> Asignar Consulta
                    </Button>
                  )}
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Asignar Consulta</DialogTitle>
            <DialogDescription>
              Asignar una consulta abierta a {selectedAsesor?.user?.nombre}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selecciona la Consulta</Label>
              <Select value={selectedConsultaId} onValueChange={setSelectedConsultaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar consulta..." />
                </SelectTrigger>
                <SelectContent>
                  {consultasLibres.length > 0 ? (
                    consultasLibres.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.codigo} - {c.titulo.substring(0, 30)}...
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      No hay consultas disponibles para asignar
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignModal(false)} disabled={assigning}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAssignConsulta} 
              disabled={!selectedConsultaId || assigning}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {assigning ? 'Asignando...' : 'Confirmar Asignación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

// ============ USUARIOS MODULE ============
function UsuariosModule() {
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'EMPRESA_AFILIADA' as RolUsuario,
    telefono: '',
    empresa: '',
    cargo: '',
  })
  const { user: currentUser } = useAuthStore()

  const loadUsuarios = useCallback(async () => {
    try {
      const data = await fetchApi<{ data: User[] }>('/api/usuarios')
      setUsuarios(data.data || [])
    } catch (error) {
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsuarios()
  }, [loadUsuarios])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingUser) {
        await fetchApi(`/api/usuarios/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        })
        toast.success('Usuario actualizado')
      } else {
        await fetchApi('/api/usuarios', {
          method: 'POST',
          body: JSON.stringify(formData),
        })
        toast.success('Usuario creado')
      }
      setOpenDialog(false)
      setEditingUser(null)
      setFormData({ nombre: '', email: '', password: '', rol: 'EMPRESA_AFILIADA', telefono: '', empresa: '', cargo: '' })
      loadUsuarios()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de desactivar este usuario?')) return
    try {
      await fetchApi(`/api/usuarios/${id}`, { method: 'DELETE' })
      toast.success('Usuario desactivado')
      loadUsuarios()
    } catch (error) {
      toast.error('Error al desactivar usuario')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64">Cargando...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">Administración de accesos al sistema</p>
        </div>
        {currentUser?.rol === 'ADMIN' && (
          <Button onClick={() => { setEditingUser(null); setFormData({ nombre: '', email: '', password: '', rol: 'EMPRESA_AFILIADA', telefono: '', empresa: '', cargo: '' }); setOpenDialog(true) }}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo Usuario
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-300px)]">
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-4 text-sm font-medium">Usuario</th>
                  <th className="text-left p-4 text-sm font-medium">Email</th>
                  <th className="text-left p-4 text-sm font-medium">Rol</th>
                  <th className="text-left p-4 text-sm font-medium">Estado</th>
                  <th className="text-left p-4 text-sm font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((user) => (
                  <tr key={user.id} className="border-t hover:bg-muted/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">{user.nombre?.split(' ').map(n => n[0]).join('').substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.nombre}</p>
                          {user.empresa && <p className="text-xs text-muted-foreground">{user.empresa}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{user.email}</td>
                    <td className="p-4">
                      <Badge className={`${getRolBadgeColor(user.rol)} text-white text-xs`}>
                        {user.rol.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {user.activo ? (
                        <Badge className="bg-green-500 text-white text-xs">Activo</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingUser(user)
                            setFormData({
                              nombre: user.nombre,
                              email: user.email,
                              password: '',
                              rol: user.rol,
                              telefono: user.telefono || '',
                              empresa: user.empresa || '',
                              cargo: user.cargo || '',
                            })
                            setOpenDialog(true)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {currentUser?.rol === 'ADMIN' && user.id !== currentUser.id && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre completo</Label>
                <Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              {!editingUser && (
                <div>
                  <Label>Contraseña</Label>
                  <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingUser} />
                </div>
              )}
              <div>
                <Label>Rol</Label>
                <Select value={formData.rol} onValueChange={(v) => setFormData({ ...formData, rol: v as RolUsuario })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="SECRETARIA_TECNICA">Secretaría Técnica</SelectItem>
                    <SelectItem value="ASESOR">Asesor</SelectItem>
                    <SelectItem value="EMPRESA_AFILIADA">Empresa Afiliada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
              </div>
              <div>
                <Label>Empresa</Label>
                <Input value={formData.empresa} onChange={(e) => setFormData({ ...formData, empresa: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{editingUser ? 'Actualizar' : 'Crear'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============ COMITES MODULE ============
function ComitesModule() {
  const [comites, setComites] = useState<Comite[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingComite, setEditingComite] = useState<Comite | null>(null)
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', color: '#3b82f6', icono: 'shield' })
  const { user } = useAuthStore()

  // Governance States
  const [selectedComite, setSelectedComite] = useState<Comite | null>(null)
  const [reuniones, setReuniones] = useState<any[]>([])
  const [loadingGovernance, setLoadingGovernance] = useState(false)
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false)
  const [newMeeting, setNewMeeting] = useState({ titulo: '', descripcion: '', fecha: format(new Date(), 'yyyy-MM-dd'), horaInicio: '10:00' })

  const loadComites = useCallback(async () => {
    try {
      const data = await fetchApi<{ data: Comite[] }>('/api/comites')
      setComites(data.data || [])
    } catch (error) {
      toast.error('Error al cargar comités')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadComites()
  }, [loadComites])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingComite) {
        await fetchApi(`/api/comites/${editingComite.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        })
        toast.success('Comité actualizado')
      } else {
        await fetchApi('/api/comites', {
          method: 'POST',
          body: JSON.stringify(formData),
        })
        toast.success('Comité creado')
      }
      setOpenDialog(false)
      setEditingComite(null)
      setFormData({ nombre: '', descripcion: '', color: '#3b82f6', icono: 'shield' })
      loadComites()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este comité?')) return
    try {
      await fetchApi(`/api/comites/${id}`, { method: 'DELETE' })
      toast.success('Comité eliminado')
      loadComites()
    } catch (error) {
      toast.error('Error al eliminar comité')
    }
  }

  const loadGovernance = async (comiteId: string) => {
    setLoadingGovernance(true)
    try {
      const data = await fetchApi<{ data: any[] }>(`/api/comites/${comiteId}/reuniones`)
      setReuniones(data.data || [])
    } catch (error) {
      toast.error('Error al cargar gobernanza')
    } finally {
      setLoadingGovernance(false)
    }
  }

  const handleCreateMeeting = async () => {
    if (!selectedComite) return
    try {
      await fetchApi(`/api/comites/${selectedComite.id}/reuniones`, {
        method: 'POST',
        body: JSON.stringify(newMeeting)
      })
      toast.success('Reunión programada')
      setShowNewMeetingModal(false)
      loadGovernance(selectedComite.id)
    } catch (error) {
      toast.error('Error al crear reunión')
    }
  }

  if (selectedComite) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedComite(null)} className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Volver a Comités
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: selectedComite.color }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{selectedComite.nombre}</h2>
              <p className="text-sm text-muted-foreground">Panel de Gobernanza y Acuerdos</p>
            </div>
          </div>
          <Button onClick={() => setShowNewMeetingModal(true)} className="bg-[#C5A059] hover:bg-[#A68040] text-white">
            <Plus className="w-4 h-4 mr-2" /> Programar Reunión
          </Button>
        </div>

        <Tabs defaultValue="reuniones" className="w-full">
          <TabsList className="bg-slate-900 border-slate-800">
            <TabsTrigger value="reuniones" className="data-[state=active]:bg-slate-800">Reuniones y Actas</TabsTrigger>
            <TabsTrigger value="acuerdos" className="data-[state=active]:bg-slate-800">Seguimiento de Acuerdos</TabsTrigger>
            <TabsTrigger value="miembros" className="data-[state=active]:bg-slate-800">Miembros</TabsTrigger>
          </TabsList>

          <TabsContent value="reuniones" className="mt-6">
            <div className="grid gap-4">
              {reuniones.length === 0 ? (
                <Card className="bg-slate-950 border-dashed py-12 text-center text-muted-foreground">
                  No hay reuniones registradas para este comité.
                </Card>
              ) : (
                reuniones.map((reunion) => (
                  <Card key={reunion.id} className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div>
                        <CardTitle className="text-lg">{reunion.titulo}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(reunion.fecha), 'dd MMM, yyyy', { locale: es })}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {reunion.horaInicio}</span>
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className={reunion.estado === 'PROGRAMADA' ? 'border-blue-500 text-blue-500' : 'border-green-500 text-green-500'}>
                        {reunion.estado}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-400 mb-4">{reunion.descripcion}</p>
                      <div className="space-y-2 border-t border-slate-800 pt-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Acuerdos ({reunion.acuerdos?.length || 0})</h4>
                        {reunion.acuerdos?.map((acuerdo: any) => (
                          <div key={acuerdo.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                            <div>
                              <p className="text-sm font-bold text-white">{acuerdo.titulo}</p>
                              <p className="text-[10px] text-slate-500">Resp: {acuerdo.responsable}</p>
                            </div>
                            <Badge variant="secondary" className="text-[9px] uppercase">{acuerdo.estado}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="acuerdos">
             {/* Simplified Agreements tracking view */}
             <Card className="bg-slate-900 border-slate-800">
               <CardHeader><CardTitle>Consolidado de Acuerdos</CardTitle></CardHeader>
               <CardContent>
                 <Table>
                   <TableHeader>
                     <TableRow className="hover:bg-transparent">
                       <TableHead className="text-slate-500">Acuerdo</TableHead>
                       <TableHead className="text-slate-500">Responsable</TableHead>
                       <TableHead className="text-slate-500">Estado</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {reuniones.flatMap(r => r.acuerdos || []).map((a: any) => (
                       <TableRow key={a.id} className="border-slate-800">
                         <TableCell>
                           <p className="font-bold text-slate-200">{a.titulo}</p>
                           <p className="text-xs text-slate-500">{a.descripcion}</p>
                         </TableCell>
                         <TableCell className="text-slate-400">{a.responsable}</TableCell>
                         <TableCell><Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">{a.estado}</Badge></TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </CardContent>
             </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showNewMeetingModal} onOpenChange={setShowNewMeetingModal}>
          <DialogContent className="bg-slate-950 border-slate-800 text-slate-200">
            <DialogHeader>
              <DialogTitle>Programar Nueva Reunión</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Título de la Reunión</Label>
                <Input value={newMeeting.titulo} onChange={(e) => setNewMeeting({...newMeeting, titulo: e.target.value})} className="bg-slate-900 border-slate-800" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha</Label>
                  <Input type="date" value={newMeeting.fecha} onChange={(e) => setNewMeeting({...newMeeting, fecha: e.target.value})} className="bg-slate-900 border-slate-800" />
                </div>
                <div>
                  <Label>Hora Inicio</Label>
                  <Input type="time" value={newMeeting.horaInicio} onChange={(e) => setNewMeeting({...newMeeting, horaInicio: e.target.value})} className="bg-slate-900 border-slate-800" />
                </div>
              </div>
              <div>
                <Label>Agenda / Descripción</Label>
                <Textarea value={newMeeting.descripcion} onChange={(e) => setNewMeeting({...newMeeting, descripcion: e.target.value})} className="bg-slate-900 border-slate-800" rows={4} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowNewMeetingModal(false)}>Cancelar</Button>
              <Button onClick={handleCreateMeeting} className="bg-blue-600 hover:bg-blue-700">Crear Reunión</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (loading) return <div className="flex items-center justify-center h-64">Cargando...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Comités</h2>
          <p className="text-muted-foreground">Comités especializados de la Mesa Técnica</p>
        </div>
        {user?.rol === 'ADMIN' && (
          <Button onClick={() => { setEditingComite(null); setFormData({ nombre: '', descripcion: '', color: '#3b82f6', icono: 'shield' }); setOpenDialog(true) }}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo Comité
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {comites.map(comite => (
          <Card 
            key={comite.id} 
            className="overflow-hidden cursor-pointer hover:border-[#C5A059] transition-all group"
            onClick={() => {
              setSelectedComite(comite)
              loadGovernance(comite.id)
            }}
          >
            <div className="h-2" style={{ backgroundColor: comite.color }} />
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: comite.color }}>
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  {comite.nombre}
                </CardTitle>
                {!comite.activo && <Badge variant="secondary">Inactivo</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{comite.descripcion}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{comite.asesores?.length || 0} asesores</span>
              </div>
              {user?.rol === 'ADMIN' && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingComite(comite)
                      setFormData({ nombre: comite.nombre, descripcion: comite.descripcion || '', color: comite.color, icono: comite.icono || 'shield' })
                      setOpenDialog(true)
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(comite.id)}>
                    <Trash2 className="w-4 h-4 mr-1 text-red-500" /> Eliminar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingComite ? 'Editar Comité' : 'Nuevo Comité'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                <Input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="flex-1" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{editingComite ? 'Actualizar' : 'Crear'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============ CANDIDATOS MODULE ============
function CandidatosModule() {
  const [candidatos, setCandidatos] = useState<CandidatoAsesor[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCandidato, setSelectedCandidato] = useState<CandidatoAsesor | null>(null)
  const [openRechazar, setOpenRechazar] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [openSolicitarInfo, setOpenSolicitarInfo] = useState(false)
  const [mensajeInfo, setMensajeInfo] = useState('')

  const loadCandidatos = useCallback(async () => {
    try {
      const data = await fetchApi<{ data: CandidatoAsesor[] }>('/api/candidatos')
      setCandidatos(data.data || [])
    } catch (error) {
      toast.error('Error al cargar candidatos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCandidatos()
  }, [loadCandidatos])

  const handleAprobar = async (id: string) => {
    try {
      await fetchApi(`/api/candidatos/${id}/aprobar`, { method: 'POST' })
      toast.success('Candidato aprobado y usuario creado')
      loadCandidatos()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al aprobar')
    }
  }

  const handleRechazar = async () => {
    if (!selectedCandidato || !motivoRechazo) return
    try {
      await fetchApi(`/api/candidatos/${selectedCandidato.id}/rechazar`, {
        method: 'POST',
        body: JSON.stringify({ motivo: motivoRechazo }),
      })
      toast.success('Candidato rechazado')
      setOpenRechazar(false)
      setSelectedCandidato(null)
      setMotivoRechazo('')
      loadCandidatos()
    } catch (error) {
      toast.error('Error al rechazar')
    }
  }

  const handleSolicitarInfo = async () => {
    if (!selectedCandidato || !mensajeInfo) return
    try {
      await fetchApi(`/api/candidatos/${selectedCandidato.id}/solicitar-info`, {
        method: 'POST',
        body: JSON.stringify({ mensaje: mensajeInfo }),
      })
      toast.success('Solicitud de información enviada por correo')
      setOpenSolicitarInfo(false)
      setMensajeInfo('')
      loadCandidatos()
    } catch (error) {
      toast.error('Error al enviar solicitud')
    }
  }

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      PENDIENTE: 'bg-gray-500',
      EN_REVISION: 'bg-blue-500',
      ENTREVISTA: 'bg-yellow-500',
      EVALUACION: 'bg-purple-500',
      SOLICITUD_INFORMACION: 'bg-amber-500',
      APROBADO: 'bg-green-500',
      RECHAZADO: 'bg-red-500',
      INCORPORADO: 'bg-emerald-500',
    }
    return colors[estado] || 'bg-gray-500'
  }

  if (loading) return <div className="flex items-center justify-center h-64">Cargando...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Candidatos</h2>
          <p className="text-muted-foreground">Gestión de postulaciones de asesores</p>
        </div>
      </div>

      <div className="grid gap-4">
        {candidatos.map(candidato => (
          <Card key={candidato.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {candidato.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{candidato.nombre}</h3>
                    <p className="text-sm text-muted-foreground">{candidato.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getEstadoColor(candidato.estado)} text-white text-xs`}>
                        {candidato.estado.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{candidato.profesion}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedCandidato(candidato)}>
                    <Eye className="w-4 h-4 mr-1" /> Ver
                  </Button>
                  {candidato.estado === 'PENDIENTE' && (
                    <>
                      <Button size="sm" onClick={() => handleAprobar(candidato.id)}>
                        <Check className="w-4 h-4 mr-1" /> Aprobar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedCandidato(candidato); setOpenSolicitarInfo(true) }}>
                        <Mail className="w-4 h-4 mr-1" /> Pedir Info
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => { setSelectedCandidato(candidato); setOpenRechazar(true) }}>
                        <XCircle className="w-4 h-4 mr-1" /> Rechazar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedCandidato && !openRechazar} onOpenChange={() => setSelectedCandidato(null)}>
        <DialogContent>
          {selectedCandidato && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCandidato.nombre}</DialogTitle>
                <DialogDescription>{selectedCandidato.email}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-xs text-muted-foreground">Profesión</Label><p>{selectedCandidato.profesion}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Especialidad</Label><p>{selectedCandidato.especialidad}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Experiencia</Label><p>{selectedCandidato.experiencia}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Teléfono</Label><p>{selectedCandidato.telefono || '-'}</p></div>
                </div>
                {selectedCandidato.biografia && (
                  <div><Label className="text-xs text-muted-foreground">Biografía</Label><p className="text-sm">{selectedCandidato.biografia}</p></div>
                )}
                {selectedCandidato.motivacion && (
                  <div><Label className="text-xs text-muted-foreground">Motivación</Label><p className="text-sm">{selectedCandidato.motivacion}</p></div>
                )}
                {selectedCandidato.motivoRechazo && (
                  <div className="p-3 bg-red-50 rounded-lg"><Label className="text-xs text-red-600">Motivo de Rechazo</Label><p className="text-sm text-red-800">{selectedCandidato.motivoRechazo}</p></div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Solicitar Información Dialog */}
      <Dialog open={openSolicitarInfo} onOpenChange={setOpenSolicitarInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Información Adicional</DialogTitle>
            <DialogDescription>
              Se enviará un correo electrónico a <strong>{selectedCandidato?.nombre}</strong> solicitando los detalles que indique a continuación.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label>Mensaje para el candidato *</Label>
            <Textarea 
              value={mensajeInfo} 
              onChange={(e) => setMensajeInfo(e.target.value)} 
              placeholder="Ej. Favor adjuntar constancia de certificación en blockchain..." 
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpenSolicitarInfo(false); setMensajeInfo('') }}>Cancelar</Button>
            <Button onClick={handleSolicitarInfo} disabled={!mensajeInfo} className="bg-amber-500 hover:bg-amber-600">
              <Send className="w-4 h-4 mr-2" /> Enviar Correo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rechazar Dialog */}
      <Dialog open={openRechazar} onOpenChange={setOpenRechazar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Candidato</DialogTitle>
            <DialogDescription>
              Al confirmar, el candidato recibirá un correo institucional notificando que no ha sido seleccionado en esta oportunidad.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label>Motivo interno del rechazo *</Label>
            <Textarea value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} placeholder="Este motivo se guardará en el historial interno..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpenRechazar(false); setMotivoRechazo('') }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRechazar} disabled={!motivoRechazo}>Rechazar y Notificar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============ AGENDA MODULE ============
function AgendaModule() {
  const [eventos, setEventos] = useState<EventoAgenda[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState({ titulo: '', descripcion: '', fecha: '', horaInicio: '', tipo: 'REUNION' as const })

  const loadEventos = useCallback(async () => {
    try {
      const start = startOfMonth(currentDate).toISOString()
      const end = endOfMonth(currentDate).toISOString()
      const data = await fetchApi<{ data: EventoAgenda[] }>(`/api/agenda?start=${start}&end=${end}`)
      setEventos(data.data || [])
    } catch (error) {
      toast.error('Error al cargar eventos')
    } finally {
      setLoading(false)
    }
  }, [currentDate])

  useEffect(() => {
    loadEventos()
  }, [loadEventos])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetchApi('/api/agenda', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      toast.success('Evento creado')
      setOpenDialog(false)
      setFormData({ titulo: '', descripcion: '', fecha: '', horaInicio: '', tipo: 'REUNION' })
      loadEventos()
    } catch (error) {
      toast.error('Error al crear evento')
    }
  }

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  })

  const getEventosForDay = (day: Date) => 
    eventos.filter(e => isSameDay(parseISO(e.fecha), day))

  if (loading) return <div className="flex items-center justify-center h-64">Cargando...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agenda</h2>
          <p className="text-muted-foreground">Calendario de eventos y vencimientos</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg">
            <Button variant={view === 'calendar' ? 'default' : 'ghost'} size="sm" onClick={() => setView('calendar')}>Calendario</Button>
            <Button variant={view === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setView('list')}>Lista</Button>
          </div>
          <Button onClick={() => setOpenDialog(true)}><Plus className="w-4 h-4 mr-2" /> Nuevo Evento</Button>
        </div>
      </div>

      {view === 'calendar' ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-semibold">{format(currentDate, 'MMMM yyyy', { locale: es })}</span>
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">{day}</div>
              ))}
              {daysInMonth.map((day, i) => {
                const dayEvents = getEventosForDay(day)
                const isTodayDate = isToday(day)
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-24 p-1 border rounded-lg ${isTodayDate ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}
                  >
                    <div className={`text-sm font-medium ${isTodayDate ? 'text-primary' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1 mt-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded truncate ${
                            event.tipo === 'VENCIMIENTO_SLA' ? 'bg-red-100 text-red-800' :
                            event.tipo === 'REUNION' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {event.titulo}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground">+{dayEvents.length - 3} más</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {eventos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()).map(evento => (
            <Card key={evento.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-12 rounded-full ${
                    evento.tipo === 'VENCIMIENTO_SLA' ? 'bg-red-500' :
                    evento.tipo === 'REUNION' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`} />
                  <div>
                    <p className="font-medium">{evento.titulo}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(evento.fecha), "d 'de' MMMM, yyyy", { locale: es })}
                      {evento.horaInicio && ` - ${evento.horaInicio}`}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{evento.tipo.replace('_', ' ')}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Evento</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Título</Label><Input value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} required /></div>
            <div><Label>Descripción</Label><Textarea value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Fecha</Label><Input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} required /></div>
              <div><Label>Hora</Label><Input type="time" value={formData.horaInicio} onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })} /></div>
            </div>
            <div><Label>Tipo</Label>
              <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v as typeof formData.tipo })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="REUNION">Reunión</SelectItem>
                  <SelectItem value="VENCIMIENTO_SLA">Vencimiento SLA</SelectItem>
                  <SelectItem value="RECORDATORIO">Recordatorio</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter><Button type="submit">Crear Evento</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
// ============ VIDEOS MODULE ============
type VideoComite = {
  id: string
  titulo: string
  descripcion?: string | null
  urlYoutube: string
  comiteId: string
  autorId: string
  createdAt: string
  autor?: { nombre: string; apellido?: string | null }
  comite?: { nombre: string; color: string }
}

function VideosModule() {
  const { user } = useAuthStore()
  const [videos, setVideos] = useState<VideoComite[]>([])
  const [comites, setComites] = useState<Comite[]>([])
  const [loading, setLoading] = useState(true)
  const [filterComite, setFilterComite] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [showNewModal, setShowNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<VideoComite | null>(null)
  const [formData, setFormData] = useState({ titulo: '', descripcion: '', urlYoutube: '', comiteId: '' })

  const canUpload = user?.rol === 'ADMIN' || user?.rol === 'SECRETARIA_TECNICA' || user?.rol === 'ASESOR'

  const loadVideos = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterComite && filterComite !== 'all') params.append('comiteId', filterComite)
      if (searchTerm) params.append('search', searchTerm)
      const data = await fetchApi<{ data: VideoComite[]; comites: Comite[] }>(`/api/videos?${params.toString()}`)
      setVideos(data.data || [])
      setComites(data.comites || [])
    } catch {
      toast.error('Error al cargar videos')
    } finally {
      setLoading(false)
    }
  }, [filterComite, searchTerm])

  useEffect(() => { loadVideos() }, [loadVideos])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setSaving(true)
    try {
      const res = await fetchApi<{ message?: string }>('/api/videos', {
        method: 'POST',
        body: JSON.stringify({ ...formData, autorId: user.id }),
      })
      toast.success(res.message || 'Video publicado y notificaciones enviadas ✅')
      setShowNewModal(false)
      setFormData({ titulo: '', descripcion: '', urlYoutube: '', comiteId: '' })
      loadVideos()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al publicar el video')
    } finally {
      setSaving(false)
    }
  }

  // Extract thumbnail from YouTube ID
  const getThumbnail = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`
  const getEmbedUrl = (id: string) => `https://www.youtube.com/embed/${id}?autoplay=1`

  if (loading) return <div className="flex items-center justify-center h-64">Cargando...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Videos de Comités</h2>
          <p className="text-muted-foreground">Recursos en video compartidos por los comités técnicos</p>
        </div>
        {canUpload && (
          <Button
            className="gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
            onClick={() => setShowNewModal(true)}
          >
            <Video className="w-4 h-4" /> Compartir Video
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Buscar videos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterComite} onValueChange={setFilterComite}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Todos los comités" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los comités</SelectItem>
            {comites.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Video grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {videos.map(video => (
          <Card
            key={video.id}
            className="overflow-hidden cursor-pointer group hover:shadow-lg hover:border-red-400 transition-all"
            onClick={() => setSelectedVideo(video)}
          >
            <div className="relative">
              {/* Thumbnail with play overlay */}
              <img
                src={getThumbnail(video.urlYoutube)}
                alt={video.titulo}
                className="w-full aspect-video object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-video.png' }}
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-red-600 rounded-full p-4 shadow-xl">
                  <Play className="w-8 h-8 text-white fill-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm leading-snug line-clamp-2">{video.titulo}</h3>
                {video.comite && (
                  <Badge style={{ backgroundColor: video.comite.color }} className="text-white text-xs shrink-0">
                    {video.comite.nombre}
                  </Badge>
                )}
              </div>
              {video.descripcion && (
                <p className="text-xs text-muted-foreground line-clamp-2">{video.descripcion}</p>
              )}
              <div className="flex items-center gap-2 pt-1">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                    {video.autor?.nombre?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {video.autor?.nombre} · {format(new Date(video.createdAt), 'dd/MM/yyyy')}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="text-center text-muted-foreground py-16 space-y-2">
          <Video className="w-12 h-12 mx-auto text-muted-foreground/40" />
          <p>No se encontraron videos compartidos</p>
          {canUpload && (
            <Button variant="outline" className="mt-2" onClick={() => setShowNewModal(true)}>
              Compartir el primer video
            </Button>
          )}
        </div>
      )}

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
          {selectedVideo && (
            <>
              <div className="aspect-video w-full bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={getEmbedUrl(selectedVideo.urlYoutube)}
                  title={selectedVideo.titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              <div className="p-5 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold leading-snug">{selectedVideo.titulo}</h3>
                  {selectedVideo.comite && (
                    <Badge style={{ backgroundColor: selectedVideo.comite.color }} className="text-white shrink-0">
                      {selectedVideo.comite.nombre}
                    </Badge>
                  )}
                </div>
                {selectedVideo.descripcion && (
                  <p className="text-sm text-muted-foreground">{selectedVideo.descripcion}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Publicado por {selectedVideo.autor?.nombre} el {format(new Date(selectedVideo.createdAt), 'dd/MM/yyyy')}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Compartir Video de YouTube</DialogTitle>
            <DialogDescription>
              Agrega un video de YouTube para compartir con todos los miembros de la Mesa. Se enviará una notificación automáticamente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Título del Video</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ej. Regulación de activos digitales en Latinoamérica"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>URL o ID del Video de YouTube</Label>
              <Input
                value={formData.urlYoutube}
                onChange={(e) => setFormData({ ...formData, urlYoutube: e.target.value })}
                placeholder="https://youtube.com/watch?v=... o un ID de 11 caracteres"
                required
              />
              <p className="text-xs text-muted-foreground">Acepta URLs completas de YouTube, youtu.be, o Shorts.</p>
            </div>

            <div className="space-y-2">
              <Label>Comité que comparte</Label>
              <Select
                value={formData.comiteId}
                onValueChange={(val) => setFormData({ ...formData, comiteId: val })}
              >
                <SelectTrigger><SelectValue placeholder="Selecciona un comité..." /></SelectTrigger>
                <SelectContent>
                  {comites.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descripción (Opcional)</Label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="¿De qué trata el video y por qué es relevante?"
                rows={3}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
              <Bell className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Al publicar, se enviará una <strong>notificación a todos los miembros</strong> de la Mesa Técnica informando sobre el nuevo video.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewModal(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!formData.titulo || !formData.urlYoutube || !formData.comiteId || saving}
                className="bg-red-600 hover:bg-red-700"
              >
                {saving ? 'Publicando...' : '📹 Publicar y Notificar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============ KB MODULE ============
function KBModule() {
  const [articulos, setArticulos] = useState<ArticuloKB[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState<string>('all')
  const { user } = useAuthStore()

  // New Article State
  const [showNewModal, setShowNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    categoria: 'FAQ',
    contenido: '',
    resumen: '',
    publicado: true,
  })

  // Viewer State
  const [selectedArticle, setSelectedArticle] = useState<ArticuloKB | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  const loadArticulos = async () => {
    try {
      const params = new URLSearchParams()
      if (filterCategoria && filterCategoria !== 'all') params.append('categoria', filterCategoria)
      if (searchTerm) params.append('search', searchTerm)
      const data = await fetchApi<{ data: ArticuloKB[] }>(`/api/kb?${params.toString()}`)
      setArticulos(data.data || [])
    } catch (error) {
      toast.error('Error al cargar artículos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArticulos()
  }, [filterCategoria, searchTerm])

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setSaving(true)
    try {
      await fetchApi('/api/kb', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          autorId: user.id,
        })
      })
      toast.success('Artículo creado exitosamente')
      setShowNewModal(false)
      loadArticulos()
      setFormData({ titulo: '', categoria: 'FAQ', contenido: '', resumen: '', publicado: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear artículo')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64">Cargando...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Base de Conocimiento</h2>
          <p className="text-muted-foreground">Documentación y recursos técnicos</p>
        </div>
        {(user?.rol === 'ADMIN' || user?.rol === 'SECRETARIA_TECNICA') && (
          <Button 
            className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            onClick={() => setShowNewModal(true)}
          >
            <Plus className="w-4 h-4" /> Nuevo Artículo
          </Button>
        )}
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Buscar artículos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Todas las categorías" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="FAQ">FAQ</SelectItem>
            <SelectItem value="NORMATIVA">Normativa</SelectItem>
            <SelectItem value="GUIA">Guías</SelectItem>
            <SelectItem value="TUTORIAL">Tutoriales</SelectItem>
            <SelectItem value="GLOSARIO">Glosario</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {articulos.map(articulo => (
          <Card 
            key={articulo.id} 
            className="cursor-pointer hover:shadow-md hover:border-amber-400 transition-all"
            onClick={() => {
              setSelectedArticle(articulo)
              setShowViewModal(true)
            }}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <Badge variant="outline">{articulo.categoria}</Badge>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="w-3 h-3" />
                  <span className="text-xs">{articulo.vistas}</span>
                </div>
              </div>
              <CardTitle className="text-lg mt-2">{articulo.titulo}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">{(articulo as any).resumen || articulo.contenido}</p>
              <div className="flex items-center justify-between mt-4 pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(articulo.createdAt), 'dd/MM/yyyy')}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-amber-600">Leer más →</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {articulos.length === 0 && (
        <div className="text-center text-muted-foreground py-12">No se encontraron artículos</div>
      )}

      {/* Creación de Artículo Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Artículo</DialogTitle>
            <DialogDescription>Añadir material a la base de conocimiento para la Mesa Técnica</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateArticle} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select 
                value={formData.categoria} 
                onValueChange={(val) => setFormData({...formData, categoria: val})}
              >
                <SelectTrigger><SelectValue placeholder="Selecciona una..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FAQ">FAQ</SelectItem>
                  <SelectItem value="NORMATIVA">Normativa</SelectItem>
                  <SelectItem value="GUIA">Guía</SelectItem>
                  <SelectItem value="TUTORIAL">Tutorial</SelectItem>
                  <SelectItem value="GLOSARIO">Glosario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Título del Artículo</Label>
              <Input 
                value={formData.titulo}
                onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                placeholder="Ej. Marco Legal de los Criptoactivos"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Resumen (Opcional)</Label>
              <Textarea 
                value={formData.resumen}
                onChange={(e) => setFormData({...formData, resumen: e.target.value})}
                placeholder="Breve descripción de lo que trata el artículo..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Contenido Completo</Label>
              <Textarea 
                value={formData.contenido}
                onChange={(e) => setFormData({...formData, contenido: e.target.value})}
                placeholder="Escribe el contenido detallado aquí (Soporta Markdown Básico: **negritas**, *cursivas*, ## Títulos, - listas)"
                rows={20}
                className="font-mono text-sm resize-y"
                required
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="publicado" 
                checked={formData.publicado}
                onCheckedChange={(c) => setFormData({...formData, publicado: c === true})}
              />
              <Label htmlFor="publicado" className="font-normal cursor-pointer text-sm">
                Publicar inmediatamente. (Si desmarcas, se guarda como borrador)
              </Label>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setShowNewModal(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!formData.titulo || !formData.contenido || saving} className="bg-amber-500 hover:bg-amber-600">
                {saving ? 'Guardando...' : 'Crear Artículo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Visor de Artículo Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0 overflow-hidden">
          {selectedArticle && (
            <>
              <DialogHeader className="p-6 pb-2 border-b">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none">
                    {selectedArticle.categoria}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Publicado el {format(new Date(selectedArticle.createdAt), 'dd/MM/yyyy')}
                  </span>
                </div>
                <DialogTitle className="text-2xl font-bold leading-tight">{selectedArticle.titulo}</DialogTitle>
                
                {selectedArticle.autor && (
                  <div className="flex items-center gap-2 mt-4 pt-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                        {selectedArticle.autor.nombre?.substring(0,2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <p className="font-medium leading-none">{selectedArticle.autor.nombre} {(selectedArticle.autor as any).apellido}</p>
                      <p className="text-xs text-muted-foreground mt-1">Autor</p>
                    </div>
                  </div>
                )}
              </DialogHeader>
              
              <div className="p-6 overflow-y-auto flex-1">
                {(selectedArticle as any).resumen && (
                  <p className="text-lg text-muted-foreground mb-6 font-medium italic border-l-4 border-amber-500 pl-4">
                    {(selectedArticle as any).resumen}
                  </p>
                )}
                
                <div className="prose prose-sm sm:prose-base prose-blue max-w-none prose-headings:font-bold prose-a:text-blue-600 hover:prose-a:text-blue-500">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-8 mb-4 border-b pb-2" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-6 mb-3" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-4 mb-2" {...props} />,
                      p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-gray-700 whitespace-pre-wrap" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
                      a: ({node, ...props}) => <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4" {...props} />,
                      code: ({node, className, children, ...props}) => {
                        const match = /language-(\w+)/.exec(className || '')
                        return !match ? (
                          <code className="bg-gray-100 text-pink-600 rounded px-1 py-0.5 text-sm font-mono" {...props}>
                            {children}
                          </code>
                        ) : (
                          <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono my-4" {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {selectedArticle.contenido}
                  </ReactMarkdown>
                </div>
              </div>
              
              <DialogFooter className="p-4 border-t bg-gray-50/50 mt-auto">
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============ CONFIGURACION MODULE ============
function ConfiguracionModule() {
  const [config, setConfig] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await fetchApi<{ data: Configuracion[] }>('/api/configuracion')
        const configMap: Record<string, string> = {}
        data.data?.forEach(c => { configMap[c.clave] = c.valor })
        setConfig(configMap)
      } catch (error) {
        toast.error('Error al cargar configuración')
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [])

  const handleSave = async () => {
    try {
      await fetchApi('/api/configuracion', {
        method: 'PUT',
        body: JSON.stringify({ configuraciones: Object.entries(config).map(([clave, valor]) => ({ clave, valor })) }),
      })
      toast.success('Configuración guardada')
    } catch (error) {
      toast.error('Error al guardar configuración')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64">Cargando...</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuración</h2>
        <p className="text-muted-foreground">Parámetros del sistema</p>
      </div>

      <Card>
        <CardHeader><CardTitle>General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Nombre de la Organización</Label><Input value={config.organizacion_nombre || ''} onChange={(e) => setConfig({ ...config, organizacion_nombre: e.target.value })} /></div>
            <div><Label>Email de Contacto</Label><Input value={config.email_contacto || ''} onChange={(e) => setConfig({ ...config, email_contacto: e.target.value })} /></div>
            <div><Label>Teléfono</Label><Input value={config.telefono_contacto || ''} onChange={(e) => setConfig({ ...config, telefono_contacto: e.target.value })} /></div>
            <div><Label>Máximo Consultas por Mes (por empresa)</Label><Input type="number" value={config.max_consultas_mes || '10'} onChange={(e) => setConfig({ ...config, max_consultas_mes: e.target.value })} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>SLA (Tiempos de Respuesta)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>SLA Estándar (horas)</Label>
              <Input type="number" value={config.sla_estandar_horas || '72'} onChange={(e) => setConfig({ ...config, sla_estandar_horas: e.target.value })} />
              <p className="text-xs text-muted-foreground mt-1">Consultas de procedimientos operativos</p>
            </div>
            <div>
              <Label>SLA Complejo (días hábiles)</Label>
              <Input type="number" value={config.sla_complejo_dias || '10'} onChange={(e) => setConfig({ ...config, sla_complejo_dias: e.target.value })} />
              <p className="text-xs text-muted-foreground mt-1">Dictámenes que requieren análisis profundo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notificaciones</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Notificaciones por Email</Label>
              <p className="text-xs text-muted-foreground">Enviar alertas por correo electrónico</p>
            </div>
            <Switch checked={config.notificaciones_email === 'true'} onCheckedChange={(v) => setConfig({ ...config, notificaciones_email: String(v) })} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Notificaciones del Sistema</Label>
              <p className="text-xs text-muted-foreground">Mostrar alertas en la plataforma</p>
            </div>
            <Switch checked={config.notificaciones_sistema === 'true'} onCheckedChange={(v) => setConfig({ ...config, notificaciones_sistema: String(v) })} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full">Guardar Configuración</Button>
    </div>
  )
}

// ============ PUBLIC CONSULTATION FORM ============
// ============ CONSULTATION FORM COMPONENT ============
function ConsultationForm({ onSuccess }: { onSuccess: (codigo: string) => void }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombreSolicitante: '', email: '', telefono: '', empresa: '', rif: '', cargo: '',
    titulo: '', descripcion: '', tipo: 'LEGAL' as TipoConsulta, prioridad: 'MEDIA' as PrioridadConsulta,
    slaTipo: 'ESTANDAR' as SlaTipo, comiteIds: [] as string[], aceptaTerminos: false, aceptaNeutralidad: false,
  })
  const [comites, setComites] = useState<Comite[]>([])

  useEffect(() => {
    fetchApi<Comite[]>('/api/comites').then(setComites).catch(() => setComites([]))
  }, [])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const data = await fetchApi<Consulta>('/api/consultas', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      onSuccess(data.codigo)
      toast.success('Consulta enviada exitosamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al enviar consulta')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { title: 'Identidad', sub: 'Datos del Solicitante', icon: UserIcon },
    { title: 'Requerimiento', sub: 'Detalles de la Consulta', icon: MessageSquare },
    { title: 'Destino', sub: 'Comité(s) de Destinatarios', icon: Users },
    { title: 'Revisión', sub: 'Validar y Enviar', icon: ClipboardList }
  ]

  return (
    <div className="space-y-8">
      {/* Enhanced Progress Indicator */}
      <div className="relative">
        <div className="flex justify-between mb-2">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1 z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border ${
                step > i + 1 ? 'bg-green-500 border-green-600 text-white' : 
                step === i + 1 ? 'bg-[#C5A059] border-[#A68040] text-white shadow-[0_0_15px_rgba(197,160,89,0.3)] scale-110' : 
                'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                {step > i + 1 ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] uppercase tracking-tighter font-bold ${step === i + 1 ? 'text-[#C5A059]' : 'text-slate-500'}`}>
                {s.title}
              </span>
            </div>
          ))}
          {/* Connector Line */}
          <div className="absolute top-4 left-4 right-4 h-[1px] bg-slate-800 -z-0" />
          <div 
            className="absolute top-4 left-4 h-[1px] bg-[#C5A059] transition-all duration-500 -z-0" 
            style={{ width: `${((step - 1) / (steps.length - 1)) * 92}%` }}
          />
        </div>
      </div>

      <div className="pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {step === 1 && <UserIcon className="w-5 h-5 text-[#C5A059]" />}
                {step === 2 && <MessageSquare className="w-5 h-5 text-[#C5A059]" />}
                {step === 3 && <Users className="w-5 h-5 text-[#C5A059]" />}
                {step === 4 && <ClipboardList className="w-5 h-5 text-[#C5A059]" />}
                {steps[step - 1].sub}
              </h3>
              <p className="text-sm text-slate-400">Complete los campos requeridos marcados con (*)</p>
            </div>

            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-slate-300">Nombre y Apellido *</Label>
                  <div className="relative group">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#C5A059] transition-colors" />
                    <Input 
                      className="pl-10 bg-slate-900/50 border-slate-800 focus:border-[#C5A059]/50 transition-all" 
                      placeholder="Ingrese su nombre completo"
                      value={formData.nombreSolicitante} 
                      onChange={(e) => setFormData({ ...formData, nombreSolicitante: e.target.value })} 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Email Institucional/Personal *</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#C5A059] transition-colors" />
                    <Input 
                      className="pl-10 bg-slate-900/50 border-slate-800 focus:border-[#C5A059]/50 transition-all" 
                      type="email" 
                      placeholder="correo@ejemplo.com"
                      value={formData.email} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Teléfono de Contacto</Label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#C5A059] transition-colors" />
                    <Input 
                      className="pl-10 bg-slate-900/50 border-slate-800 focus:border-[#C5A059]/50 transition-all" 
                      placeholder="+58 4XX XXX XX XX"
                      value={formData.telefono} 
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">RIF (Opcional)</Label>
                  <div className="relative group">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#C5A059] transition-colors" />
                    <Input 
                      className="pl-10 bg-slate-900/50 border-slate-800 focus:border-[#C5A059]/50 transition-all" 
                      placeholder="J-00000000-0"
                      value={formData.rif} 
                      onChange={(e) => setFormData({ ...formData, rif: e.target.value })} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Empresa / Organización</Label>
                  <div className="relative group">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#C5A059] transition-colors" />
                    <Input 
                      className="pl-10 bg-slate-900/50 border-slate-800 focus:border-[#C5A059]/50 transition-all" 
                      placeholder="Nombre de la institución"
                      value={formData.empresa} 
                      onChange={(e) => setFormData({ ...formData, empresa: e.target.value })} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Cargo dentro de la Entidad</Label>
                  <div className="relative group">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#C5A059] transition-colors" />
                    <Input 
                      className="pl-10 bg-slate-900/50 border-slate-800 focus:border-[#C5A059]/50 transition-all" 
                      placeholder="Ej: Director de Tecnología"
                      value={formData.cargo} 
                      onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} 
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-slate-300">Título de la Consulta *</Label>
                  <Input 
                    className="bg-slate-900/50 border-slate-800 focus:border-[#C5A059]/50 transition-all" 
                    placeholder="Resumen corto de su requerimiento"
                    value={formData.titulo} 
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Descripción Detallada *</Label>
                  <Textarea 
                    className="bg-slate-900/50 border-slate-800 focus:border-[#C5A059]/50 transition-all min-h-[150px] resize-none" 
                    placeholder="Explique su consulta técnica de la manera más detallada posible para facilitar el análisis..."
                    rows={5} 
                    value={formData.descripcion} 
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Área Geográfica / Tipo</Label>
                    <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v as TipoConsulta })}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                        <SelectItem value="LEGAL">Legal / Normativo</SelectItem>
                        <SelectItem value="FISCAL">Fiscal / Tributario</SelectItem>
                        <SelectItem value="TECNICA">Técnico / Implementación</SelectItem>
                        <SelectItem value="MIXTA">Proyecto Integral / Mixta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Prioridad Requerida</Label>
                    <Select value={formData.prioridad} onValueChange={(v) => setFormData({ ...formData, prioridad: v as PrioridadConsulta })}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                        <SelectItem value="BAJA">Baja (Informativa)</SelectItem>
                        <SelectItem value="MEDIA">Media (Análisis Técnico)</SelectItem>
                        <SelectItem value="ALTA">Alta (Urgencia Operativa)</SelectItem>
                        <SelectItem value="URGENTE">Crítica (Bloqueo / Legal)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-800 flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-white font-bold block mb-1">Acuerdo de Niveles de Servicio (SLA)</span>
                    Las consultas se procesan bajo un estándar de 72 horas para requerimientos básicos. Proyectos complejos pueden requerir dictámenes de 5 a 10 días hábiles.
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400 mb-2">Seleccione los comités que deben evaluar su requerimiento:</p>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="grid gap-4">
                    {comites.length > 0 ? (
                      comites.map(comite => (
                        <div 
                          key={comite.id} 
                          className={`flex items-center space-x-4 p-4 border rounded-2xl transition-all cursor-pointer ${
                            formData.comiteIds.includes(comite.id) 
                            ? 'border-[#C5A059] bg-[#C5A059]/5' 
                            : 'border-slate-800 bg-slate-900/30 hover:bg-slate-900/50'
                          }`}
                          onClick={() => {
                             const checked = formData.comiteIds.includes(comite.id);
                             setFormData({
                               ...formData,
                               comiteIds: !checked
                                 ? [...formData.comiteIds, comite.id]
                                 : formData.comiteIds.filter(id => id !== comite.id),
                             })
                          }}
                        >
                          <Checkbox
                            id={comite.id}
                            checked={formData.comiteIds.includes(comite.id)}
                            className="data-[state=checked]:bg-[#C5A059] data-[state=checked]:border-[#C5A059]"
                          />
                          <div className="flex-1">
                            <Label htmlFor={comite.id} className="text-sm font-bold block text-white cursor-pointer">{comite.nombre}</Label>
                            {comite.descripcion && <p className="text-[11px] text-slate-500 line-clamp-1">{comite.descripcion}</p>}
                          </div>
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: comite.color }} />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-sm italic">Cargando comités...</div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-[28px] space-y-4 shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h4 className="font-bold text-[#C5A059] text-sm flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4" /> Resumen del Requerimiento
                    </h4>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] text-slate-500 uppercase hover:text-[#C5A059]" onClick={() => setStep(1)}>
                      Editar Todo
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Solicitante</p>
                      <p className="text-sm text-slate-200">{formData.nombreSolicitante}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Email</p>
                      <p className="text-sm text-slate-200 truncate">{formData.email}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Asunto</p>
                      <p className="text-sm text-slate-200 font-bold">{formData.titulo}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Categoría</p>
                      <Badge variant="outline" className="text-xs bg-slate-800/50">{formData.tipo}</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Prioridad</p>
                      <Badge className={`${getPrioridadColor(formData.prioridad)} text-white text-[10px]`}>{formData.prioridad}</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className={`p-4 rounded-2xl border transition-all ${formData.aceptaNeutralidad ? 'border-green-500/20 bg-green-500/5' : 'bg-slate-900/50 border-slate-800'}`}>
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="neutralidad" 
                        checked={formData.aceptaNeutralidad} 
                        onCheckedChange={(v) => setFormData({ ...formData, aceptaNeutralidad: !!v })} 
                        className="mt-1 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <Label htmlFor="neutralidad" className="text-[11px] leading-relaxed text-slate-400 cursor-pointer">
                        <span className="text-white font-bold">Pacto de Neutralidad:</span> Entiendo que la Mesa Técnica actúa bajo principios de objetividad institucional, sin favoritismos ni recomendaciones comerciales de marcas específicas.
                      </Label>
                    </div>
                  </div>
                  <div className={`p-4 rounded-2xl border transition-all ${formData.aceptaTerminos ? 'border-blue-500/20 bg-blue-500/5' : 'bg-slate-900/50 border-slate-800'}`}>
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="terminos" 
                        checked={formData.aceptaTerminos} 
                        onCheckedChange={(v) => setFormData({ ...formData, aceptaTerminos: !!v })} 
                        className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <Label htmlFor="terminos" className="text-[11px] leading-relaxed text-slate-400 cursor-pointer">
                        He leído y acepto los <span className="text-[#C5A059] hover:underline cursor-pointer">Términos y Condiciones</span> de uso de la plataforma y su Política de Tratamiento de Datos.
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-slate-800">
        <Button 
          variant="ghost" 
          disabled={step === 1 || loading}
          className="text-slate-400 hover:text-white hover:bg-slate-800 font-bold" 
          onClick={() => setStep(step - 1)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
        </Button>
        <div className="flex gap-3">
          {step < 4 ? (
            <Button 
              className="bg-[#C5A059] hover:bg-[#A68040] text-white font-bold px-8" 
              onClick={() => {
                if (step === 1 && (!formData.nombreSolicitante || !formData.email)) {
                  toast.error('Por favor complete los campos obligatorios');
                  return;
                }
                if (step === 2 && (!formData.titulo || !formData.descripcion)) {
                  toast.error('Por favor complete los detalles de la consulta');
                  return;
                }
                if (step === 3 && formData.comiteIds.length === 0) {
                  toast.error('Debe seleccionar al menos un comité');
                  return;
                }
                setStep(step + 1);
              }}
            >
              Siguiente <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              className="bg-gradient-to-r from-[#C5A059] to-[#927843] hover:shadow-[0_0_20px_rgba(197,160,89,0.2)] text-white font-bold px-10 border-none h-11" 
              onClick={handleSubmit} 
              disabled={!formData.aceptaTerminos || !formData.aceptaNeutralidad || loading}
            >
              {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Enviar Consulta Técnica
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function ConsultationFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [success, setSuccess] = useState(false)
  const [codigoSeguimiento, setCodigoSeguimiento] = useState('')

  return (
    <Dialog open={open} onOpenChange={() => {
      setSuccess(false)
      onClose()
    }}>
      <DialogContent className="max-w-2xl bg-slate-950 border-slate-800 text-slate-200 max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <DialogTitle className="text-2xl font-bold mb-3">¡Consulta Enviada!</DialogTitle>
            <DialogDescription className="text-slate-400 mb-8">
              Su requerimiento ha sido procesado por la Secretaría Técnica.
            </DialogDescription>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl mb-8">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-black mb-2">Código de Seguimiento</p>
              <p className="text-3xl font-mono font-black text-white">{codigoSeguimiento}</p>
            </div>
            <Button onClick={onClose} className="w-full h-12 bg-slate-800 hover:bg-slate-700 font-bold">Cerrar</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Send className="w-6 h-6 text-[#C5A059]" /> Enviar Consulta Técnica
              </DialogTitle>
            </DialogHeader>
            <ConsultationForm onSuccess={(codigo) => {
              setCodigoSeguimiento(codigo)
              setSuccess(true)
            }} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============ CANDIDATE FORM ============
// ============ CANDIDATE FORM COMPONENT ============
function CandidateForm({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', email: '', telefono: '', ciudad: '', pais: 'Venezuela',
    profesion: '', especialidad: '', experiencia: '', tituloAcademico: '',
    comitePreferidoId: '', disponibilidad: 'TIEMPO_COMPLETO',
    cvUrl: '', cartaMotivacionUrl: '', biografia: '',
  })
  const [comites, setComites] = useState<Comite[]>([])

  useEffect(() => {
    fetchApi<Comite[]>('/api/comites').then(setComites).catch(() => setComites([]))
  }, [])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await fetchApi('/api/candidatos', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      onSuccess()
      toast.success('Postulación enviada exitosamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al enviar postulación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-white">Paso {step} de 4</h3>
        <p className="text-sm text-slate-400">
          {step === 1 ? 'Información Personal' : step === 2 ? 'Información Profesional' : step === 3 ? 'Documentos' : 'Motivación'}
        </p>
      </div>

      <div className="flex gap-2">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`flex-1 h-2 rounded ${s <= step ? 'bg-[#00459E]' : 'bg-slate-800'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Nombre *</Label><Input className="bg-slate-900 border-slate-800" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Apellido *</Label><Input className="bg-slate-900 border-slate-800" value={formData.apellido} onChange={(e) => setFormData({ ...formData, apellido: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Email *</Label><Input className="bg-slate-900 border-slate-800" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Teléfono</Label><Input className="bg-slate-900 border-slate-800" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Ciudad / País</Label><Input className="bg-slate-900 border-slate-800" value={`${formData.ciudad}${formData.ciudad && ', '}${formData.pais}`} disabled /></div>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Profesión *</Label><Input className="bg-slate-900 border-slate-800" value={formData.profesion} onChange={(e) => setFormData({ ...formData, profesion: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Especialidad *</Label><Input className="bg-slate-900 border-slate-800" value={formData.especialidad} onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Años de Experiencia</Label><Input className="bg-slate-900 border-slate-800" value={formData.experiencia} onChange={(e) => setFormData({ ...formData, experiencia: e.target.value })} /></div>
          <div className="space-y-2"><Label>Título Académico</Label><Input className="bg-slate-900 border-slate-800" value={formData.tituloAcademico} onChange={(e) => setFormData({ ...formData, tituloAcademico: e.target.value })} /></div>
          <div className="space-y-2"><Label>Comité de Preferencia</Label>
            <Select value={formData.comitePreferidoId} onValueChange={(v) => setFormData({ ...formData, comitePreferidoId: v })}>
              <SelectTrigger className="bg-slate-900 border-slate-800"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {comites.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Disponibilidad</Label>
            <Select value={formData.disponibilidad} onValueChange={(v) => setFormData({ ...formData, disponibilidad: v })}>
              <SelectTrigger className="bg-slate-900 border-slate-800"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TIEMPO_COMPLETO">Tiempo Completo</SelectItem>
                <SelectItem value="MEDIO_TIEMPO">Medio Tiempo</SelectItem>
                <SelectItem value="POR_HORAS">Por Horas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="space-y-2"><Label>URL del CV</Label><Input className="bg-slate-900 border-slate-800" type="url" placeholder="https://..." value={formData.cvUrl} onChange={(e) => setFormData({ ...formData, cvUrl: e.target.value })} /></div>
          <div className="space-y-2"><Label>URL de Carta de Motivación</Label><Input className="bg-slate-900 border-slate-800" type="url" placeholder="https://..." value={formData.cartaMotivacionUrl} onChange={(e) => setFormData({ ...formData, cartaMotivacionUrl: e.target.value })} /></div>
          <p className="text-xs text-slate-500 italic">Suba sus documentos a Google Drive y proporcione los enlaces de acceso público.</p>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <div className="space-y-2"><Label>Biografía / Motivación *</Label><Textarea className="bg-slate-900 border-slate-800" rows={6} placeholder="Explique por qué desea formar parte de la Mesa Técnica..." value={formData.biografia} onChange={(e) => setFormData({ ...formData, biografia: e.target.value })} required /></div>
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-[24px]">
            <h4 className="font-bold text-[#00459E] mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4" /> Resumen de su Postulación
            </h4>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-slate-500">Nombre:</span> <span className="text-slate-200">{formData.nombre}</span>
              <span className="text-slate-500">Apellido:</span> <span className="text-slate-200">{formData.apellido}</span>
              <span className="text-slate-500">Email:</span> <span className="text-slate-200">{formData.email}</span>
              <span className="text-slate-500">Profesión:</span> <span className="text-slate-200">{formData.profesion}</span>
              <span className="text-slate-500">Especialidad:</span> <span className="text-slate-200">{formData.especialidad}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        {step > 1 && <Button variant="outline" className="border-slate-800 text-slate-400 hover:bg-slate-800" onClick={() => setStep(step - 1)}>Anterior</Button>}
        <div className="ml-auto flex gap-3">
          {step < 4 ? (
            <Button className="bg-[#00459E] hover:bg-[#003882] font-bold" onClick={() => setStep(step + 1)}>
              Siguiente <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button className="bg-gradient-to-r from-[#00459E] to-[#001C3D] hover:shadow-lg hover:shadow-[#00459E]/20 font-bold" onClick={handleSubmit} disabled={!formData.biografia} loading={loading}>
              <UserPlus className="w-4 h-4 mr-2" /> Enviar Postulación
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function CandidateFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [success, setSuccess] = useState(false)

  return (
    <Dialog open={open} onOpenChange={() => {
      setSuccess(false)
      onClose()
    }}>
      <DialogContent className="max-w-2xl bg-slate-950 border-slate-800 text-slate-200 max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-[#00459E]/10 border border-[#00459E]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-[#00459E]" />
            </div>
            <DialogTitle className="text-2xl font-bold mb-3">¡Postulación Enviada!</DialogTitle>
            <DialogDescription className="text-slate-400 mb-8">
              Su perfil será revisado por el Consejo Directivo y los coordinadores de comités.
            </DialogDescription>
            <Button onClick={onClose} className="w-full h-12 bg-slate-800 hover:bg-slate-700 font-bold">Cerrar</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-[#00459E]" /> Postularse como Asesor
              </DialogTitle>
            </DialogHeader>
            <CandidateForm onSuccess={() => setSuccess(true)} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============ CONSULTATION SECTION ============
function TrackingSection() {
  const [codigo, setCodigo] = useState('')
  const [consulta, setConsulta] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTrack = async () => {
    if (!codigo) {
      toast.error('Por favor ingrese un código')
      return
    }
    setLoading(true)
    setError('')
    setConsulta(null)
    try {
      const data = await fetchApi<{ data: Consulta[] }>(`/api/consultas?codigo=${codigo.trim().toUpperCase()}`)
      if (data.data && data.data.length > 0) {
        setConsulta(data.data[0])
      } else {
        setError('No se encontró ninguna consulta con ese código.')
      }
    } catch (err) {
      setError('Error al consultar el servidor. Intente más tarde.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'RECIBIDA': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'CLASIFICADA': return 'text-purple-400 bg-purple-500/10 border-purple-500/20'
      case 'ASIGNADA': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'EN_PROCESO': return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
      case 'DICTAMEN': return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'CERRADA': return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
    }
  }

  return (
    <section id="seguimiento" className="py-24 relative overflow-hidden bg-slate-950 border-t border-slate-900/50">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Seguimiento de Consulta</h2>
          <p className="text-slate-400">Ingrese su código para conocer el estatus actual de su requerimiento.</p>
        </div>

        <div className="max-w-xl mx-auto">
          <div className="flex gap-2 p-2 bg-[#001C3D] border border-slate-800 rounded-2xl mb-8">
            <Input 
              placeholder="Ej: CONS-2026-0001" 
              className="bg-transparent border-none text-white placeholder:text-slate-600 focus-visible:ring-0"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
            />
            <Button 
              onClick={handleTrack}
              disabled={loading}
              className="bg-[#C5A059] hover:bg-[#A68040] text-white font-bold px-6 rounded-xl shrink-0"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              Consultar
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                key="error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center mb-6"
              >
                {error}
              </motion.div>
            )}

            {consulta && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#001C3D]/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm"
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black tracking-widest mb-6 ${getStatusColor(consulta.estado)}`}>
                    {consulta.estado}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{consulta.titulo}</h3>
                  <p className="text-slate-500 text-sm mb-8 font-mono">ID: {consulta.codigo}</p>
                  
                  <div className="w-full grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-left">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Tipo</p>
                      <p className="text-sm font-bold text-slate-300">{consulta.tipo}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-left">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Prioridad</p>
                      <p className="text-sm font-bold text-slate-300">{consulta.prioridad}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/20 text-left w-full">
                    <div className="w-10 h-10 rounded-xl bg-[#C5A059]/20 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-[#C5A059]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">Información de Entrega</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Al finalizar el proceso técnico de evaluación, el dictamen oficial y los resultados serán enviados automáticamente a su correo electrónico registrado.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

function ConsultationSection() {
  const [success, setSuccess] = useState(false)
  const [codigoSeguimiento, setCodigoSeguimiento] = useState('')

  return (
    <section id="consulta" className="py-32 relative overflow-hidden bg-[#001C3D]/50">
      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-6 font-display">Enviar Consulta Técnica</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Obtenga respuestas institucionales y técnicas sobre el ecosistema de criptoactivos en Venezuela.
            </p>
          </div>

          <div className="bg-[#001C3D]/80 backdrop-blur-xl border border-slate-800 p-8 lg:p-12 rounded-[40px] shadow-2xl relative">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
              <Send className="w-64 h-64 text-white" />
            </div>
            
            {success ? (
              <div className="text-center py-12">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8"
                >
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </motion.div>
                <h3 className="text-3xl font-bold text-white mb-4">¡Consulta Recibida!</h3>
                <p className="text-slate-400 mb-10 max-w-md mx-auto">
                  Su requerimiento ha sido asignado a la Secretaría Técnica. Guarde su código para futuras consultas.
                </p>
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] mb-10 inline-block px-12">
                  <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black mb-3">Código de Seguimiento</p>
                  <p className="text-4xl font-mono font-black text-white tracking-widest">{codigoSeguimiento}</p>
                </div>
                <div>
                  <Button 
                    onClick={() => setSuccess(false)} 
                    variant="outline" 
                    className="h-12 px-8 border-slate-800 text-slate-400 hover:bg-slate-800 font-bold"
                  >
                    Nueva Consulta
                  </Button>
                </div>
              </div>
            ) : (
              <ConsultationForm onSuccess={(codigo) => {
                setCodigoSeguimiento(codigo)
                setSuccess(true)
                document.getElementById('consulta')?.scrollIntoView({ behavior: 'smooth' })
              }} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============ CANDIDATE SECTION ============
function CandidateSection() {
  const [success, setSuccess] = useState(false)

  return (
    <section id="postulacion" className="py-32 relative overflow-hidden">
      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-6 font-display">Postularme como Asesor</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Únase a los comités expertos y contribuya al desarrollo de estándares para la economía digital.
            </p>
          </div>

          <div className="bg-[#001C3D]/80 backdrop-blur-xl border border-slate-800 p-8 lg:p-12 rounded-[40px] shadow-2xl relative">
             <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
              <UserPlus className="w-64 h-64 text-white" />
            </div>

            {success ? (
              <div className="text-center py-12">
                <motion.div 
                   initial={{ scale: 0.8, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   className="w-24 h-24 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-8"
                >
                  <UserCheck className="w-12 h-12 text-blue-500" />
                </motion.div>
                <h3 className="text-3xl font-bold text-white mb-4">¡Postulación Enviada!</h3>
                <p className="text-slate-400 mb-10 max-w-md mx-auto">
                  Su perfil ha sido registrado en nuestra base de talentos. La Secretaría Técnica se pondrá en contacto pronto.
                </p>
                <Button 
                  onClick={() => setSuccess(false)} 
                  className="h-12 px-8 bg-blue-600 hover:bg-blue-700 font-bold"
                >
                  Entendido
                </Button>
              </div>
            ) : (
              <CandidateForm onSuccess={() => {
                setSuccess(true)
                document.getElementById('postulacion')?.scrollIntoView({ behavior: 'smooth' })
              }} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============ LANDING PAGE COMPONENT ============
function LandingPage({ onLoginClick, onRegister, onCandidate, onConsultation, user }: {
  onLoginClick: () => void
  onRegister: () => void
  onCandidate: () => void
  onConsultation: () => void
  user: any
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-amber-500/30">
      {/* Hero Section */}
      <header className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
        <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full opacity-30 pointer-events-none" />
        
        <div className="container mx-auto px-4 relative">
          <nav className="flex items-center justify-between mb-16 lg:mb-24">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#C5A059] to-[#A68040] rounded-xl flex items-center justify-center shadow-lg shadow-[#C5A059]/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg text-white block leading-none">Mesa Técnica</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Criptoactivos • CAVECOM-e</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
              <a href="#proposito" className="hover:text-amber-500 transition-colors">Propósito</a>
              <a href="#estructura" className="hover:text-amber-500 transition-colors">Estructura</a>
              <a href="#servicios" className="hover:text-amber-500 transition-colors">Servicios</a>
              <a href="#seguimiento" className="hover:text-amber-500 transition-colors font-bold text-amber-500/80">Seguimiento</a>
              {user ? (
                <Button variant="ghost" className="text-white hover:text-amber-500 hover:bg-amber-500/5 flex items-center gap-2 border border-slate-800" onClick={onLoginClick}>
                  <LayoutDashboard className="w-4 h-4" /> Panel Administrativo
                </Button>
              ) : (
                <Button variant="ghost" className="text-white hover:text-amber-500 hover:bg-amber-500/5 text-xs uppercase tracking-widest font-black" onClick={onLoginClick}>
                  Iniciar Sesión
                </Button>
              )}
            </div>
            <Button variant="outline" className="md:hidden border-slate-700 h-9 px-3" onClick={onLoginClick}>
              {user ? 'Panel' : 'Acceso'}
            </Button>
          </nav>

          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold mb-8 uppercase tracking-widest">
                <Shield className="w-3.5 h-3.5" />
                Gobernanza Digital
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-white mb-8 tracking-tight leading-[1.1]">
                Infraestructura de Confianza para la <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#C5A059]">Economía Digital</span>
              </h1>
              <p className="text-xl text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto">
                Estandarización y gobernanza del comercio electrónico con criptoactivos en Venezuela. Un espacio de neutralidad técnica y certeza jurídica.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" className="h-14 px-8 text-base font-bold bg-[#00459E] hover:bg-[#003882] hover:shadow-lg hover:shadow-[#00459E]/30 transition-all" onClick={onConsultation}>
                  <Send className="w-5 h-5 mr-2" /> Enviar Consulta Técnica
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-base font-bold border-slate-700 bg-[#001C3D]/50 hover:bg-[#002855] text-white transition-all" onClick={onCandidate}>
                  <UserPlus className="w-5 h-5 mr-2" /> Postularme como Asesor
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Identidad y Propósito */}
      <section id="proposito" className="py-32 relative">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Identidad y Propósito</h2>
                <div className="w-20 h-1.5 bg-gradient-to-r from-[#C5A059] to-[#A68040] rounded-full" />
              </div>
              
              <div className="space-y-8">
                <div className="flex gap-6 group">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Target className="w-7 h-7 text-[#C5A059]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Misión</h3>
                    <p className="text-slate-400 leading-relaxed">Establecer una infraestructura de confianza, estandarización y gobernanza para la economía digital en Venezuela.</p>
                  </div>
                </div>
                
                <div className="flex gap-6 group">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-[#00459E]/10 border border-[#00459E]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-7 h-7 text-[#00459E]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Objetivo</h3>
                    <p className="text-slate-400 leading-relaxed">Permitir que el comercio electrónico integre criptoactivos con certeza jurídica, resiliencia tecnológica y excelencia contable.</p>
                  </div>
                </div>
                
                <div className="flex gap-6 group">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="w-7 h-7 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Intervención</h3>
                    <p className="text-slate-400 leading-relaxed">Cerramos brechas y riesgos estructurales (legales, fiscales y técnicos) derivados de una adopción no estandarizada.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#C5A059]/20 to-[#A68040]/20 blur-2xl rounded-[40px] opacity-50" />
              <div className="relative bg-[#001C3D]/80 backdrop-blur-xl p-10 rounded-[32px] border border-slate-700 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Shield className="w-40 h-40 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  <Award className="w-6 h-6 text-[#C5A059]" />
                  Principios Fundamentales
                </h3>
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/20">
                    <p className="text-[#C5A059] font-bold mb-2 flex items-center gap-2">
                       "Regla de Oro" de Cero Comercialización
                    </p>
                    <p className="text-sm text-slate-300">Espacio para definir estándares, no para promocionar marcas o productos.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                      <p className="font-bold text-white mb-1">Ad Honorem</p>
                      <p className="text-xs text-slate-500">Sin conflictos de interés privado.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                      <p className="font-bold text-white mb-1">Neutralidad</p>
                      <p className="text-xs text-slate-500">Prohibición de uso comercial.</p>
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-start gap-4">
                    <Lock className="w-5 h-5 text-slate-500 mt-1" />
                    <div>
                      <p className="font-bold text-white mb-1">Confidencialidad</p>
                      <p className="text-sm text-slate-500">Protección de datos sensibles y proyectos en fase de diseño.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Estructura Organizativa */}
      <section id="estructura" className="py-32 bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">Arquitectura Orbital</h2>
            <p className="text-lg text-slate-400">Nuestra estructura jerárquica garantiza agilidad técnica y alineación estratégica institucional.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-[32px] bg-[#001C3D] border border-slate-800 hover:border-[#C5A059]/40 transition-all hover:shadow-2xl hover:shadow-[#C5A059]/5">
              <div className="w-14 h-14 rounded-2xl bg-[#C5A059]/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Award className="w-7 h-7 text-[#C5A059]" />
              </div>
              <p className="text-[#C5A059] text-xs font-black tracking-[0.2em] uppercase mb-3">Nivel 1 • Estratégico</p>
              <h3 className="text-2xl font-extrabold text-white mb-6">Consejo Directivo</h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                Liderado por la presidencia de CAVECOM-e, encargado de la dirección y vocería institucional de la Mesa.
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-center gap-2 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" /> Dirección Política
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" /> Vocería Oficial
                </li>
              </ul>
            </div>

            <div className="group p-8 rounded-[32px] bg-[#001C3D] border border-slate-800 hover:border-[#00459E]/40 transition-all hover:shadow-2xl hover:shadow-[#00459E]/5">
              <div className="w-14 h-14 rounded-2xl bg-[#00459E]/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <RefreshCw className="w-7 h-7 text-[#00459E]" />
              </div>
              <p className="text-[#00459E] text-xs font-black tracking-[0.2em] uppercase mb-3">Nivel 2 • Conector</p>
              <h3 className="text-2xl font-extrabold text-white mb-6">Secretaría Técnica</h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                Actúa como el "router institucional", gestionando el flujo de documentos, actas y coordinación de agendas.
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-center gap-2 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00459E]" /> Gestión Documental
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00459E]" /> Coordinación Técnica
                </li>
              </ul>
            </div>

            <div className="group p-8 rounded-[32px] bg-[#001C3D] border border-slate-800 hover:border-purple-500/40 transition-all hover:shadow-2xl hover:shadow-purple-500/5">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Layers className="w-7 h-7 text-purple-500" />
              </div>
              <p className="text-purple-500 text-xs font-black tracking-[0.2em] uppercase mb-3">Nivel 3 • Ejecución</p>
              <h3 className="text-2xl font-extrabold text-white mb-6">7 Comités Expertos</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="text-[10px] text-purple-400 uppercase font-black tracking-widest block mb-1">Eje Técnico</span>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">Legal, Tecnología (Blockchain/IA), Ciberseguridad y Minería.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="text-[10px] text-purple-400 uppercase font-black tracking-widest block mb-1">Eje Negocios</span>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">Modelos de Negocio, Contable/Tributario y Académico.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Funcionamiento y SLA */}
      <section id="servicios" className="py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[#00459E]/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-10">Funcionamiento y Gestión SLA</h2>
              <div className="space-y-8">
                <div className="p-8 rounded-3xl bg-gradient-to-br from-[#001C3D] to-slate-950 border border-slate-800 shadow-xl">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <Clock className="w-6 h-6 text-[#C5A059]" />
                    Tiempos de Respuesta
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Consultas Estándar</span>
                      <div className="text-2xl font-black text-white">48 - 72h</div>
                      <p className="text-xs text-slate-400">Resolución directa y expedita.</p>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Dictámenes Complejos</span>
                      <div className="text-2xl font-black text-white">5 - 10 Días</div>
                      <p className="text-xs text-slate-400">Investigación y deliberación profunda.</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 rounded-2xl bg-green-500/5 border border-green-500/10 items-center">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <FileCheck className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-300">
                    <span className="font-bold text-green-500">Ciclo de Consultas:</span> Recepción → Clasificación → Asignación → Dictamen → Cierre.
                  </p>
                </div>

                <div className="flex gap-4 p-4 rounded-2xl bg-[#00459E]/5 border border-[#00459E]/10 items-center">
                  <div className="w-10 h-10 rounded-full bg-[#00459E]/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-[#00459E]" />
                  </div>
                  <p className="text-sm font-medium text-slate-300">
                    <span className="font-bold text-[#00459E]">Toma de Decisiones:</span> Sesiones mensuales híbridas basadas en consenso técnico.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <h3 className="text-2xl font-bold text-white">Acción Estratégica</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { title: 'Liderazgo de Pensamiento', icon: Target, desc: 'Órgano de consulta obligatoria en el ecosistema.' },
                  { title: 'Asistencia Técnica', icon: HelpCircle, desc: 'Solución a nudos operativos para afiliados.' },
                  { title: 'Doctrina Institucional', icon: BookOpen, desc: 'Unificar criterios para mejores decisiones.' },
                  { title: 'Inteligencia Regulatoria', icon: Shield, desc: 'Monitoreo proactivo de riesgos normativos.' },
                  { title: 'Capacitación Impacto', icon: GraduationCap, desc: 'Formación continua técnica y estratégica.' },
                  { title: 'Acción Transversal', icon: Zap, desc: 'Identificar necesidades críticas del sector.' },
                ].map((item, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-[#001C3D] border border-slate-800 hover:bg-[#002855] transition-colors">
                    <item.icon className="w-7 h-7 text-[#C5A059] mb-4" />
                    <h4 className="text-white font-bold mb-2">{item.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plan Operativo */}
      <section className="py-32 relative">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-t from-[#C5A059]/10 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-20 tracking-tight">Plan Operativo Inmediato</h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
            <div className="p-8 rounded-3xl bg-[#001C3D]/50 border border-slate-800 backdrop-blur hover:border-[#C5A059]/30 transition-all hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-[#C5A059]/10 flex items-center justify-center mx-auto mb-6">
                <Video className="w-8 h-8 text-[#C5A059]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Master Class</h3>
              <p className="text-sm text-slate-500">Marco regulatorio y fiscalidad en Venezuela.</p>
            </div>
            
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur hover:border-blue-500/30 transition-all hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
                <Megaphone className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Podcast</h3>
              <p className="text-sm text-slate-500">Debate técnico quincenal: USDT vs USDC y más.</p>
            </div>
            
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur hover:border-purple-500/30 transition-all hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
                <LayoutDashboard className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Talleres</h3>
              <p className="text-sm text-slate-500">Ciberseguridad y custodia de activos digitales.</p>
            </div>
            
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur hover:border-green-500/30 transition-all hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <ClipboardList className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Diagnóstico</h3>
              <p className="text-sm text-slate-500">Formulario nacional de necesidades críticas.</p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto p-12 rounded-[40px] bg-gradient-to-br from-[#C5A059] to-[#A68040] shadow-2xl shadow-[#C5A059]/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
              <Shield className="w-64 h-64 text-white" />
            </div>
            <div className="relative">
              <h3 className="text-3xl font-black text-white mb-6">¿Listo para integrarte a la economía digital?</h3>
              <p className="text-white/80 text-lg mb-10 font-medium">Únete a la plataforma oficial de la Mesa Técnica y gestiona tus consultas con el respaldo de expertos.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" className="h-14 px-10 bg-white text-[#A68040] hover:bg-slate-100 font-bold text-lg rounded-2xl shadow-xl transition-all" onClick={onRegister}>
                  Registrarse Ahora
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-10 border-white/30 text-black hover:bg-white/10 font-bold text-lg rounded-2xl backdrop-blur-sm transition-all" onClick={onLoginClick}>
                  Acceder a la Mesa
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Secciones de Acción */}
      <TrackingSection />
      <ConsultationSection />
      <CandidateSection />

      {/* Footer */}
      <footer className="py-20 border-t border-slate-900 relative">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#C5A059]" />
              </div>
              <span className="font-bold text-slate-300">CAVECOM-e</span>
            </div>
            <p className="text-slate-500 text-sm">© 2026 Cámara Venezolana de Comercio Electrónico. Todos los derechos reservados.</p>
            <div className="flex gap-8 text-sm font-medium">
              <a href="#" onClick={(e) => { e.preventDefault(); onLoginClick(); }} className="text-slate-400 hover:text-amber-500 transition-colors font-bold">Panel Administrativo</a>
              <a href="#" className="text-slate-400 hover:text-amber-500 transition-colors">Normativa</a>
              <a href="#" className="text-slate-400 hover:text-amber-500 transition-colors">Privacidad</a>
              <a href="#" className="text-slate-400 hover:text-amber-500 transition-colors">Contacto</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ============ MAIN APP ============
export function MesaTecnicaApp() {
  const { user, isAuthenticated, login, logout, checkAuth, setUser } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showConsultationForm, setShowConsultationForm] = useState(false)
  const [showCandidateForm, setShowCandidateForm] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [notifications, setNotifications] = useState<Notificacion[]>([])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchApi<{ data: Notificacion[] }>('/api/notificaciones')
        .then(data => setNotifications(data.data || []))
        .catch(() => {})
    }
  }, [isAuthenticated, user])

  const handleLogin = async (loggedUser: any) => {
    setUser(loggedUser)
    setShowLoginForm(false)
    setShowConsultationForm(false)
    setShowCandidateForm(false)
  }

  const handleLogout = async () => {
    try {
      await fetchApi('/api/auth/logout', { method: 'POST' })
    } catch {}
    logout()
  }

  const unreadCount = notifications.filter(n => n.estado === 'PENDIENTE').length

  // Role-based menu items
  const getMenuItems = () => {
    const items = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SECRETARIA_TECNICA', 'ASESOR', 'EMPRESA_AFILIADA'] },
      { id: 'foro', label: 'Foro', icon: Hash, roles: ['ADMIN', 'SECRETARIA_TECNICA', 'ASESOR', 'EMPRESA_AFILIADA'] },
      { id: 'consultas', label: 'Consultas', icon: MessageSquare, roles: ['ADMIN', 'SECRETARIA_TECNICA', 'ASESOR', 'EMPRESA_AFILIADA'] },
      { id: 'asesores', label: 'Asesores', icon: Users, roles: ['ADMIN', 'SECRETARIA_TECNICA', 'ASESOR'] },
      { id: 'usuarios', label: 'Usuarios', icon: UserIcon, roles: ['ADMIN'] },
      { id: 'comites', label: 'Comités', icon: Shield, roles: ['ADMIN', 'SECRETARIA_TECNICA'] },
      { id: 'candidatos', label: 'Candidatos', icon: UserPlus, roles: ['ADMIN', 'SECRETARIA_TECNICA'] },
      { id: 'agenda', label: 'Agenda', icon: Calendar, roles: ['ADMIN', 'SECRETARIA_TECNICA', 'ASESOR'] },
      { id: 'videos', label: 'Videos', icon: Video, roles: ['ADMIN', 'SECRETARIA_TECNICA', 'ASESOR', 'EMPRESA_AFILIADA'] },
      { id: 'kb', label: 'Conocimiento', icon: BookOpen, roles: ['ADMIN', 'SECRETARIA_TECNICA', 'ASESOR', 'EMPRESA_AFILIADA'] },
      { id: 'configuracion', label: 'Configuración', icon: Settings, roles: ['ADMIN'] },
    ]
    return items.filter(item => user && item.roles.includes(user.rol))
  }

  if (!isAuthenticated) {
    if (showLoginForm) {
      return (
        <LoginForm
          onLogin={handleLogin}
          onRegister={() => {}}
          onCandidate={() => setShowCandidateForm(true)}
          onConsultation={() => setShowConsultationForm(true)}
        />
      )
    }

    return (
      <>
        <LandingPage
          user={user}
          onLoginClick={() => setShowLoginForm(true)}
          onRegister={() => setShowLoginForm(true)}
          onCandidate={() => {
            document.getElementById('postulacion')?.scrollIntoView({ behavior: 'smooth' })
          }}
          onConsultation={() => {
            document.getElementById('consulta')?.scrollIntoView({ behavior: 'smooth' })
          }}
        />
        <ConsultationFormModal open={showConsultationForm} onClose={() => setShowConsultationForm(false)} />
        <CandidateFormModal open={showCandidateForm} onClose={() => setShowCandidateForm(false)} />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-lg">Mesa Técnica de Criptoactivos</h1>
                <p className="text-xs text-muted-foreground">CAVECOM-e</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowConsultationForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Nueva Consulta
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-2 border-b">
                  <h3 className="font-semibold">Notificaciones</h3>
                </div>
                <ScrollArea className="h-64">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">Sin notificaciones</div>
                  ) : (
                    notifications.slice(0, 5).map(n => (
                      <div key={n.id} className={`p-3 border-b hover:bg-muted/50 ${n.estado === 'PENDIENTE' ? 'bg-muted/30' : ''}`}>
                        <p className="font-medium text-sm">{n.titulo}</p>
                        <p className="text-xs text-muted-foreground truncate">{n.mensaje}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                      {user?.nombre?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">{user?.nombre}</span>
                  <Badge className={`${getRolBadgeColor(user?.rol || 'EMPRESA_AFILIADA')} text-white text-xs hidden md:inline`}>
                    {user?.rol?.replace('_', ' ')}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 240 : 64 }}
          className="sticky top-16 h-[calc(100vh-64px)] border-r bg-background overflow-hidden"
        >
          <nav className="p-2 space-y-1">
            {getMenuItems().map(item => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'secondary' : 'ghost'}
                className={`w-full justify-start gap-3 ${!sidebarOpen && 'px-2'}`}
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Button>
            ))}
          </nav>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 p-6 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <DashboardModule />}
              {activeTab === 'foro' && <ForoModule />}
              {activeTab === 'consultas' && <ConsultasModule />}
              {activeTab === 'asesores' && <AsesoresModule />}
              {activeTab === 'usuarios' && <UsuariosModule />}
              {activeTab === 'comites' && <ComitesModule />}
              {activeTab === 'candidatos' && <CandidatosModule />}
              {activeTab === 'agenda' && <AgendaModule />}
              {activeTab === 'videos' && <VideosModule />}
              {activeTab === 'kb' && <KBModule />}
              {activeTab === 'configuracion' && <ConfiguracionModule />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <ConsultationFormModal open={showConsultationForm} onClose={() => setShowConsultationForm(false)} />
      <CandidateFormModal open={showCandidateForm} onClose={() => setShowCandidateForm(false)} />
      
      <Criptobot />
    </div>
  )
}
