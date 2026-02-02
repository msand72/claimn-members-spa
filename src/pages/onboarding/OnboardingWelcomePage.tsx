import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCurrentProfile, useUpdateProfile } from '../../lib/api/hooks'
import { useUpdateOnboarding } from '../../lib/api/hooks/useOnboarding'
import { OnboardingLayout } from './OnboardingLayout'
import { GlassCard, GlassInput, GlassButton, GlassAvatar } from '../../components/ui'
import { Upload, ArrowRight, SkipForward } from 'lucide-react'

export function OnboardingWelcomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: profile } = useCurrentProfile()
  const updateProfile = useUpdateProfile()
  const updateOnboarding = useUpdateOnboarding()

  const [form, setForm] = useState({
    display_name: profile?.display_name || user?.display_name || '',
    city: profile?.city || '',
    country: profile?.country || '',
  })

  const displayName = form.display_name || user?.email?.split('@')[0] || 'Member'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleContinue = async () => {
    // Save profile fields if changed
    if (form.display_name || form.city || form.country) {
      await updateProfile.mutateAsync({
        display_name: form.display_name,
        city: form.city,
        country: form.country,
      })
    }
    // Advance onboarding step
    await updateOnboarding.mutateAsync({ current_step: 'assessment' })
    navigate('/onboarding/assessment')
  }

  const handleSkip = async () => {
    await updateOnboarding.mutateAsync({
      current_step: 'assessment',
    })
    navigate('/onboarding/assessment')
  }

  return (
    <OnboardingLayout step={1} totalSteps={5}>
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-kalkvit mb-3">
          Welcome to CLAIM'N, {displayName}!
        </h1>
        <p className="text-kalkvit/60 text-lg">
          Let's set up your profile so other members can connect with you.
        </p>
      </div>

      <GlassCard variant="elevated" className="!p-6 md:!p-8">
        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <GlassAvatar initials={initials} size="xl" className="w-24 h-24 text-3xl" />
            <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-koppar rounded-full flex items-center justify-center text-charcoal hover:bg-koppar/90 transition-colors">
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <GlassInput
            label="Display Name"
            value={form.display_name}
            onChange={(e) => setForm(f => ({ ...f, display_name: e.target.value }))}
            placeholder="How should we call you?"
          />
          <div className="grid grid-cols-2 gap-4">
            <GlassInput
              label="City"
              value={form.city}
              onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
              placeholder="Stockholm"
            />
            <GlassInput
              label="Country"
              value={form.country}
              onChange={(e) => setForm(f => ({ ...f, country: e.target.value }))}
              placeholder="Sweden"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 text-kalkvit/50 text-sm hover:text-kalkvit/70 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
            Skip for now
          </button>
          <GlassButton
            variant="primary"
            onClick={handleContinue}
            disabled={updateProfile.isPending || updateOnboarding.isPending}
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </GlassButton>
        </div>
      </GlassCard>
    </OnboardingLayout>
  )
}

export default OnboardingWelcomePage
