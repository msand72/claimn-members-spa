import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLatestAssessmentResult } from '../../lib/api/hooks'
import { useAssessmentQuestions } from '../../lib/api/hooks/useAssessments'
import { useUpdateOnboarding } from '../../lib/api/hooks/useOnboarding'
import { OnboardingLayout } from './OnboardingLayout'
import { GlassCard, GlassButton, GlassBadge } from '../../components/ui'
import { PILLARS, type PillarId } from '../../lib/constants'
import {
  calculatePillarScores,
  determineArchetypesFromAnswers,
  generateSimpleMicroInsights,
  generateSimpleIntegrationInsights,
} from '../../lib/assessment/scoring'
import {
  ArrowRight,
  Loader2,
  Sparkles,
  Compass,
  Brain,
  Heart,
  Users,
  Target,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const PILLAR_ICONS: Record<PillarId, React.ReactNode> = {
  identity: <Compass className="w-5 h-5" />,
  emotional: <Brain className="w-5 h-5" />,
  physical: <Heart className="w-5 h-5" />,
  connection: <Users className="w-5 h-5" />,
  mission: <Target className="w-5 h-5" />,
}

export function OnboardingResultsPage() {
  const navigate = useNavigate()
  const { data: apiResult, isLoading } = useLatestAssessmentResult()
  const { data: apiQuestions } = useAssessmentQuestions('five-pillars')
  const updateOnboarding = useUpdateOnboarding()

  // Derive results from API or fall back to sessionStorage client-side scoring
  const results = useMemo(() => {
    if (apiResult) {
      return {
        pillarScores: apiResult.pillar_scores,
        archetypes: apiResult.archetypes,
        overallScore: apiResult.overall_score,
        insights: apiResult.insights,
      }
    }

    // Fallback: client-side scoring from sessionStorage
    const storedAnswers = sessionStorage.getItem('assessmentAnswers')
    if (!storedAnswers || !apiQuestions || apiQuestions.length === 0) return null

    const answers = JSON.parse(storedAnswers) as Record<string, number>
    const questionsForScoring = apiQuestions.map(q => ({
      id: q.id,
      section: q.section,
      pillar: q.pillar,
    }))

    const pillarScores = calculatePillarScores(answers, questionsForScoring)
    const archetypes = determineArchetypesFromAnswers(answers, questionsForScoring)
    const pillarValues = Object.values(pillarScores)
    const overallScore = pillarValues.length > 0
      ? Math.round(pillarValues.reduce((sum, s) => sum + s, 0) / pillarValues.length)
      : 0

    return {
      pillarScores,
      archetypes,
      overallScore,
      insights: {
        micro: generateSimpleMicroInsights(pillarScores),
        integration: generateSimpleIntegrationInsights(pillarScores, archetypes),
      },
    }
  }, [apiResult, apiQuestions])

  const handleContinue = async () => {
    await updateOnboarding.mutateAsync({ current_step: 'path' })
    navigate('/onboarding/path')
  }

  if (isLoading || !results) {
    return (
      <OnboardingLayout step={4} totalSteps={5}>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-koppar" />
        </div>
      </OnboardingLayout>
    )
  }

  const { pillarScores, archetypes, overallScore, insights } = results
  const archetype = archetypes?.[0] || null

  // Sort pillars by score for display
  const sortedPillars = Object.entries(pillarScores)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => id as PillarId)
    .filter(id => PILLARS[id])

  const strongestPillar = sortedPillars[0]
  const weakestPillar = sortedPillars[sortedPillars.length - 1]

  return (
    <OnboardingLayout step={4} totalSteps={5}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-koppar/10 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-koppar" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-kalkvit mb-3">
          {archetype ? (
            <>You are <span className="text-koppar">{archetype}</span></>
          ) : (
            'Your Assessment Results'
          )}
        </h1>
        <p className="text-kalkvit/60 text-lg max-w-lg mx-auto">
          Here's your personalized profile across the Five Pillars.
          Your journey will focus on strengthening your growth areas.
        </p>
      </div>

      {/* Overall Score */}
      <GlassCard variant="elevated" className="!p-6 mb-6 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-koppar/20 to-koppar/5 border-2 border-koppar mb-3">
          <span className="font-display text-3xl font-bold text-koppar">{overallScore}</span>
        </div>
        <h2 className="font-serif text-lg font-semibold text-kalkvit mb-1">
          Overall Wellbeing Score
        </h2>
        <p className="text-kalkvit/60 text-sm max-w-md mx-auto">
          {overallScore >= 80
            ? 'Excellent! You have a strong foundation across all pillars.'
            : overallScore >= 60
              ? 'Good progress! Some areas show strength while others offer growth opportunities.'
              : overallScore >= 40
                ? 'Solid starting point. Focused work on key pillars will drive transformation.'
                : 'Great potential for growth. Your journey starts here.'}
        </p>
      </GlassCard>

      {/* Archetype */}
      {archetype && (
        <GlassCard variant="base" className="!p-5 mb-6">
          <h3 className="font-display text-base font-semibold text-kalkvit mb-3">
            Your Archetype{archetypes.length > 1 ? 's' : ''}
          </h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {archetypes.map((a, i) => (
              <GlassBadge key={a} variant={i === 0 ? 'koppar' : 'default'} className="text-sm py-1.5 px-3">
                {a}
              </GlassBadge>
            ))}
          </div>
          <p className="text-kalkvit/60 text-sm">
            {archetypes.length === 1
              ? `You strongly identify as ${archetypes[0]}. This archetype shapes how you approach challenges and growth.`
              : `You show traits of multiple archetypes, with ${archetypes[0]} being your primary style.`}
          </p>
        </GlassCard>
      )}

      {/* Pillar Scores */}
      <div className="space-y-3 mb-6">
        {sortedPillars.map((pillarId) => {
          const pillar = PILLARS[pillarId]
          const score = Math.round(pillarScores[pillarId] || 0)
          const isStrongest = pillarId === strongestPillar
          const isWeakest = pillarId === weakestPillar

          return (
            <GlassCard
              key={pillarId}
              variant={isStrongest ? 'accent' : 'base'}
              className={cn('!p-4', isStrongest && 'ring-1 ring-koppar/30')}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'p-2.5 rounded-xl',
                    isStrongest
                      ? 'bg-koppar/20 text-koppar'
                      : 'bg-white/10 text-kalkvit/60'
                  )}
                >
                  {PILLAR_ICONS[pillarId]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-kalkvit text-sm">{pillar.name}</h4>
                      {isStrongest && (
                        <GlassBadge variant="success" className="text-xs">
                          <TrendingUp className="w-3 h-3" />
                          Strongest
                        </GlassBadge>
                      )}
                      {isWeakest && (
                        <GlassBadge variant="warning" className="text-xs">
                          <AlertCircle className="w-3 h-3" />
                          Growth Area
                        </GlassBadge>
                      )}
                    </div>
                    <span
                      className={cn(
                        'font-display text-lg font-bold',
                        score >= 70 ? 'text-skogsgron' : score >= 40 ? 'text-koppar' : 'text-tegelrod'
                      )}
                    >
                      {score}
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-1000 ease-out',
                        score >= 70
                          ? 'bg-skogsgron'
                          : score >= 40
                            ? 'bg-gradient-to-r from-koppar to-koppar/70'
                            : 'bg-tegelrod'
                      )}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  {insights?.micro[pillarId] && (
                    <p className="text-xs text-kalkvit/50">{insights.micro[pillarId]}</p>
                  )}
                </div>
              </div>
            </GlassCard>
          )
        })}
      </div>

      {sortedPillars.length === 0 && (
        <GlassCard variant="base" className="!p-6 mb-6 text-center">
          <p className="text-kalkvit/50">Assessment results will appear here once completed.</p>
        </GlassCard>
      )}

      {/* Integration Insights */}
      {insights?.integration && insights.integration.length > 0 && (
        <GlassCard variant="elevated" className="!p-5 mb-6">
          <h3 className="font-display text-base font-semibold text-kalkvit mb-3">
            Key Insights
          </h3>
          <div className="space-y-2.5">
            {insights.integration.map((insight, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-koppar/20 flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-koppar">{index + 1}</span>
                </div>
                <p className="text-kalkvit/70 text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <div className="flex justify-end">
        <GlassButton
          variant="primary"
          onClick={handleContinue}
          disabled={updateOnboarding.isPending}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </GlassButton>
      </div>
    </OnboardingLayout>
  )
}

export default OnboardingResultsPage
