# Timesheet HRMS

Enterprise HR & Timesheet management platform.

**Frontend** → Vercel &nbsp;|&nbsp; **Backend** → Render &nbsp;|&nbsp; **Database** → Supabase

---

## Project Structure

```
timesheet/
├── frontend/          # React 19 + TypeScript + Vite + Tailwind + Redux
│   ├── public/
│   ├── src/
│   │   ├── app/           # Redux store, router, providers
│   │   ├── components/    # Shared UI components (layout, forms, tables)
│   │   ├── constants/     # Route constants
│   │   ├── hooks/         # Custom hooks
│   │   ├── modules/       # Feature modules (see below)
│   │   ├── pages/         # Non-module pages (404 etc.)
│   │   ├── services/      # API client, auth API, mock data
│   │   ├── styles/        # Global CSS
│   │   └── utils/         # Utilities (cn, etc.)
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── backend/           # Node.js REST API server
│   ├── src/
│   │   └── server.js  # Full API — employees, timesheets, HR, stakeholders
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── shared/            # TypeScript types shared by frontend & backend
│   ├── src/
│   │   └── index.ts   # Imported as @hrms/shared-types
│   └── package.json
├── .gitignore
├── package.json       # Root monorepo (npm workspaces)
├── vercel.json        # Vercel deployment config (frontend)
└── README.md
```

## Feature Modules (frontend/src/modules/)

| Module | Description |
|---|---|
| `auth` | Login, force password change |
| `dashboard` | Employee/manager summary dashboard |
| `timesheets` | Timesheet list + new timesheet creation |
| `leaves` | Leave requests list |
| `employees` | Employee profile, list, create |
| `hr` | HR dashboard |
| `operations` | HR operations — employee create, attendance, jobs, projects |
| `managers` | Team view, approvals |
| `stakeholders` | Stakeholder dashboard, directory, employee detail |
| `admin` | Users, departments, settings |

---

## Local Development

### Prerequisites
- Node.js >= 20
- npm >= 9

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-org/timesheet.git
cd timesheet

# 2. Install all dependencies (workspaces)
npm install

# 3. Set up environment variables
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

### Run

```bash
# Frontend only (http://localhost:5173)
npm run dev:frontend

# Backend only (http://localhost:4000)
npm run dev:backend

# Both (frontend only — backend must be started separately)
npm run dev
```

---

## Demo Credentials

| Email | Password | Role |
|---|---|---|
| `employee@methodhub.com` | `Employee@methodhub` | Employee |
| `manager@methodhub.com` | `Manager@methodhub` | Manager |
| `hr@methodhub.com` | `HR@methodhub` | HR |
| `stakeholder@methodhub.com` | `Stakeholder@methodhub` | Stakeholder |
| `admin@methodhub.com` | `Admin@methodhub` | Admin |

---

## Deployment

### Frontend → Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Vercel will auto-detect the `vercel.json` at root — no changes needed
4. Add environment variable in Vercel dashboard:
   - `VITE_API_BASE_URL` = `https://your-backend.onrender.com`
5. Deploy ✅

**Vercel settings** (auto-detected from `vercel.json`):
- Build Command: `npm run build`
- Output Directory: `frontend/dist`
- Install Command: `npm install`

### Backend → Render

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
4. Add environment variables (from `backend/.env.example`):
   - `PORT` (set by Render automatically)
   - `DATABASE_URL` (your Supabase connection string)
   - `CORS_ORIGIN` (your Vercel frontend URL)
   - `STAKEHOLDER_HEADCOUNT_FILE` (optional)
5. Deploy ✅

### Database → Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database → Connection string (URI)**
3. Copy the URI and set it as `DATABASE_URL` in your Render backend environment
4. Run your database migrations (SQL) via the Supabase SQL editor

---

## Build Commands

```bash
# Production build (frontend)
npm run build

# Lint (frontend)
npm run lint

# Preview production build locally
npm run preview
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| State | Redux Toolkit, React Router v7 |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table |
| Charts | Recharts |
| Backend | Node.js (ESM), native http module |
| Database | Supabase (PostgreSQL) |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |
