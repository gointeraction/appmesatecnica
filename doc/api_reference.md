# API Reference - Mesa Técnica de Criptoactivos

The application uses a standard RESTful API pattern with Next.js App Router routes located in `src/app/api`.

## Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | `POST` | Authenticates a user and returns their data. |
| `/api/auth/logout` | `POST` | Destroys the user session. |
| `/api/usuarios/me` | `GET` | Returns information about the currently logged-in user. |

## Core Entities (CRUD)

All CRUD endpoints follow a similar pattern: `GET` to list, `POST` to create, `GET` (with ID) to read, `PUT` to update, and `DELETE` (or `PUT` status) to deactivate.

### Consultas
- `/api/consultas`: Search and filter consultations.
- `/api/consultas/[id]`: Retrieve single consultation details.
- `/api/consultas/[id]/estado`: Update only the state of a consultation (Kanban).
- `/api/consultas/[id]/asignar`: Assign advisors and committees.

### Asesores & Usuarios
- `/api/asesores`: Directory of technical experts.
- `/api/usuarios`: Management of system users and their roles.

### Specialty Modules
- `/api/comites`: List of technical committees (Legal, Technical, etc.).
- `/api/dictamenes`: Official технические мнения issued for consultations.
- `/api/documentos`: Manage file uploads and metadata attached to consultations.
- `/api/mensajes`: Communication threads for consultations (support for private messages).

## Utilities & Shared Data

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/estadisticas` | `GET` | Aggregated data for the Admin Dashboard (SLA, performance, volumes). |
| `/api/agenda` | `GET/POST` | Management of the Technical Desk calendar. |
| `/api/kb` | `GET/POST` | Knowledge Base articles. |
| `/api/notificaciones` | `GET` | Real-time notifications for the active user. |
| `/api/configuracion` | `GET/PUT` | System-wide parameters (SLA times, contact info, etc.). |

### Response Format
Most endpoints return a standard JSON object:
```json
{
  "success": true,
  "data": [...],
  "message": "Operation successful"
}
```
In case of error:
```json
{
  "success": false,
  "error": "Error message description"
}
```
