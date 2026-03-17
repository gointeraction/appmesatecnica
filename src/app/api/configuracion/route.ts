import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/configuracion - Get all system settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clave = searchParams.get('clave');

    if (clave) {
      // Get single setting
      const config = await db.configuracion.findUnique({
        where: { clave },
      });

      if (!config) {
        return NextResponse.json(
          { error: 'Configuración no encontrada' },
          { status: 404 }
        );
      }

      // Parse value based on type
      let valor: any = config.valor;
      if (config.tipo === 'NUMBER') {
        valor = parseFloat(config.valor);
      } else if (config.tipo === 'BOOLEAN') {
        valor = config.valor === 'true';
      } else if (config.tipo === 'JSON') {
        try {
          valor = JSON.parse(config.valor);
        } catch {
          valor = config.valor;
        }
      }

      return NextResponse.json({
        ...config,
        valor,
      });
    }

    // Get all settings
    const configuraciones = await db.configuracion.findMany({
      orderBy: { clave: 'asc' },
    });

    // Parse values based on types
    const configParsed = configuraciones.map((config) => {
      let valor: any = config.valor;
      if (config.tipo === 'NUMBER') {
        valor = parseFloat(config.valor);
      } else if (config.tipo === 'BOOLEAN') {
        valor = config.valor === 'true';
      } else if (config.tipo === 'JSON') {
        try {
          valor = JSON.parse(config.valor);
        } catch {
          valor = config.valor;
        }
      }
      return { ...config, valor };
    });

    // Return as object for easy access
    const configObject: Record<string, any> = {};
    configParsed.forEach((config) => {
      configObject[config.clave] = config.valor;
    });

    return NextResponse.json({
      data: configParsed,
      configuracion: configObject,
    });
  } catch (error) {
    console.error('Error fetching configuration:', error);
    return NextResponse.json(
      { error: 'Error al obtener la configuración' },
      { status: 500 }
    );
  }
}

// PUT /api/configuracion - Update system settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { clave, valor, descripcion, tipo } = body;

    if (!clave) {
      return NextResponse.json(
        { error: 'Se requiere la clave de configuración' },
        { status: 400 }
      );
    }

    // Convert value to string for storage
    let valorStr: string;
    if (typeof valor === 'object') {
      valorStr = JSON.stringify(valor);
    } else {
      valorStr = String(valor);
    }

    // Determine type if not provided
    let tipoFinal = tipo || 'STRING';
    if (!tipo) {
      if (typeof valor === 'number') {
        tipoFinal = 'NUMBER';
      } else if (typeof valor === 'boolean') {
        tipoFinal = 'BOOLEAN';
      } else if (typeof valor === 'object') {
        tipoFinal = 'JSON';
      }
    }

    // Upsert configuration
    const config = await db.configuracion.upsert({
      where: { clave },
      create: {
        clave,
        valor: valorStr,
        descripcion,
        tipo: tipoFinal,
      },
      update: {
        valor: valorStr,
        descripcion: descripcion || undefined,
        tipo: tipoFinal,
      },
    });

    // Return parsed value
    let valorRespuesta: any = config.valor;
    if (config.tipo === 'NUMBER') {
      valorRespuesta = parseFloat(config.valor);
    } else if (config.tipo === 'BOOLEAN') {
      valorRespuesta = config.valor === 'true';
    } else if (config.tipo === 'JSON') {
      try {
        valorRespuesta = JSON.parse(config.valor);
      } catch {
        valorRespuesta = config.valor;
      }
    }

    return NextResponse.json({
      ...config,
      valor: valorRespuesta,
    });
  } catch (error) {
    console.error('Error updating configuration:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la configuración' },
      { status: 500 }
    );
  }
}

// POST /api/configuracion - Create new configuration (for batch updates)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { configuraciones } = body;

    if (!configuraciones || !Array.isArray(configuraciones)) {
      return NextResponse.json(
        { error: 'Se requiere un array de configuraciones' },
        { status: 400 }
      );
    }

    // Process each configuration
    const results = [];
    for (const config of configuraciones) {
      const { clave, valor, descripcion, tipo } = config;

      if (!clave) continue;

      // Convert value to string for storage
      let valorStr: string;
      if (typeof valor === 'object') {
        valorStr = JSON.stringify(valor);
      } else {
        valorStr = String(valor);
      }

      // Determine type if not provided
      let tipoFinal = tipo || 'STRING';
      if (!tipo) {
        if (typeof valor === 'number') {
          tipoFinal = 'NUMBER';
        } else if (typeof valor === 'boolean') {
          tipoFinal = 'BOOLEAN';
        } else if (typeof valor === 'object') {
          tipoFinal = 'JSON';
        }
      }

      const result = await db.configuracion.upsert({
        where: { clave },
        create: {
          clave,
          valor: valorStr,
          descripcion,
          tipo: tipoFinal,
        },
        update: {
          valor: valorStr,
          descripcion: descripcion || undefined,
          tipo: tipoFinal,
        },
      });

      results.push(result);
    }

    return NextResponse.json({
      message: 'Configuraciones actualizadas exitosamente',
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error('Error creating configuration:', error);
    return NextResponse.json(
      { error: 'Error al crear la configuración' },
      { status: 500 }
    );
  }
}
