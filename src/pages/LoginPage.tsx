import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { GlassCard, GlassButton, BackgroundPattern } from '../components/ui'
import { LogIn, AlertCircle } from 'lucide-react'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

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

          <div className="mt-6 text-center">
            <a
              href="#"
              className="text-sm text-koppar hover:text-koppar/80 transition-colors"
            >
              Forgot your password?
            </a>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
