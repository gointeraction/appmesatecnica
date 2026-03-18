import { NextResponse } from "next/server"
import { db as prisma } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { message } = await req.json()
    const msg = message.toLowerCase()
    
    console.log("CRIPTOBOT_DEBUG_KEYS:", Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')));

    let response = ""

    // 1. Intent: Status of consultations
    if (msg.includes("estado") && (msg.includes("consulta") || msg.includes("cons-"))) {
      const codigoMatch = message.match(/cons-\d{4}-\d{4}/i)
      if (codigoMatch) {
        const codigo = codigoMatch[0].toUpperCase()
        const consulta = await prisma.consulta.findUnique({
          where: { codigo },
          include: { comites: { include: { comite: true } } }
        })

        if (consulta) {
          response = `La consulta **${consulta.codigo}: ${consulta.titulo}** se encuentra en estado **${consulta.estado}**. `
          if (consulta.comites.length > 0) {
            response += `Está asignada a los comités: ${consulta.comites.map(c => c.comite.nombre).join(", ")}.`
          }
        } else {
          response = `No pude encontrar la consulta con código **${codigo}**. Por favor verifica que sea correcto.`
        }
      } else {
        const totalConsultas = await prisma.consulta.count()
        const pendientes = await prisma.consulta.count({ where: { estado: { not: "CERRADA" } } })
        response = `Actualmente hay **${pendientes}** consultas activas de un total de **${totalConsultas}**. ¿Buscas alguna en específico?`
      }
    } 
    // 2. Intent: Committee info
    else if (msg.includes("comité") || msg.includes("comite")) {
      const comites = await prisma.comite.findMany({
        where: { activo: true },
        include: { _count: { select: { asesores: true, consultas: true } } }
      })

      response = "Estos son los comités activos actualmente:\n\n"
      comites.forEach(c => {
        response += `- **${c.nombre}**: ${c._count.asesores} asesores y ${c._count.consultas} consultas asignadas.\n`
      })
      response += "\n¿Necesitas más detalles sobre alguno?"
    }
    // 3. Intent: Governance (Meetings/Agreements)
    else if (msg.includes("reunión") || msg.includes("reunion") || msg.includes("acuerdo")) {
      const client = prisma as any;
      const model = client.reunionComite || client.ReunionComite;
      
      if (!model) {
        // Fallback to raw query if model is missing in client
        try {
          const rawReuniones: any = await prisma.$queryRaw`
            SELECT r.*, c.nombre as comiteNombre, 
            (SELECT COUNT(*) FROM AcuerdoComite WHERE reunionId = r.id) as acuerdosCount
            FROM ReunionComite r
            LEFT JOIN Comite c ON r.comiteId = c.id
            ORDER BY r.fecha DESC LIMIT 5
          `
          if (rawReuniones.length > 0) {
            response = "Estas son las reuniones más recientes de los comités:\n\n"
            rawReuniones.forEach((r: any) => {
              const count = typeof r.acuerdosCount === 'bigint' ? Number(r.acuerdosCount) : r.acuerdosCount;
              response += `- **${r.titulo}** (${r.comiteNombre}): ${count} acuerdos registrados.\n`
            })
            response += "\n¿Te gustaría saber los acuerdos de alguna reunión específica?"
          } else {
            response = "No hay reuniones registradas recientemente."
          }
        } catch (e: any) {
          response = `Error de configuración: El modelo de Gobernanza no está accesible (${e.message}).`
        }
      } else {
        const reuniones = await model.findMany({
          take: 5,
          orderBy: { fecha: 'desc' },
          include: { comite: true, _count: { select: { acuerdos: true } } }
        })

        if (reuniones.length > 0) {
          response = "Estas son las reuniones más recientes de los comités:\n\n"
          reuniones.forEach((r: any) => {
            response += `- **${r.titulo}** (${r.comite?.nombre}): ${r._count.acuerdos} acuerdos registrados.\n`
          })
          response += "\n¿Te gustaría saber los acuerdos de alguna reunión específica?"
        } else {
          response = "No hay reuniones registradas recientemente. ¿Deseas que te ayude a programar una?"
        }
      }
    }
    // 4. Intent: Forum
    else if (msg.includes("foro") || msg.includes("tema") || msg.includes("discusión")) {
      const client = prisma as any;
      const model = client.foroTema || client.ForoTema;

      if (!model) {
        // Fallback to raw query
        try {
          const rawTemas: any = await prisma.$queryRaw`
            SELECT t.*, u.nombre as autorNombre,
            (SELECT COUNT(*) FROM ForoPost WHERE temaId = t.id) as postsCount
            FROM ForoTema t
            LEFT JOIN User u ON t.autorId = u.id
            ORDER BY t.createdAt DESC LIMIT 5
          `
          if (rawTemas.length > 0) {
            response = "Esto es lo más reciente en el **Foro Comunitario**:\n\n"
            rawTemas.forEach((t: any) => {
              const count = typeof t.postsCount === 'bigint' ? Number(t.postsCount) : t.postsCount;
              response += `- **${t.titulo}** (${t.categoria}): por ${t.autorNombre} (${count} respuestas).\n`
            })
            response += "\n¿Te interesa participar en alguna de estas conversaciones?"
          } else {
            response = "El foro está tranquilo hoy."
          }
        } catch (e: any) {
          response = `Error de configuración: El módulo de Foro no está accesible (${e.message}).`
        }
      } else {
        const temas = await model.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { autor: { select: { nombre: true } }, _count: { select: { posts: true } } }
        })

        if (temas.length > 0) {
          response = "Esto es lo más reciente en el **Foro Comunitario**:\n\n"
          temas.forEach((t: any) => {
            response += `- **${t.titulo}** (${t.categoria}): por ${t.autor.nombre} (${t._count.posts} respuestas).\n`
          })
          response += "\n¿Te interesa participar en alguna de estas conversaciones?"
        } else {
          response = "El foro está tranquilo hoy. ¡Podrías ser el primero en iniciar un tema!"
        }
      }
    }
    // 5. Intent: Help / Navigation
    else if (msg.includes("ayuda") || msg.includes("qué puedes hacer") || msg.includes("que puedes hacer")) {
      response = "¡Hola! Soy **Criptobot**. Puedo ayudarte con lo siguiente:\n\n" +
        "1. **Consultas**: Pregúntame por el estado usando su código (ej: 'estado de CONS-2026-0001').\n" +
        "2. **Comités**: Consulta la carga de trabajo y miembros de los comités técnicos.\n" +
        "3. **Gobernanza**: Entérate de las últimas reuniones y acuerdos institucionales.\n" +
        "4. **Foro**: Descubre los temas de discusión más recientes impulsados por la comunidad."
    }
    // 6. Default / General AI fallback
    else {
      response = "Entiendo perfectamente. Por ahora, mi conocimiento se especializa en la **gestión de Consultas**, el **Foro Comunitario** y la **Gobernanza de Comités**. ¿Hay algo específico que busques sobre estos temas?"
    }

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error("[AI_CHAT_ERROR]", error)
    return NextResponse.json({ 
      error: "Internal Server Error", 
      message: error.message,
      stack: error.stack,
      debugKeys: Object.keys(prisma).filter(k => !k.startsWith('$'))
    }, { status: 500 })
  }
}
