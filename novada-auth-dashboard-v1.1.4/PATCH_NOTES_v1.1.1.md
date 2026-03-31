# Patch Notes v1.1.1

This patch fixes engineering and deployment issues without changing the visual design.

## Fixed

- Protected `/app`, `/app/`, and `/app/index.html` on the server side before serving the dashboard shell.
- Prevented `express.static()` from bypassing the protected dashboard route.
- Added a shared server-side session resolver so route protection and `/api/auth/verify` use the same auth resolution path.
- Changed the dashboard entry bundle to a stable filename target (`assets/dashboard-app.js`) for future builds.
- Updated the current built package to include `frontend/dist/assets/dashboard-app.js`.
- Removed the hard dependency on a single hashed JS filename inside `auth-gate.js`.
- Kept startup alive when `.env` is incomplete or MySQL is temporarily unavailable (degraded mode instead of hard exit).
- Replaced the legacy `auth-pages/dashboard.html` with a safe redirect to `/app/`.
- Fixed the dead Terms of Service link on the registration page and added a placeholder `auth-pages/terms.html` page.
- Added a working ESLint config and corrected the root `lint` script.
- Updated several leftover `Oxylabs` code comments to `Novada` in touched backend files.

## Notes

- Current prebuilt dashboard (`frontend/dist`) still uses `auth-gate.js` and works with the included stable bundle path.
- Future frontend rebuilds can still work because the source bootstrap now verifies the session if `window.__APP_AUTH_USER__` is not already present.
- Business modules inside the dashboard (Users / Whitelist / charts) are still demo-data driven unless you later connect them to real APIs.
