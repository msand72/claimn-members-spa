import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  login as authLogin,
  logout as authLogout,
  getAccessToken,
  fetchCurrentUser,
  getStoredExpiresAt,
  refreshToken,
  type AuthUserResponse,
} from '../lib/auth'

export type AuthUser = AuthUserResponse & Record<string, unknown>

interface AuthSession {
  access_token: string
  refresh_token: string
  expires_at: number
}

interface AuthContextType {
  user: AuthUser | null
  session: AuthSession | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleRefresh() {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }

    const expiresAt = getStoredExpiresAt()
    if (!expiresAt) return

    // Refresh 5 minutes before expiry
    const msUntilRefresh = (expiresAt * 1000) - Date.now() - (5 * 60 * 1000)
    const delay = Math.max(msUntilRefresh, 0)

    refreshTimerRef.current = setTimeout(async () => {
      try {
        const tokens = await refreshToken()
        setSession({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_at,
        })
        scheduleRefresh()
      } catch {
        setUser(null)
        setSession(null)
      }
    }, delay)
  }

  useEffect(() => {
    // Check for existing token on mount
    async function init() {
      try {
        const token = await getAccessToken()
        if (token) {
          const userData = await fetchCurrentUser(token)
          setUser(userData as AuthUser)
          const expiresAt = getStoredExpiresAt()
          setSession({
            access_token: token,
            refresh_token: localStorage.getItem('claimn_refresh_token') || '',
            expires_at: expiresAt || 0,
          })
          scheduleRefresh()
        }
      } catch {
        setUser(null)
        setSession(null)
      } finally {
        setLoading(false)
      }
    }

    init()

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log('[AuthContext] signIn called for:', email)
    try {
      console.log('[AuthContext] Calling authLogin...')
      const tokens = await authLogin(email, password)
      console.log('[AuthContext] Login successful, fetching user...')
      const userData = await fetchCurrentUser(tokens.access_token)
      console.log('[AuthContext] User fetched:', userData)
      setUser(userData as AuthUser)
      setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at,
      })
      scheduleRefresh()
      console.log('[AuthContext] signIn complete, user set')
      return { error: null }
    } catch (err) {
      console.error('[AuthContext] signIn error:', err)
      return { error: err as Error }
    }
  }

  const signOut = async () => {
    await authLogout()
    setUser(null)
    setSession(null)
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
