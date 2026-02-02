import { useNavigate } from 'react-router-dom'
import { useUpdateOnboarding, useOnboardingState } from '../../lib/api/hooks/useOnboarding'
import { OnboardingLayout } from './OnboardingLayout'
import { GlassCard, GlassButton, GlassBadge } from '../../components/ui'
import { ArrowRight, Flame, Users, Calendar, Loader2, Check } from 'lucide-react'

/**
 * Step 5: Personalized starting path.
 * Shows recommended protocol, circle, and optional expert session based on challenge selection.
 */
export function OnboardingPathPage() {
  const navigate = useNavigate()
  const { data: onboarding, isLoading } = useOnboardingState()
  const updateOnboarding = useUpdateOnboarding()

  const handleComplete = async () => {
    await updateOnboarding.mutateAsync({ step: 'complete' })
    navigate('/')
  }

  if (isLoading) {
    return (
      <OnboardingLayout step={5} totalSteps={5}>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-koppar" />
        </div>
      </OnboardingLayout>
    )
  }

  const challengeLabels: Record<string, string> = {
    identity: 'Identity & Purpose',
    vitality: 'Physical & Vital',
    connection: 'Connection & Leadership',
    emotional: 'Emotional & Mental',
    mission: 'Mission & Mastery',
  }

  const challenge = onboarding?.primary_challenge || 'vitality'
  const pillarLabel = challengeLabels[challenge] || 'Your Focus Area'

  return (
    <OnboardingLayout step={5} totalSteps={5}>
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-kalkvit mb-3">
          Your Starting Path
        </h1>
        <p className="text-kalkvit/60 text-lg">
          Based on your focus on <span className="text-koppar">{pillarLabel}</span>,
          here's what we recommend to get started.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {/* Recommended Protocol */}
        <GlassCard className="!p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-koppar/10 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 text-koppar" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-kalkvit font-medium">Recommended Protocol</h3>
                <GlassBadge variant="koppar">Start here</GlassBadge>
              </div>
              <p className="text-kalkvit/60 text-sm">
                We'll add this protocol to your journey dashboard. You can start it right away
                or browse the full library for alternatives.
              </p>
              {onboarding?.recommended_protocol_slug && (
                <p className="text-koppar text-sm mt-2 font-medium">
                  {onboarding.recommended_protocol_slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </p>
              )}
            </div>
            <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-green-400" />
            </div>
          </div>
        </GlassCard>

        {/* Recommended Circle */}
        <GlassCard className="!p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-koppar/10 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-koppar" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-kalkvit font-medium">Recommended Circle</h3>
                <GlassBadge variant="default">Community</GlassBadge>
              </div>
              <p className="text-kalkvit/60 text-sm">
                Join a circle of members working on similar challenges.
                Share progress, ask questions, and support each other.
              </p>
            </div>
            <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-green-400" />
            </div>
          </div>
        </GlassCard>

        {/* Optional Expert Session */}
        <GlassCard className="!p-5 border-dashed">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-kalkvit/40" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-kalkvit/80 font-medium">Book an Expert Session</h3>
                <GlassBadge variant="default">Optional</GlassBadge>
              </div>
              <p className="text-kalkvit/50 text-sm">
                Get 1:1 guidance from a CLAIM'N expert to accelerate your progress.
                Available to Expert Guidance tier members.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="!p-4 bg-koppar/5 border-koppar/20 mb-8">
        <p className="text-kalkvit/70 text-sm text-center">
          You can change any of these choices anytime from your dashboard.
        </p>
      </GlassCard>

      <div className="flex justify-end">
        <GlassButton
          variant="primary"
          onClick={handleComplete}
          disabled={updateOnboarding.isPending}
        >
          Start My Journey
          <ArrowRight className="w-4 h-4" />
        </GlassButton>
      </div>
    </OnboardingLayout>
  )
}

export default OnboardingPathPage
