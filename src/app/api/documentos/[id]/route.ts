import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/documentos/[id] - Get a single document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const documento = await db.documento.findUnique({
      where: { id },
      include: {
        consulta: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
            estado: true,
            empresaId: true,
          },
        },
      },
    });

    if (!documento) {
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(documento);
  } catch (error) {
    console.error("Error fetching documento:", error);
    return NextResponse.json(
      { error: "Error al obtener el documento" },
      { status: 500 }
    );
  }
}

// PUT /api/documentos/[id] - Update a document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, descripcion, esPublico } = body;

    // Check if documento exists
    const existingDocumento = await db.documento.findUnique({
      where: { id },
    });

    if (!existingDocumento) {
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      );
    }

    const documento = await db.documento.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(esPublico !== undefined && { esPublico }),
      },
      include: {
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

    return NextResponse.json(documento);
  } catch (error) {
    console.error("Error updating documento:", error);
    return NextResponse.json(
      { error: "Error al actualizar el documento" },
      { status: 500 }
    );
  }
}

// DELETE /api/documentos/[id] - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if documento exists
    const existingDocumento = await db.documento.findUnique({
      where: { id },
    });

    if (!existingDocumento) {
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      );
    }

    // Delete the document record
    await db.documento.delete({
      where: { id },
    });

    // Note: The actual file deletion from storage should be handled separately
    // based on the `ruta` field

    return NextResponse.json({ message: "Documento eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting documento:", error);
    return NextResponse.json(
      { error: "Error al eliminar el documento" },
      { status: 500 }
    );
  }
}
