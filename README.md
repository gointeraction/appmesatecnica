# Mesa Técnica de Criptoactivos - CAVECOM-e

Sistema integral de gestión de consultas técnicas para la Mesa Técnica de Criptoactivos y Comercio Electrónico de la Cámara Venezolana de Comercio Electrónico (CAVECOM-e).

## 🏗️ Arquitectura

| Componente | Tecnología |
|------------|------------|
| Framework | Next.js 16 con App Router |
| Lenguaje | TypeScript 5 |
| Base de datos | SQLite + Prisma ORM |
| UI | Tailwind CSS 4 + shadcn/ui |
| Estado | Zustand |

## 👥 Roles del Sistema

1. **ADMIN** - Administrador del sistema
2. **SECRETARIA_TECNICA** - Gestiona consultas y asignaciones
3. **ASESOR** - Miembros de mesa técnica que emiten dictámenes
4. **EMPRESA_AFILIADA** - Empresas que envían consultas

## 📊 Flujo de Consultas

```
RECIBIDA → CLASIFICADA → ASIGNADA → EN_PROCESO → DICTAMEN → CERRADA
```

## 🧩 Módulos

| Dashboard | Estadísticas y métricas generales |
| Consultas | Pipeline Kanban, vista de lista, documentos |
| Asesores | Directorio y perfiles técnicos |
| Foro | Discusión técnica categorizada por temas |
| Criptobot | Asistente IA con contexto de consultas y comités |
| Gobernanza | Reuniones de comités y actas de acuerdos |
| Usuarios | Gestión con roles |
| Comités | Gestión de comités especializados |
| Candidatos | Onboarding de nuevos asesores con notificaciones |
| Agenda | Calendario de eventos y vencimientos |
| Base de Conocimiento | Artículos técnicos |
| Configuración | Parámetros del sistema |

## 🔐 Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@cavecom-e.org | admin123 |
| Secretaría | secretaria@cavecom-e.org | secretaria123 |
| Asesor Legal | asesor.legal@cavecom-e.org | asesor123 |
| Asesor Técnico | asesor.tecnico@cavecom-e.org | asesor123 |
| Empresa | empresa@ejemplo.com | empresa123 |

## 🚀 Instalación

```bash
# Instalar dependencias
bun install

# Configurar base de datos
bun run db:push
bun run db:seed

# Iniciar servidor de desarrollo
bun run dev
```

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── api/           # API Routes
│   ├── page.tsx       # Aplicación principal
│   └── layout.tsx     # Layout raíz
├── components/
│   └── ui/            # Componentes shadcn/ui
├── lib/
│   ├── db.ts          # Cliente Prisma
│   └── auth.ts        # Utilidades de autenticación
├── store/
│   └── auth.ts        # Store de Zustand
└── types/
    └── index.ts       # Tipos TypeScript

prisma/
├── schema.prisma      # Schema de la base de datos
└── seed.ts           # Datos iniciales
```

## 🏛️ Comités Especializados

1. **Comité de Regulación y Fiscalidad** - Interpretación normativa, dictámenes legales y fiscales
2. **Comité de Tecnología y Ciberseguridad** - Auditoría de infraestructuras, protocolos de resiliencia
3. **Comité de Negocios y Medios de Pago** - Integración de pasarelas, modelos de monetización

## 📄 Licencia

Uso exclusivo de CAVECOM-e.
