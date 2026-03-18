import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EstadoConsulta, TipoConsulta, PrioridadConsulta, SlaTipo } from '@prisma/client';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/consultas/[id] - Get individual consultation
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const consulta = await db.consulta.findUnique({
      where: { id },
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            empresa: true,
            email: true,
            telefono: true,
            cargo: true,
          },
        },
        asesorPrincipal: {
          include: {
            user: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                telefono: true,
              },
            },
            comite: {
              select: {
                id: true,
                nombre: true,
                color: true,
              },
            },
          },
        },
        comites: {
          include: {
            comite: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
                color: true,
                icono: true,
              },
            },
          },
        },
        asesoresApoyo: {
          include: {
            asesor: {
              include: {
                user: {
                  select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    email: true,
                  },
                },
                comite: {
                  select: {
                    id: true,
                    nombre: true,
                    color: true,
                  },
                },
              },
            },
          },
        },
        mensajes: {
          include: {
            user: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        dictamenes: {
          include: {
            asesor: {
              include: {
                user: {
                  select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        documentos: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        encuestas: true,
      },
    });

    if (!consulta) {
      return NextResponse.json(
        { error: 'Consulta no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(consulta);
  } catch (error) {
    console.error('Error fetching consultation:', error);
    return NextResponse.json(
      { error: 'Error al obtener la consulta' },
      { status: 500 }
    );
  }
}

// PUT /api/consultas/[id] - Update consultation
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    const {
      titulo,
      descripcion,
      tipo,
      prioridad,
      slaTipo,
    } = body;

    // Check if consultation exists
    const existingConsulta = await db.consulta.findUnique({
      where: { id },
    });

    if (!existingConsulta) {
      return NextResponse.json(
        { error: 'Consulta no encontrada' },
        { status: 404 }
      );
    }

    // Check if consultation can be modified (not closed)
    if (existingConsulta.estado === EstadoConsulta.CERRADA) {
      return NextResponse.json(
        { error: 'No se puede modificar una consulta cerrada' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (titulo) updateData.titulo = titulo;
    if (descripcion) updateData.descripcion = descripcion;
    if (tipo) updateData.tipo = tipo as TipoConsulta;
    if (prioridad) updateData.prioridad = prioridad as PrioridadConsulta;
    
    if (slaTipo && slaTipo !== existingConsulta.slaTipo) {
      updateData.slaTipo = slaTipo as SlaTipo;
      // Recalculate SLA date
      const slaDays = slaTipo === SlaTipo.ESTANDAR ? 3 : 10;
      const now = new Date();
      const slaFecha = new Date(now);
      let daysAdded = 0;
      
      while (daysAdded < slaDays) {
        slaFecha.setDate(slaFecha.getDate() + 1);
        const dayOfWeek = slaFecha.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          daysAdded++;
        }
      }
      
      updateData.slaFecha = slaFecha;
    }

    // Update consultation
    const updatedConsulta = await db.consulta.update({
      where: { id },
      data: updateData,
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            empresa: true,
            email: true,
          },
        },
        asesorPrincipal: {
          include: {
            user: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
              },
            },
          },
        },
        comites: {
          include: {
            comite: true,
          },
        },
        asesoresApoyo: {
          include: {
            asesor: {
              include: {
                user: {
                  select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedConsulta);
  } catch (error) {
    console.error('Error updating consultation:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la consulta' },
      { status: 500 }
    );
  }
}

// DELETE /api/consultas/[id] - Delete consultation (soft delete by closing)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Check if consultation exists
    const existingConsulta = await db.consulta.findUnique({
      where: { id },
    });

    if (!existingConsulta) {
      return NextResponse.json(
        { error: 'Consulta no encontrada' },
        { status: 404 }
      );
    }

    // Instead of deleting, close the consultation
    const closedConsulta = await db.consulta.update({
      where: { id },
      data: {
        estado: EstadoConsulta.CERRADA,
        fechaCierre: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Consulta cerrada exitosamente',
      data: closedConsulta,
    });
  } catch (error) {
    console.error('Error closing consultation:', error);
    return NextResponse.json(
      { error: 'Error al cerrar la consulta' },
      { status: 500 }
    );
  }
}
