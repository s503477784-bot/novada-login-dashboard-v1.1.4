# Deployment and Integration Guide

## 1. Current request flow

### Register

1. Browser opens `/auth/register.html`
2. Frontend requests `/api/auth/captcha`
3. User submits email + password + captcha
4. Backend validates request, hashes password, writes to `users`
5. Registration success returns the generated username (`Proxy*****`)
6. User is redirected to `/auth/login.html`

### Login

1. Browser opens `/auth/login.html`
2. Frontend requests `/api/auth/captcha`
3. User submits credentials
4. Backend validates password against MySQL
5. Backend issues HttpOnly auth cookie + refresh cookie
6. Frontend redirects to `/app/`

### Enter dashboard

1. `/app/` serves the dashboard shell
2. `frontend/dist/auth-gate.js` calls `/api/auth/verify` before loading the app bundle
3. If verification succeeds, the React bundle is loaded
4. If verification fails, the browser is redirected to `/auth/login.html`

## 2. Files you usually change

### Auth API / backend

- `backend/routes/auth.routes.js` - auth route definitions
- `backend/controllers/auth.controller.js` - auth business logic
- `backend/models/User.js` - user queries
- `backend/config/database.js` - MySQL connection pool
- `backend/app.js` - static hosting, CSP, route fallback

### Login / register UI

- `auth-pages/login.html`
- `auth-pages/register.html`
- `auth-pages/css/styles.css`
- `auth-pages/js/pages/login.js`
- `auth-pages/js/pages/register.js`

### Dashboard app

- `frontend/src/App.jsx`
- `frontend/src/components/*`
- `frontend/src/pages/*`
- `frontend/src/main.jsx`
- `frontend/vite.config.js`

### Database

- `database/schema.sql`
- `database/dashboard_extension.sql`

## 3. How to connect more backend APIs

If you want the dashboard to stop using local mock data and start reading real data:

1. Add a new route file or extend an existing one in `backend/routes/`
2. Add controller logic in `backend/controllers/`
3. Add SQL access in `backend/models/`
4. Return JSON from `/api/...`
5. Update React pages in `frontend/src/pages/` to fetch that API

Recommended pattern:

- `routes` -> only route wiring + middleware
- `controllers` -> validation + orchestration
- `models` -> SQL only
- `frontend` -> present API data, do not embed business rules there

## 4. How to persist dashboard modules to MySQL

The shipped dashboard still uses demo-only local arrays for:

- proxy users
- whitelist IPs

When you are ready to persist them:

1. Apply `database/dashboard_extension.sql`
2. Create models, for example:
   - `backend/models/ProxyUser.js`
   - `backend/models/WhitelistedIp.js`
3. Add API routes, for example:
   - `GET /api/dashboard/proxy-users`
   - `POST /api/dashboard/proxy-users`
   - `PUT /api/dashboard/proxy-users/:id`
   - `DELETE /api/dashboard/proxy-users/:id`
   - `GET /api/dashboard/whitelisted-ips`
   - `POST /api/dashboard/whitelisted-ips`
4. In the React pages, replace local state seed arrays with API fetch + mutation calls

Make every dashboard record scoped by the logged-in `user.id`.

## 5. How to add other pages

### Add a new dashboard page

1. Create `frontend/src/pages/YourPage.jsx`
2. Import it into `frontend/src/App.jsx`
3. Add a `<Route />` entry
4. Add a navigation link in `frontend/src/components/Sidebar.jsx`
5. Rebuild with `npm run build:frontend`

### Add a non-dashboard static page

If it should behave like login/register marketing pages, place it under `auth-pages/` and expose it through `backend/app.js`.

## 6. Deployment notes

### Same-origin deployment (recommended)

Deploy the Node server so that it serves:

- auth pages
- API
- dashboard static files

This is the simplest setup because cookies, redirects, and `/api` calls all stay on the same origin.

### Reverse proxy / Nginx

Typical production chain:

- Nginx / CDN / LB -> Node app
- Node app -> MySQL

If you terminate TLS in front of Node, set:

- `TRUST_PROXY=true`
- `AUTH_COOKIE_SECURE=true`

### If you deploy frontend and backend on different origins

Then you must re-check:

- `CORS_ALLOWED_ORIGINS`
- `AUTH_COOKIE_SAMESITE`
- `AUTH_COOKIE_SECURE`

For true cross-site cookies, `SameSite=None` requires HTTPS.

## 7. Rebuild checklist after frontend changes

Whenever you edit `frontend/src/*`:

1. Run `npm run build:frontend`
2. Confirm `frontend/dist/index.html` exists
3. Restart the Node server
4. Open `/app/` and verify auth still redirects correctly

## 8. Security reminders

- Never store plaintext passwords in the database
- Keep `JWT_SECRET` long and random
- Turn on HTTPS in production
- Use `AUTH_COOKIE_SECURE=true` in production
- Keep rate limits enabled
- If you expose new CRUD APIs, enforce ownership by `user.id`
