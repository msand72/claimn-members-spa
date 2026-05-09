// Auth module - manages tokens and auth API calls

import { STALE_TOKEN_CODES } from './auth-errors'

const TOKEN_KEY = 'claimn_access_token'
const REFRESH_TOKEN_KEY = 'claimn_refresh_token'
const EXPIRES_AT_KEY = 'claimn_expires_at'

// Circuit breaker for /auth/me — when the SPA holds a bad token, GoTrue logs
// flooded with bad_jwt 403s during the 2026-05-07 cohort send. After 3
// consecutive 4xx, force log-out regardless of error_code (defense in depth).
const ME_FAILURE_LIMIT = 3
let consecutiveMeFailures = 0

/** Surface flag for LoginPage: shows "Din session har gått ut" copy on next render. */
export function flagSessionExpired() {
  try {
    sessionStorage.setItem('auth_session_expired', '1')
  } catch {
    // sessionStorage can throw in privacy modes — non-fatal
  }
}

// API URL resolution:
// 1. VITE_API_URL env var (set in .env for local dev, Vercel env vars for deploys)
// 2. Fallback to production API (safe for preview deploys; local dev should set .env)
export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  return 'https://api.claimn.co'
}

const AUTH_BASE = () => `${getApiBaseUrl()}/api/v2/auth`
const AUTH_TIMEOUT = 15_000

function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId))
}

interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_at: number
}

export type UserType = 'guest' | 'member' | 'client' | 'expert' | 'admin' | 'superadmin'

export interface AuthUserResponse {
  id: string
  email: string
  role: string
  user_type: UserType
  display_name: string
  avatar_url: string
  phone: string
  phone_confirmed_at: string | null
}

export function storeTokens(tokens: AuthTokens) {
  localStorage.setItem(TOKEN_KEY, tokens.access_token)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
  localStorage.setItem(EXPIRES_AT_KEY, String(tokens.expires_at))
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(EXPIRES_AT_KEY)
}

function getStoredTokens(): AuthTokens | null {
  const access_token = localStorage.getItem(TOKEN_KEY)
  const refresh_token = localStorage.getItem(REFRESH_TOKEN_KEY)
  const expires_at = localStorage.getItem(EXPIRES_AT_KEY)

  if (!access_token || !refresh_token || !expires_at) {
    return null
  }

  return { access_token, refresh_token, expires_at: Number(expires_at) }
}

export function isAuthenticated(): boolean {
  const tokens = getStoredTokens()
  if (!tokens) return false
  return tokens.expires_at * 1000 > Date.now()
}

let refreshPromise: Promise<AuthTokens> | null = null

export async function refreshToken(): Promise<AuthTokens> {
  // Deduplicate concurrent refresh calls
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const tokens = getStoredTokens()
      if (!tokens?.refresh_token) {
        throw new Error('No refresh token available')
      }

      const res = await authFetch(`${AUTH_BASE()}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: tokens.refresh_token }),
      })

      if (!res.ok) {
        clearTokens()
        throw new Error('Token refresh failed')
      }

      const data = await res.json()
      const newTokens: AuthTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
      }
      storeTokens(newTokens)
      return newTokens
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function getAccessToken(): Promise<string | null> {
  const tokens = getStoredTokens()
  if (!tokens) return null

  // Auto-refresh if expired or within 5 minutes of expiry
  const fiveMinutes = 5 * 60
  if (tokens.expires_at - fiveMinutes <= Date.now() / 1000) {
    try {
      const newTokens = await refreshToken()
      return newTokens.access_token
    } catch {
      return null
    }
  }

  return tokens.access_token
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const url = `${AUTH_BASE()}/login`

  const res = await authFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Login failed' }))
    const message = errorData.error?.message || errorData.error || 'Login failed'
    const code = errorData.error?.code || errorData.code || ''
    const err = new Error(message) as Error & { code: string; status: number }
    err.code = code
    err.status = res.status
    throw err
  }

  const data = await res.json()
  const tokens: AuthTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
  }
  storeTokens(tokens)
  return tokens
}

export async function logout(): Promise<void> {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    await authFetch(`${AUTH_BASE()}/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    }).catch(() => {})
  }
  clearTokens()
}

export async function fetchCurrentUser(token: string): Promise<AuthUserResponse> {
  const url = `${AUTH_BASE()}/me`

  const res = await authFetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  })

  if (!res.ok) {
    // Circuit breaker + stale-token kill switch. If the API tells us the
    // token is bad (bad_jwt / user_not_found / invalid_jwt / jwt_expired)
    // OR we hit 3 consecutive 4xx, log out hard so the SPA stops polling
    // and the user sees a "session expired" message instead of an opaque
    // "Failed to fetch user". Backend brief 2026-05-08.
    let errorCode = ''
    try {
      const body = await res.clone().json()
      errorCode = body?.error?.code || body?.code || body?.error_code || ''
    } catch {
      // body might not be JSON — leave code empty
    }

    if (res.status >= 400 && res.status < 500) {
      consecutiveMeFailures += 1
    }

    const isStaleToken = STALE_TOKEN_CODES.has(errorCode)
    const tripped = consecutiveMeFailures >= ME_FAILURE_LIMIT

    if (isStaleToken || tripped) {
      consecutiveMeFailures = 0
      clearTokens()
      flagSessionExpired()
      const err = new Error('Session expired') as Error & { code: string; status: number }
      err.code = errorCode || 'session_expired'
      err.status = res.status
      throw err
    }

    const err = new Error('Failed to fetch user') as Error & { code: string; status: number }
    err.code = errorCode
    err.status = res.status
    throw err
  }

  // Reset breaker on success
  consecutiveMeFailures = 0

  const data = await res.json()
  // /auth/me returns user at top level (not nested under .user)
  // profile fields (display_name, avatar_url) are nested under .profile
  const user = data.user || data
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    user_type: user.user_type || user.profile?.user_type || 'member',
    display_name: user.profile?.display_name || user.display_name || user.email?.split('@')[0] || '',
    avatar_url: user.profile?.avatar_url || user.avatar_url || '',
    phone: user.phone || '',
    phone_confirmed_at: user.phone_confirmed_at || null,
  }
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await authFetch(`${AUTH_BASE()}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, redirect_to: 'https://members.claimn.co' }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(errorData.error?.message || errorData.error || 'Failed to send reset email')
  }
}

export async function changeEmail(currentPassword: string, newEmail: string): Promise<{ new_email: string }> {
  const token = await getAccessToken()
  if (!token) {
    const err = new Error('Not authenticated') as Error & { code: string; status: number }
    err.code = 'NOT_AUTHENTICATED'
    err.status = 401
    throw err
  }

  const res = await authFetch(`${AUTH_BASE()}/change-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ current_password: currentPassword, new_email: newEmail }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    const message = errorData.error?.message || errorData.error || 'Failed to change email'
    const code = errorData.error?.code || errorData.code || ''
    const err = new Error(message) as Error & { code: string; status: number }
    err.code = code
    err.status = res.status
    throw err
  }

  return res.json()
}

export async function changePhone(currentPassword: string, newPhone: string): Promise<{ new_phone: string }> {
  const token = await getAccessToken()
  if (!token) {
    const err = new Error('Not authenticated') as Error & { code: string; status: number }
    err.code = 'NOT_AUTHENTICATED'
    err.status = 401
    throw err
  }

  const res = await authFetch(`${AUTH_BASE()}/change-phone`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ current_password: currentPassword, new_phone: newPhone }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    const message = errorData.error?.message || errorData.error || 'Failed to change phone'
    const code = errorData.error?.code || errorData.code || ''
    const err = new Error(message) as Error & { code: string; status: number }
    err.code = code
    err.status = res.status
    throw err
  }

  return res.json()
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const res = await authFetch(`${AUTH_BASE()}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: token, new_password: password }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }))
    const message = errorData.error?.message || errorData.error || 'Failed to reset password'
    const code = errorData.error?.code || errorData.code || ''
    const err = new Error(message) as Error & { code: string; status: number }
    err.code = code
    err.status = res.status
    throw err
  }
}

export interface ExchangeTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  expires_at: number
  user: {
    id: string
    email: string
    user_type: UserType
    full_name: string
  }
}

/**
 * Exchange a Supabase access token for a Go-issued JWT.
 * No Authorization header required — the backend validates the Supabase token directly.
 */
export async function exchangeToken(supabaseToken: string): Promise<ExchangeTokenResponse> {
  const url = `${AUTH_BASE()}/exchange`

  const res = await authFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ supabase_token: supabaseToken }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Token exchange failed' }))
    throw new Error(errorData.error?.message || errorData.error || 'Token exchange failed')
  }

  const data: ExchangeTokenResponse = await res.json()

  // Store the Go JWT as the primary access token
  storeTokens({
    access_token: data.access_token,
    refresh_token: localStorage.getItem(REFRESH_TOKEN_KEY) || '',
    expires_at: data.expires_at,
  })

  return data
}

export function getStoredExpiresAt(): number | null {
  const val = localStorage.getItem(EXPIRES_AT_KEY)
  return val ? Number(val) : null
}
