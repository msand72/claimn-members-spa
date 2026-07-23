// User-facing Swedish copy for auth error states. Used by LoginPage,
// ResetPasswordPage, ActivateAccountPage, and the /user circuit breaker.
//
// Pattern: pass any error or error-shape object to mapAuthError(). It returns
// the right Swedish copy for the user. Falls back to a generic message rather
// than surfacing raw GoTrue strings (which non-technical cohort members tried
// to paste as passwords on 2026-05-07).

/** Bad-token error codes from GoTrue/the API — these mean "log the user out". */
export const STALE_TOKEN_CODES = new Set([
  'bad_jwt',
  'user_not_found',
  'invalid_jwt',
  'jwt_expired',
])

/**
 * Raw GoTrue/Go-API message fragments that mean the same thing as the codes
 * above. The JWT-secret drift on 2026-07-22 surfaced as
 * "token signature is invalid" with no machine-readable code attached, so
 * matching on message text is the difference between a clean bounce to login
 * and a browser that polls a dead token forever.
 */
const STALE_TOKEN_MESSAGES = [
  'token signature is invalid',
  'signature is invalid',
  'invalid jwt',
  'bad_jwt',
  'jwt expired',
  'token is expired',
  'invalid claim',
  'missing sub claim',
  'session not found',
  'session expired',
]

export interface AuthErrorShape {
  status?: number
  code?: string
  message?: string
  error?: { code?: string; message?: string } | string
}

/**
 * Does this error mean "the token we hold is dead, stop using it"?
 *
 * A 401 always counts — the API only issues one when it rejected our bearer
 * token. A 403 counts only when the code or message names a JWT problem,
 * because 403 is also how tier gating (`RequireTier`) says "not your plan",
 * and logging someone out for browsing a premium page would be a worse bug.
 */
export function isStaleTokenError(err: unknown): boolean {
  if (!err) return false

  const e = err as AuthErrorShape
  const status = typeof e.status === 'number' ? e.status : 0
  if (status === 401) return true

  const { code, message } = extractAuthError(err)
  if (STALE_TOKEN_CODES.has(code)) return true

  const lower = (message || '').toLowerCase()
  return STALE_TOKEN_MESSAGES.some((fragment) => lower.includes(fragment))
}

/**
 * Extract a normalized {code, message} pair from any auth error shape we've
 * encountered (Error, ApiError envelope, plain string, GoTrue raw response).
 */
export function extractAuthError(err: unknown): { code: string; message: string } {
  if (!err) return { code: '', message: '' }
  if (typeof err === 'string') return { code: '', message: err }

  const e = err as AuthErrorShape & Error

  // Standard v2 envelope: { error: { code, message } }
  if (typeof e.error === 'object' && e.error) {
    return {
      code: e.error.code || '',
      message: e.error.message || e.message || '',
    }
  }

  // Plain Error with optional .code attached
  if (e.message) {
    return { code: e.code || '', message: e.message }
  }

  return { code: e.code || '', message: '' }
}

/**
 * Map an auth error to a user-friendly Swedish string. The cohort is
 * Swedish-speaking; surfacing raw English/GoTrue copy on auth failures
 * caused real confusion during the 2026-05-07 cohort send.
 */
export function mapAuthError(err: unknown): string {
  const { code, message } = extractAuthError(err)
  const lower = (message || '').toLowerCase()

  if (STALE_TOKEN_CODES.has(code)) {
    return 'Din session har gått ut. Logga in igen.'
  }

  if (code === 'invalid_credentials' || lower.includes('invalid login') || lower.includes('invalid email or password')) {
    return 'Fel e-post eller lösenord. Glömt ditt lösenord? Klicka på länken nedan.'
  }

  if (
    code === 'otp_expired' ||
    lower.includes('one-time token not found') ||
    lower.includes('email link is invalid') ||
    lower.includes('email link is expired') ||
    lower.includes('link is invalid or has expired')
  ) {
    return 'Den här länken har redan använts eller gått ut. Be om en ny återställningslänk.'
  }

  if (code === 'over_email_send_rate_limit' || lower.includes('rate limit')) {
    return 'Vi har skickat för många mejl till denna adress. Försök igen om några minuter.'
  }

  if (code === 'no_active_subscription' || lower.includes('no active subscription')) {
    return 'Inget aktivt medlemskap hittades för det här kontot. Kontakta support@claimn.co.'
  }

  if (code === 'no_account' || lower.includes('no account found')) {
    return 'Inget konto hittades för den här e-postadressen. Kontakta support@claimn.co.'
  }

  // OTP-fallback flow error codes from POST /auth/verify-otp.
  if (code === 'INVALID_OTP' || lower.includes('invalid otp')) {
    return 'Fel kod eller koden har gått ut. Försök igen eller be om en ny kod.'
  }

  if (code === 'INVALID_OTP_FORMAT' || lower.includes('invalid otp format')) {
    return 'Koden ska vara 6 siffror.'
  }

  if (code === 'TOO_MANY_ATTEMPTS' || lower.includes('too many attempts')) {
    return 'För många felaktiga försök. Be om en ny kod.'
  }

  if (code === 'OTP_EXPIRED' || lower.includes('otp expired')) {
    return 'Koden har gått ut. Be om en ny kod.'
  }

  if (code === 'RATE_LIMIT_EXCEEDED' || lower.includes('rate limit')) {
    return 'Vi har skickat för många mejl till denna adress. Försök igen om några minuter.'
  }

  return 'Något gick fel. Kontakta support@claimn.co om problemet kvarstår.'
}
