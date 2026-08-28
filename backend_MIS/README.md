# MIMS FastAPI Backend

FastAPI backend for the existing Mureed Information Management System frontend. The API keeps the frontend's camelCase response contract while the database layer uses backend-friendly snake_case names.

## Stack

Python, FastAPI, Pydantic, SQLAlchemy, SQLite for local demo mode, and Supabase/PostgreSQL for production deployment. Exports support CSV and XLSX.

## Run Locally

```sh
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Swagger is available at `http://localhost:8000/docs`.

The app seeds demo peers, 10,000 Mureeds, one Main Admin, one Admin, and sample Mureed accounts when the database is empty.

Demo credentials:

```text
Main Admin: mainadmin@example.com / Admin@123
Admin: admin@mims.app / admin123
Mureed accounts: seeded mureed email / mureed123
Mock OTP: 123456
```

## Environment

Copy `.env.example` to `.env` for local overrides.

```env
MIMS_DATABASE_URL=sqlite:///./mims.db
MIMS_SECRET_KEY=change-this-for-production
MIMS_MAIN_ADMIN_EMAIL=mainadmin@example.com
MIMS_DEMO_OTP=123456
MIMS_OTP_TTL_SECONDS=600
MIMS_FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Set the frontend adapter with:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## Supabase Setup

Production should use Supabase Auth for passwords, OTP, email verification, and Google OAuth. Keep `SUPABASE_SERVICE_ROLE_KEY` on the backend only.

Apply the database design in `migrations/001_supabase_schema.sql`. It creates:

- `profiles`: Supabase user profile, role, account status, auth provider.
- `peers`: Peer records with unique names.
- `mureeds`: Mureed business information; age is derived from `date_of_birth`.
- `admin_approval_requests`: pending/approved/rejected Admin registration workflow.

The migration also includes indexes and RLS policies for Admin management and Mureed own-record isolation.

## API Areas

- Auth: Admin/Mureed login, logout, current user, mock OTP signup, Google mock flow, Mureed setup.
- Admin approval: Main Admin approve/reject endpoints.
- Mureeds: CRUD, search, filters, location from address, pagination, own-record read.
- Peers: CRUD, names list, assigned-Mureed delete safety.
- Users: account status, Mureed account setup records, safe user deletion.
- Reports: overview and Mureeds by Peer.
- Exports: `/api/exports/mureeds` and `/api/exports/peers` with `format=csv|xlsx`.

## Security Notes

The local SQLite mode is a development stand-in so the frontend can run before Supabase credentials exist. It uses local password hashes only for demo authentication. Production should delegate credential storage and verification to Supabase Auth, then use FastAPI for authorization, profile lookup, business data, approvals, reports, and exports.

Do not commit `.env`, `.db`, virtual environments, access tokens, OTPs, or service role keys.
