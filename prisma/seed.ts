import { PrismaClient, RolUsuario, EstadoConsulta, TipoConsulta, PrioridadConsulta, SlaTipo, EstadoCandidato, TipoEvento, EstadoNotificacion, TipoPlantilla } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Limpiar datos existentes
  await prisma.comunicado.deleteMany()
  await prisma.normativa.deleteMany()
  await prisma.capacitacion.deleteMany()
  await prisma.encuestaSatisfaccion.deleteMany()
  await prisma.plantillaDictamen.deleteMany()
  await prisma.configuracion.deleteMany()
  await prisma.notificacion.deleteMany()
  await prisma.articuloKB.deleteMany()
  await prisma.eventoParticipante.deleteMany()
  await prisma.eventoAgenda.deleteMany()
  await prisma.candidatoAsesor.deleteMany()
  await prisma.documento.deleteMany()
  await prisma.dictamen.deleteMany()
  await prisma.mensaje.deleteMany()
  await prisma.consultaAsesorApoyo.deleteMany()
  await prisma.consultaComite.deleteMany()
  await prisma.consulta.deleteMany()
  await prisma.asesor.deleteMany()
  await prisma.comite.deleteMany()
  await prisma.user.deleteMany()

  console.log('✓ Datos existentes eliminados')

  // Crear usuarios
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@cavecom-e.org',
      password: hashedPassword,
      nombre: 'Administrador',
      apellido: 'Sistema',
      rol: RolUsuario.ADMIN,
      activo: true,
      telefono: '+58 212 1234567',
    },
  })
  console.log('✓ Usuario admin creado')

  const secretariaUser = await prisma.user.create({
    data: {
      email: 'secretaria@cavecom-e.org',
      password: await bcrypt.hash('secretaria123', 12),
      nombre: 'María',
      apellido: 'González',
      rol: RolUsuario.SECRETARIA_TECNICA,
      activo: true,
      telefono: '+58 212 2345678',
    },
  })
  console.log('✓ Usuario secretaría creado')

  const asesorLegalUser = await prisma.user.create({
    data: {
      email: 'asesor.legal@cavecom-e.org',
      password: await bcrypt.hash('asesor123', 12),
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      rol: RolUsuario.ASESOR,
      activo: true,
      telefono: '+58 212 3456789',
    },
  })
  console.log('✓ Usuario asesor legal creado')

  const asesorTecnicoUser = await prisma.user.create({
    data: {
      email: 'asesor.tecnico@cavecom-e.org',
      password: await bcrypt.hash('asesor123', 12),
      nombre: 'Ana',
      apellido: 'Martínez',
      rol: RolUsuario.ASESOR,
      activo: true,
      telefono: '+58 212 4567890',
    },
  })
  console.log('✓ Usuario asesor técnico creado')

  const empresaUser = await prisma.user.create({
    data: {
      email: 'empresa@ejemplo.com',
      password: await bcrypt.hash('empresa123', 12),
      nombre: 'Juan',
      apellido: 'Pérez',
      rol: RolUsuario.EMPRESA_AFILIADA,
      activo: true,
      telefono: '+58 212 5678901',
      empresa: 'CryptoCommerce CA',
      cargo: 'Director de Operaciones',
    },
  })
  console.log('✓ Usuario empresa creado')

  // Crear comités
  const comiteRegulacion = await prisma.comite.create({
    data: {
      nombre: 'Comité de Regulación y Fiscalidad',
      descripcion: 'Responsable del estudio, interpretación y propuesta de mejoras al marco normativo vigente, así como del análisis del impacto de las cargas tributarias en la economía digital.',
      color: '#3B82F6',
      icono: 'scale',
      activo: true,
    },
  })
  console.log('✓ Comité de Regulación creado')

  const comiteTecnologia = await prisma.comite.create({
    data: {
      nombre: 'Comité de Tecnología y Ciberseguridad',
      descripcion: 'Encargado de la evaluación de infraestructuras críticas, protocolos de resiliencia digital, auditoría de sistemas y mitigación de riesgos tecnológicos para el ecosistema.',
      color: '#10B981',
      icono: 'shield',
      activo: true,
    },
  })
  console.log('✓ Comité de Tecnología creado')

  const comiteNegocios = await prisma.comite.create({
    data: {
      nombre: 'Comité de Negocios y Medios de Pago',
      descripcion: 'Actúa como órgano asesor en la integración de nuevas pasarelas de pago, modelos de monetización y facilitación de intercambios comerciales dentro y fuera de la plataforma digital.',
      color: '#F59E0B',
      icono: 'briefcase',
      activo: true,
    },
  })
  console.log('✓ Comité de Negocios creado')

  // Crear asesores
  const asesorLegal = await prisma.asesor.create({
    data: {
      userId: asesorLegalUser.id,
      profesion: 'Abogado',
      especialidad: 'Derecho Financiero y Criptoactivos',
      biografia: 'Especialista en regulación de criptoactivos con más de 10 años de experiencia en derecho financiero.',
      comiteId: comiteRegulacion.id,
      activo: true,
    },
  })
  console.log('✓ Asesor legal creado')

  const asesorTecnico = await prisma.asesor.create({
    data: {
      userId: asesorTecnicoUser.id,
      profesion: 'Ingeniero de Sistemas',
      especialidad: 'Blockchain y Ciberseguridad',
      biografia: 'Experto en desarrollo de smart contracts y auditoría de sistemas blockchain.',
      comiteId: comiteTecnologia.id,
      activo: true,
    },
  })
  console.log('✓ Asesor técnico creado')

  // Actualizar líderes de comités
  await prisma.comite.update({
    where: { id: comiteRegulacion.id },
    data: { liderId: asesorLegal.id },
  })
  await prisma.comite.update({
    where: { id: comiteTecnologia.id },
    data: { liderId: asesorTecnico.id },
  })
  console.log('✓ Líderes de comités asignados')

  // Crear consultas de ejemplo
  const consulta1 = await prisma.consulta.create({
    data: {
      codigo: 'CONS-2024-0001',
      titulo: 'Consulta sobre tributación de criptoactivos',
      descripcion: '¿Cuál es el tratamiento fiscal adecuado para las transacciones con criptoactivos en Venezuela? Necesitamos información sobre los impuestos aplicables y las obligaciones formales.',
      tipo: TipoConsulta.FISCAL,
      prioridad: PrioridadConsulta.ALTA,
      estado: EstadoConsulta.RECIBIDA,
      slaTipo: SlaTipo.ESTANDAR,
      slaFecha: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 días
      empresaId: empresaUser.id,
    },
  })
  console.log('✓ Consulta 1 creada')

  const consulta2 = await prisma.consulta.create({
    data: {
      codigo: 'CONS-2024-0002',
      titulo: 'Auditoría de smart contract para pasarela de pago',
      descripcion: 'Requerimos una auditoría técnica de un smart contract que será utilizado como pasarela de pago en nuestra plataforma de e-commerce.',
      tipo: TipoConsulta.TECNICA,
      prioridad: PrioridadConsulta.URGENTE,
      estado: EstadoConsulta.ASIGNADA,
      slaTipo: SlaTipo.ESTANDAR,
      slaFecha: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 días
      empresaId: empresaUser.id,
      asesorPrincipalId: asesorTecnico.id,
    },
  })
  console.log('✓ Consulta 2 creada')

  // Asignar comités a consultas
  await prisma.consultaComite.create({
    data: {
      consultaId: consulta1.id,
      comiteId: comiteRegulacion.id,
      estado: EstadoConsulta.CLASIFICADA,
    },
  })
  await prisma.consultaComite.create({
    data: {
      consultaId: consulta2.id,
      comiteId: comiteTecnologia.id,
      estado: EstadoConsulta.ASIGNADA,
    },
  })
  console.log('✓ Comités asignados a consultas')

  // Crear artículos de base de conocimiento
  await prisma.articuloKB.create({
    data: {
      titulo: 'Guía de cumplimiento regulatorio para exchanges de criptoactivos',
      contenido: `# Guía de Cumplimiento Regulatorio

Esta guía proporciona un marco de referencia para el cumplimiento de las regulaciones venezolanas aplicables a exchanges de criptoactivos.

## Marco Legal

Las plataformas de intercambio de criptoactivos en Venezuela deben cumplir con:

1. **Ley de Criptoactivos**: Marco regulatorio principal
2. **Normativas SUNACRIP**: Registros y autorizaciones
3. **Ley de Ilícitos Cambiarios**: Aspectos de comercio exterior

## Requisitos de Registro

- Registro ante SUNACRIP
- Constitución de garantías
- Plan de cumplimiento AML/CTF

## Mejores Prácticas

- Implementar KYC robusto
- Mantener registros auditables
- Reportar transacciones sospechosas`,
      categoria: 'GUIA',
      esDestacado: true,
      publicado: true,
      autorId: adminUser.id,
    },
  })
  console.log('✓ Artículo de KB creado')

  // Crear configuración inicial
  const configuraciones = [
    { clave: 'organizacion_nombre', valor: 'Mesa Técnica de Criptoactivos - CAVECOM-e', tipo: 'STRING' },
    { clave: 'email_contacto', valor: 'mesatecnica@cavecom-e.org', tipo: 'STRING' },
    { clave: 'telefono_contacto', valor: '+58 212 1234567', tipo: 'STRING' },
    { clave: 'direccion', valor: 'Caracas, Venezuela', tipo: 'STRING' },
    { clave: 'max_consultas_mes', valor: '10', tipo: 'NUMBER' },
    { clave: 'sla_estandar_horas', valor: '72', tipo: 'NUMBER' },
    { clave: 'sla_complejo_dias', valor: '10', tipo: 'NUMBER' },
    { clave: 'notificaciones_email', valor: 'true', tipo: 'BOOLEAN' },
    { clave: 'notificaciones_sistema', valor: 'true', tipo: 'BOOLEAN' },
  ]

  for (const config of configuraciones) {
    await prisma.configuracion.create({ data: config })
  }
  console.log('✓ Configuración inicial creada')

  // Crear plantillas de dictamen
  await prisma.plantillaDictamen.create({
    data: {
      nombre: 'Dictamen Legal Estándar',
      tipo: TipoPlantilla.DICTAMEN_LEGAL,
      contenido: `# DICTAMEN TÉCNICO-LEGAL

**Código de Consulta:** {consulta.codigo}
**Fecha:** {fecha}
**Asesor:** {asesor.nombre}

## ANTECEDENTES

{consulta.descripcion}

## ANÁLISIS

[Análisis del caso]

## CONCLUSIÓN

[Conclusión del dictamen]

## RECOMENDACIONES

[Recomendaciones]

---
*Este dictamen tiene carácter técnico-consultivo y no constituye asesoría legal vinculante.*`,
      activa: true,
    },
  })
  console.log('✓ Plantilla de dictamen creada')

  // Crear evento de agenda
  await prisma.eventoAgenda.create({
    data: {
      titulo: 'Sesión Ordinaria de la Mesa Técnica',
      descripcion: 'Reunión mensual de seguimiento de consultas y casos.',
      tipo: TipoEvento.REUNION,
      fechaInicio: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Próxima semana
      creadoPorId: secretariaUser.id,
    },
  })
  console.log('✓ Evento de agenda creado')

  console.log('\n✅ Seed completado exitosamente!')
  console.log('\n📋 Credenciales de prueba:')
  console.log('┌─────────────────────────────────────────────────────────────┐')
  console.log('│ Rol           │ Email                        │ Contraseña   │')
  console.log('├─────────────────────────────────────────────────────────────┤')
  console.log('│ Admin         │ admin@cavecom-e.org          │ admin123     │')
  console.log('│ Secretaría    │ secretaria@cavecom-e.org     │ secretaria123│')
  console.log('│ Asesor Legal  │ asesor.legal@cavecom-e.org   │ asesor123    │')
  console.log('│ Asesor Técnico│ asesor.tecnico@cavecom-e.org │ asesor123    │')
  console.log('│ Empresa       │ empresa@ejemplo.com          │ empresa123   │')
  console.log('└─────────────────────────────────────────────────────────────┘')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
