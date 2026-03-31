# Novada Auth Dashboard — v1.1.2 Upgrade Notes

**Release Date**: 2026-03-03  
**Previous Version**: v1.1.1  
**Classification**: Security Hardening + Mobile Adaptation + Engineering Cleanup

---

## Summary

This release addresses **22 issues** identified across two independent code reviews, covering security vulnerabilities, architecture concerns, engineering hygiene, and mobile responsiveness. Changes are organized by priority tier.

---

## P0 — Critical Fixes (Must-fix before any deployment)

### 1. Version Number Unified to 1.1.2

| Location | Before | After |
|----------|--------|-------|
| `package.json` → `version` | `1.1.0` | `1.1.2` |
| `GET /api/health` → `version` | `1.1.0` (hardcoded) | Read from `package.json` |
| `login.html` / `register.html` `?v=` | `1.1.0` | `1.1.2` |

**What changed**: `backend/routes/index.js` now reads version from `package.json` dynamically, eliminating drift.

### 2. Google Login Button Disabled with "Coming Soon" Badge

**Files**: `auth-pages/login.html`, `auth-pages/register.html`, `auth-pages/css/styles.css`

The Google OAuth button is now visually disabled with a "Coming Soon" badge. Previously, the button was clickable but the backend returned 501 — a misleading user experience.

- Button has `disabled` attribute
- Added `.google-btn--disabled` CSS class
- Added `.coming-soon-badge` label

### 3. Terms of Service Replaced with Proper Legal Content

**File**: `auth-pages/terms.html`

The placeholder text has been replaced with substantive terms covering: acceptance, account security, acceptable use, billing, data privacy (GDPR/CCPA), intellectual property, service availability, suspension, liability, and changes to terms.

> **Note**: This is template legal content. Have your legal team review before production deployment.

### 4. Demo Credentials Removed from Frontend Bundle

**File**: `frontend/src/data/mockData.js`

| Field | Before | After |
|-------|--------|-------|
| `defaultGeneratorPassword` | `ChangeMe!234` | `••••••••` |
| `proxyUsers[].password` | Plaintext passwords | `••••••••` |
| `staticIps` | Real-looking IPs (`104.238.x.x`) | RFC 1918 private range (`10.0.x.x`) |

---

## P1 — Security & Architecture Hardening

### 5. JWT Secrets Separated for Access vs Refresh Tokens

**File**: `backend/controllers/auth.controller.js`, `.env.example`

Previously, both token types shared `JWT_SECRET`. Now:

- `JWT_ACCESS_SECRET` signs access tokens
- `JWT_REFRESH_SECRET` signs refresh tokens
- Falls back to `JWT_SECRET` if new env vars are not set (backward compatible)

**Migration**: Add `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to your `.env` file. If unset, the system falls back to `JWT_SECRET`.

### 6. Refresh Token Rotation Implemented

**File**: `backend/controllers/auth.controller.js`

`restoreSessionFromRefreshToken()` now:
1. Verifies the existing refresh token
2. **Revokes** the old refresh token
3. Issues a **new** refresh token alongside the new access token
4. Sets both tokens as cookies

This means each refresh token can only be used once, limiting the damage window if a token is compromised.

### 7. Timing Attack Mitigation on Login

**File**: `backend/controllers/auth.controller.js`

When a user is not found, the server now runs a dummy `verifyPassword()` call against a fake hash to normalize response timing, preventing user enumeration via timing side-channel.

### 8. Complete Login Audit Trail

**File**: `backend/controllers/auth.controller.js`

All failure scenarios now log via `User.logLoginAttempt()`:

| Scenario | Before | After |
|----------|--------|-------|
| User not found | No log | Logged as "User not found" |
| Account disabled | No log | Logged as "Account disabled" |
| Wrong password | Logged | Logged (unchanged) |
| Successful login | Logged | Logged (unchanged) |

### 9. Password Strength Validation Unified

**File**: `backend/utils/passwordHasher.js`

The `validatePasswordStrength()` function now enforces the same rules as `inputSanitizer.validateAuthInput('register')`:
- 8–72 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit

Previously, the checks for uppercase/lowercase/digit were commented out.

### 10. Database Connection Timeouts Added

**File**: `backend/config/database.js`

Added `connectTimeout: 10000` and `acquireTimeout: 10000` (10 seconds each) to prevent requests from hanging indefinitely when the database is unreachable.

### 11. Cookie Security Default Improved

**File**: `.env.example`

`AUTH_COOKIE_SECURE` changed from `false` to empty string. When empty, the code auto-detects based on `NODE_ENV`:
- `production` → Secure cookies (HTTPS only)
- Other → Non-secure (development)

This prevents accidentally deploying with insecure cookies.

---

## P2 — Maintenance & Experience Improvements

### 12. Oxylabs Branding Fully Replaced with Novada

**18 files updated** across backend middleware, utilities, auth pages, and comments. Global search confirms zero remaining "Oxylabs" references.

### 13. `syncDashboardLabels` DOM Hack Removed

**File**: `frontend/public/auth-gate.js`

The `setInterval` + `TreeWalker` DOM text replacement has been completely removed. The auth-gate now only:
1. Verifies the session via `/api/auth/verify`
2. Injects `window.__APP_AUTH_USER__` for React consumption
3. Renders a session pill using safe `document.createElement` (no `innerHTML`)

React components read user data directly from `sessionProfile` — no DOM manipulation conflicts.

### 14. Session Pill Uses Safe DOM Construction

**File**: `frontend/public/auth-gate.js`

`injectSessionPill()` rewritten to use `document.createElement` instead of `innerHTML`, eliminating potential XSS vectors even with `escapeHtml`. Also responsive: hides email text on screens < 480px.

### 15. `generateUniqueUsername` Race Condition Fixed

**File**: `backend/models/User.js`

Removed the internal SELECT-then-INSERT loop (20 queries). Now generates a random username directly and relies on the DB unique constraint + the controller's retry loop. This:
- Eliminates the race condition
- Reduces DB queries per registration by up to 20×
- Is simpler and more reliable

### 16. HashRouter → BrowserRouter

**File**: `frontend/src/main.jsx`

Switched from `HashRouter` to `BrowserRouter` with `basename="/app"`. The backend already handles SPA fallback for `/app/*` routes, so this produces cleaner URLs:
- Before: `/app/#/overview`
- After: `/app/overview`

### 17. `.gitignore` Added

Excludes: `node_modules/`, `frontend/dist/`, `.env`, IDE files, OS files, logs, coverage.

### 18. `frontend/dist/` Removed from Source

Build artifacts (630KB+ JS bundles including duplicate copies) are no longer included. Run `npm run build:frontend` to generate them.

### 19. ESLint Scope Expanded

**File**: `package.json`

`lint` script now covers both `backend/**/*.js` and `auth-pages/js/**/*.js`.

### 20. Error Handler Default-Secure

**File**: `backend/app.js`

Added explicit comment that database error details are never exposed. The `isDev` check already defaults to secure, but the intent is now documented.

---

## Mobile Adaptation (New)

### Auth Pages (login, register, terms)

- **Full-width card layout** on screens < 768px, centered within safe viewport
- **Left marketing panel hidden** on mobile (already existed at 960px, now refined)
- **iOS zoom prevention**: All text inputs set to `font-size: 16px` on mobile
- **Captcha row wraps** gracefully on narrow screens
- **Safe area insets** for notched devices (iPhone X+)
- **"Coming Soon" badge hidden** on very small screens (< 380px)
- **Touch-friendly tap targets**: Minimum 44px for interactive elements

### Dashboard (React SPA)

- **Collapsible sidebar**: Hidden off-screen by default on mobile, slides in with backdrop overlay
- **Hamburger menu** in header (visible on screens < 768px)
- **Close button** on sidebar (visible on mobile only)
- **Sidebar auto-closes** on route navigation
- **Header breadcrumbs** truncated on small screens
- **Overview page**: Product toggle and stats sections stack vertically on mobile
- **Session pill**: Email hidden on screens < 480px, shows only avatar + logout

---

## Migration Checklist

1. **Environment Variables** — Add to your `.env`:
   ```
   JWT_ACCESS_SECRET=<generate-unique-secret>
   JWT_REFRESH_SECRET=<generate-unique-secret>
   AUTH_COOKIE_SECURE=
   ```

2. **Rebuild Frontend** — `frontend/dist/` is no longer included:
   ```bash
   cd frontend && npm install && npm run build
   ```

3. **Review Terms of Service** — `auth-pages/terms.html` has template legal content. Replace with your actual legal text.

4. **Database** — No schema changes required. The `revoked_tokens` table will see more writes due to refresh token rotation.

5. **Test Login Flow** — Verify that:
   - Login → dashboard redirect works
   - Session refresh issues new cookies (check browser dev tools)
   - Logout clears both cookies
   - Mobile layout renders correctly on phone-sized screens

---

## Known Remaining Items (Future Work)

These items were identified in reviews but are beyond this release scope:

- **Redis-backed rate limiting** for multi-instance deployments
- **CSRF protection** (custom header or double-submit cookie)
- **CSP nonce support** for inline scripts
- **IPv6 / CIDR support** for IP whitelist
- **Automated test suite** (smoke tests for auth flow)
- **Google OAuth integration** (button ready, backend needs implementation)
- **`cookie-parser` migration** to replace custom `parseCookies`
- **`EndpointGenerator.jsx` refactoring** (1000+ lines → component split)

---

*Generated from merged review reports: code-review-novada-auth-dashboard.md + AI optimization suggestions*
