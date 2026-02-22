import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { sanitizeRedirect } from '../lib/url-validation'
import { GlassCard, GlassButton, BackgroundPattern } from '../components/ui'
import { LogIn, AlertCircle, ArrowLeft } from 'lucide-react'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = sanitizeRedirect(searchParams.get('redirect'), '/')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate(redirect)
    }
  }

  return (
    <div className="min-h-screen bg-glass-dark text-kalkvit flex items-center justify-center p-4">
      <BackgroundPattern />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold mb-2">CLAIM'N</h1>
          <p className="font-serif text-lg italic text-kalkvit/70">
            Members Portal
          </p>
        </div>

        <GlassCard variant="elevated" leftBorder={false}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-kalkvit/80 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.15] rounded-xl text-kalkvit placeholder-kalkvit/40 focus:outline-none focus:border-koppar/50 focus:ring-1 focus:ring-koppar/50 transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-kalkvit/80 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.15] rounded-xl text-kalkvit placeholder-kalkvit/40 focus:outline-none focus:border-koppar/50 focus:ring-1 focus:ring-koppar/50 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-tegelrod/20 border border-tegelrod/30 rounded-xl text-tegelrod">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <GlassButton
              type="submit"
              variant="primary"
              icon={LogIn}
              disabled={loading}
              className="w-full justify-center"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </GlassButton>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.1]" />
            <span className="text-xs text-kalkvit/40 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/[0.1]" />
          </div>

          {/* OAuth buttons */}
          <div className="mt-4 space-y-3">
            <a
              href={`https://auth.claimn.co/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent('https://members.claimn.co')}`}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/[0.06] border border-white/[0.12] rounded-xl text-kalkvit hover:bg-white/[0.1] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-sm font-medium">Sign in with Google</span>
            </a>

            <a
              href={`https://auth.claimn.co/auth/v1/authorize?provider=azure&redirect_to=${encodeURIComponent('https://members.claimn.co')}`}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/[0.06] border border-white/[0.12] rounded-xl text-kalkvit hover:bg-white/[0.1] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              <span className="text-sm font-medium">Sign in with Microsoft</span>
            </a>
          </div>

          <div className="mt-6 text-center space-y-3">
            <Link
              to="/forgot-password"
              className="text-sm text-koppar hover:text-koppar/80 transition-colors"
            >
              Forgot your password?
            </Link>
            <div>
              <a
                href="https://www.claimn.co"
                className="inline-flex items-center gap-1.5 text-sm text-kalkvit/50 hover:text-kalkvit/70 transition-colors"
              >
                <ArrowLeft size={14} />
                Back to claimn.co
              </a>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

export default LoginPage;
