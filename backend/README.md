# ProcureEase Backend

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Notes:
- Uses TypeORM `synchronize: true` for initial dev.
- Uses `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (Supabase pooler values).
- Default base URL: `http://localhost:5000`

## Auth (Backend-first)

### 1) Create the first Admin account (one-time)

This project does not include open self-registration by default.

Run the bootstrap script (it will also create an "Administration" department if missing):

```bash
node src/scripts/bootstrap-admin.js --email admin@hospital.gov --password Admin123! --name "System Admin" --dept "Administration"
```

### 2) Login

`POST /api/auth/login`

Body:
```json
{ "email": "admin@hospital.gov", "password": "Admin123!", "role": "Admin" }
```

Returns:
```json
{ "token": "<jwt>", "user": { "id": 1, "email": "...", "role": "Admin" } }
```

### 3) Admin creates new accounts

`POST /api/users` (Admin-only, requires `Authorization: Bearer <jwt>`)

Body:
```json
{ "user_name": "Dept User", "email": "dept@hospital.gov", "role": "Department User", "password": "User123!", "dept_id": 1 }
```

### 4) (Optional) Admin manages departments

- `GET /api/departments` (Admin-only)
- `POST /api/departments` (Admin-only)

Example create:
```json
{ "dept_name": "Pharmacy" }
```

## Env

Optional:
- `AUTH_JWT_SECRET` (recommended). If not set, backend uses a dev-only fallback secret.
