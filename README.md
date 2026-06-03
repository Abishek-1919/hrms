# HRMS Enterprise Frontend

Production-oriented HRMS frontend scaffold built with React, TypeScript, Vite, Tailwind CSS, Redux Toolkit, RTK Query, React Router, React Hook Form, Zod, TanStack Table, Recharts, and reusable UI primitives.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Vercel

This repo is configured for Vercel from the monorepo root with `vercel.json`.

- Build command: `npm run build`
- Output directory: `apps/frontend/dist`
- Install command: `npm install`

The app currently uses mock data and demo authentication so it can be deployed before the backend is created.

## Demo Users

Use any password with these demo emails:

- `employee@methodhub.com`
- `manager@methodhub.com`
- `admin@methodhub.com`
