# SmartMedChart — Clinical Medication Management & Reception Bureau System

> HIPAA/NABH-compliant inpatient EHR, ICU-grade eMAR, CPOE, 5-Rights bedside verification, and full-featured Hospital Reception & Intake Portal.

---

## 🏥 System Overview

SmartMedChart is a unified hospital clinical management application integrating:
- **Clinical EHR & eMAR:** ICU medication administration, 5-rights bedside barcode/QR verification, and CPOE physician prescribing.
- **Receptionist Intake Bureau (`/receptionist`):** Outpatient queue triage, inpatient ward & bed allocation matrix, consulting doctor assignment, live shift rostering, and instant QR health pass generation.
- **Doctor & Nurse Workstations:** Real-time patient charts, lab values, vitals, medication scheduling, and safety checks.
- **Patient & Public Verification Portals:** Scannable wristbands, cryptographic HMAC audit verification, and prescription sheets.

---

## 🚀 Quick Start

### 1. Installation
Clone the repository and install dependencies at the project root:
```bash
npm install
```

### 2. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```
Key environment variables:
- `DATABASE_URL`: Path to SQLite database (`file:./prisma/smartmed.db`) or PostgreSQL connection string.
- `JWT_SECRET` & `JWT_REFRESH_SECRET`: Secrets for authentication tokens and cryptographic audit trail signatures.
- `PORT`: Express API server port (default: `3001`).
- `VITE_API_URL`: Backend API base URL for frontend requests (default: `http://localhost:3001/api`).

### 3. Database Setup & Seeding
```bash
npm run db:generate    # Generate Prisma Client
npm run db:seed        # Seed clinical and hospital personnel demo data
```

### 4. Running the Development Server
```bash
npm run dev            # Starts both Express backend (:3001) and Vite frontend (:5173) concurrently
```
Or start individually:
- Frontend: `npm run dev:frontend`
- Backend: `npm run dev:backend`

---

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run Vite frontend (`:5173`) and Express backend (`:3001`) concurrently |
| `npm run dev:frontend` | Run Vite frontend only |
| `npm run dev:backend` | Run Express API server with nodemon + tsx |
| `npm run build` | Build production bundle (`prisma generate && vite build`) |
| `npm run preview` | Preview production build locally |
| `npm run db:generate` | Generate Prisma client bindings |
| `npm run db:migrate` | Apply Prisma schema migrations |
| `npm run db:seed` | Seed hospital personnel, wards, and clinical data (`prisma/seed.ts`) |
| `npm run db:reset` | Reset and reseed database |
| `npm run db:studio` | Launch Prisma Studio GUI database inspector |
| `npm run docker:up` | Start PostgreSQL container |
| `npm run docker:down` | Stop PostgreSQL container |

---

## 🔐 Demo Credentials (Password: `SmartMed@2024`)

| Role | Email / Staff ID | Primary Portal Route |
|------|------------------|----------------------|
| 👨‍💼 **Receptionist** | `priya.sharma@metrohealth.org` / `REC-1001` | `/receptionist` |
| 👨‍⚕️ **Doctor** | `sharma.md@metrohealth.org` / `DOC-84729` | `/doctor`, `/prescriptions` |
| 👩‍⚕️ **Nurse** | `priya.rn@metrohealth.org` / `RN-88219` | `/nurse`, `/bedside-scan` |
| 💊 **Pharmacist** | `dave.pharm@metrohealth.org` / `PHARM-7721` | `/prescriptions` |
| 🛡️ **Admin** | `evelyn.vance@metrohealth.org` / `ADM-9001` | `/admin`, `/safety-audit`, `/reports` |
| 🏥 **Allied Staff** | `staff@metrohealth.org` / `STF-5001` | `/staff` |
| 🧑‍🦱 **Patient Portal** | MRN `94021-08` / PIN `1234` | `/patient-portal` |

---

## 🏛️ Project Structure

```
Shridha SmartMedChart/
├── src/                                  # React 18 + Vite frontend
│   ├── api/                              # Axios HTTP client with interceptors
│   ├── assets/                           # Static visual brand assets
│   ├── components/                       # Shared UI components (Sidebar, Modals, Navbars)
│   ├── data/                             # Demo and preset dataset files
│   ├── features/
│   │   └── receptionist/                 # Unified Receptionist Portal Feature
│   │       ├── components/               # Reception desk UI (Wards bed map, doctor allotment, QR passes)
│   │       ├── data/                     # Ward layout definitions & shift duty rosters
│   │       ├── utils/                    # QR payload encoder & isolated storage fallback
│   │       ├── types.ts                  # Receptionist domain types
│   │       └── ReceptionistPage.tsx      # Main Receptionist desk container
│   ├── hooks/                            # Custom hooks (useAuth, query hooks)
│   ├── layouts/                          # AppLayout shell
│   ├── pages/                            # Top-level portal pages (Doctor, Nurse, Receptionist, Patient)
│   ├── routes/                           # ProtectedRoute with role-based access control
│   ├── services/                         # REST API services (patientService, prescriptionService, etc.)
│   ├── types/                            # Global TypeScript ambient definitions
│   ├── utils/                            # Shared utilities (PDF generators, live sync engine)
│   ├── App.tsx                           # Application route table with lazy-loaded portals
│   ├── index.css                         # Tailored clinical design system & animations
│   └── main.tsx                          # React DOM application mount
│
├── server/                               # Express + TypeScript backend API
│   ├── config/                           # Prisma and Supabase client initializers
│   ├── controllers/                      # Auth, Patient, Prescription, Schedule, Alert controllers
│   ├── middleware/                       # JWT auth, role authorization, rate limiting, error handlers
│   ├── routes/                           # Express REST endpoints
│   ├── services/                         # Clinical safety & administration scheduling engines
│   ├── utils/                            # HMAC cryptographic audit trail hashing
│   └── start.ts                          # Server bootstrap entry point
│
├── prisma/
│   ├── schema.prisma                     # Prisma ORM schema
│   └── seed.ts                           # Full hospital demo data seed
│
├── api/                                  # Serverless Vercel function handler
│   └── index.ts                          # Serverless Express wrapper
│
├── public/                               # Public static image assets and favicon
├── backup_db/                            # Safety backup of committed SQLite databases
├── .env.example                          # Documented environment template
├── .gitignore                            # Version control exclusion rules
├── package.json                          # Unified project dependencies and scripts
├── tsconfig.json                         # TypeScript compiler configuration (frontend)
├── tsconfig.server.json                  # TypeScript compiler configuration (backend)
├── vercel.json                           # Vercel deployment build & rewrite configuration
└── vite.config.ts                        # Vite bundler configuration with @ alias
```

---

## 🔒 Security & Compliance

- **Role-Based Access Control (RBAC):** Strict JWT verification and role enforcement across routes and endpoints.
- **5-Rights Bedside Administration:** Dual nurse verification or camera barcode scanning check before medication delivery.
- **Cryptographic Audit Trail:** All administrative actions and medication administrations are timestamped and signed with HMAC-SHA256 digests.
