import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  login as authLogin,
  logout as authLogout,
  getAccessToken,
  fetchCurrentUser,
  getStoredExpiresAt,
  storeTokens,
  refreshToken,
  exchangeToken,
  type AuthUserResponse,
  type UserType,
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
  userType: UserType
  hasAccess: (...types: UserType[]) => boolean
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
    async function init() {
      try {
        // Check for OAuth tokens from redirect (stored by App.tsx hash handler)
        const oauthToken = sessionStorage.getItem('oauth_access_token')
        if (oauthToken) {
          const oauthRefresh = sessionStorage.getItem('oauth_refresh_token') || ''
          const oauthExpiresAt = Number(sessionStorage.getItem('oauth_expires_at') || '0')
          sessionStorage.removeItem('oauth_access_token')
          sessionStorage.removeItem('oauth_refresh_token')
          sessionStorage.removeItem('oauth_expires_at')

          // Exchange Supabase OAuth token for Go JWT
          let accessToken = oauthToken
          let expiresAt = oauthExpiresAt
          let userType: UserType = 'member'

          try {
            const exchangeResponse = await exchangeToken(oauthToken)
            accessToken = exchangeResponse.access_token
            expiresAt = exchangeResponse.expires_at
            userType = exchangeResponse.user.user_type
          } catch (exchangeErr) {
            // Exchange failed — fall back to Supabase token
            if (import.meta.env.DEV) {
              console.warn('Token exchange failed during OAuth init, using original token:', exchangeErr)
            }
          }

          // Block guest users — no active subscription
          if (userType === 'guest') {
            await authLogout()
            sessionStorage.setItem(
              'oauth_error',
              'No active subscription found for this account. Please purchase a membership first.',
            )
            setLoading(false)
            return
          }

          try {
            const userData = await fetchCurrentUser(accessToken)
            const mergedUser = { ...userData, user_type: userType || userData.user_type } as AuthUser
            // Persist tokens to localStorage so session survives page reloads
            storeTokens({
              access_token: accessToken,
              refresh_token: oauthRefresh,
              expires_at: expiresAt,
            })
            setUser(mergedUser)
            setSession({
              access_token: accessToken,
              refresh_token: oauthRefresh,
              expires_at: expiresAt,
            })
            scheduleRefresh()
          } catch {
            // User not found in backend — surface error to login page
            await authLogout()
            sessionStorage.setItem(
              'oauth_error',
              'No account found for this email. Please sign in with email and password, or contact support.',
            )
          }
          setLoading(false)
          return
        }

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

    // Cross-tab session sync: detect logout from another tab
    function onStorageChange(e: StorageEvent) {
      if (e.key === 'claimn_access_token' && !e.newValue) {
        setUser(null)
        setSession(null)
        if (refreshTimerRef.current) {
          clearTimeout(refreshTimerRef.current)
        }
      }
    }
    window.addEventListener('storage', onStorageChange)

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
      window.removeEventListener('storage', onStorageChange)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const tokens = await authLogin(email, password)

      // Exchange the Supabase-style token for a Go-issued JWT that includes user_type
      let accessToken = tokens.access_token
      let expiresAt = tokens.expires_at
      let userType: UserType = 'member'

      try {
        const exchangeResponse = await exchangeToken(tokens.access_token)
        accessToken = exchangeResponse.access_token
        expiresAt = exchangeResponse.expires_at
        userType = exchangeResponse.user.user_type
      } catch (exchangeErr) {
        // If exchange fails, fall back to the original token
        if (import.meta.env.DEV) {
          console.warn('Token exchange failed, using original token:', exchangeErr)
        }
      }

      // Block guest users — no active subscription
      if (userType === 'guest') {
        await authLogout()
        return { error: new Error('No active subscription found for this account. Please purchase a membership first.') }
      }

      const userData = await fetchCurrentUser(accessToken)
      // Merge user_type from exchange response if available
      const mergedUser = { ...userData, user_type: userType || userData.user_type } as AuthUser
      setUser(mergedUser)
      setSession({
        access_token: accessToken,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
      })
      scheduleRefresh()
      return { error: null }
    } catch (err) {
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

  const userType: UserType = user?.user_type || 'guest'

  const hasAccess = (...types: UserType[]) => {
    if (userType === 'superadmin' || userType === 'admin') return true
    return types.includes(userType)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, userType, hasAccess, signIn, signOut }}>
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
