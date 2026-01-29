// Auth module - manages tokens and auth API calls

const TOKEN_KEY = 'claimn_access_token'
const REFRESH_TOKEN_KEY = 'claimn_refresh_token'
const EXPIRES_AT_KEY = 'claimn_expires_at'

// Auto-detect production based on hostname, fallback to env var or localhost
export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname === 'members.claimn.co' || hostname === 'www.members.claimn.co') {
      return 'https://api.claimn.co'
    }
  }

  return 'http://localhost:3001'
}

const AUTH_BASE = () => `${getApiBaseUrl()}/api/v2/auth`

interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_at: number
}

export interface AuthUserResponse {
  id: string
  email: string
  role: string
  display_name: string
  avatar_url: string
}

function storeTokens(tokens: AuthTokens) {
  localStorage.setItem(TOKEN_KEY, tokens.access_token)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
  localStorage.setItem(EXPIRES_AT_KEY, String(tokens.expires_at))
}

function clearTokens() {
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

      const res = await fetch(`${AUTH_BASE()}/refresh`, {
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

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Login failed' }))
    throw new Error(errorData.error?.message || errorData.error || 'Login failed')
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
    await fetch(`${AUTH_BASE()}/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    }).catch(() => {})
  }
  clearTokens()
}

export async function fetchCurrentUser(token: string): Promise<AuthUserResponse> {
  const url = `${AUTH_BASE()}/me`

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  })

  if (!res.ok) {
    throw new Error('Failed to fetch user')
  }

  const data = await res.json()
  // /auth/me returns user at top level (not nested under .user)
  // profile fields (display_name, avatar_url) are nested under .profile
  const user = data.user || data
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    display_name: user.profile?.display_name || user.display_name || user.email?.split('@')[0] || '',
    avatar_url: user.profile?.avatar_url || user.avatar_url || '',
  }
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${AUTH_BASE()}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(errorData.error?.message || errorData.error || 'Failed to send reset email')
  }
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const res = await fetch(`${AUTH_BASE()}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(errorData.error?.message || errorData.error || 'Failed to reset password')
  }
}

export function getStoredExpiresAt(): number | null {
  const val = localStorage.getItem(EXPIRES_AT_KEY)
  return val ? Number(val) : null
}
