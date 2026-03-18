import { NextResponse } from "next/server"
import { db as prisma } from "@/lib/db"

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
  try {
    const acuerdos = await prisma.acuerdoComite.findMany({
      where: { reunionId: params.id },
      orderBy: { createdAt: "desc" }
    })
    return NextResponse.json({ data: acuerdos })
  } catch (error) {
    return NextResponse.json({ error: "Error fetching agreements" }, { status: 500 })
  }
}

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
  try {
    const { titulo, descripcion, responsable } = await req.json()
    
    const acuerdo = await prisma.acuerdoComite.create({
      data: {
        titulo,
        descripcion,
        responsable,
        reunionId: params.id,
        estado: "PENDIENTE"
      }
    })
    return NextResponse.json({ data: acuerdo })
  } catch (error) {
    return NextResponse.json({ error: "Error creating agreement" }, { status: 500 })
  }
}
