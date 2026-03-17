# Business Flows - Mesa Técnica de Criptoactivos

## 1. Consultation Lifecycle (Core Flow)

The heart of the system is the Technical Consultation process.

### Step-by-Step Flow:
1. **Submission**: An `EMPRESA_AFILIADA` submits a consultation via the platform. It starts in the `RECIBIDA` state.
2. **Classification**: The `SECRETARIA_TECNICA` reviews the consultation and moves it to `CLASIFICADA`, tagging it with relevant **Committees** (e.g., Legal and Technology).
3. **Assignment**: A primary `ASESOR` is assigned, and support advisors may be added. State moves to `ASIGNADA`.
4. **Analysis**: The assigned advisor moves the state to `EN_PROCESO`. Communication occurs via the `Mensajes` module (internal messages are marked as private).
5. **Opinion (`Dictamen`)**: The advisor drafts a formal technical opinion. Once ready, the state becomes `DICTAMEN`.
6. **Closure**: The `SECRETARIA_TECNICA` or `ADMIN` reviews the final opinion and moves the consultation to `CERRADA`. An optional satisfaction survey is sent to the company.

---

## 2. Advisor Onboarding Flow

To expand the pool of technical experts.

1. **Postulation**: A potential candidate fills out a form (`CandidatoAsesor`).
2. **Screening**: The `SECRETARIA_TECNICA` reviews the bio and CV. Moves state from `PENDIENTE` to `EN_REVISION`.
3. **Evaluation**: Interview and technical evaluation are scheduled.
4. **Approval**: If successful, the `ADMIN` approves the candidate (`APROBADO`), which triggers the creation of a standard `User` with the role `ASESOR`.

---

## 3. Knowledge Base Expansion

Turning individual responses into public value.

1. **Selection**: A technical opinion from a closed consultation is identified as valuable for the general public.
2. **Redaction**: An advisor or secretary technical creates an `ArticuloKB` based on the opinion, ensuring anonymization of company details.
3. **Publication**: Once approved, it is set to `publicado: true` and becomes searchable by all users or only affiliates depending on settings.

---

## 4. SLA Management

The system automatically calculates the Service Level Agreement (SLA) date based on:
- **SLA Type**: `ESTANDAR` (15 business days) or `COMPLEJO` (30 business days).
- **Triggers**: Classification triggers the SLA countdown.
- **Alerts**: The Dashboard highlights `vencido` (overdue) or `urgente` consultations.
