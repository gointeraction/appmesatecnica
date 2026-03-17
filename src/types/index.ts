// Types for Mesa Técnica de Criptoactivos

export type RolUsuario = 'ADMIN' | 'SECRETARIA_TECNICA' | 'ASESOR' | 'EMPRESA_AFILIADA'

export type TipoConsulta = 'LEGAL' | 'FISCAL' | 'TECNICA' | 'MIXTA'

export type PrioridadConsulta = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE'

export type EstadoConsulta = 'RECIBIDA' | 'CLASIFICADA' | 'ASIGNADA' | 'EN_PROCESO' | 'DICTAMEN' | 'CERRADA'

export type SlaTipo = 'ESTANDAR' | 'COMPLEJO'

export type EstadoCandidato = 'PENDIENTE' | 'EN_REVISION' | 'ENTREVISTA' | 'EVALUACION' | 'APROBADO' | 'RECHAZADO' | 'INCORPORADO'

export type TipoEvento = 'VENCIMIENTO_SLA' | 'REUNION' | 'RECORDATORIO' | 'ENTREGA' | 'OTRO'

export type EstadoNotificacion = 'PENDIENTE' | 'LEIDA' | 'ARCHIVADA'

export type TipoPlantilla = 'LEGAL' | 'FISCAL' | 'TECNICA' | 'MIXTA'

export type CategoriaKB = 'FAQ' | 'NORMATIVA' | 'GUIA' | 'TUTORIAL' | 'GLOSARIO'

export interface User {
  id: string
  email: string
  nombre: string
  rol: RolUsuario
  activo: boolean
  telefono?: string
  empresa?: string
  cargo?: string
  createdAt: string
  updatedAt: string
}

export interface Asesor {
  id: string
  userId: string
  user?: User
  profesion: string
  especialidad: string
  biografia?: string
  comiteId?: string
  comite?: Comite
  activo: boolean
  consultasAtendidas?: number
  calificacionPromedio?: number
  createdAt: string
  updatedAt: string
}

export interface Comite {
  id: string
  nombre: string
  descripcion?: string
  color: string
  icono?: string
  activo: boolean
  liderId?: string
  lider?: Asesor
  asesores?: Asesor[]
  createdAt: string
  updatedAt: string
}

export interface Consulta {
  id: string
  codigo: string
  titulo: string
  descripcion: string
  tipo: TipoConsulta
  prioridad: PrioridadConsulta
  estado: EstadoConsulta
  slaTipo: SlaTipo
  slaFecha: string
  empresaId?: string
  empresa?: User
  asesorPrincipalId?: string
  asesorPrincipal?: Asesor
  comites?: ConsultaComite[]
  asesoresApoyo?: ConsultaAsesorApoyo[]
  mensajes?: Mensaje[]
  dictamenes?: Dictamen[]
  documentos?: Documento[]
  createdAt: string
  updatedAt: string
}

export interface ConsultaComite {
  id: string
  consultaId: string
  comiteId: string
  comite?: Comite
  estado: string
  asignadoEn: string
  asignadoPor?: string
}

export interface ConsultaAsesorApoyo {
  id: string
  consultaId: string
  asesorId: string
  asesor?: Asesor
  asignadoEn: string
}

export interface Mensaje {
  id: string
  consultaId: string
  userId: string
  user?: User
  contenido: string
  esPrivado: boolean
  esRespuestaOficial: boolean
  createdAt: string
  updatedAt: string
}

export interface Dictamen {
  id: string
  consultaId: string
  asesorId: string
  asesor?: Asesor
  titulo: string
  contenido: string
  version: number
  esFinal: boolean
  createdAt: string
  updatedAt: string
}

export interface Documento {
  id: string
  consultaId: string
  nombre: string
  tipo: string
  url: string
  descripcion?: string
  esPublico: boolean
  subidoPor?: string
  createdAt: string
}

export interface CandidatoAsesor {
  id: string
  nombre: string
  email: string
  telefono?: string
  profesion: string
  especialidad: string
  experiencia: string
  biografia?: string
  comitePreferidoId?: string
  disponibilidad?: string
  motivacion?: string
  cvUrl?: string
  cartaMotivacionUrl?: string
  estado: EstadoCandidato
  motivoRechazo?: string
  evaluadorId?: string
  puntuacion?: number
  comentarios?: string
  createdAt: string
  updatedAt: string
}

export interface EventoAgenda {
  id: string
  titulo: string
  descripcion?: string
  fecha: string
  horaInicio?: string
  horaFin?: string
  tipo: TipoEvento
  consultaId?: string
  consulta?: Consulta
  creadorId: string
  participantes?: EventoParticipante[]
  esVirtual: boolean
  enlaceVirtual?: string
  ubicacion?: string
  createdAt: string
}

export interface EventoParticipante {
  id: string
  eventoId: string
  userId: string
  user?: User
  estado: string
}

export interface ArticuloKB {
  id: string
  titulo: string
  contenido: string
  categoria: CategoriaKB
  tags?: string
  autorId: string
  autor?: User
  vistas: number
  utilPositivo: number
  utilNegativo: number
  publicado: boolean
  createdAt: string
  updatedAt: string
}

export interface Notificacion {
  id: string
  userId: string
  tipo: string
  titulo: string
  mensaje: string
  referenciaId?: string
  referenciaTipo?: string
  estado: EstadoNotificacion
  createdAt: string
}

export interface Configuracion {
  id: string
  clave: string
  valor: string
  descripcion?: string
  tipo: string
  updatedAt: string
}

export interface PlantillaDictamen {
  id: string
  nombre: string
  tipo: TipoPlantilla
  contenido: string
  variables?: string
  activo: boolean
  creadoPorId?: string
  createdAt: string
  updatedAt: string
}

export interface EncuestaSatisfaccion {
  id: string
  consultaId: string
  consulta?: Consulta
  userId: string
  user?: User
  calificacionGeneral: number
  calificacionTiempoRespuesta: number
  calificacionCalidadTecnica: number
  calificacionComunicacion: number
  comentarios?: string
  recomendacion: boolean
  createdAt: string
}

export interface Capacitacion {
  id: string
  titulo: string
  descripcion: string
  categoria: string
  nivel: string
  fechaProgramada?: string
  duracion?: number
  instructor?: string
  enlace?: string
  cupoMaximo?: number
  inscritos?: number
  activo: boolean
  creadoPorId: string
  createdAt: string
}

export interface Normativa {
  id: string
  titulo: string
  descripcion?: string
  tipo: string
  numero?: string
  fechaPublicacion?: string
  fechaVigencia?: string
  entidadEmisora?: string
  enlace?: string
  archivoUrl?: string
  tags?: string
  activo: boolean
  creadoPorId: string
  createdAt: string
}

export interface Comunicado {
  id: string
  titulo: string
  contenido: string
  tipo: string
  urgencia: string
  publicado: boolean
  fechaPublicacion?: string
  autorId: string
  autor?: User
  createdAt: string
}

export interface Estadisticas {
  totalConsultas: number
  consultasPorEstado: Record<EstadoConsulta, number>
  consultasPorTipo: Record<TipoConsulta, number>
  consultasPorComite: Array<{ comite: string; cantidad: number }>
  tiempoPromedioRespuesta: number
  slaCumplidos: number
  slaVencidos: number
  usuariosActivos: number
  asesoresActivos: number
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
  meta?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
