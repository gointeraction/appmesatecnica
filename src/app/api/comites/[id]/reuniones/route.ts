import { NextResponse } from "next/server"
import { db as prisma } from "@/lib/db"

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
  try {
    const reuniones = await prisma.reunionComite.findMany({
      where: { comiteId: params.id },
      include: {
        acuerdos: true
      },
      orderBy: { fecha: "desc" }
    })
    return NextResponse.json({ data: reuniones })
  } catch (error) {
    return NextResponse.json({ error: "Error fetching meetings" }, { status: 500 })
  }
}

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
  try {
    const { titulo, descripcion, fecha, horaInicio, horaFin } = await req.json()
    
    const reunion = await prisma.reunionComite.create({
      data: {
        titulo,
        descripcion,
        fecha: new Date(fecha),
        horaInicio,
        horaFin,
        comiteId: params.id,
        estado: "PROGRAMADA"
      }
    })
    return NextResponse.json({ data: reunion })
  } catch (error) {
    return NextResponse.json({ error: "Error creating meeting" }, { status: 500 })
  }
}
