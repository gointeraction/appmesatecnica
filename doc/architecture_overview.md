# Architecture Overview - Mesa Técnica de Criptoactivos

## Technical Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router, Client-side SPA style) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) with Persistence |
| **Database** | [SQLite](https://www.sqlite.org/) with [Prisma ORM](https://www.prisma.io/) |
| **Authentication** | Custom Session-based (Zustand + API Routes) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |

## Project Structure

- `src/app`: Next.js App Router.
    - `page.tsx`: Entry point that dynamically loads the main application component.
    - `api/`: RESTful API routes handling database operations.
- `src/components`: UI components.
    - `mesa-tecnica-app.tsx`: The primary application component (SPA-style) containing most module views.
    - `ui/`: Reusable primitive components (shadcn/ui).
- `src/lib`: Core utilities.
    - `db.ts`: Prisma database client singleton.
    - `auth.ts`: Authentication-related server-side logic.
- `src/store`: Client-side state.
    - `auth.ts`: Zustand store for user session and authentication state.
- `prisma`: Database schema and seeding scripts.
- `skills`: Modular AI system capabilities (LLM, ASR, TTS, etc.).

## Key Components

### 1. Main Application (`mesa-tecnica-app.tsx`)
This massive component (approx. 2200 lines) serves as the orchestrator for all application modules. It handles:
- **Navigation**: Sidebar-based module switching.
- **Data Fetching**: Centralized `fetchApi` utility for interacting with `/api/*` routes.
- **Module Views**: Dashboard, Consultations (Kanban), Advisors, Users, etc.

### 2. State Management
`zustand` handles the global state for the authenticated user, ensuring that roles and permissions are reactive across the entire application without deep prop drilling.

### 3. API Layer
The application follows a standard Next.js API route pattern where each model has its own endpoint for CRUD operations, located in `src/app/api`.
