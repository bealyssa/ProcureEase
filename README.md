# ProcureEase (Scaffold)

This repo contains two separate apps:
- `frontend/`: Vite + React + Tailwind
- `backend/`: Node.js + Express + TypeORM (Supabase Postgres)

## 1) Backend

```bash
cd backend
npm install
cp .env.example .env
# set DATABASE_URL (recommended) or DB_HOST/DB_USER/etc
npm run dev
```

- Backend runs on `http://localhost:5000`
- TypeORM is configured with `synchronize: true` for initial development.

## 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

- Frontend runs on `http://localhost:5173`
