# Patch Notes v1.1.4

**Release Date**: 2026-03-13
**Previous Version**: v1.1.3
**Classification**: Critical Bug Fix + Security Audit + Dashboard Redesign + UX Enhancements

---

## Summary

This release fixes a critical captcha timezone bug that prevented login/registration, redesigns the Overview dashboard (Account Balance + Code Integration), adds Endpoint Generator UX improvements (whitelist dropdown, sticky session info, manage buttons), introduces current-IP auto-detection for the Whitelist page, and completes a comprehensive codebase audit with 30+ security and code quality fixes.

---

## Critical Bug Fix — Captcha Timezone Mismatch

### Captcha verification always returned "expired" even with correct answers
- **Root Cause**: MySQL `NOW()` returns server local time, but `timezone: '+00:00'` in mysql2 config stores `expires_at` in UTC. The comparison `expires_at > NOW()` always failed because the two timestamps were in different timezones.
- **Fix**: Replaced all 3 occurrences of `NOW()` with `UTC_TIMESTAMP()` in captcha SQL queries:
  - `preVerifyCaptcha()`: `expires_at > UTC_TIMESTAMP()`
  - `verifyCaptcha()`: `expires_at > UTC_TIMESTAMP()`
  - `cleanupExpiredSessions()`: `expires_at < UTC_TIMESTAMP()`
- **Secondary Fix**: Changed captcha input event from `keypress` to `keydown` with `e.stopPropagation()` to prevent form submission race condition on Enter key
- **Secondary Fix**: `isVerified()` in server captcha mode now requires `this.state.isVerified` to be true (was only checking token existence)
- **Files**: `backend/middleware/captchaValidator.js`, `auth-pages/js/components/CaptchaWidget.js`

---

## Overview Page Redesign

### Bandwidth Usage → Account Balance
- Replaced the old Bandwidth Usage card with an Account Balance card showing:
  - Available balance in GB (e.g., "57.2 GB")
  - Plan expiration date
  - Remaining days until expiration
  - "Top up balance" link to Rotating Proxies page
- **Files**: `frontend/src/pages/Overview.jsx`

### Knowledge Spotlight → Code Integration
- Replaced the Knowledge Spotlight section with a Code Integration card featuring:
  - Ready-to-use proxy snippets in 3 languages: cURL, Python, Node.js
  - Tab-based language switching
  - Fixed-height (220px) code block with syntax-appropriate styling
  - One-click copy button
  - Description text explaining how to use the snippets
  - Link to Endpoint Generator for credential configuration
- **Files**: `frontend/src/pages/Overview.jsx`

### Welcome Section Cleanup
- Removed username/email from "Welcome back" heading — now just "Welcome back"
- Removed unused imports (`appProfile`, `sessionProfile`, `Activity`, `Calendar`, `Sparkles`)
- **Files**: `frontend/src/pages/Overview.jsx`

---

## Endpoint Generator Improvements

### Authentication Method Redesign
- **User Auth mode**: Removed Password field — now only shows Username dropdown. Added "Manage Users" navigation button linking to `/tools/users`
- **Whitelist mode**: Added dropdown selector populated with existing whitelisted IPs from mock data. Added "Manage Whitelist" navigation button linking to `/tools/whitelist`
- **Files**: `frontend/src/pages/EndpointGenerator.jsx`

### Sticky Session Changes
- Maximum sticky duration increased from 60 → 120 minutes
- Removed "Automatically switch when IP becomes unavailable" checkbox
- Replaced with an amber info notice explaining the 120-minute maximum and automatic IP rotation behavior
- Input field now enforces max=120 constraint
- **Files**: `frontend/src/pages/EndpointGenerator.jsx`

---

## Whitelisted IPs — Current IP Detection

### Auto-detect user's current IP
- "Use sample IP" button replaced with "Use my current IP" button
- Calls `GET /api/client-ip` backend endpoint to detect the user's actual public IP
- Shows loading spinner during detection
- Displays success/error notification after detection
- **Files**: `frontend/src/pages/WhitelistedIPs.jsx`

### New Backend Endpoint
- Added `GET /api/client-ip` endpoint to `backend/routes/index.js`
- Extracts IP from `req.ip` with `::ffff:` IPv6-mapped IPv4 prefix stripping
- Returns `{ success: true, data: { ip: "..." } }`
- **Files**: `backend/routes/index.js`

---

## 404 Page & HTML Language Fix

### 404 Catch-All Route
- Added a styled 404 "Page not found" fallback route in the React app
- Includes a "Back to Overview" button linking to `/overview`
- **Files**: `frontend/src/App.jsx`

### HTML Language Attribute Fix
- Changed `lang="zh-CN"` to `lang="en"` on login, register, and dashboard redirect pages (content is English)
- **Files**: `auth-pages/login.html`, `auth-pages/register.html`, `auth-pages/dashboard.html`

---

## Codebase Audit — Code Quality & UX Fixes

### A1. Overview.jsx Clipboard Error Handling
- `handleCopy()` now wraps `navigator.clipboard.writeText()` in try/catch to prevent unhandled rejection in insecure contexts
- **Files**: `frontend/src/pages/Overview.jsx`

### A2. WhitelistedIPs.jsx IPv4 Validation Hardened
- `isValidIpv4()` now rejects leading zeros (e.g., "01.02.03.04") by checking `part === String(Number(part))`
- Prevents ambiguous octal interpretation of IP addresses
- **Files**: `frontend/src/pages/WhitelistedIPs.jsx`

### A3. EndpointGenerator.jsx Dead Code Cleanup
- `rotateOnFailure` changed from `useState(true)` (with removed setter) to a plain `const` — no longer wastes a React state slot
- **Files**: `frontend/src/pages/EndpointGenerator.jsx`

### A4. CaptchaWidget.js Verify Race Condition
- Added `_verifying` guard flag to prevent re-entry into `verify()` during the 1.2-second wrong-answer cooldown timeout
- Applied to both server captcha and local captcha modes
- Prevents duplicate server requests and UI state corruption from rapid clicking
- **Files**: `auth-pages/js/components/CaptchaWidget.js`

### A5. Header.jsx Email Tooltip
- Added `title` attribute to the truncated email display so users can hover to see the full address
- **Files**: `frontend/src/components/Header.jsx`

### A6. Window Timer Pollution Cleanup
- **WhitelistedIPs.jsx**: Replaced `window.__whitelistFeedbackTimer` with `useRef`
- **EndpointGenerator.jsx**: Replaced `window.__endpointNoticeTimer` and `window.__endpointCopiedTimer` with `useRef`
- Prevents global namespace pollution and potential cross-component timer conflicts
- **Files**: `frontend/src/pages/WhitelistedIPs.jsx`, `frontend/src/pages/EndpointGenerator.jsx`

---

## Security Audit — Critical & High Priority Fixes

### H1. CSRF Protection Added
- Added `X-Requested-With: NovadaClient` custom header check on all POST/PUT/DELETE routes
- Frontend `api.js` and `auth-gate.js` now send the header on every request
- **Files**: `backend/app.js`, `auth-pages/js/utils/api.js`, `frontend/public/auth-gate.js`

### H2. Refresh Token Race Condition Fixed
- Token rotation now uses `INSERT IGNORE INTO revoked_tokens` for atomic, race-condition-free rotation
- **Files**: `backend/controllers/auth.controller.js`

### H3. Rate Limiting — IP Ceiling Added
- Added `authIpCeilingLimiter` (15 req/5min, IP-only key) to prevent distributed brute-force across multiple emails
- **Files**: `backend/middleware/rateLimiter.js`, `backend/routes/auth.routes.js`

### H4. Refresh & Logout Rate Limiting
- Added `refreshRateLimiter` and `logoutRateLimiter` (10 req/min each) to prevent token-churn DoS
- **Files**: `backend/middleware/rateLimiter.js`, `backend/routes/auth.routes.js`

### H5. Privilege Escalation via Status Field Blocked
- Removed `status` from User model `update()` allowedFields to prevent self-activation
- **Files**: `backend/models/User.js`

### H6. Open Redirect & XSS in Success Animation
- Redirect URL validation (must start with `/`, no `//`)
- Replaced `innerHTML` with safe DOM manipulation (createElement/textContent)
- **Files**: `auth-pages/js/components/SuccessAnimation.js`

---

## Security Audit — Medium Priority Fixes

### M1. Database Queue Limit
- Changed connection pool `queueLimit` from `0` (unlimited) to `50`
- **Files**: `backend/config/database.js`

### M2. In-Memory Rate Limiter Production Warning
- Logs a warning at startup when using the default in-memory store in production
- **Files**: `backend/middleware/rateLimiter.js`

### M4. innerHTML Sanitization
- SuccessAnimation now uses safe DOM APIs instead of innerHTML
- **Files**: `auth-pages/js/components/SuccessAnimation.js`

### M5. Captcha Fail-Open → Fail-Closed
- Network errors during captcha pre-check now block submission instead of optimistic pass
- **Files**: `auth-pages/js/components/CaptchaWidget.js`

### M7. JSON.parse Hardening in Order Model
- All `JSON.parse(order.server_config)` calls wrapped in try/catch
- **Files**: `backend/models/Order.js`

### M8. CORS Production Lockdown
- Production mode now requires explicit `CORS_ALLOWED_ORIGINS` or rejects all cross-origin
- **Files**: `backend/app.js`

### M9. Vite Dev Server Binding
- Changed `host: true` (0.0.0.0) to `host: 'localhost'`
- **Files**: `frontend/vite.config.js`

### M10. Modulo Bias in Random Token Generation
- Replaced `bytes[i] % chars.length` with `crypto.randomInt(chars.length)`
- **Files**: `backend/models/User.js`

### M11. password_hash NOT NULL Constraint
- Changed `password_hash` column from `DEFAULT NULL` to `NOT NULL`
- **Files**: `database/dashboard_extension.sql`

---

## Security Audit — Code Quality Fixes

### C1. Password Special Character Validation
- Changed `requireSpecial` default to `true`
- Fixed special char regex to `/[^a-zA-Z0-9\s]/` (any non-alphanumeric)
- Backend `inputSanitizer.js` and `passwordHasher.js` updated to match
- **Files**: `auth-pages/js/utils/validation.js`, `backend/middleware/inputSanitizer.js`, `backend/utils/passwordHasher.js`

### C2. Captcha Brute-Force Oracle Eliminated
- Wrong captcha answer now consumes the token (`UPDATE captcha_sessions SET is_used = TRUE`)
- Returns a fresh `newCaptcha: { token, question }` on wrong answer or expiry
- **Files**: `backend/middleware/captchaValidator.js`, `backend/controllers/auth.controller.js`, `auth-pages/js/components/CaptchaWidget.js`

---

## Security Audit — Low Priority Fixes

### L1. Graceful Shutdown Timeout
- Added 10-second forced shutdown timer to prevent zombie processes
- **Files**: `backend/server.js`

### L2. Path Disclosure in 404 Response
- Removed `path: req.originalUrl` from 404 JSON response
- **Files**: `backend/routes/index.js`

### L3. Unused Dependency Removed
- Removed `uuid` from package.json dependencies
- **Files**: `package.json`

### L4. Email Length Limits
- Added 254-char total, 64-char local part, and min 2-char TLD validation
- **Files**: `auth-pages/js/utils/validation.js`

### L5. Common Password Dictionary + Pattern Penalties
- Added 20-entry common password list and sequential/repeating pattern scoring penalties
- **Files**: `auth-pages/js/utils/validation.js`

### L6. Idempotent Migration Script
- `ALTER TABLE` in migration now checks `INFORMATION_SCHEMA.STATISTICS` before execution
- **Files**: `database/migrations/001_add_username_unique_and_revoked_tokens.sql`

### L7. Frozen Auth User Object
- `window.__APP_AUTH_USER__` is now frozen via `Object.freeze()` to prevent tampering
- **Files**: `frontend/public/auth-gate.js`

### L8. Revoked Tokens Table Startup Check
- Server now verifies `revoked_tokens` table exists at startup
- **Files**: `backend/server.js`

---

## Error Messages & Customer Service Reference Codes

### Comprehensive Error Message System
- `errorMessages.js` completely rewritten with structured `{ text, ref }` objects
- Reference codes follow `[REF: AREA-NNN]` format for customer service triage:
  - `AUTH-001` ~ `AUTH-004`: Authentication errors
  - `CAPTCHA-001`: Captcha validation
  - `RATE-001` ~ `RATE-003`: Rate limiting
  - `REG-001` ~ `REG-003`: Registration errors
  - `SESSION-001` ~ `SESSION-004`: Session/token errors
  - `CSRF-001`: CSRF rejection
  - `NET-001` ~ `NET-002`: Network errors
  - `SYS-001` ~ `SYS-002`: Server/system errors
- Three accessor methods: `get(code)`, `getText(code)`, `getRef(code)`
- **Files**: `auth-pages/js/utils/errorMessages.js`

### All Alert() Calls Replaced with In-Card Banners
- Login and register pages now show styled `.page-error` banners instead of browser `alert()` dialogs
- Added `DOM.showPageError()` and `DOM.clearPageError()` helper methods
- All error paths in `login.js` and `register.js` use `ErrorMessages.get()` with reference codes
- **Files**: `auth-pages/js/pages/login.js`, `auth-pages/js/pages/register.js`, `auth-pages/js/utils/dom.js`, `auth-pages/login.html`, `auth-pages/register.html`, `auth-pages/css/styles.css`

---

## Product Rename: Unlimited Proxies → Static ISP Proxies

### Page Rewrite
- Title, description, and all feature copy rewritten for Static ISP Proxies
- Emphasized: real ISP-assigned residential IPs, high trust score, dedicated allocation, long-lived sessions
- Removed the **Pricing** tab entirely — Static ISP Proxies no longer have self-service pricing
- Added a **"Contact Sales"** notice banner on the Information page explaining that allocations are provisioned individually by the sales team
- **Files**: `frontend/src/pages/UnlimitedProxies.jsx`

### Navigation & Routing
- Sidebar label: "Unlimited Proxies" → "Static ISP Proxies"
- Route path: `/products/unlimited` → `/products/static-isp`
- Header breadcrumb updated accordingly
- **Files**: `frontend/src/components/Sidebar.jsx`, `frontend/src/components/Header.jsx`, `frontend/src/App.jsx`

### Overview Page
- Removed the Rotating / Unlimited product toggle — now shows only Rotating Proxies dashboard
- Removed all Unlimited-specific views (service expiration countdown, CPU load gauge, egress bandwidth gauge)
- Removed `unlimitedMessages` and `unlimitedSteps` data
- **Files**: `frontend/src/pages/Overview.jsx`

### Endpoint Generator
- Removed the "Product Type" toggle (Rotating vs Unlimited)
- Removed the entire Unlimited Proxies endpoint generation section (static IP checkboxes, unlimited auth config)
- Now exclusively generates Rotating Proxies endpoints
- **Files**: `frontend/src/pages/EndpointGenerator.jsx`

---

## Mobile Responsiveness — Login & Register

### Mobile Logo
- Added a Novada logo (`N` icon + "novada" text) above the auth card, visible only on screens ≤ 960px where the left marketing panel is hidden
- Logo uses the same purple gradient brand styling as the desktop sidebar
- **Files**: `auth-pages/login.html`, `auth-pages/register.html`, `auth-pages/css/styles.css`

### Layout Adjustments
- Container gap reduced to `0` on mobile so the logo sits directly above the card
- Mobile-specific margin adjustments for the logo at ≤ 480px breakpoint

---

## Version Bump

All version references updated from `1.1.2` / `1.1.3` to `1.1.4`:
- `package.json` version field
- All `?v=` cache-bust query strings in HTML and CSS
- Folder renamed from `novada-auth-dashboard-v1.1.3` to `novada-auth-dashboard-v1.1.4`
