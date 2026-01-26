import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-glass-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-koppar animate-spin" />
      </div>
    )
  }

  if (!user) {
    // Redirect to login with the current path as redirect param
    const redirectPath = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirectPath}`} replace />
  }

  return <>{children}</>
}
