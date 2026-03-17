'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, MessageSquare, Settings, LogOut, Menu, X, Bell,
  Search, Plus, ChevronRight, ChevronDown, FileText, Calendar, BookOpen,
  AlertTriangle, CheckCircle, Clock, User, Building, Shield, Briefcase,
  Upload, Send, Eye, Edit, Trash2, Check, XCircle, Filter, Download,
  ChevronLeft, MoreVertical, UserPlus, ClipboardList, TrendingUp, BarChart3,
  Award, Target, Zap, Globe, Lock, Mail, Phone, MapPin, Briefcase as BriefcaseIcon,
  GraduationCap, FileCheck, AlertCircle, Info, Star, ThumbsUp, ThumbsDown,
  ExternalLink, Copy, RefreshCw, Archive, Play, Video, File, FolderOpen,
  Newspaper, Megaphone, HelpCircle, Layers, Hash
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
import { toast } from 'sonner'
import { format, formatDistanceToNow, addDays, differenceInHours, differenceInBusinessDays, isPast, isToday, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type {
  User, Asesor, Comite, Consulta, Mensaje, Dictamen, Documento,
  CandidatoAsesor, EventoAgenda, ArticuloKB, Notificacion, Configuracion,
  PlantillaDictamen, Estadisticas, EstadoConsulta, TipoConsulta, PrioridadConsulta, RolUsuario
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await fetchApi<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      onLogin(data.user)
      toast.success(`Bienvenido, ${data.user.nombre}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
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
                <Label htmlFor="password" className="text-slate-300">Contraseña</Label>
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
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                disabled={loading}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
            <div className="mt-6 space-y-2">
              <Button
                variant="outline"
                className="w-full border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                onClick={onConsultation}
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar Consulta Técnica
              </Button>
              <Button
                variant="outline"
                className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                onClick={onCandidate}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Postularme como Asesor
              </Button>
            </div>
          </CardContent>
          <CardFooter className="text-center text-sm text-slate-500">
            ¿No tienes cuenta?{' '}
            <button onClick={onRegister} className="text-amber-500 hover:underline ml-1">
              Registrarse
            </button>
          </CardFooter>
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
  const [filterComite, setFilterComite] = useState<string>('')
  const [comites, setComites] = useState<Comite[]>([])
  const { user } = useAuthStore()

  const loadConsultas = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterComite) params.append('comiteId', filterComite)
      const data = await fetchApi<{ data: Consulta[] }>(`/api/consultas?${params.toString()}`)
      setConsultas(data.data || [])
    } catch (error) {
      toast.error('Error al cargar consultas')
    } finally {
      setLoading(false)
    }
  }, [filterComite])

  useEffect(() => {
    loadConsultas()
    fetchApi<{ data: Comite[] }>('/api/comites').then(data => setComites(data.data || []))
  }, [loadConsultas])

  const handleUpdateEstado = async (id: string, nuevoEstado: EstadoConsulta) => {
    try {
      await fetchApi(`/api/consultas/${id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      toast.success('Estado actualizado')
      loadConsultas()
    } catch (error) {
      toast.error('Error al actualizar estado')
    }
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
          <Select value={filterComite} onValueChange={setFilterComite}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por comité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los comités</SelectItem>
              {comites.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(column => (
          <div key={column} className="flex-shrink-0 w-72">
            <div className={`rounded-t-lg p-2 text-white text-sm font-medium ${getEstadoColor(column)}`}>
              <div className="flex items-center justify-between">
                <span>{column.replace('_', ' ')}</span>
                <Badge variant="secondary" className="bg-white/20">
                  {getConsultasByEstado(column).length}
                </Badge>
              </div>
            </div>
            <ScrollArea className="h-[calc(100vh-320px)] rounded-b-lg border border-t-0 bg-muted/30">
              <div className="p-2 space-y-2">
                {getConsultasByEstado(column).map(consulta => {
                  const slaStatus = getSlaStatus(consulta.slaFecha)
                  return (
                    <Card
                      key={consulta.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedConsulta(consulta)}
                    >
                      <CardContent className="p-3">
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
                  )
                })}
                {getConsultasByEstado(column).length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    Sin consultas
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ))}
      </div>

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
                  </div>
                )}
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
            <SelectItem value="">Todos los comités</SelectItem>
            {comites.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAsesores.map(asesor => (
          <Card key={asesor.id} className="overflow-hidden">
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
          <Card key={comite.id} className="overflow-hidden">
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

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      PENDIENTE: 'bg-gray-500',
      EN_REVISION: 'bg-blue-500',
      ENTREVISTA: 'bg-yellow-500',
      EVALUACION: 'bg-purple-500',
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

      {/* Rechazar Dialog */}
      <Dialog open={openRechazar} onOpenChange={setOpenRechazar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Candidato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Motivo del rechazo *</Label>
            <Textarea value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} placeholder="Explique el motivo del rechazo..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpenRechazar(false); setMotivoRechazo('') }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRechazar} disabled={!motivoRechazo}>Rechazar</Button>
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

// ============ KB MODULE ============
function KBModule() {
  const [articulos, setArticulos] = useState<ArticuloKB[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState<string>('')
  const { user } = useAuthStore()

  useEffect(() => {
    const loadArticulos = async () => {
      try {
        const params = new URLSearchParams()
        if (filterCategoria) params.append('categoria', filterCategoria)
        if (searchTerm) params.append('search', searchTerm)
        const data = await fetchApi<{ data: ArticuloKB[] }>(`/api/kb?${params.toString()}`)
        setArticulos(data.data || [])
      } catch (error) {
        toast.error('Error al cargar artículos')
      } finally {
        setLoading(false)
      }
    }
    loadArticulos()
  }, [filterCategoria, searchTerm])

  if (loading) return <div className="flex items-center justify-center h-64">Cargando...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Base de Conocimiento</h2>
          <p className="text-muted-foreground">Documentación y recursos técnicos</p>
        </div>
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
            <SelectItem value="">Todas</SelectItem>
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
          <Card key={articulo.id} className="cursor-pointer hover:shadow-md transition-shadow">
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
              <p className="text-sm text-muted-foreground line-clamp-3">{articulo.contenido}</p>
              <div className="flex items-center justify-between mt-4 pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(articulo.createdAt), 'dd/MM/yyyy')}
                </span>
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs">{articulo.utilPositivo}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {articulos.length === 0 && (
        <div className="text-center text-muted-foreground py-12">No se encontraron artículos</div>
      )}
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
function ConsultationFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [codigoSeguimiento, setCodigoSeguimiento] = useState('')
  const [formData, setFormData] = useState({
    nombreSolicitante: '',
    email: '',
    telefono: '',
    empresa: '',
    rif: '',
    cargo: '',
    titulo: '',
    descripcion: '',
    tipo: 'LEGAL' as TipoConsulta,
    prioridad: 'MEDIA' as PrioridadConsulta,
    slaTipo: 'ESTANDAR' as const,
    comiteIds: [] as string[],
    aceptaTerminos: false,
    aceptaNeutralidad: false,
  })
  const [comites, setComites] = useState<Comite[]>([])

  useEffect(() => {
    if (open) {
      fetchApi<{ data: Comite[] }>('/api/comites').then(data => setComites(data.data || []))
    }
  }, [open])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const data = await fetchApi<{ consulta: Consulta }>('/api/consultas', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      setCodigoSeguimiento(data.consulta.codigo)
      setSuccess(true)
      toast.success('Consulta enviada exitosamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al enviar consulta')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setSuccess(false)
    setCodigoSeguimiento('')
    setFormData({
      nombreSolicitante: '', email: '', telefono: '', empresa: '', rif: '', cargo: '',
      titulo: '', descripcion: '', tipo: 'LEGAL', prioridad: 'MEDIA', slaTipo: 'ESTANDAR',
      comiteIds: [], aceptaTerminos: false, aceptaNeutralidad: false,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={() => success ? resetForm() : onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <DialogTitle className="text-xl mb-2">¡Consulta Enviada!</DialogTitle>
            <DialogDescription className="mb-4">
              Su consulta ha sido recibida exitosamente.
            </DialogDescription>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Código de Seguimiento:</p>
              <p className="text-2xl font-mono font-bold">{codigoSeguimiento}</p>
            </div>
            <Button onClick={resetForm} className="mt-6">Cerrar</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Enviar Consulta Técnica</DialogTitle>
              <DialogDescription>
                Paso {step} de 4 - {step === 1 ? 'Datos del Solicitante' : step === 2 ? 'Detalles de la Consulta' : step === 3 ? 'Comité(s) Destinatarios' : 'Confirmación'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className={`flex-1 h-2 rounded ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Nombre y Apellido *</Label><Input value={formData.nombreSolicitante} onChange={(e) => setFormData({ ...formData, nombreSolicitante: e.target.value })} required /></div>
                  <div><Label>Email *</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
                  <div><Label>Teléfono</Label><Input value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} /></div>
                  <div><Label>RIF</Label><Input value={formData.rif} onChange={(e) => setFormData({ ...formData, rif: e.target.value })} /></div>
                  <div><Label>Empresa/Organización</Label><Input value={formData.empresa} onChange={(e) => setFormData({ ...formData, empresa: e.target.value })} /></div>
                  <div><Label>Cargo</Label><Input value={formData.cargo} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} /></div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div><Label>Título de la Consulta *</Label><Input value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} required /></div>
                <div><Label>Descripción Detallada *</Label><Textarea rows={5} value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Tipo de Consulta</Label>
                    <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v as TipoConsulta })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LEGAL">Legal</SelectItem>
                        <SelectItem value="FISCAL">Fiscal</SelectItem>
                        <SelectItem value="TECNICA">Técnica</SelectItem>
                        <SelectItem value="MIXTA">Mixta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Prioridad</Label>
                    <Select value={formData.prioridad} onValueChange={(v) => setFormData({ ...formData, prioridad: v as PrioridadConsulta })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BAJA">Baja</SelectItem>
                        <SelectItem value="MEDIA">Media</SelectItem>
                        <SelectItem value="ALTA">Alta</SelectItem>
                        <SelectItem value="URGENTE">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>SLA Esperado</Label>
                  <Select value={formData.slaTipo} onValueChange={(v) => setFormData({ ...formData, slaTipo: v as 'ESTANDAR' | 'COMPLEJO' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ESTANDAR">Estándar (72 horas)</SelectItem>
                      <SelectItem value="COMPLEJO">Complejo (5-10 días hábiles)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <Label>Seleccione el(los) comité(s) destinatarios:</Label>
                <div className="space-y-2">
                  {comites.map(comite => (
                    <div key={comite.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                      <Checkbox
                        id={comite.id}
                        checked={formData.comiteIds.includes(comite.id)}
                        onCheckedChange={(checked) => {
                          setFormData({
                            ...formData,
                            comiteIds: checked
                              ? [...formData.comiteIds, comite.id]
                              : formData.comiteIds.filter(id => id !== comite.id),
                          })
                        }}
                      />
                      <div className="flex-1">
                        <Label htmlFor={comite.id} className="font-medium cursor-pointer">{comite.nombre}</Label>
                        {comite.descripcion && <p className="text-xs text-muted-foreground">{comite.descripcion}</p>}
                      </div>
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: comite.color }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold">Resumen de la Consulta</h4>
                  <p><span className="text-muted-foreground">Solicitante:</span> {formData.nombreSolicitante}</p>
                  <p><span className="text-muted-foreground">Email:</span> {formData.email}</p>
                  <p><span className="text-muted-foreground">Empresa:</span> {formData.empresa || '-'}</p>
                  <p><span className="text-muted-foreground">Título:</span> {formData.titulo}</p>
                  <p><span className="text-muted-foreground">Tipo:</span> {formData.tipo}</p>
                  <p><span className="text-muted-foreground">Prioridad:</span> {formData.prioridad}</p>
                  <p><span className="text-muted-foreground">SLA:</span> {formData.slaTipo === 'ESTANDAR' ? '72 horas' : '5-10 días hábiles'}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Checkbox id="neutralidad" checked={formData.aceptaNeutralidad} onCheckedChange={(v) => setFormData({ ...formData, aceptaNeutralidad: !!v })} />
                    <Label htmlFor="neutralidad" className="text-sm leading-tight cursor-pointer">
                      Acepto el Pacto de Neutralidad: La Mesa Técnica actúa de manera objetiva e imparcial, sin promover marcas comerciales específicas.
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Checkbox id="terminos" checked={formData.aceptaTerminos} onCheckedChange={(v) => setFormData({ ...formData, aceptaTerminos: !!v })} />
                    <Label htmlFor="terminos" className="text-sm leading-tight cursor-pointer">
                      Acepto los Términos y Condiciones y la Política de Tratamiento de Datos.
                    </Label>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="mt-6">
              {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Anterior</Button>}
              {step < 4 ? (
                <Button onClick={() => setStep(step + 1)} disabled={step === 3 && formData.comiteIds.length === 0}>Siguiente</Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!formData.aceptaTerminos || !formData.aceptaNeutralidad} loading={loading}>
                  Enviar Consulta
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============ CANDIDATE FORM ============
function CandidateFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '', email: '', telefono: '', ciudad: '', pais: 'Venezuela',
    profesion: '', especialidad: '', experiencia: '', tituloAcademico: '',
    comitePreferidoId: '', disponibilidad: 'TIEMPO_COMPLETO',
    cvUrl: '', cartaMotivacionUrl: '', motivacion: '',
  })
  const [comites, setComites] = useState<Comite[]>([])

  useEffect(() => {
    if (open) {
      fetchApi<{ data: Comite[] }>('/api/comites').then(data => setComites(data.data || []))
    }
  }, [open])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await fetchApi('/api/candidatos', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      setSuccess(true)
      toast.success('Postulación enviada exitosamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al enviar postulación')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setSuccess(false)
    setFormData({
      nombre: '', email: '', telefono: '', ciudad: '', pais: 'Venezuela',
      profesion: '', especialidad: '', experiencia: '', tituloAcademico: '',
      comitePreferidoId: '', disponibilidad: 'TIEMPO_COMPLETO',
      cvUrl: '', cartaMotivacionUrl: '', motivacion: '',
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={() => success ? resetForm() : onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <DialogTitle className="text-xl mb-2">¡Postulación Enviada!</DialogTitle>
            <DialogDescription className="mb-4">
              Su postulación ha sido recibida. El equipo de la Mesa Técnica revisará su perfil y se pondrá en contacto.
            </DialogDescription>
            <Button onClick={resetForm}>Cerrar</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Postularse como Asesor</DialogTitle>
              <DialogDescription>
                Paso {step} de 4 - {step === 1 ? 'Información Personal' : step === 2 ? 'Información Profesional' : step === 3 ? 'Documentos' : 'Motivación'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className={`flex-1 h-2 rounded ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Nombre completo *</Label><Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required /></div>
                  <div><Label>Email *</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
                  <div><Label>Teléfono</Label><Input value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} /></div>
                  <div><Label>Ciudad</Label><Input value={formData.ciudad} onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })} /></div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Profesión *</Label><Input value={formData.profesion} onChange={(e) => setFormData({ ...formData, profesion: e.target.value })} required /></div>
                  <div><Label>Especialidad *</Label><Input value={formData.especialidad} onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })} required /></div>
                  <div><Label>Años de Experiencia</Label><Input value={formData.experiencia} onChange={(e) => setFormData({ ...formData, experiencia: e.target.value })} /></div>
                  <div><Label>Título Académico</Label><Input value={formData.tituloAcademico} onChange={(e) => setFormData({ ...formData, tituloAcademico: e.target.value })} /></div>
                  <div><Label>Comité de Preferencia</Label>
                    <Select value={formData.comitePreferidoId} onValueChange={(v) => setFormData({ ...formData, comitePreferidoId: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {comites.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Disponibilidad</Label>
                    <Select value={formData.disponibilidad} onValueChange={(v) => setFormData({ ...formData, disponibilidad: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TIEMPO_COMPLETO">Tiempo Completo</SelectItem>
                        <SelectItem value="MEDIO_TIEMPO">Medio Tiempo</SelectItem>
                        <SelectItem value="POR_HORAS">Por Horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div><Label>URL del CV</Label><Input type="url" placeholder="https://..." value={formData.cvUrl} onChange={(e) => setFormData({ ...formData, cvUrl: e.target.value })} /></div>
                <div><Label>URL de Carta de Motivación</Label><Input type="url" placeholder="https://..." value={formData.cartaMotivacionUrl} onChange={(e) => setFormData({ ...formData, cartaMotivacionUrl: e.target.value })} /></div>
                <p className="text-xs text-muted-foreground">Suba sus documentos a un servicio de almacenamiento en la nube y proporcione los enlaces.</p>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div><Label>Carta de Motivación *</Label><Textarea rows={6} placeholder="Explique por qué desea formar parte de la Mesa Técnica..." value={formData.motivacion} onChange={(e) => setFormData({ ...formData, motivacion: e.target.value })} required /></div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Resumen de su Postulación</h4>
                  <p><span className="text-muted-foreground">Nombre:</span> {formData.nombre}</p>
                  <p><span className="text-muted-foreground">Email:</span> {formData.email}</p>
                  <p><span className="text-muted-foreground">Profesión:</span> {formData.profesion}</p>
                  <p><span className="text-muted-foreground">Especialidad:</span> {formData.especialidad}</p>
                </div>
              </div>
            )}

            <DialogFooter className="mt-6">
              {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Anterior</Button>}
              {step < 4 ? (
                <Button onClick={() => setStep(step + 1)}>Siguiente</Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!formData.motivacion} loading={loading}>Enviar Postulación</Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============ MAIN APP ============
export function MesaTecnicaApp() {
  const { user, isAuthenticated, login, logout, checkAuth } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showConsultationForm, setShowConsultationForm] = useState(false)
  const [showCandidateForm, setShowCandidateForm] = useState(false)
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

  const handleLogin = async (loggedUser: User) => {
    login(loggedUser)
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
      { id: 'consultas', label: 'Consultas', icon: MessageSquare, roles: ['ADMIN', 'SECRETARIA_TECNICA', 'ASESOR', 'EMPRESA_AFILIADA'] },
      { id: 'asesores', label: 'Asesores', icon: Users, roles: ['ADMIN', 'SECRETARIA_TECNICA', 'ASESOR'] },
      { id: 'usuarios', label: 'Usuarios', icon: User, roles: ['ADMIN'] },
      { id: 'comites', label: 'Comités', icon: Shield, roles: ['ADMIN', 'SECRETARIA_TECNICA'] },
      { id: 'candidatos', label: 'Candidatos', icon: UserPlus, roles: ['ADMIN', 'SECRETARIA_TECNICA'] },
      { id: 'agenda', label: 'Agenda', icon: Calendar, roles: ['ADMIN', 'SECRETARIA_TECNICA', 'ASESOR'] },
      { id: 'kb', label: 'Conocimiento', icon: BookOpen, roles: ['ADMIN', 'SECRETARIA_TECNICA', 'ASESOR', 'EMPRESA_AFILIADA'] },
      { id: 'configuracion', label: 'Configuración', icon: Settings, roles: ['ADMIN'] },
    ]
    return items.filter(item => user && item.roles.includes(user.rol))
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginForm
          onLogin={handleLogin}
          onRegister={() => {}}
          onCandidate={() => setShowCandidateForm(true)}
          onConsultation={() => setShowConsultationForm(true)}
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
              {activeTab === 'consultas' && <ConsultasModule />}
              {activeTab === 'asesores' && <AsesoresModule />}
              {activeTab === 'usuarios' && <UsuariosModule />}
              {activeTab === 'comites' && <ComitesModule />}
              {activeTab === 'candidatos' && <CandidatosModule />}
              {activeTab === 'agenda' && <AgendaModule />}
              {activeTab === 'kb' && <KBModule />}
              {activeTab === 'configuracion' && <ConfiguracionModule />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <ConsultationFormModal open={showConsultationForm} onClose={() => setShowConsultationForm(false)} />
      <CandidateFormModal open={showCandidateForm} onClose={() => setShowCandidateForm(false)} />
    </div>
  )
}
