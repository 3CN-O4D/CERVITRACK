# Cervitrack Backend

Enterprise NestJS backend for the Kenya National Cervical Cancer Screening Registry.

## Architecture

```
src/
├── common/
│   ├── decorators/     # @Roles(), @FacilityIsolation(), @AuditAction(), @CurrentUser()
│   ├── filters/        # HttpExceptionFilter (PHI-safe error responses)
│   ├── guards/         # JwtAuthGuard with 7-tier RBAC
│   └── middleware/      # AuditLogMiddleware (strips PHI)
├── infrastructure/
│   └── database/       # PrismaService (singleton lifecycle)
└── features/
    ├── auth/           # JWT + bcrypt, refresh token rotation
    ├── patients/       # Demographic registry, clinical summaries
    ├── screenings/     # Screening continuum, offline batch sync
    ├── facilities/     # Facility management, county-level stats
    ├── reports/        # DHIS2/MOH aggregate report generator
    └── telemetry/      # Cervical kinematics tracking
```

## 7-Tier RBAC

| Role | Access |
|------|--------|
| `patient` | View own records, book appointments, view results |
| `lab_technician` | View assigned tests, enter results, offline sync |
| `clinician` | Manage patients, create screenings, upload images, referrals |
| `facility_admin` | Manage facility, view stats, manage staff |
| `county_admin` | View county stats, manage facilities |
| `national_admin` | View national stats, export DHIS2, manage counties |
| `system_admin` | Full access, system config, audit logs |

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your Supabase, Cloudinary, and JWT secrets

# Generate Prisma client
npx prisma generate

# Run database migrations (SQLite for dev)
npx prisma migrate dev --name init

# Seed the database
npx prisma db seed

# Start development server
npm run start:dev
```

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Auth
- `POST /auth/register` — Create account
- `POST /auth/login` — Get access + refresh tokens
- `POST /auth/refresh` — Rotate refresh token
- `POST /auth/logout` — Revoke refresh token

### Patients
- `GET /patients` — List (with search, pagination, county/facility filters)
- `GET /patients/:id` — Detail with screenings, diagnoses, treatments
- `GET /patients/:id/summary` — Clinical summary with next-action logic
- `POST /patients` — Create (facility_admin, clinician, system_admin)
- `PUT /patients/:id` — Update

### Screenings
- `GET /screenings` — List (filter by facility, patient, result)
- `GET /screenings/:id` — Detail
- `POST /screenings` — Create screening record
- `POST /screenings/sync-batch` — Offline batch sync for Lab PWA

### Facilities
- `GET /facilities` — List (search by name, code, county, type)
- `GET /facilities/:id` — Detail with staff and patient counts
- `GET /facilities/:id/stats` — Screening stats by result
- `POST /facilities` — Create (county_admin+)
- `PUT /facilities/:id` — Update

### Reports
- `GET /reports/facility/:id/monthly` — Monthly report for facility
- `POST /reports/facility/:id/export-dhis2` — Export to DHIS2
- `GET /reports/national/summary` — National aggregate summary

### Telemetry
- `POST /telemetry/record` — Record metric data point
- `GET /telemetry/metrics` — Query metrics with filters
- `GET /telemetry/aggregates` — Aggregated statistics

## Offline Sync Protocol

The Lab PWA queues results in IndexedDB when offline. On reconnection, it flushes via `POST /screenings/sync-batch`:

```json
{
  "batchId": "batch_1721654400",
  "items": [
    {
      "offlineId": "offline_abc123",
      "patientId": "uuid",
      "type": "VIA",
      "findings": "Acetowhite lesion visible",
      "result": "POSITIVE",
      "screeningDate": "2026-07-22T10:30:00Z",
      "clientTimestamp": "2026-07-22T10:30:05Z"
    }
  ]
}
```

Response includes per-item status: `synced`, `conflict`, or `error`.

## DHIS2 Integration

Monthly reports compile facility screening data into DHIS2-compatible payloads:

```bash
# Generate report
GET /reports/facility/{id}/monthly?year=2026&month=7

# Export to DHIS2 (requires DHIS2_URL, DHIS2_USER, DHIS2_PASSWORD in .env)
POST /reports/facility/{id}/export-dhis2?year=2026&month=7
```

Data elements mapped:
- `VIA_SCREENING`, `PAP_SCREENING`, `HPV_SCREENING`
- `POSITIVE_RESULTS`, `DIAGNOSES`
- `CRYOTHERAPY`, `LEEP`, `TREATMENTS`

## CORS Configuration

All 5 deployment streams are whitelisted:

| Origin | Purpose |
|--------|---------|
| `https://cervitrack.vercel.app` | Web dashboards (admin, workspace, lab, facilities) |
| `capacitor://localhost` | Patient Mobile APK (Android/iOS) |
| `ionic://localhost` | Alternative mobile wrapper |
| `http://localhost:3000` | Local development |
| `http://localhost:5173` | Vite dev server |

## Environment Variables

See `.env.example` for all required variables:

- **Database**: `DATABASE_URL` (PostgreSQL/Supabase), `DIRECT_URL`
- **JWT**: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRY`
- **Supabase**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- **Cloudinary**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET`
- **DHIS2**: `DHIS2_URL`, `DHIS2_USER`, `DHIS2_PASSWORD`
- **CORS**: `CORS_ORIGINS` (comma-separated)

## Database Schema

12 models via Prisma:

- **User** — All 7 role types, facility-linked
- **Patient** — Demographics, MOH-aligned identifiers
- **Facility** — MFL code, county/sub-county hierarchy
- **Screening** — VIA/Pap/HPV/Colposcopy/LEEP records
- **Diagnosis** — CIN staging, histopathology
- **Treatment** — LEEP/Cryotherapy/surgery outcomes
- **Referral** — Cross-facility referral tracking
- **SyncBatch** — Offline upload batch tracking
- **ConsentRecord** — Patient consent audit trail
- **AuditLog** — PHI-stripped access logging
- **RefreshToken** — JWT refresh token management

## Supabase SQL Functions

For PostgreSQL deployment, run `supabase/functions.sql` to create:

- `user_profile_routing` view — Unified user roles and permissions
- `get_my_routing()` — Current user's app access and permissions
- `get_patient_profile()` — Patient-facing profile with screening status
- `get_lab_queue()` — Lab PWA pending test queue

## Docker

```bash
docker-compose up -d
```

## License

Part of the Cervitrack project by 3C Network for Oncology & Digital Health (3CN-O4D).
