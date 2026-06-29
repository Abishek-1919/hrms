# Timesheet HRMS — Backend

Node.js REST API server. Deploy on **Render**.

## Tech Stack

- **Runtime**: Node.js >= 20 (ESM)
- **Database**: Supabase (PostgreSQL)
- **Framework**: Native `node:http` (no Express dependency)

## Local Development

```bash
# From the repo root:
npm run dev:backend

# Or from this folder:
npm run dev
```

Server starts on `http://localhost:4000`

## Environment Variables

Copy `.env.example` → `.env` and fill in your values:

| Variable | Description |
|---|---|
| `PORT` | Server port (Render sets this automatically) |
| `DATABASE_URL` | Supabase PostgreSQL URI |
| `CORS_ORIGIN` | Allowed frontend URL (Vercel URL in production) |
| `STAKEHOLDER_HEADCOUNT_FILE` | Path to headcount Excel file |

## Deploy on Render

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo
3. Set **Root Directory**: `backend`
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `node src/server.js`
6. Add all environment variables from `.env.example`

## API Endpoints

| Method | Path | Role |
|---|---|---|
| GET | `/health` | Public |
| GET | `/api/employees` | employee, manager, hr, admin |
| POST | `/api/employees` | hr, admin |
| GET | `/api/employees/:id/profile` | employee, manager, hr, admin |
| GET | `/api/hr/employees` | hr |
| POST | `/api/hr/employees` | hr |
| GET | `/api/hr/managers` | hr |
| GET | `/api/dashboard/summary` | hr, stakeholder, admin |
| GET | `/api/leave` | employee, manager, hr, admin |
| PATCH | `/api/leave/:id` | manager, hr, admin |
| GET | `/api/attendance` | employee, manager, hr, admin |
| GET | `/api/jobs` | employee, manager, hr, admin |
| POST | `/api/jobs` | hr, admin |
| GET | `/api/projects` | employee, manager, hr, admin |
| POST | `/api/projects` | hr, admin |
| GET | `/api/files` | employee, manager, hr, admin |
| POST | `/api/files` | hr, admin |
| GET | `/api/approvals` | manager, hr, admin |
| PATCH | `/api/approvals/:id` | manager, hr, admin |
| GET | `/api/compensation` | hr, admin |
| GET | `/stakeholder/dashboard-summary` | stakeholder |
| GET | `/stakeholder/employees` | stakeholder |
| GET | `/stakeholder/employees/:id` | stakeholder |

## Authentication

Pass a Bearer token header:
```
Authorization: Bearer demo-access-token-<role>
```
Where `<role>` is: `employee`, `manager`, `hr`, `stakeholder`, or `admin`.
