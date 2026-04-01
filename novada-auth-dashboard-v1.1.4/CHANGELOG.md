# Novada Auth Dashboard — Changelog

All notable changes to this project are documented here, organized by release in reverse-chronological order.

---

## v1.1.4 — 2026-03-13

**Classification**: Critical Bug Fix + Security Audit + Dashboard Redesign + UX Enhancements

### Summary

Fixes a critical captcha timezone bug that prevented login/registration, redesigns the Overview dashboard (Account Balance + Code Integration), adds Endpoint Generator UX improvements (whitelist dropdown, sticky session info, manage buttons), introduces current-IP auto-detection for the Whitelist page, and completes a comprehensive codebase audit with 30+ security and code quality fixes.

---

### Critical Bug Fix — Captcha Timezone Mismatch

- **Root Cause**: MySQL `NOW()` returns server local time, but `timezone: '+00:00'` in mysql2 config stores `expires_at` in UTC. The comparison `expires_at > NOW()` always failed because the two timestamps were in different timezones.
- **Fix**: Replaced all 3 occurrences of `NOW()` with `UTC_TIMESTAMP()` in captcha SQL queries (`preVerifyCaptcha`, `verifyCaptcha`, `cleanupExpiredSessions`)
- **Secondary Fix**: Changed captcha input event from `keypress` to `keydown` with `e.stopPropagation()` to prevent form submission race condition on Enter key
- **Secondary Fix**: `isVerified()` in server captcha mode now requires `this.state.isVerified` to be true (was only checking token existence)
- **Files**: `backend/middleware/captchaValidator.js`, `auth-pages/js/components/CaptchaWidget.js`

---

### Overview Page Redesign

- **Account Balance card**: Replaced Bandwidth Usage with Account Balance showing available GB, plan expiration date, remaining days, and a "Top up balance" link
- **Code Integration card**: Replaced Knowledge Spotlight with ready-to-use proxy snippets in cURL, Python, and Node.js with tab switching, syntax styling, and one-click copy
- **Welcome section**: Removed username/email from heading; removed unused imports
- **Files**: `frontend/src/pages/Overview.jsx`

---

### Endpoint Generator Improvements

- **User Auth mode**: Removed Password field — now only shows Username dropdown. Added "Manage Users" navigation button
- **Whitelist mode**: Added dropdown selector populated with existing whitelisted IPs. Added "Manage Whitelist" navigation button
- **Sticky session**: Maximum duration increased from 60 → 120 minutes. Removed "Automatically switch when IP becomes unavailable" checkbox. Added amber info notice.
- **Files**: `frontend/src/pages/EndpointGenerator.jsx`

---

### Whitelisted IPs — Current IP Detection

- "Use sample IP" replaced with "Use my current IP" — calls `GET /api/client-ip` to detect user's actual public IP
- New `GET /api/client-ip` backend endpoint with `::ffff:` IPv6-mapped IPv4 prefix stripping
- **Files**: `frontend/src/pages/WhitelistedIPs.jsx`, `backend/routes/index.js`

---

### 404 Page & HTML Language Fix

- Added styled 404 "Page not found" fallback route in the React app with "Back to Overview" button
- Changed `lang="zh-CN"` to `lang="en"` on login, register, and dashboard redirect pages
- **Files**: `frontend/src/App.jsx`, `auth-pages/login.html`, `auth-pages/register.html`, `auth-pages/dashboard.html`

---

### Security Audit — Critical & High Priority

| ID | Fix | Files |
|----|-----|-------|
| H1 | **CSRF Protection**: `X-Requested-With: NovadaClient` header check on all POST/PUT/DELETE routes | `backend/app.js`, `auth-pages/js/utils/api.js`, `frontend/public/auth-gate.js` |
| H2 | **Refresh Token Race Condition**: `INSERT IGNORE INTO revoked_tokens` for atomic, race-condition-free rotation | `backend/controllers/auth.controller.js` |
| H3 | **Rate Limiting IP Ceiling**: `authIpCeilingLimiter` (15 req/5min, IP-only key) to prevent distributed brute-force | `backend/middleware/rateLimiter.js`, `backend/routes/auth.routes.js` |
| H4 | **Refresh & Logout Rate Limiting**: `refreshRateLimiter` and `logoutRateLimiter` (10 req/min each) | `backend/middleware/rateLimiter.js`, `backend/routes/auth.routes.js` |
| H5 | **Privilege Escalation Blocked**: Removed `status` from User model `update()` allowedFields | `backend/models/User.js` |
| H6 | **Open Redirect & XSS in SuccessAnimation**: Redirect URL validation + replaced `innerHTML` with safe DOM APIs | `auth-pages/js/components/SuccessAnimation.js` |

### Security Audit — Medium Priority

| ID | Fix | Files |
|----|-----|-------|
| M1 | Database connection pool `queueLimit` changed from `0` (unlimited) to `50` | `backend/config/database.js` |
| M2 | In-memory rate limiter logs a production warning at startup | `backend/middleware/rateLimiter.js` |
| M4 | SuccessAnimation uses safe DOM APIs instead of innerHTML | `auth-pages/js/components/SuccessAnimation.js` |
| M5 | Captcha network errors now block submission (fail-closed) instead of optimistic pass | `auth-pages/js/components/CaptchaWidget.js` |
| M7 | All `JSON.parse(order.server_config)` calls wrapped in try/catch | `backend/models/Order.js` |
| M8 | CORS production lockdown: requires explicit `CORS_ALLOWED_ORIGINS` or rejects all cross-origin | `backend/app.js` |
| M9 | Vite dev server binding changed from `0.0.0.0` to `localhost` | `frontend/vite.config.js` |
| M10 | Modulo bias fixed: replaced `bytes[i] % chars.length` with `crypto.randomInt(chars.length)` | `backend/models/User.js` |
| M11 | `password_hash` column changed from `DEFAULT NULL` to `NOT NULL` | `database/dashboard_extension.sql` |

### Security Audit — Code Quality

| ID | Fix | Files |
|----|-----|-------|
| C1 | Password special character validation: `requireSpecial` default set to `true`; regex fixed to `/[^a-zA-Z0-9\s]/` | `auth-pages/js/utils/validation.js`, `backend/middleware/inputSanitizer.js`, `backend/utils/passwordHasher.js` |
| C2 | Captcha brute-force oracle eliminated: wrong answer now consumes the token; returns fresh captcha | `backend/middleware/captchaValidator.js`, `backend/controllers/auth.controller.js`, `auth-pages/js/components/CaptchaWidget.js` |

### Security Audit — Low Priority

| ID | Fix | Files |
|----|-----|-------|
| L1 | Graceful shutdown: 10-second forced shutdown timer to prevent zombie processes | `backend/server.js` |
| L2 | Removed `path: req.originalUrl` from 404 JSON response (path disclosure) | `backend/routes/index.js` |
| L3 | Removed unused `uuid` dependency | `package.json` |
| L4 | Email validation: 254-char total, 64-char local part, min 2-char TLD | `auth-pages/js/utils/validation.js` |
| L5 | Common password dictionary (20 entries) + sequential/repeating pattern scoring penalties | `auth-pages/js/utils/validation.js` |
| L6 | Migration script `ALTER TABLE` checks `INFORMATION_SCHEMA.STATISTICS` before execution (idempotent) | `database/migrations/001_add_username_unique_and_revoked_tokens.sql` |
| L7 | `window.__APP_AUTH_USER__` frozen via `Object.freeze()` to prevent client-side tampering | `frontend/public/auth-gate.js` |
| L8 | Server verifies `revoked_tokens` table exists at startup | `backend/server.js` |

---

### Code Quality & UX Fixes

| ID | Fix | Files |
|----|-----|-------|
| A1 | `handleCopy()` wraps clipboard API in try/catch for insecure contexts | `frontend/src/pages/Overview.jsx` |
| A2 | `isValidIpv4()` rejects leading zeros (e.g., "01.02.03.04") | `frontend/src/pages/WhitelistedIPs.jsx` |
| A3 | `rotateOnFailure` changed from unused `useState` to plain `const` | `frontend/src/pages/EndpointGenerator.jsx` |
| A4 | CaptchaWidget `_verifying` guard prevents re-entry during wrong-answer cooldown | `auth-pages/js/components/CaptchaWidget.js` |
| A5 | Email display in Header gets `title` tooltip for full address on hover | `frontend/src/components/Header.jsx` |
| A6 | Timer refs moved from `window.__*` globals to `useRef` (WhitelistedIPs, EndpointGenerator) | `frontend/src/pages/WhitelistedIPs.jsx`, `frontend/src/pages/EndpointGenerator.jsx` |

---

### Error Messages & Customer Service Reference Codes

- `errorMessages.js` rewritten with structured `{ text, ref }` objects
- Reference codes: `AUTH-001~004`, `CAPTCHA-001`, `RATE-001~003`, `REG-001~003`, `SESSION-001~004`, `CSRF-001`, `NET-001~002`, `SYS-001~002`
- Three accessor methods: `get(code)`, `getText(code)`, `getRef(code)`
- All `alert()` calls replaced with styled in-card `.page-error` banners on login and register pages
- **Files**: `auth-pages/js/utils/errorMessages.js`, `auth-pages/js/pages/login.js`, `auth-pages/js/pages/register.js`, `auth-pages/js/utils/dom.js`

---

### Product Rename: Unlimited Proxies → Static ISP Proxies

- Page rewritten for Static ISP Proxies (real ISP-assigned residential IPs, dedicated allocation, long-lived sessions)
- Removed Pricing tab; added "Contact Sales" notice banner
- Sidebar label, route path (`/products/static-isp`), and header breadcrumb updated
- Overview page: removed Rotating/Unlimited product toggle — now shows only Rotating Proxies
- Endpoint Generator: removed Product Type toggle and all Unlimited Proxies endpoint generation
- **Files**: `frontend/src/pages/UnlimitedProxies.jsx`, `frontend/src/components/Sidebar.jsx`, `frontend/src/components/Header.jsx`, `frontend/src/App.jsx`, `frontend/src/pages/Overview.jsx`, `frontend/src/pages/EndpointGenerator.jsx`

---

### Mobile Responsiveness — Login & Register

- Added Novada logo (N icon + "novada" text) above auth card, visible on screens ≤ 960px
- Container gap reduced to `0` on mobile; mobile-specific margin adjustments at ≤ 480px
- **Files**: `auth-pages/login.html`, `auth-pages/register.html`, `auth-pages/css/styles.css`

---

### Version Bump

- `package.json`, all `?v=` cache-bust strings, and folder name updated from v1.1.3 → v1.1.4

---

## v1.1.3

**Classification**: Critical Bug Fixes + Security Hardening + Resilience

### Critical Bug Fixes

#### 1. Captcha Real-Time Pre-Verification
- **Problem**: The captcha "Check" button only validated that input was a number, showing green ✓ "Ready" even when the answer was wrong. Real verification only happened on form submit, causing a confusing retry loop.
- **Fix**: Added `POST /api/auth/captcha/verify` endpoint for non-destructive server-side answer checking. Falls back gracefully to the old behavior if the endpoint is unavailable.
- **Files**: `CaptchaWidget.js`, `api.js`, `auth.controller.js`, `captchaValidator.js`, `auth.routes.js`

#### 2. Refresh Token Loses "Remember Me" Flag
- **Problem**: Rotated refresh tokens always used the short 12h expiration regardless of the original "Remember Me" setting (which should give 30d).
- **Fix**: `rememberMe` flag embedded in refresh token payload and preserved during rotation.
- **Files**: `auth.controller.js`

#### 3. Invalid Dummy BCrypt Hash Causes Console Errors
- **Problem**: The timing-attack prevention dummy hash was not a valid bcrypt hash, causing `bcrypt.compare()` to throw on every failed-email login.
- **Fix**: Replaced with a properly formatted bcrypt hash.
- **Files**: `auth.controller.js`

#### 4. Username Collision Space Exhaustion
- **Problem**: `generateUniqueUsername()` used 5-digit numbers (90,000 possible values), increasing collisions with user growth.
- **Fix**: Switched to 8-character alphanumeric suffix via `crypto.randomBytes()` (~2.8 trillion possibilities). Backward compatible with existing `Proxy#####` usernames.
- **Files**: `User.js`

#### 5. Session Utility Static Evaluation
- **Problem**: `frontend/src/utils/session.js` evaluated `window.__APP_AUTH_USER__` at module import time. In Vite dev server, user was always null even after bootstrap set it.
- **Fix**: Replaced static values with Proxy-based getters that resolve at access time.
- **Files**: `frontend/src/utils/session.js`

### Improvements

- Captcha validation errors now clearly state "Incorrect answer" instead of "Please complete the security check"
- Form validation distinguishes between "no answer entered" and "answer not yet verified"
- Added centralized `ErrorMessages.js` for consistent error text across pages
- SQL pattern detection in `inputSanitizer` logs only in development mode
- JWT secret separation warning printed at startup when falling back to shared `JWT_SECRET`
- `user_agent` in login attempts truncated to 512 chars to prevent storage abuse
- Cookie configuration debug logging in development mode
- Added React `ErrorBoundary` wrapping the dashboard app to prevent white-screen crashes
- Database connection pool checks for closed state and recreates automatically
- `.env.example` expanded with detailed comments on `NODE_ENV`, `AUTH_COOKIE_SECURE`, and `BCRYPT_ROUNDS`

### New Files

- `auth-pages/js/utils/errorMessages.js` — Centralized API error code → user message mapping
- `frontend/src/components/ErrorBoundary.jsx` — React error boundary with retry/navigation

### New API Endpoint

- `POST /api/auth/captcha/verify` — Non-destructive captcha answer pre-check (rate-limited)

---

## v1.1.2 — 2026-03-03

**Classification**: Security Hardening + Mobile Adaptation + Engineering Cleanup

### Summary

Addresses **22 issues** identified across two independent code reviews, covering security vulnerabilities, architecture concerns, engineering hygiene, and mobile responsiveness.

---

### P0 — Critical Fixes

#### 1. Version Number Unified to 1.1.2
- `package.json` version updated to `1.1.2`
- `GET /api/health` now reads version dynamically from `package.json` (eliminates drift)
- All `?v=` cache-bust strings updated in HTML/CSS

#### 2. Google Login Button Disabled with "Coming Soon" Badge
- Button now has `disabled` attribute and `.google-btn--disabled` CSS class
- Added `.coming-soon-badge` label — previously the button was clickable but returned 501
- **Files**: `auth-pages/login.html`, `auth-pages/register.html`, `auth-pages/css/styles.css`

#### 3. Terms of Service Replaced with Proper Legal Content
- Placeholder text replaced with substantive terms covering acceptance, account security, acceptable use, billing, data privacy (GDPR/CCPA), intellectual property, service availability, suspension, liability, and amendments
- **Note**: Template legal content — have legal team review before production
- **File**: `auth-pages/terms.html`

#### 4. Demo Credentials Removed from Frontend Bundle
- `defaultGeneratorPassword`: `ChangeMe!234` → `••••••••`
- `proxyUsers[].password`: plaintext → `••••••••`
- `staticIps`: real-looking IPs (`104.238.x.x`) → RFC 1918 range (`10.0.x.x`)
- **File**: `frontend/src/data/mockData.js`

---

### P1 — Security & Architecture Hardening

#### 5. JWT Secrets Separated for Access vs Refresh Tokens
- `JWT_ACCESS_SECRET` signs access tokens; `JWT_REFRESH_SECRET` signs refresh tokens
- Falls back to `JWT_SECRET` if new vars are not set (backward compatible)
- **Migration**: Add `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to `.env`
- **Files**: `backend/controllers/auth.controller.js`, `.env.example`

#### 6. Refresh Token Rotation Implemented
- `restoreSessionFromRefreshToken()` now revokes the old refresh token and issues a new one alongside a new access token
- Each refresh token can only be used once
- **Files**: `backend/controllers/auth.controller.js`

#### 7. Timing Attack Mitigation on Login
- When user is not found, server runs a dummy `verifyPassword()` call to normalize response timing and prevent user enumeration
- **Files**: `backend/controllers/auth.controller.js`

#### 8. Complete Login Audit Trail
- All failure scenarios now log via `User.logLoginAttempt()`: user not found, account disabled, wrong password, successful login
- **Files**: `backend/controllers/auth.controller.js`

#### 9. Password Strength Validation Unified
- `validatePasswordStrength()` now enforces the same rules as `inputSanitizer.validateAuthInput('register')`: 8–72 chars, uppercase, lowercase, digit
- Previously, the uppercase/lowercase/digit checks were commented out
- **Files**: `backend/utils/passwordHasher.js`

#### 10. Database Connection Timeouts Added
- Added `connectTimeout: 10000` and `acquireTimeout: 10000` to prevent hanging when DB is unreachable
- **Files**: `backend/config/database.js`

#### 11. Cookie Security Default Improved
- `AUTH_COOKIE_SECURE` changed from `false` to empty string — auto-detects based on `NODE_ENV`
- **Files**: `.env.example`

---

### P2 — Maintenance & Experience Improvements

#### 12. Oxylabs Branding Fully Replaced with Novada
- 18 files updated; zero remaining "Oxylabs" references

#### 13. `syncDashboardLabels` DOM Hack Removed
- `setInterval` + `TreeWalker` DOM text replacement completely removed from `auth-gate.js`
- Auth-gate now only: verifies session, injects `window.__APP_AUTH_USER__`, renders session pill
- **Files**: `frontend/public/auth-gate.js`

#### 14. Session Pill Uses Safe DOM Construction
- `injectSessionPill()` rewritten with `document.createElement` instead of `innerHTML`
- Responsive: hides email text on screens < 480px
- **Files**: `frontend/public/auth-gate.js`

#### 15. `generateUniqueUsername` Race Condition Fixed
- Removed internal SELECT-then-INSERT loop (up to 20 queries). Now generates a random username directly and relies on DB unique constraint + controller retry loop
- **Files**: `backend/models/User.js`

#### 16. HashRouter → BrowserRouter
- Switched from `HashRouter` to `BrowserRouter` with `basename="/app"`
- URLs: `/app/#/overview` → `/app/overview`
- **Files**: `frontend/src/main.jsx`

#### 17. `.gitignore` Added
- Excludes: `node_modules/`, `frontend/dist/`, `.env`, IDE files, OS files, logs, coverage

#### 18. `frontend/dist/` Removed from Source
- Build artifacts no longer committed. Run `npm run build:frontend` to generate them.

#### 19. ESLint Scope Expanded
- `lint` script now covers both `backend/**/*.js` and `auth-pages/js/**/*.js`
- **Files**: `package.json`

#### 20. Error Handler Default-Secure
- Added comment confirming database error details are never exposed in responses
- **Files**: `backend/app.js`

---

### Mobile Adaptation

**Auth Pages** (login, register, terms):
- Full-width card layout on screens < 768px
- Left marketing panel hidden on mobile (refined from 960px)
- iOS zoom prevention: all text inputs set to `font-size: 16px` on mobile
- Captcha row wraps gracefully on narrow screens
- Safe area insets for notched devices (iPhone X+)
- "Coming Soon" badge hidden on very small screens (< 380px)
- Touch-friendly tap targets: minimum 44px

**Dashboard** (React SPA):
- Collapsible sidebar: hidden off-screen on mobile, slides in with backdrop overlay
- Hamburger menu in header (visible on screens < 768px)
- Close button on sidebar (mobile only)
- Sidebar auto-closes on route navigation
- Header breadcrumbs truncated on small screens
- Overview page stats stack vertically on mobile
- Session pill: email hidden on screens < 480px

---

### Migration Checklist (v1.1.2)

1. Add to `.env`:
   ```
   JWT_ACCESS_SECRET=<generate-unique-secret>
   JWT_REFRESH_SECRET=<generate-unique-secret>
   AUTH_COOKIE_SECURE=
   ```
2. Rebuild frontend: `cd frontend && npm install && npm run build`
3. Review `auth-pages/terms.html` — replace template legal text with actual terms
4. No schema changes required; `revoked_tokens` table will see more writes due to rotation

---

## v1.1.1

**Classification**: Deployment & Routing Fixes (no visual changes)

### Fixed

- Protected `/app`, `/app/`, and `/app/index.html` on the server side before serving the dashboard shell
- Prevented `express.static()` from bypassing the protected dashboard route
- Added a shared server-side session resolver so route protection and `/api/auth/verify` use the same auth resolution path
- Changed the dashboard entry bundle to a stable filename target (`assets/dashboard-app.js`) for future builds
- Updated the current built package to include `frontend/dist/assets/dashboard-app.js`
- Removed the hard dependency on a single hashed JS filename inside `auth-gate.js`
- Kept startup alive when `.env` is incomplete or MySQL is temporarily unavailable (degraded mode instead of hard exit)
- Replaced the legacy `auth-pages/dashboard.html` with a safe redirect to `/app/`
- Fixed the dead Terms of Service link on the registration page; added a placeholder `auth-pages/terms.html` page
- Added a working ESLint config and corrected the root `lint` script
- Updated leftover `Oxylabs` code comments to `Novada` in touched backend files

### Notes

- Prebuilt dashboard (`frontend/dist`) still uses `auth-gate.js` with the included stable bundle path
- Future frontend rebuilds work because the source bootstrap verifies the session if `window.__APP_AUTH_USER__` is not already present
- Business modules inside the dashboard (Users / Whitelist / charts) remain demo-data driven until connected to real APIs
