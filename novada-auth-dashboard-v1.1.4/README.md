# Novada Auth + Dashboard (Integrated)

This package merges:

- the **Novada dashboard** React app (`/frontend`)
- the **register / login** UI and auth backend (`/auth-pages`, `/backend`)
- the **MySQL schema** for user auth and session support (`/database/schema.sql`)

## What is already connected

1. Users register through `/auth/register.html`
2. Registration writes to MySQL `users`
3. Users log in through `/auth/login.html`
4. The backend sets HttpOnly auth cookies
5. Visiting `/app/` verifies the current session first
6. If the session is valid, the dashboard loads
7. If the session is missing / expired, the user is redirected back to login

## Project structure

- `backend/` - Express API + auth flow + static hosting
- `auth-pages/` - login/register HTML/CSS/JS pages
- `frontend/` - dashboard source + prebuilt `dist/`
- `database/` - MySQL schema files
- `.env.example` - required runtime configuration

## Quick start

### 1) Prepare the database

Create a MySQL database, then import:

- `database/schema.sql`

Optional, for future dashboard persistence:

- `database/dashboard_extension.sql`

### 2) Configure environment

Copy `.env.example` to `.env` and fill in:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`

### 3) Install dependencies

Root backend:

```bash
npm install
```

Dashboard frontend (only needed if you plan to rebuild or run Vite dev):

```bash
cd frontend
npm install
```

### 4) Run the server

```bash
npm run start
```

Development mode:

```bash
npm run dev
```

Then open:

- `http://localhost:3000/auth/login.html`
- or simply `http://localhost:3000/`

## Frontend development

The included `frontend/dist` is already prebuilt for `/app/`.

If you edit the React dashboard source, rebuild it from the project root with:

```bash
npm run build:frontend
```

If you want Vite live reload while keeping the backend API on port 3000:

```bash
npm run dev          # terminal 1
npm run dev:frontend # terminal 2
```

The Vite config already proxies `/api` to `http://localhost:3000`.

## Main URLs

- `/` -> redirects to login
- `/auth/login.html` -> login page
- `/auth/register.html` -> register page
- `/api/auth/*` -> auth APIs
- `/app/` -> protected dashboard entry

See `DEPLOYMENT_AND_INTEGRATION_GUIDE.md` for deployment, API extension, DB extension, and adding new pages.
