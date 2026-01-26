import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GlassCard, GlassButton, GlassInput } from '../components/ui'
import { BackgroundPattern } from '../components/ui/BackgroundPattern'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // TODO: Implement password reset via Supabase
    // await supabase.auth.resetPasswordForEmail(email)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    setIsLoading(false)
    setIsSubmitted(true)
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
              <h2 className="font-display text-xl font-bold text-kalkvit mb-2">Check Your Email</h2>
              <p className="text-kalkvit/60 mb-6">
                We've sent a password reset link to <strong className="text-kalkvit">{email}</strong>
              </p>
              <p className="text-sm text-kalkvit/50 mb-6">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <div className="flex flex-col gap-3">
                <GlassButton
                  variant="secondary"
                  className="w-full"
                  onClick={() => setIsSubmitted(false)}
                >
                  Try Different Email
                </GlassButton>
                <Link to="/login">
                  <GlassButton variant="ghost" className="w-full">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </GlassButton>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="font-display text-xl font-bold text-kalkvit mb-2">Forgot Password?</h2>
                <p className="text-kalkvit/60">
                  Enter your email and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <GlassInput
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <GlassButton
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isLoading || !email}
                >
                  {isLoading ? (
                    'Sending...'
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Reset Link
                    </>
                  )}
                </GlassButton>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-sm text-kalkvit/60 hover:text-koppar transition-colors inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
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
