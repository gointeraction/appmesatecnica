import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EstadoConsulta } from '@prisma/client';

interface RouteParams {
  params: {
    id: string;
  };
}

// Valid state transitions based on workflow
const VALID_TRANSITIONS: Record<EstadoConsulta, EstadoConsulta[]> = {
  [EstadoConsulta.RECIBIDA]: [EstadoConsulta.CLASIFICADA],
  [EstadoConsulta.CLASIFICADA]: [EstadoConsulta.ASIGNADA, EstadoConsulta.RECIBIDA],
  [EstadoConsulta.ASIGNADA]: [EstadoConsulta.EN_PROCESO, EstadoConsulta.CLASIFICADA],
  [EstadoConsulta.EN_PROCESO]: [EstadoConsulta.DICTAMEN, EstadoConsulta.ASIGNADA],
  [EstadoConsulta.DICTAMEN]: [EstadoConsulta.CERRADA, EstadoConsulta.EN_PROCESO],
  [EstadoConsulta.CERRADA]: [], // Cannot transition from closed
};

// PUT /api/consultas/[id]/estado - Update consultation status
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    const { estado, observaciones } = body;

    // Validate estado is provided
    if (!estado) {
      return NextResponse.json(
        { error: 'El campo estado es requerido' },
        { status: 400 }
      );
    }

    // Validate estado is valid
    const newEstado = estado as EstadoConsulta;
    if (!Object.values(EstadoConsulta).includes(newEstado)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      );
    }

    // Check if consultation exists
    const existingConsulta = await db.consulta.findUnique({
      where: { id },
      include: {
        comites: true,
        asesorPrincipal: true,
        dictamenes: {
          where: { esFinal: true },
        },
      },
    });

    if (!existingConsulta) {
      return NextResponse.json(
        { error: 'Consulta no encontrada' },
        { status: 404 }
      );
    }

    // Check if consultation is already closed
    if (existingConsulta.estado === EstadoConsulta.CERRADA) {
      return NextResponse.json(
        { error: 'No se puede cambiar el estado de una consulta cerrada' },
        { status: 400 }
      );
    }

    // Validate state transition
    const allowedTransitions = VALID_TRANSITIONS[existingConsulta.estado];
    if (!allowedTransitions.includes(newEstado)) {
      return NextResponse.json(
        { 
          error: `Transición de estado inválida. Desde ${existingConsulta.estado} solo se puede cambiar a: ${allowedTransitions.join(', ') || 'ninguno'}` 
        },
        { status: 400 }
      );
    }

    // Additional validations based on state transitions
    const updateData: any = { estado: newEstado };

    switch (newEstado) {
      case EstadoConsulta.CLASIFICADA:
        // Must have at least one committee assigned
        if (existingConsulta.comites.length === 0) {
          return NextResponse.json(
            { error: 'Se requiere al menos un comité para clasificar la consulta' },
            { status: 400 }
          );
        }
        break;

      case EstadoConsulta.ASIGNADA:
        // Must have a principal advisor assigned
        if (!existingConsulta.asesorPrincipalId) {
          return NextResponse.json(
            { error: 'Se requiere un asesor principal para asignar la consulta' },
            { status: 400 }
          );
        }
        break;

      case EstadoConsulta.EN_PROCESO:
        // Advisor must have accepted or started working
        // This is a soft check - actual implementation might require explicit acceptance
        break;

      case EstadoConsulta.DICTAMEN:
        // Should have at least one dictamen (draft or final)
        // This is a soft check
        break;

      case EstadoConsulta.CERRADA:
        // Must have a final dictamen
        if (existingConsulta.dictamenes.length === 0) {
          return NextResponse.json(
            { error: 'Se requiere al menos un dictamen final para cerrar la consulta' },
            { status: 400 }
          );
        }
        updateData.fechaCierre = new Date();
        break;
    }

    // Update consultation status
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
    });

    // Update committee consultation status if needed
    if (observaciones) {
      await db.consultaComite.updateMany({
        where: { consultaId: id },
        data: { 
          estado: newEstado,
          observaciones,
        },
      });
    }

    return NextResponse.json({
      message: `Estado actualizado a ${newEstado}`,
      data: updatedConsulta,
    });
  } catch (error) {
    console.error('Error updating consultation status:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el estado de la consulta' },
      { status: 500 }
    );
  }
}
