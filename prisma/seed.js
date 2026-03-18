const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos (JS)...');

  try {
    // Limpiar datos existentes
    await prisma.comunicado.deleteMany();
    await prisma.normativa.deleteMany();
    await prisma.capacitacion.deleteMany();
    await prisma.encuestaSatisfaccion.deleteMany();
    await prisma.plantillaDictamen.deleteMany();
    await prisma.configuracion.deleteMany();
    await prisma.notificacion.deleteMany();
    await prisma.articuloKB.deleteMany();
    await prisma.eventoParticipante.deleteMany();
    await prisma.eventoAgenda.deleteMany();
    await prisma.candidatoAsesor.deleteMany();
    await prisma.documento.deleteMany();
    await prisma.dictamen.deleteMany();
    await prisma.mensaje.deleteMany();
    await prisma.consultaAsesorApoyo.deleteMany();
    await prisma.consultaComite.deleteMany();
    await prisma.consulta.deleteMany();
    await prisma.asesor.deleteMany();
    await prisma.comite.deleteMany();
    await prisma.user.deleteMany();

    console.log('✓ Datos existentes eliminados');

    // Crear usuarios
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@cavecom-e.org',
        password: hashedPassword,
        nombre: 'Administrador',
        apellido: 'Sistema',
        rol: 'ADMIN',
        activo: true,
        telefono: '+58 212 1234567',
      },
    });
    console.log('✓ Usuario admin creado');

    const secretariaUser = await prisma.user.create({
      data: {
        email: 'secretaria@cavecom-e.org',
        password: await bcrypt.hash('secretaria123', 12),
        nombre: 'María',
        apellido: 'González',
        rol: 'SECRETARIA_TECNICA',
        activo: true,
        telefono: '+58 212 2345678',
      },
    });
    console.log('✓ Usuario secretaría creado');

    const asesorLegalUser = await prisma.user.create({
      data: {
        email: 'asesor.legal@cavecom-e.org',
        password: await bcrypt.hash('asesor123', 12),
        nombre: 'Carlos',
        apellido: 'Rodríguez',
        rol: 'ASESOR',
        activo: true,
        telefono: '+58 212 3456789',
      },
    });
    console.log('✓ Usuario asesor legal creado');

    const asesorTecnicoUser = await prisma.user.create({
      data: {
        email: 'asesor.tecnico@cavecom-e.org',
        password: await bcrypt.hash('asesor123', 12),
        nombre: 'Ana',
        apellido: 'Martínez',
        rol: 'ASESOR',
        activo: true,
        telefono: '+58 212 4567890',
      },
    });
    console.log('✓ Usuario asesor técnico creado');

    const empresaUser = await prisma.user.create({
      data: {
        email: 'empresa@ejemplo.com',
        password: await bcrypt.hash('empresa123', 12),
        nombre: 'Juan',
        apellido: 'Pérez',
        rol: 'EMPRESA_AFILIADA',
        activo: true,
        telefono: '+58 212 5678901',
        empresa: 'CryptoCommerce CA',
        cargo: 'Director de Operaciones',
      },
    });
    console.log('✓ Usuario empresa creado');

    // Crear comités
    const comiteRegulacion = await prisma.comite.create({
      data: {
        nombre: 'Comité de Regulación y Fiscalidad',
        descripcion: 'Responsable del estudio, interpretación y propuesta de mejoras al marco normativo vigente.',
        color: '#3B82F6',
        icono: 'scale',
        activo: true,
      },
    });
    console.log('✓ Comité de Regulación creado');

    const comiteTecnologia = await prisma.comite.create({
      data: {
        nombre: 'Comité de Tecnología y Ciberseguridad',
        descripcion: 'Encargado de la evaluación de infraestructuras críticas.',
        color: '#10B981',
        icono: 'shield',
        activo: true,
      },
    });
    console.log('✓ Comité de Tecnología creado');

    // Crear asesores
    const asesorLegal = await prisma.asesor.create({
      data: {
        userId: asesorLegalUser.id,
        profesion: 'Abogado',
        especialidad: 'Derecho Financiero y Criptoactivos',
        biografia: 'Especialista en regulación de criptoactivos.',
        comiteId: comiteRegulacion.id,
        activo: true,
      },
    });
    console.log('✓ Asesor legal creado');

    const asesorTecnico = await prisma.asesor.create({
      data: {
        userId: asesorTecnicoUser.id,
        profesion: 'Ingeniero de Sistemas',
        especialidad: 'Blockchain y Ciberseguridad',
        biografia: 'Experto en desarrollo de smart contracts.',
        comiteId: comiteTecnologia.id,
        activo: true,
      },
    });
    console.log('✓ Asesor técnico creado');

    // Crear configuración inicial
    const configuraciones = [
      { clave: 'organizacion_nombre', valor: 'Mesa Técnica de Criptoactivos - CAVECOM-e', tipo: 'STRING' },
      { clave: 'email_contacto', valor: 'mesatecnica@cavecom-e.org', tipo: 'STRING' },
      { clave: 'notificaciones_email', valor: 'true', tipo: 'BOOLEAN' },
    ];

    for (const config of configuraciones) {
      await prisma.configuracion.create({ data: config });
    }
    console.log('✓ Configuración inicial creada');

    console.log('\n✅ Seed completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
