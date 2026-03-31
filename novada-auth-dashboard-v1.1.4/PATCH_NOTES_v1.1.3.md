# Patch Notes v1.1.3

## Critical Bug Fixes

### 1. Captcha Real-Time Pre-Verification (Root cause of login/register loop)
- **Problem**: The captcha "Check" button in server mode only validated that input was a number, showing a green ✓ "Ready" even when the answer was wrong. The real verification only happened on form submit, causing a confusing loop where users were asked to re-enter the captcha.
- **Fix**: Added `POST /api/auth/captcha/verify` endpoint that performs non-destructive server-side answer checking. The Check button now gives accurate real-time feedback ("Verified" or "Wrong") before form submission. If the pre-check endpoint is unavailable, falls back gracefully to the old optimistic behavior.
- **Files**: `CaptchaWidget.js`, `api.js`, `auth.controller.js`, `captchaValidator.js`, `auth.routes.js`

### 2. Refresh Token Loses "Remember Me" Flag
- **Problem**: When a refresh token was rotated, the new token always used the short expiration (12h) regardless of whether the user checked "Remember Me" (which should give 30d).
- **Fix**: `rememberMe` flag is now embedded in the refresh token payload and preserved during rotation.
- **Files**: `auth.controller.js`

### 3. Invalid Dummy BCrypt Hash Causes Console Errors
- **Problem**: The timing-attack prevention dummy hash `$2b$12$dummyhash...` was not a valid bcrypt hash, causing `bcrypt.compare()` to throw and log errors on every failed-email login attempt.
- **Fix**: Replaced with a properly formatted bcrypt hash.
- **Files**: `auth.controller.js`

### 4. Username Collision Space Exhaustion
- **Problem**: `generateUniqueUsername()` used 5-digit numbers (90,000 possible values). With growing users, collisions and retry loops would increase.
- **Fix**: Switched to 8-character alphanumeric suffix using `crypto.randomBytes()` (~2.8 trillion possibilities). Backward compatible with existing Proxy##### usernames.
- **Files**: `User.js`

### 5. Session Utility Static Evaluation
- **Problem**: `frontend/src/utils/session.js` evaluated `window.__APP_AUTH_USER__` at module import time. When loaded via Vite dev server (without auth-gate), user was always null and never updated after bootstrap set it.
- **Fix**: Replaced static values with Proxy-based getters that resolve at access time.
- **Files**: `frontend/src/utils/session.js`

## Improvements

### UX / Error Messages
- Captcha validation errors now clearly state "Incorrect answer" instead of "Please complete the security check"
- Form validation distinguishes between "no answer entered" and "answer not yet verified"
- Added centralized `ErrorMessages.js` utility for consistent error text across pages

### Security
- SQL pattern detection in `inputSanitizer` now only logs in development mode to avoid false-positive noise in production (parameterized queries remain the primary defense)
- JWT secret separation warning printed at server startup when `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` fall back to shared `JWT_SECRET`
- `user_agent` field in login attempts truncated to 512 chars to prevent storage abuse
- Cookie configuration debug logging in development mode to help diagnose auth issues on localhost

### Resilience
- Added React `ErrorBoundary` component wrapping the dashboard app to prevent full white-screen crashes
- Database connection pool now checks for closed state and recreates automatically
- `.env.example` expanded with detailed comments on `NODE_ENV`, `AUTH_COOKIE_SECURE`, and `BCRYPT_ROUNDS` impact

## New Files
- `auth-pages/js/utils/errorMessages.js` — Centralized API error code → user message mapping
- `frontend/src/components/ErrorBoundary.jsx` — React error boundary with retry/navigation

## New API Endpoint
- `POST /api/auth/captcha/verify` — Non-destructive captcha answer pre-check (rate-limited)
