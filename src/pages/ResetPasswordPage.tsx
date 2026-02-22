import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GlassCard, GlassButton, GlassInput } from '../components/ui'
import { BackgroundPattern } from '../components/ui/BackgroundPattern'
import { Lock, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { resetPassword } from '../lib/auth'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const token = sessionStorage.getItem('recovery_token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(pwd)) return 'Password must contain an uppercase letter'
    if (!/[0-9]/.test(pwd)) return 'Password must contain a number'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Invalid or missing reset token. Please request a new reset link.')
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      await resetPassword(token, password)
      sessionStorage.removeItem('recovery_token')
      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password. The link may have expired.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinue = () => {
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-glass-dark flex items-center justify-center p-4">
      <BackgroundPattern />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-koppar to-jordbrun mb-4">
            <span className="text-kalkvit font-bold text-2xl">C</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-kalkvit">CLAIM'N</h1>
        </div>

        <GlassCard variant="elevated">
          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-skogsgron/20 mb-4">
                <CheckCircle className="w-8 h-8 text-skogsgron" />
              </div>
              <h2 className="font-serif text-xl font-bold text-kalkvit mb-2">Password Updated</h2>
              <p className="text-kalkvit/60 mb-6">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <GlassButton
                variant="primary"
                className="w-full"
                onClick={handleContinue}
              >
                Continue to Login
              </GlassButton>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="font-serif text-xl font-bold text-kalkvit mb-2">Reset Password</h2>
                <p className="text-kalkvit/60">
                  Enter your new password below.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <GlassInput
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-kalkvit/50 hover:text-kalkvit"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <GlassInput
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                {/* Password Requirements */}
                <div className="text-xs text-kalkvit/50 space-y-1">
                  <p className={password.length >= 8 ? 'text-skogsgron' : ''}>
                    ✓ At least 8 characters
                  </p>
                  <p className={/[A-Z]/.test(password) ? 'text-skogsgron' : ''}>
                    ✓ One uppercase letter
                  </p>
                  <p className={/[0-9]/.test(password) ? 'text-skogsgron' : ''}>
                    ✓ One number
                  </p>
                </div>

                {error && (
                  <p className="text-sm text-tegelrod">{error}</p>
                )}

                <GlassButton
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isLoading || !password || !confirmPassword}
                >
                  {isLoading ? (
                    'Updating...'
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Reset Password
                    </>
                  )}
                </GlassButton>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-sm text-kalkvit/60 hover:text-koppar transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </GlassCard>

        <p className="text-center text-sm text-kalkvit/40 mt-8">
          Need help? <a href="mailto:support@claimn.co" className="text-koppar hover:underline">Contact Support</a>
        </p>
      </div>
    </div>
  )
}

export default ResetPasswordPage;
