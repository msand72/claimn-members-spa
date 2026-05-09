import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GlassCard, GlassButton, GlassInput } from '../components/ui'
import { BackgroundPattern } from '../components/ui/BackgroundPattern'
import { LockClosedIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { resetPassword } from '../lib/auth'
import { mapAuthError } from '../lib/auth-errors'

/** Structural JWT check (header.payload.signature, all non-empty). */
function looksLikeJwt(token: string): boolean {
  const parts = token.split('.')
  return parts.length === 3 && parts.every((p) => p.length > 0)
}

export function ActivateAccountPage() {
  const navigate = useNavigate()
  const token = sessionStorage.getItem('invite_token') || ''
  const tokenIsValid = looksLikeJwt(token)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return 'Lösenordet måste vara minst 8 tecken'
    if (!/[A-Z]/.test(pwd)) return 'Lösenordet måste innehålla en versal'
    if (!/[0-9]/.test(pwd)) return 'Lösenordet måste innehålla en siffra'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!tokenIsValid) {
      setError('Inbjudningslänken är ogiltig eller har gått ut. Kontakta support@claimn.co.')
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte')
      return
    }

    setIsLoading(true)
    console.log('[auth/invite] submitting initial password')

    try {
      await resetPassword(token, password)
      console.log('[auth/invite] account activation succeeded')
      sessionStorage.removeItem('invite_token')
      setIsSubmitted(true)
    } catch (err) {
      console.warn('[auth/invite] account activation failed:', err)
      setError(mapAuthError(err))
    } finally {
      setIsLoading(false)
    }
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
          {!tokenIsValid && !isSubmitted ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tegelrod/20 mb-4">
                <ExclamationCircleIcon className="w-8 h-8 text-tegelrod" />
              </div>
              <h2 className="font-serif text-xl font-bold text-kalkvit mb-2">Länken är ogiltig</h2>
              <p className="text-kalkvit/60 mb-6">
                Inbjudningslänken är ogiltig eller har gått ut. Många företagsmail blockerar länkar — du kan istället ange den 6-siffriga koden från ditt välkomstmejl.
              </p>
              <Link to="/verify-otp?type=invite">
                <GlassButton variant="primary" className="w-full">
                  Ange kod från mejlet
                </GlassButton>
              </Link>
              <p className="text-xs text-kalkvit/40 mt-4">
                Behöver du hjälp? Kontakta <a href="mailto:support@claimn.co" className="text-koppar hover:underline">support@claimn.co</a>.
              </p>
            </div>
          ) : isSubmitted ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-skogsgron/20 mb-4">
                <CheckCircleIcon className="w-8 h-8 text-skogsgron" />
              </div>
              <h2 className="font-serif text-xl font-bold text-kalkvit mb-2">You're all set</h2>
              <p className="text-kalkvit/60 mb-6">
                Your password has been created. Log in to access your CLAIM'N account.
              </p>
              <GlassButton
                variant="primary"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Go to login
              </GlassButton>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="font-serif text-xl font-bold text-kalkvit mb-2">Set your password</h2>
                <p className="text-kalkvit/60">
                  Create a password to access your CLAIM'N account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <GlassInput
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-kalkvit/50 hover:text-kalkvit"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>

                <GlassInput
                  label="Confirm password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

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
                    'Setting password...'
                  ) : (
                    <>
                      <LockClosedIcon className="w-4 h-4" />
                      Set password and continue
                    </>
                  )}
                </GlassButton>
              </form>
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

export default ActivateAccountPage
