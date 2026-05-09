import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { GlassCard, GlassButton, GlassInput } from '../components/ui'
import { BackgroundPattern } from '../components/ui/BackgroundPattern'
import {
  ArrowLeftIcon,
  KeyIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import { requestOtp, verifyOtp } from '../lib/auth'
import { mapAuthError } from '../lib/auth-errors'

/** /verify-otp page — fallback path for users whose email security (Defender
 *  SafeLinks etc.) mangles the URL link. Email arrives with a 6-digit code in
 *  plain text alongside the URL; user types the code here and gets routed into
 *  the existing reset/activate password-set flow. */
export function VerifyOtpPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialEmail = searchParams.get('email') ?? ''
  const rawType = searchParams.get('type')
  const type: 'recovery' | 'invite' = rawType === 'invite' ? 'invite' : 'recovery'

  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resentMessage, setResentMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail)
  }, [initialEmail])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResentMessage('')

    const trimmed = code.trim()
    if (!/^[0-9]{6}$/.test(trimmed)) {
      setError('Koden ska vara 6 siffror.')
      return
    }
    if (!email) {
      setError('Ange din e-postadress.')
      return
    }

    setIsVerifying(true)
    try {
      const tokens = await verifyOtp(email, trimmed, type)
      // Stash the access_token in the same sessionStorage slot the URL-hash
      // path uses, so the existing ResetPasswordPage / ActivateAccountPage
      // can run their password-set flow unchanged.
      const slot = type === 'recovery' ? 'recovery_token' : 'invite_token'
      sessionStorage.setItem(slot, tokens.access_token)
      navigate(type === 'recovery' ? '/reset-password' : '/activate')
    } catch (err) {
      console.warn('[auth/verify-otp] failed:', err)
      setError(mapAuthError(err))
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setResentMessage('')
    if (!email) {
      setError('Ange din e-postadress för att be om en ny kod.')
      return
    }
    setIsResending(true)
    try {
      await requestOtp(email, type)
      setResentMessage('En ny kod har skickats om kontot finns.')
    } catch (err) {
      console.warn('[auth/request-otp] failed:', err)
      setError(mapAuthError(err))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-glass-dark flex items-center justify-center p-4">
      <BackgroundPattern />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-koppar to-jordbrun mb-4">
            <span className="text-kalkvit font-bold text-2xl">C</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-kalkvit">CLAIM'N</h1>
        </div>

        <GlassCard variant="elevated">
          <div className="text-center mb-6">
            <h2 className="font-serif text-xl font-bold text-kalkvit mb-2">
              {type === 'recovery' ? 'Ange koden från mejlet' : 'Aktivera ditt konto'}
            </h2>
            <p className="text-kalkvit/60">
              Skriv in den 6-siffriga koden från ditt mejl. Använd det här alternativet om länken i mejlet inte fungerar (vissa företagsmail blockerar länkar).
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <GlassInput
              label="E-postadress"
              type="email"
              placeholder="din@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <GlassInput
              label="6-siffrig kod"
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              required
            />

            {error && (
              <div className="flex items-start gap-2 p-3 bg-tegelrod/20 border border-tegelrod/30 rounded-xl text-tegelrod">
                <ExclamationCircleIcon className="w-[18px] h-[18px] flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {resentMessage && !error && (
              <p className="text-sm text-skogsgron">{resentMessage}</p>
            )}

            <GlassButton
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isVerifying || code.length !== 6 || !email}
            >
              {isVerifying ? (
                'Verifierar...'
              ) : (
                <>
                  <KeyIcon className="w-4 h-4" />
                  Verifiera kod
                </>
              )}
            </GlassButton>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || !email}
              className="text-sm text-koppar hover:text-koppar/80 transition-colors disabled:opacity-50"
            >
              {isResending ? 'Skickar...' : 'Skicka ny kod'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-kalkvit/60 hover:text-koppar transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Tillbaka till login
            </Link>
          </div>
        </GlassCard>

        <p className="text-center text-sm text-kalkvit/40 mt-8">
          Need help?{' '}
          <a href="mailto:support@claimn.co" className="text-koppar hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  )
}

export default VerifyOtpPage
