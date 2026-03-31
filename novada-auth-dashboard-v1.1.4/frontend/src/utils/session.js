/**
 * =============================================================================
 * Novada Dashboard - Session Utility
 * =============================================================================
 * Provides reactive access to the authenticated user injected by auth-gate.js
 * or the bootstrap fallback in main.jsx.
 *
 * Uses getter functions instead of static top-level evaluation because
 * window.__APP_AUTH_USER__ may not be set at module parse time (e.g. when
 * loaded via Vite dev server without auth-gate).
 */

const getInitials = (value) => {
  if (!value) return 'NV'
  const clean = String(value).replace(/[^a-zA-Z0-9]+/g, ' ').trim()
  if (!clean) return 'NV'
  const parts = clean.split(/\s+/).slice(0, 2)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return clean.slice(0, 2).toUpperCase()
}

/** Get the current authenticated user object (null if no session). */
export const getSessionUser = () => {
  return (typeof window !== 'undefined' ? window.__APP_AUTH_USER__ : null) || null
}

/** Build a display profile from the current session user. */
export const getSessionProfile = () => {
  const user = getSessionUser()
  return {
    initials: getInitials(user?.username || user?.email || 'NV'),
    displayName: user?.username || 'Novada Operator',
    email: user?.email || 'auth@novada.local',
    plan: 'Authenticated Session',
    welcomeName: user?.username || 'Operator',
  }
}

// Backward-compatible proxy objects that resolve at access time.
export const sessionUser = new Proxy({}, {
  get(_, prop) {
    const user = getSessionUser()
    return user ? user[prop] : null
  },
})

export const sessionProfile = new Proxy({}, {
  get(_, prop) {
    return getSessionProfile()[prop]
  },
})
