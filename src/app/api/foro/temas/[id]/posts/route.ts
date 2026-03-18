import { NextResponse } from "next/server"
import { db as prisma } from "@/lib/db"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("POSTS_GET_ID:", id);
    const client = prisma as any;
    const modelName = Object.keys(client).find(k => k.toLowerCase() === 'foropost');
    const model = modelName ? client[modelName] : null;

    if (model) {
      const posts = await model.findMany({
        where: { temaId: id },
        include: {
          autor: { select: { nombre: true, imagenUrl: true } }
        },
        orderBy: { createdAt: "asc" }
      })
      return NextResponse.json({ data: posts, debugParams: params })
    } else {
      // Raw fallback
      const posts: any = await prisma.$queryRaw`
        SELECT p.*, u.nombre as autorNombre, u.imagenUrl as autorImagen
        FROM ForoPost p
        LEFT JOIN User u ON p.autorId = u.id
        WHERE p.temaId = ${id}
        ORDER BY p.createdAt ASC
      `
      const formattedPosts = posts.map((p: any) => ({
        id: p.id,
        contenido: p.contenido,
        temaId: p.temaId,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        autor: { nombre: p.autorNombre, imagenUrl: p.autorImagen }
      }))
      return NextResponse.json({ data: formattedPosts, debugId: id })
    }
  } catch (error: any) {
    console.error("Error fetching forum posts:", error)
    return NextResponse.json({ error: "Error fetching posts", message: error.message }, { status: 500 })
  }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { contenido } = await req.json()
    
    const firstUser = await prisma.user.findFirst()
    if (!firstUser) throw new Error("No users found")

    const client = prisma as any;
    const modelName = Object.keys(client).find(k => k.toLowerCase() === 'foropost');
    const model = modelName ? client[modelName] : null;

    if (model) {
      try {
        const post = await model.create({
          data: {
            contenido,
            temaId: id,
            autorId: firstUser.id
          }
        })
        return NextResponse.json({ data: post })
      } catch (e: any) {
        console.warn("Prisma create failed, falling back to raw insert", e.message);
      }
    }

    const postId = `cl_post_raw_${Date.now()}`;
    await prisma.$executeRaw`
      INSERT INTO ForoPost (id, contenido, temaId, autorId, createdAt, updatedAt)
      VALUES (${postId}, ${contenido}, ${id}, ${firstUser.id}, ${new Date().toISOString()}, ${new Date().toISOString()})
    `
    return NextResponse.json({ data: { id: postId, contenido, temaId: id, autorId: firstUser.id } })
  } catch (error: any) {
    console.error("Error creating forum post:", error)
    return NextResponse.json({ 
      error: "Error creating post", 
      message: error.message
    }, { status: 500 })
  }
}
