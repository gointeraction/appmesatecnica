import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EstadoConsulta, TipoConsulta, PrioridadConsulta, SlaTipo } from '@prisma/client';

interface ExportConfig {
  entidad: string;
  formato: 'json' | 'csv';
  filtros?: Record<string, any>;
  campos?: string[];
}

// POST /api/exportar - Export data to CSV/JSON
export async function POST(request: NextRequest) {
  try {
    const body: ExportConfig = await request.json();
    const { entidad, formato, filtros, campos } = body;

    if (!entidad || !formato) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: entidad, formato' },
        { status: 400 }
      );
    }

    // Validate formato
    if (!['json', 'csv'].includes(formato)) {
      return NextResponse.json(
        { error: 'Formato no válido. Use: json o csv' },
        { status: 400 }
      );
    }

    let data: any[] = [];
    let headers: string[] = [];

    // Fetch data based on entity type
    switch (entidad) {
      case 'consultas':
        data = await exportConsultas(filtros);
        headers = getConsultasHeaders();
        break;

      case 'usuarios':
        data = await exportUsuarios(filtros);
        headers = getUsuariosHeaders();
        break;

      case 'asesores':
        data = await exportAsesores(filtros);
        headers = getAsesoresHeaders();
        break;

      case 'comites':
        data = await exportComites(filtros);
        headers = getComitesHeaders();
        break;

      case 'mensajes':
        data = await exportMensajes(filtros);
        headers = getMensajesHeaders();
        break;

      case 'dictamenes':
        data = await exportDictamenes(filtros);
        headers = getDictamenesHeaders();
        break;

      case 'encuestas':
        data = await exportEncuestas(filtros);
        headers = getEncuestasHeaders();
        break;

      case 'eventos':
        data = await exportEventos(filtros);
        headers = getEventosHeaders();
        break;

      case 'articulos_kb':
        data = await exportArticulosKB(filtros);
        headers = getArticulosKBHeaders();
        break;

      case 'normativas':
        data = await exportNormativas(filtros);
        headers = getNormativasHeaders();
        break;

      case 'comunicados':
        data = await exportComunicados(filtros);
        headers = getComunicadosHeaders();
        break;

      case 'capacitaciones':
        data = await exportCapacitaciones(filtros);
        headers = getCapacitacionesHeaders();
        break;

      default:
        return NextResponse.json(
          { error: `Entidad no válida: ${entidad}` },
          { status: 400 }
        );
    }

    // Filter fields if specified
    if (campos && campos.length > 0) {
      data = data.map((item) => {
        const filtered: Record<string, any> = {};
        campos.forEach((campo) => {
          if (item[campo] !== undefined) {
            filtered[campo] = item[campo];
          }
        });
        return filtered;
      });
      headers = headers.filter((h) => campos.includes(h));
    }

    // Generate response based on format
    if (formato === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${entidad}_export_${Date.now()}.json"`,
        },
      });
    } else {
      // CSV format
      const csv = generateCSV(data, headers);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${entidad}_export_${Date.now()}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Error al exportar los datos' },
      { status: 500 }
    );
  }
}

// Helper function to generate CSV
function generateCSV(data: any[], headers: string[]): string {
  if (data.length === 0) {
    return headers.join(',') + '\n';
  }

  const csvRows = [headers.join(',')];

  data.forEach((item) => {
    const values = headers.map((header) => {
      const value = item[header];
      if (value === null || value === undefined) {
        return '';
      }
      // Escape quotes and wrap in quotes if contains comma or newline
      const str = String(value).replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str}"`;
      }
      return str;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}

// Export functions for each entity
async function exportConsultas(filtros?: Record<string, any>): Promise<any[]> {
  const where: any = {};
  if (filtros?.estado) where.estado = filtros.estado;
  if (filtros?.tipo) where.tipo = filtros.tipo;
  if (filtros?.empresaId) where.empresaId = filtros.empresaId;
  if (filtros?.fechaDesde) where.createdAt = { ...where.createdAt, gte: new Date(filtros.fechaDesde) };
  if (filtros?.fechaHasta) where.createdAt = { ...where.createdAt, lte: new Date(filtros.fechaHasta) };

  const consultas = await db.consulta.findMany({
    where,
    include: {
      empresa: { select: { nombre: true, apellido: true, empresa: true, email: true } },
      asesorPrincipal: { include: { user: { select: { nombre: true, apellido: true } } } },
      comites: { include: { comite: { select: { nombre: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return consultas.map((c) => ({
    id: c.id,
    codigo: c.codigo,
    titulo: c.titulo,
    descripcion: c.descripcion?.replace(/\n/g, ' ').substring(0, 200),
    tipo: c.tipo,
    prioridad: c.prioridad,
    estado: c.estado,
    slaTipo: c.slaTipo,
    slaFecha: c.slaFecha?.toISOString(),
    fechaCierre: c.fechaCierre?.toISOString(),
    empresa: c.empresa.empresa || `${c.empresa.nombre} ${c.empresa.apellido || ''}`.trim(),
    empresaEmail: c.empresa.email,
    asesorPrincipal: c.asesorPrincipal ? `${c.asesorPrincipal.user.nombre} ${c.asesorPrincipal.user.apellido || ''}`.trim() : null,
    comites: c.comites.map((cc) => cc.comite.nombre).join('; '),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
}

function getConsultasHeaders(): string[] {
  return ['id', 'codigo', 'titulo', 'descripcion', 'tipo', 'prioridad', 'estado', 'slaTipo', 'slaFecha', 'fechaCierre', 'empresa', 'empresaEmail', 'asesorPrincipal', 'comites', 'createdAt', 'updatedAt'];
}

async function exportUsuarios(filtros?: Record<string, any>): Promise<any[]> {
  const where: any = {};
  if (filtros?.rol) where.rol = filtros.rol;
  if (filtros?.activo !== undefined) where.activo = filtros.activo;

  const usuarios = await db.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return usuarios.map((u) => ({
    id: u.id,
    email: u.email,
    nombre: u.nombre,
    apellido: u.apellido,
    telefono: u.telefono,
    cargo: u.cargo,
    empresa: u.empresa,
    rol: u.rol,
    activo: u.activo,
    ultimoAcceso: u.ultimoAcceso?.toISOString(),
    createdAt: u.createdAt.toISOString(),
  }));
}

function getUsuariosHeaders(): string[] {
  return ['id', 'email', 'nombre', 'apellido', 'telefono', 'cargo', 'empresa', 'rol', 'activo', 'ultimoAcceso', 'createdAt'];
}

async function exportAsesores(filtros?: Record<string, any>): Promise<any[]> {
  const where: any = {};
  if (filtros?.activo !== undefined) where.activo = filtros.activo;
  if (filtros?.comiteId) where.comiteId = filtros.comiteId;

  const asesores = await db.asesor.findMany({
    where,
    include: {
      user: { select: { nombre: true, apellido: true, email: true } },
      comite: { select: { nombre: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return asesores.map((a) => ({
    id: a.id,
    nombre: `${a.user.nombre} ${a.user.apellido || ''}`.trim(),
    email: a.user.email,
    profesion: a.profesion,
    especialidad: a.especialidad,
    biografia: a.biografia?.replace(/\n/g, ' ').substring(0, 200),
    comite: a.comite?.nombre,
    activo: a.activo,
    fechaIncorporacion: a.fechaIncorporacion.toISOString(),
    createdAt: a.createdAt.toISOString(),
  }));
}

function getAsesoresHeaders(): string[] {
  return ['id', 'nombre', 'email', 'profesion', 'especialidad', 'biografia', 'comite', 'activo', 'fechaIncorporacion', 'createdAt'];
}

async function exportComites(filtros?: Record<string, any>): Promise<any[]> {
  const where: any = {};
  if (filtros?.activo !== undefined) where.activo = filtros.activo;

  const comites = await db.comite.findMany({
    where,
    include: {
      lider: { include: { user: { select: { nombre: true, apellido: true } } } },
      _count: { select: { asesores: true, consultas: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return comites.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    color: c.color,
    activo: c.activo,
    lider: c.lider ? `${c.lider.user.nombre} ${c.lider.user.apellido || ''}`.trim() : null,
    totalAsesores: c._count.asesores,
    totalConsultas: c._count.consultas,
    createdAt: c.createdAt.toISOString(),
  }));
}

function getComitesHeaders(): string[] {
  return ['id', 'nombre', 'descripcion', 'color', 'activo', 'lider', 'totalAsesores', 'totalConsultas', 'createdAt'];
}

async function exportMensajes(filtros?: Record<string, any>): Promise<any[]> {
  const where: any = {};
  if (filtros?.consultaId) where.consultaId = filtros.consultaId;
  if (filtros?.userId) where.userId = filtros.userId;

  const mensajes = await db.mensaje.findMany({
    where,
    include: {
      user: { select: { nombre: true, apellido: true, email: true } },
      consulta: { select: { codigo: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: filtros?.limit || 1000,
  });

  return mensajes.map((m) => ({
    id: m.id,
    consultaCodigo: m.consulta.codigo,
    usuario: `${m.user.nombre} ${m.user.apellido || ''}`.trim(),
    usuarioEmail: m.user.email,
    contenido: m.contenido?.replace(/\n/g, ' ').substring(0, 500),
    esPrivado: m.esPrivado,
    esRespuestaOficial: m.esRespuestaOficial,
    createdAt: m.createdAt.toISOString(),
  }));
}

function getMensajesHeaders(): string[] {
  return ['id', 'consultaCodigo', 'usuario', 'usuarioEmail', 'contenido', 'esPrivado', 'esRespuestaOficial', 'createdAt'];
}

async function exportDictamenes(filtros?: Record<string, any>): Promise<any[]> {
  const where: any = {};
  if (filtros?.consultaId) where.consultaId = filtros.consultaId;
  if (filtros?.asesorId) where.asesorId = filtros.asesorId;

  const dictamenes = await db.dictamen.findMany({
    where,
    include: {
      asesor: { include: { user: { select: { nombre: true, apellido: true } } } },
      consulta: { select: { codigo: true, titulo: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return dictamenes.map((d) => ({
    id: d.id,
    consultaCodigo: d.consulta.codigo,
    consultaTitulo: d.consulta.titulo,
    titulo: d.titulo,
    asesor: `${d.asesor.user.nombre} ${d.asesor.user.apellido || ''}`.trim(),
    contenido: d.contenido?.replace(/\n/g, ' ').substring(0, 500),
    conclusion: d.conclusion?.replace(/\n/g, ' ').substring(0, 200),
    version: d.version,
    esFinal: d.esFinal,
    createdAt: d.createdAt.toISOString(),
  }));
}

function getDictamenesHeaders(): string[] {
  return ['id', 'consultaCodigo', 'consultaTitulo', 'titulo', 'asesor', 'contenido', 'conclusion', 'version', 'esFinal', 'createdAt'];
}

async function exportEncuestas(filtros?: Record<string, any>): Promise<any[]> {
  const where: any = {};
  if (filtros?.consultaId) where.consultaId = filtros.consultaId;

  const encuestas = await db.encuestaSatisfaccion.findMany({
    where,
    include: {
      user: { select: { nombre: true, apellido: true, empresa: true } },
      consulta: { select: { codigo: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return encuestas.map((e) => ({
    id: e.id,
    consultaCodigo: e.consulta.codigo,
    usuario: `${e.user.nombre} ${e.user.apellido || ''}`.trim(),
    empresa: e.user.empresa,
    calificacion: e.calificacion,
    tiempoRespuesta: e.tiempoRespuesta,
    calidadRespuesta: e.calidadRespuesta,
    comunicacion: e.comunicacion,
    recomendaria: e.recomendaria,
    comentarios: e.comentarios,
    createdAt: e.createdAt.toISOString(),
  }));
}

function getEncuestasHeaders(): string[] {
  return ['id', 'consultaCodigo', 'usuario', 'empresa', 'calificacion', 'tiempoRespuesta', 'calidadRespuesta', 'comunicacion', 'recomendaria', 'comentarios', 'createdAt'];
}

async function exportEventos(filtros?: Record<string, any>): Promise<any[]> {
  const where: any = {};
  if (filtros?.tipo) where.tipo = filtros.tipo;
  if (filtros?.fechaDesde) where.fechaInicio = { ...where.fechaInicio, gte: new Date(filtros.fechaDesde) };
  if (filtros?.fechaHasta) where.fechaInicio = { ...where.fechaInicio, lte: new Date(filtros.fechaHasta) };

  const eventos = await db.eventoAgenda.findMany({
    where,
    include: {
      creadoPor: { select: { nombre: true, apellido: true } },
      _count: { select: { participantes: true } },
    },
    orderBy: { fechaInicio: 'desc' },
  });

  return eventos.map((e) => ({
    id: e.id,
    titulo: e.titulo,
    descripcion: e.descripcion,
    tipo: e.tipo,
    fechaInicio: e.fechaInicio.toISOString(),
    fechaFin: e.fechaFin?.toISOString(),
    ubicacion: e.ubicacion,
    esVirtual: e.esVirtual,
    creadoPor: `${e.creadoPor.nombre} ${e.creadoPor.apellido || ''}`.trim(),
    totalParticipantes: e._count.participantes,
    createdAt: e.createdAt.toISOString(),
  }));
}

function getEventosHeaders(): string[] {
  return ['id', 'titulo', 'descripcion', 'tipo', 'fechaInicio', 'fechaFin', 'ubicacion', 'esVirtual', 'creadoPor', 'totalParticipantes', 'createdAt'];
}

async function exportArticulosKB(filtros?: Record<string, any>): Promise<any[]> {
  const where: any = {};
  if (filtros?.categoria) where.categoria = filtros.categoria;
  if (filtros?.publicado !== undefined) where.publicado = filtros.publicado;

  const articulos = await db.articuloKB.findMany({
    where,
    include: {
      autor: { select: { nombre: true, apellido: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return articulos.map((a) => ({
    id: a.id,
    titulo: a.titulo,
    resumen: a.resumen,
    categoria: a.categoria,
    esDestacado: a.esDestacado,
    publicado: a.publicado,
    vistas: a.vistas,
    autor: `${a.autor.nombre} ${a.autor.apellido || ''}`.trim(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));
}

function getArticulosKBHeaders(): string[] {
  return ['id', 'titulo', 'resumen', 'categoria', 'esDestacado', 'publicado', 'vistas', 'autor', 'createdAt', 'updatedAt'];
}

async function exportNormativas(filtros?: Record<string, any>): Promise<any[]> {
  const where: any = {};
  if (filtros?.tipo) where.tipo = filtros.tipo;
  if (filtros?.activo !== undefined) where.activo = filtros.activo;

  const normativas = await db.normativa.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return normativas.map((n) => ({
    id: n.id,
    titulo: n.titulo,
    descripcion: n.descripcion?.replace(/\n/g, ' ').substring(0, 200),
    tipo: n.tipo,
    numero: n.numero,
    fechaPublicacion: n.fechaPublicacion?.toISOString(),
    fechaVigencia: n.fechaVigencia?.toISOString(),
    organismo: n.organismo,
    activo: n.activo,
    createdAt: n.createdAt.toISOString(),
  }));
}

function getNormativasHeaders(): string[] {
  return ['id', 'titulo', 'descripcion', 'tipo', 'numero', 'fechaPublicacion', 'fechaVigencia', 'organismo', 'activo', 'createdAt'];
}

async function exportComunicados(filtros?: Record<string, any>): Promise<any[]> {
  const where: any = {};
  if (filtros?.publicado !== undefined) where.publicado = filtros.publicado;

  const comunicados = await db.comunicado.findMany({
    where,
    include: {
      autor: { select: { nombre: true, apellido: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return comunicados.map((c) => ({
    id: c.id,
    titulo: c.titulo,
    resumen: c.resumen,
    esUrgente: c.esUrgente,
    publicado: c.publicado,
    fechaPublicacion: c.fechaPublicacion?.toISOString(),
    autor: `${c.autor.nombre} ${c.autor.apellido || ''}`.trim(),
    createdAt: c.createdAt.toISOString(),
  }));
}

function getComunicadosHeaders(): string[] {
  return ['id', 'titulo', 'resumen', 'esUrgente', 'publicado', 'fechaPublicacion', 'autor', 'createdAt'];
}

async function exportCapacitaciones(filtros?: Record<string, any>): Promise<any[]> {
  const where: any = {};
  if (filtros?.categoria) where.categoria = filtros.categoria;
  if (filtros?.activo !== undefined) where.activo = filtros.activo;

  const capacitaciones = await db.capacitacion.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return capacitaciones.map((c) => ({
    id: c.id,
    titulo: c.titulo,
    descripcion: c.descripcion,
    categoria: c.categoria,
    nivel: c.nivel,
    duracion: c.duracion,
    instructor: c.instructor,
    activo: c.activo,
    inscritos: c.inscritos,
    completados: c.completados,
    fechaProgramada: c.fechaProgramada?.toISOString(),
    createdAt: c.createdAt.toISOString(),
  }));
}

function getCapacitacionesHeaders(): string[] {
  return ['id', 'titulo', 'descripcion', 'categoria', 'nivel', 'duracion', 'instructor', 'activo', 'inscritos', 'completados', 'fechaProgramada', 'createdAt'];
}
