import { useNavigate } from 'react-router-dom'
import { useLatestAssessmentResult } from '../../lib/api/hooks'
import { useUpdateOnboarding } from '../../lib/api/hooks/useOnboarding'
import { OnboardingLayout } from './OnboardingLayout'
import { GlassCard, GlassButton, GlassBadge } from '../../components/ui'
import { PILLARS, type PillarId } from '../../lib/constants'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'

export function OnboardingResultsPage() {
  const navigate = useNavigate()
  const { data: result, isLoading } = useLatestAssessmentResult()
  const updateOnboarding = useUpdateOnboarding()

  const handleContinue = async () => {
    await updateOnboarding.mutateAsync({ step: 'challenge' })
    navigate('/onboarding/challenge')
  }

  if (isLoading) {
    return (
      <OnboardingLayout step={3} totalSteps={5}>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-koppar" />
        </div>
      </OnboardingLayout>
    )
  }

  const archetype = result?.archetype || 'Your Archetype'
  const pillarScores = (result?.pillar_scores || {}) as Record<string, number>

  // Sort pillars by score for display
  const sortedPillars = Object.entries(pillarScores)
    .sort(([, a], [, b]) => b - a)
    .map(([id, score]) => ({
      id: id as PillarId,
      pillar: PILLARS[id as PillarId],
      score: Math.round(score),
    }))
    .filter(p => p.pillar)

  return (
    <OnboardingLayout step={3} totalSteps={5}>
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-koppar/10 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-koppar" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-kalkvit mb-3">
          You are <span className="text-koppar">{archetype}</span>
        </h1>
        <p className="text-kalkvit/60 text-lg max-w-lg mx-auto">
          Here's how you scored across the Five Pillars.
          Your journey will focus on strengthening your lower-scoring areas.
        </p>
      </div>

      <GlassCard variant="elevated" className="!p-6 md:!p-8 mb-6">
        {/* Archetype badge */}
        <div className="flex justify-center mb-6">
          <GlassBadge variant="koppar" className="text-base px-4 py-1.5">
            {archetype}
          </GlassBadge>
        </div>

        {/* Pillar scores as bars */}
        <div className="space-y-4">
          {sortedPillars.map(({ id, pillar, score }) => (
            <div key={id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-kalkvit/80 text-sm font-medium">{pillar.name}</span>
                <span className="text-kalkvit/50 text-sm">{score}%</span>
              </div>
              <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-koppar rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {sortedPillars.length === 0 && (
          <div className="text-center py-8">
            <p className="text-kalkvit/50">Assessment results will appear here once completed.</p>
          </div>
        )}
      </GlassCard>

      <div className="flex justify-end">
        <GlassButton variant="primary" onClick={handleContinue}>
          Continue
          <ArrowRight className="w-4 h-4" />
        </GlassButton>
      </div>
    </OnboardingLayout>
  )
}

export default OnboardingResultsPage
