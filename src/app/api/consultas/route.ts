import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EstadoConsulta, TipoConsulta, PrioridadConsulta, SlaTipo } from '@prisma/client';

// Helper function to generate consultation code
async function generateConsultationCode(): Promise<string> {
  const year = new Date().getFullYear();
  
  // Find the last consultation of the current year
  const lastConsulta = await db.consulta.findFirst({
    where: {
      codigo: {
        startsWith: `CONS-${year}-`,
      },
    },
    orderBy: {
      codigo: 'desc',
    },
  });

  let nextNumber = 1;
  if (lastConsulta) {
    const lastCode = lastConsulta.codigo;
    const lastNumber = parseInt(lastCode.split('-')[2], 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  // Format: CONS-YYYY-NNNN
  return `CONS-${year}-${nextNumber.toString().padStart(4, '0')}`;
}

// Helper function to calculate SLA date
function calculateSlaDate(slaTipo: SlaTipo): Date {
  const now = new Date();
  const slaDays = slaTipo === SlaTipo.ESTANDAR ? 3 : 10; // 72 hours = 3 days for ESTANDAR, 5-10 days for COMPLEJO
  
  // Add business days (excluding weekends for simplicity)
  let daysAdded = 0;
  const result = new Date(now);
  
  while (daysAdded < slaDays) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++;
    }
  }
  
  return result;
}

// GET /api/consultas - List consultations with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const estado = searchParams.get('estado') as EstadoConsulta | null;
    const tipo = searchParams.get('tipo') as TipoConsulta | null;
    const prioridad = searchParams.get('prioridad') as PrioridadConsulta | null;
    const comiteId = searchParams.get('comite');
    const empresaId = searchParams.get('empresa');
    const asesorId = searchParams.get('asesor');
    const search = searchParams.get('search');
    const codigo = searchParams.get('codigo');
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (estado) {
      where.estado = estado;
    }
    
    if (tipo) {
      where.tipo = tipo;
    }
    
    if (prioridad) {
      where.prioridad = prioridad;
    }
    
    if (empresaId) {
      where.empresaId = empresaId;
    }
    
    if (asesorId) {
      where.OR = [
        { asesorPrincipalId: asesorId },
        { asesoresApoyo: { some: { asesorId } } },
      ];
    }
    
    if (comiteId) {
      where.comites = { some: { comiteId } };
    }
    
    if (search) {
      where.OR = [
        { titulo: { contains: search } },
        { codigo: { contains: search } },
        { descripcion: { contains: search } },
      ];
    }

    if (codigo) {
      where.codigo = codigo;
    }

    // Get total count
    const total = await db.consulta.count({ where });

    // Get consultations
    const consultas = await db.consulta.findMany({
      where,
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
              },
            },
          },
        },
        _count: {
          select: {
            mensajes: true,
            documentos: true,
            dictamenes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      data: consultas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching consultations:', error);
    return NextResponse.json(
      { error: 'Error al obtener las consultas' },
      { status: 500 }
    );
  }
}

// POST /api/consultas - Create new consultation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      titulo,
      descripcion,
      tipo,
      prioridad,
      slaTipo,
      empresaId,
      email,
      nombreSolicitante,
      comiteIds,
      asesorPrincipalId,
      asesoresApoyoIds,
    } = body;

    // Validate required fields
    if (!titulo || !descripcion || !tipo) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: titulo, descripcion, tipo' },
        { status: 400 }
      );
    }

    let finalEmpresaId = empresaId;

    // Public consultation: find or create user by email
    if (!finalEmpresaId && email) {
      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        finalEmpresaId = existingUser.id;
      } else {
        const newUser = await db.user.create({
          data: {
            email,
            nombre: nombreSolicitante || email.split('@')[0],
            telefono: body.telefono || '',
            empresa: body.empresa || '',
            rol: 'EMPRESA_AFILIADA',
            activo: false,
            password: '', // Should be set when invited
          },
        });
        finalEmpresaId = newUser.id;
      }
    }

    if (!finalEmpresaId) {
      return NextResponse.json(
        { error: 'Se requiere empresaId o email para procesar la consulta' },
        { status: 400 }
      );
    }

    // Generate consultation code
    const codigo = await generateConsultationCode();

    // Determine SLA type if not provided
    const finalSlaTipo = slaTipo || SlaTipo.ESTANDAR;
    
    // Calculate SLA date
    const slaFecha = calculateSlaDate(finalSlaTipo);

    // Create consultation
    const consulta = await db.consulta.create({
      data: {
        codigo,
        titulo,
        descripcion,
        tipo: tipo as TipoConsulta,
        prioridad: (prioridad || PrioridadConsulta.MEDIA) as PrioridadConsulta,
        estado: EstadoConsulta.RECIBIDA,
        slaTipo: finalSlaTipo,
        slaFecha,
        empresaId: finalEmpresaId,
        asesorPrincipalId: asesorPrincipalId || null,
        comites: comiteIds ? {
          create: comiteIds.map((comiteId: string) => ({
            comiteId,
            estado: EstadoConsulta.CLASIFICADA,
          })),
        } : undefined,
        asesoresApoyo: asesoresApoyoIds ? {
          create: asesoresApoyoIds.map((asesorId: string) => ({
            asesorId,
          })),
        } : undefined,
      },
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

    return NextResponse.json(consulta, { status: 201 });
  } catch (error) {
    console.error('Error creating consultation:', error);
    return NextResponse.json(
      { error: 'Error al crear la consulta' },
      { status: 500 }
    );
  }
}
