import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/mensajes/[id] - Get a single message
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const mensaje = await db.mensaje.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            rol: true,
            imagenUrl: true,
          },
        },
        consulta: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
            estado: true,
          },
        },
      },
    });

    if (!mensaje) {
      return NextResponse.json(
        { error: "Mensaje no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(mensaje);
  } catch (error) {
    console.error("Error fetching mensaje:", error);
    return NextResponse.json(
      { error: "Error al obtener el mensaje" },
      { status: 500 }
    );
  }
}

// PUT /api/mensajes/[id] - Update a message
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { contenido, esPrivado, esRespuestaOficial } = body;

    // Check if mensaje exists
    const existingMensaje = await db.mensaje.findUnique({
      where: { id },
    });

    if (!existingMensaje) {
      return NextResponse.json(
        { error: "Mensaje no encontrado" },
        { status: 404 }
      );
    }

    // Update mensaje
    const mensaje = await db.mensaje.update({
      where: { id },
      data: {
        ...(contenido !== undefined && { contenido }),
        ...(esPrivado !== undefined && { esPrivado }),
        ...(esRespuestaOficial !== undefined && { esRespuestaOficial }),
      },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            rol: true,
            imagenUrl: true,
          },
        },
        consulta: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
          },
        },
      },
    });

    return NextResponse.json(mensaje);
  } catch (error) {
    console.error("Error updating mensaje:", error);
    return NextResponse.json(
      { error: "Error al actualizar el mensaje" },
      { status: 500 }
    );
  }
}

// DELETE /api/mensajes/[id] - Delete a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if mensaje exists
    const existingMensaje = await db.mensaje.findUnique({
      where: { id },
    });

    if (!existingMensaje) {
      return NextResponse.json(
        { error: "Mensaje no encontrado" },
        { status: 404 }
      );
    }

    await db.mensaje.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Mensaje eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting mensaje:", error);
    return NextResponse.json(
      { error: "Error al eliminar el mensaje" },
      { status: 500 }
    );
  }
}
