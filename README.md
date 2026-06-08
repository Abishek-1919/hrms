# HRMS Enterprise

Clean full-stack repository for an HRMS/timesheet web application.

## Tech Stack Assumptions

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Redux Toolkit, React Router.
- Backend: Node.js service scaffold, ready to evolve to Express APIs.
- Database: PostgreSQL recommended when persistence is added.
- Shared: TypeScript interfaces and domain types shared across frontend and backend.
- Deploy: Vercel for the frontend today; backend/database deployment can be added under `infrastructure/`.

## Project Structure

```text
.
|-- backend/
|   |-- src/
|   |   `-- server.js
|   |-- .env.example
|   |-- package.json
|   `-- README.md
|-- frontend/
|   |-- public/
|   |   `-- favicon.svg
|   |-- src/
|   |   |-- app/
|   |   |-- components/
|   |   |-- constants/
|   |   |-- hooks/
|   |   |-- modules/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- styles/
|   |   |-- utils/
|   |   |-- main.tsx
|   |   `-- vite-env.d.ts
|   |-- .env.example
|   |-- eslint.config.js
|   |-- index.html
|   |-- package.json
|   |-- postcss.config.js
|   |-- tailwind.config.ts
|   |-- tsconfig.app.json
|   |-- tsconfig.json
|   |-- tsconfig.node.json
|   `-- vite.config.ts
|-- infrastructure/
|   `-- README.md
|-- scripts/
|   `-- README.md
|-- shared/
|   |-- src/
|   |   `-- index.ts
|   `-- package.json
|-- .gitignore
|-- package.json
|-- package-lock.json
|-- README.md
`-- vercel.json
```

## Folder Purpose

- `frontend/`: React/Vite web app and all browser-facing UI code.
- `backend/`: API/service code. It currently exposes a minimal `/health` endpoint and is ready for Express/PostgreSQL expansion.
- `shared/`: Domain types and interfaces imported by apps as `@hrms/shared-types`.
- `infrastructure/`: Deployment notes, IaC, migrations, Docker, or CI/CD assets when needed.
- `scripts/`: Small project automation scripts that can be called from root npm scripts.

## Environment Variables

Frontend variables must use the `VITE_` prefix:

```text
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

Backend variables:

```text
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hrms
CORS_ORIGIN=http://localhost:5173
```

Keep real secrets in local `.env` files or your deployment platform. Commit only `.env.example` files.

## Scripts

```bash
npm run dev            # frontend dev server
npm run dev:frontend   # frontend dev server
npm run dev:backend    # backend health service
npm run build          # frontend production build
npm run lint           # frontend lint
npm run preview        # preview frontend production build
```

## Build And Deploy Flow

1. Install dependencies from the repo root.
2. Run frontend/backend locally as needed.
3. Run lint and build before deployment.
4. Deploy frontend with Vercel using the root `vercel.json`.
5. Add backend deployment and PostgreSQL infrastructure when API persistence is introduced.

## Bootstrap Commands

```bash
npm install
npm run dev
```

Optional backend health service:

```bash
npm run dev:backend
```

## Incremental Enhancement Plan

1. Replace mock data with backend API routes.
2. Add Express, request validation, and PostgreSQL migrations.
3. Add authentication middleware and role-based authorization.
4. Add focused unit/integration tests for shared business rules and API endpoints.
5. Add CI checks for lint, build, and tests.

## Demo Users

Use any password with these demo emails:

- `employee@methodhub.com`
- `manager@methodhub.com`
- `admin@methodhub.com`
