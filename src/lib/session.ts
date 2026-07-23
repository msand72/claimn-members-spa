// Session lifetime — the single place that decides "our token is dead".
//
// Deliberately separate from auth.ts: the API client needs this logic, and
// auth.ts is heavily mocked in tests. Keeping the latch here means a test that
// stubs the auth module doesn't accidentally disable the kill switch.

export const TOKEN_KEY = 'claimn_access_token'
export const REFRESH_TOKEN_KEY = 'claimn_refresh_token'
export const EXPIRES_AT_KEY = 'claimn_expires_at'
export const LOGIN_METHOD_KEY = 'claimn_login_method'

/** Fired on killSession so AuthContext can drop its user/session state. */
export const SESSION_EXPIRED_EVENT = 'claimn:session-expired'

// When the backend rejects our token, every in-flight poll (messages 10s,
// notifications 60s, experts 60s) is about to fail the same way. Latching
// "this session is dead" lets the API client fail those instantly instead of
// re-sending a token we already know is rejected — that retry storm is what
// turned the 2026-07-22 JWT-secret drift into a browser hammering GoTrue
// /user every few seconds behind a blank app.
let sessionDead = false

/** Pages that ARE the recovery path — never bounce a user off these. */
const PUBLIC_AUTH_PATHS = new Set([
  '/login',
  '/forgot-password',
  '/reset-password',
  '/activate',
  '/verify-otp',
])

export function isSessionDead(): boolean {
  return sessionDead
}

/** Fresh tokens revive the session — otherwise a login right after a kill would stay blocked. */
export function markSessionAlive() {
  sessionDead = false
}

/** Test-only: drop the latch so it can't leak between test cases. */
export function resetSessionState() {
  sessionDead = false
}

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(EXPIRES_AT_KEY)
}

/** Surface flag for LoginPage: shows "Din session har gått ut" copy on next render. */
export function flagSessionExpired() {
  try {
    sessionStorage.setItem('auth_session_expired', '1')
  } catch {
    // sessionStorage can throw in privacy modes — non-fatal
  }
}

/** Build the marked error every dead-session path throws. */
export function sessionExpiredError(code = 'session_expired', status = 401) {
  const err = new Error('Session expired') as Error & { code: string; status: number }
  err.code = code
  err.status = status
  return err
}

/**
 * The session is dead — drop all local auth state and send the user to log in.
 *
 * Idempotent by design: a page typically has several requests in flight when
 * the token goes bad, and each one lands here. Only the first call navigates,
 * so a burst of 401s can't queue up a pile of redirects.
 */
export function killSession(options: { redirect?: boolean; reason?: string } = {}) {
  const { redirect = true, reason = '' } = options
  const isFirstCall = !sessionDead

  sessionDead = true
  clearStoredSession()
  localStorage.removeItem(LOGIN_METHOD_KEY)

  if (!isFirstCall || typeof window === 'undefined') return

  // Logged in production too — idempotence keeps it to one line per page, and
  // it's the only breadcrumb explaining an unexpected bounce to login.
  console.warn(`[auth] Session rejected by the backend, signing out. ${reason}`.trim())

  flagSessionExpired()
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))

  if (!redirect) return

  const { pathname, search } = window.location
  if (PUBLIC_AUTH_PATHS.has(pathname)) return

  // replace(), not assign() — the dead page must not stay in history, or Back
  // walks straight back into the same rejected token.
  const target = encodeURIComponent(pathname + search)
  window.location.replace(`/login?redirect=${target}`)
}
