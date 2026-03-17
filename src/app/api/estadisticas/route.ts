import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EstadoConsulta, TipoConsulta } from '@prisma/client';

// GET /api/estadisticas - Dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo'); // 'mes', 'trimestre', 'año'

    // Calculate date range based on periodo
    let startDate: Date | null = null;
    const now = new Date();

    if (periodo === 'mes') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (periodo === 'trimestre') {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
    } else if (periodo === 'año') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    // Build date filter
    const dateFilter = startDate ? { gte: startDate } : undefined;

    // Get total consultations count
    const totalConsultas = await db.consulta.count({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
    });

    // Get consultations by estado
    const consultasPorEstado = await db.consulta.groupBy({
      by: ['estado'],
      where: dateFilter ? { createdAt: dateFilter } : undefined,
      _count: {
        id: true,
      },
    });

    // Get consultations by tipo
    const consultasPorTipo = await db.consulta.groupBy({
      by: ['tipo'],
      where: dateFilter ? { createdAt: dateFilter } : undefined,
      _count: {
        id: true,
      },
    });

    // Get consultations by comite
    const consultasPorComite = await db.consultaComite.groupBy({
      by: ['comiteId'],
      where: dateFilter ? { createdAt: dateFilter } : undefined,
      _count: {
        id: true,
      },
    });

    // Get comite details for the groupBy result
    const comiteIds = consultasPorComite.map((c) => c.comiteId);
    const comites = await db.comite.findMany({
      where: { id: { in: comiteIds } },
      select: { id: true, nombre: true, color: true },
    });

    const consultasPorComiteConNombre = consultasPorComite.map((item) => ({
      comite: comites.find((c) => c.id === item.comiteId),
      count: item._count.id,
    }));

    // Calculate average response time (time between creation and first dictamen)
    const consultasConDictamen = await db.consulta.findMany({
      where: {
        createdAt: dateFilter,
        dictamenes: { some: {} },
      },
      include: {
        dictamenes: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    let totalResponseTime = 0;
    let responseCount = 0;

    consultasConDictamen.forEach((consulta) => {
      if (consulta.dictamenes.length > 0) {
        const createdTime = new Date(consulta.createdAt).getTime();
        const firstDictamenTime = new Date(consulta.dictamenes[0].createdAt).getTime();
        const diffHours = (firstDictamenTime - createdTime) / (1000 * 60 * 60);
        totalResponseTime += diffHours;
        responseCount++;
      }
    });

    const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

    // Calculate SLA compliance
    const consultasCerradas = await db.consulta.findMany({
      where: {
        estado: EstadoConsulta.CERRADA,
        createdAt: dateFilter,
        fechaCierre: { not: null },
        slaFecha: { not: null },
      },
      select: {
        fechaCierre: true,
        slaFecha: true,
      },
    });

    let slaCompliant = 0;
    consultasCerradas.forEach((consulta) => {
      if (consulta.fechaCierre && consulta.slaFecha) {
        const cierre = new Date(consulta.fechaCierre).getTime();
        const sla = new Date(consulta.slaFecha).getTime();
        if (cierre <= sla) {
          slaCompliant++;
        }
      }
    });

    const slaComplianceRate = consultasCerradas.length > 0 
      ? (slaCompliant / consultasCerradas.length) * 100 
      : 0;

    // Get active users count
    const usuariosActivos = await db.user.count({
      where: { activo: true },
    });

    // Get asesores count
    const asesoresActivos = await db.asesor.count({
      where: { activo: true },
    });

    // Get pending consultations (not closed)
    const consultasPendientes = await db.consulta.count({
      where: {
        estado: { not: EstadoConsulta.CERRADA },
      },
    });

    // Get consultations at risk of SLA breach
    const consultasEnRiesgo = await db.consulta.count({
      where: {
        estado: { not: EstadoConsulta.CERRADA },
        slaFecha: { lt: new Date() },
      },
    });

    // Get messages count
    const totalMensajes = await db.mensaje.count({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
    });

    // Get dictamenes count
    const totalDictamenes = await db.dictamen.count({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
    });

    // Get satisfaction surveys average
    const encuestas = await db.encuestaSatisfaccion.findMany({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
      select: { calificacion: true },
    });

    const averageSatisfaction = encuestas.length > 0
      ? encuestas.reduce((sum, e) => sum + e.calificacion, 0) / encuestas.length
      : 0;

    // Get recent activity (last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const actividadSemanal = await db.consulta.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: lastWeek },
      },
      _count: { id: true },
    });

    // Group by day
    const actividadPorDia: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      actividadPorDia[key] = 0;
    }

    actividadSemanal.forEach((item) => {
      const key = new Date(item.createdAt).toISOString().split('T')[0];
      if (actividadPorDia[key] !== undefined) {
        actividadPorDia[key] += item._count.id;
      }
    });

    // Get knowledge base stats
    const articulosKB = await db.articuloKB.count({
      where: { publicado: true },
    });

    const vistasKB = await db.articuloKB.aggregate({
      _sum: { vistas: true },
    });

    // Get training stats
    const capacitaciones = await db.capacitacion.count({
      where: { activo: true },
    });

    const inscripcionesCapacitacion = await db.capacitacion.aggregate({
      _sum: { inscritos: true },
    });

    return NextResponse.json({
      resumen: {
        totalConsultas,
        consultasPendientes,
        consultasEnRiesgo,
        usuariosActivos,
        asesoresActivos,
      },
      porEstado: consultasPorEstado.map((item) => ({
        estado: item.estado,
        count: item._count.id,
      })),
      porTipo: consultasPorTipo.map((item) => ({
        tipo: item.tipo,
        count: item._count.id,
      })),
      porComite: consultasPorComiteConNombre,
      rendimiento: {
        averageResponseTime: Math.round(averageResponseTime),
        slaComplianceRate: Math.round(slaComplianceRate * 10) / 10,
        totalMensajes,
        totalDictamenes,
        averageSatisfaction: Math.round(averageSatisfaction * 10) / 10,
      },
      conocimiento: {
        articulosKB,
        totalVistas: vistasKB._sum.vistas || 0,
        capacitaciones,
        inscripciones: inscripcionesCapacitacion._sum.inscritos || 0,
      },
      actividadSemanal: Object.entries(actividadPorDia)
        .map(([fecha, count]) => ({ fecha, count }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Error al obtener las estadísticas' },
      { status: 500 }
    );
  }
}
