import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EstadoConsulta } from '@prisma/client';

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/consultas/[id]/asignar - Assign advisors and committees
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const {
      asesorPrincipalId,
      asesoresApoyoIds,
      comiteIds,
      observaciones,
    } = body;

    // Check if consultation exists
    const existingConsulta = await db.consulta.findUnique({
      where: { id },
      include: {
        comites: true,
        asesoresApoyo: true,
      },
    });

    if (!existingConsulta) {
      return NextResponse.json(
        { error: 'Consulta no encontrada' },
        { status: 404 }
      );
    }

    // Check if consultation can be modified
    if (existingConsulta.estado === EstadoConsulta.CERRADA) {
      return NextResponse.json(
        { error: 'No se puede modificar una consulta cerrada' },
        { status: 400 }
      );
    }

    // Validate asesor principal if provided
    if (asesorPrincipalId) {
      const asesor = await db.asesor.findUnique({
        where: { id: asesorPrincipalId },
        include: { user: true },
      });

      if (!asesor) {
        return NextResponse.json(
          { error: 'El asesor principal especificado no existe' },
          { status: 404 }
        );
      }

      if (!asesor.activo) {
        return NextResponse.json(
          { error: 'El asesor principal no está activo' },
          { status: 400 }
        );
      }
    }

    // Validate asesores de apoyo if provided
    if (asesoresApoyoIds && Array.isArray(asesoresApoyoIds)) {
      for (const asesorId of asesoresApoyoIds) {
        const asesor = await db.asesor.findUnique({
          where: { id: asesorId },
        });

        if (!asesor) {
          return NextResponse.json(
            { error: `El asesor de apoyo con ID ${asesorId} no existe` },
            { status: 404 }
          );
        }

        if (!asesor.activo) {
          return NextResponse.json(
            { error: `El asesor de apoyo con ID ${asesorId} no está activo` },
            { status: 400 }
          );
        }

        // Cannot be both principal and support
        if (asesorId === asesorPrincipalId) {
          return NextResponse.json(
            { error: 'Un asesor no puede ser principal y de apoyo simultáneamente' },
            { status: 400 }
          );
        }
      }
    }

    // Validate comités if provided
    if (comiteIds && Array.isArray(comiteIds)) {
      for (const comiteId of comiteIds) {
        const comite = await db.comite.findUnique({
          where: { id: comiteId },
        });

        if (!comite) {
          return NextResponse.json(
            { error: `El comité con ID ${comiteId} no existe` },
            { status: 404 }
          );
        }

        if (!comite.activo) {
          return NextResponse.json(
            { error: `El comité con ID ${comiteId} no está activo` },
            { status: 400 }
          );
        }
      }
    }

    // Start transaction for atomic updates
    const updatedConsulta = await db.$transaction(async (tx) => {
      // Update principal advisor
      if (asesorPrincipalId !== undefined) {
        await tx.consulta.update({
          where: { id },
          data: { asesorPrincipalId },
        });
      }

      // Update committees (replace existing)
      if (comiteIds && Array.isArray(comiteIds)) {
        // Remove existing committee relations
        await tx.consultaComite.deleteMany({
          where: { consultaId: id },
        });

        // Create new committee relations
        if (comiteIds.length > 0) {
          await tx.consultaComite.createMany({
            data: comiteIds.map((comiteId: string) => ({
              consultaId: id,
              comiteId,
              estado: EstadoConsulta.CLASIFICADA,
              observaciones,
            })),
          });
        }
      }

      // Update support advisors (replace existing)
      if (asesoresApoyoIds && Array.isArray(asesoresApoyoIds)) {
        // Remove existing support advisor relations
        await tx.consultaAsesorApoyo.deleteMany({
          where: { consultaId: id },
        });

        // Create new support advisor relations
        if (asesoresApoyoIds.length > 0) {
          await tx.consultaAsesorApoyo.createMany({
            data: asesoresApoyoIds.map((asesorId: string) => ({
              consultaId: id,
              asesorId,
            })),
          });
        }
      }

      // Return updated consultation with all relations
      return tx.consulta.findUnique({
        where: { id },
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
        },
      });
    });

    return NextResponse.json({
      message: 'Asignación realizada exitosamente',
      data: updatedConsulta,
    });
  } catch (error) {
    console.error('Error assigning consultation:', error);
    return NextResponse.json(
      { error: 'Error al realizar la asignación' },
      { status: 500 }
    );
  }
}
