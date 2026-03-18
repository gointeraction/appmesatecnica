import { NextResponse } from "next/server"
import { db as prisma } from "@/lib/db"
import { getServerSession } from "next-auth"

export async function GET() {
  try {
    const client = prisma as any;
    const modelName = Object.keys(client).find(k => k.toLowerCase() === 'forotema');
    const model = modelName ? client[modelName] : null;
    
    if (model) {
      const temas = await model.findMany({
        include: {
          autor: { select: { nombre: true, imagenUrl: true } },
          _count: { select: { posts: true } }
        },
        orderBy: { createdAt: "desc" }
      })
      return NextResponse.json({ data: temas })
    } else {
      // Raw fallback
      const temas: any = await prisma.$queryRaw`
        SELECT t.*, u.nombre as autorNombre, u.imagenUrl as autorImagen,
        (SELECT COUNT(*) FROM ForoPost WHERE temaId = t.id) as postsCount
        FROM ForoTema t
        LEFT JOIN User u ON t.autorId = u.id
        ORDER BY t.createdAt DESC
      `
      // Map raw result to expected format explicitly
      const formattedTemas = temas.map((t: any) => ({
        id: t.id,
        titulo: t.titulo,
        contenido: t.contenido,
        categoria: t.categoria,
        vistas: typeof t.vistas === 'bigint' ? Number(t.vistas) : t.vistas,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        autor: { nombre: t.autorNombre, imagenUrl: t.autorImagen },
        _count: { posts: typeof t.postsCount === 'bigint' ? Number(t.postsCount) : t.postsCount }
      }))
      return NextResponse.json({ data: formattedTemas })
    }
  } catch (error: any) {
    console.error("Error fetching forum topics:", error)
    return NextResponse.json({ error: "Error fetching topics", message: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { titulo, contenido, categoria } = await req.json()
    
    const firstUser = await prisma.user.findFirst()
    if (!firstUser) throw new Error("No users found")

    const client = prisma as any;
    const modelName = Object.keys(client).find(k => k.toLowerCase() === 'forotema');
    const model = modelName ? client[modelName] : null;

    if (model) {
      const tema = await model.create({
        data: {
          titulo,
          contenido,
          categoria,
          autorId: firstUser.id
        }
      })
      return NextResponse.json({ data: tema })
    } else {
      // Raw fallback for creation
      const id = `cl_raw_${Date.now()}`;
      await prisma.$executeRaw`
        INSERT INTO ForoTema (id, titulo, contenido, categoria, autorId, vistas, createdAt, updatedAt)
        VALUES (${id}, ${titulo}, ${contenido}, ${categoria}, ${firstUser.id}, 0, ${new Date().toISOString()}, ${new Date().toISOString()})
      `
      return NextResponse.json({ data: { id, titulo, contenido, categoria, autorId: firstUser.id } })
    }
  } catch (error: any) {
    console.error("Error creating forum topic:", error)
    return NextResponse.json({ 
      error: "Error creating topic", 
      message: error.message
    }, { status: 500 })
  }
}
