import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/kb/[id] - Get individual article
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const articulo = await db.articuloKB.findUnique({
      where: { id },
      include: {
        autor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            imagenUrl: true,
          },
        },
      },
    });

    if (!articulo) {
      return NextResponse.json(
        { error: 'Artículo no encontrado' },
        { status: 404 }
      );
    }

    // Increment view count
    await db.articuloKB.update({
      where: { id },
      data: { vistas: { increment: 1 } },
    });

    // Parse etiquetas if present
    const articuloConEtiquetas = {
      ...articulo,
      etiquetas: articulo.etiquetas ? JSON.parse(articulo.etiquetas) : [],
      vistas: articulo.vistas + 1, // Return incremented value
    };

    return NextResponse.json(articuloConEtiquetas);
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Error al obtener el artículo' },
      { status: 500 }
    );
  }
}

// PUT /api/kb/[id] - Update article
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    const {
      titulo,
      contenido,
      resumen,
      categoria,
      etiquetas,
      esDestacado,
      publicado,
    } = body;

    // Check if article exists
    const existingArticulo = await db.articuloKB.findUnique({
      where: { id },
    });

    if (!existingArticulo) {
      return NextResponse.json(
        { error: 'Artículo no encontrado' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (titulo) updateData.titulo = titulo;
    if (contenido) updateData.contenido = contenido;
    if (resumen !== undefined) updateData.resumen = resumen;
    if (categoria !== undefined) updateData.categoria = categoria;
    if (etiquetas !== undefined) updateData.etiquetas = etiquetas ? JSON.stringify(etiquetas) : null;
    if (esDestacado !== undefined) updateData.esDestacado = esDestacado;
    if (publicado !== undefined) updateData.publicado = publicado;

    // Update article
    const updatedArticulo = await db.articuloKB.update({
      where: { id },
      data: updateData,
      include: {
        autor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedArticulo);
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el artículo' },
      { status: 500 }
    );
  }
}

// DELETE /api/kb/[id] - Delete article
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Check if article exists
    const existingArticulo = await db.articuloKB.findUnique({
      where: { id },
    });

    if (!existingArticulo) {
      return NextResponse.json(
        { error: 'Artículo no encontrado' },
        { status: 404 }
      );
    }

    // Delete article
    await db.articuloKB.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Artículo eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el artículo' },
      { status: 500 }
    );
  }
}
