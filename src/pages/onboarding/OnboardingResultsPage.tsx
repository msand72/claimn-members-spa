import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLatestAssessmentResult } from '../../lib/api/hooks'
import { useAssessmentQuestions } from '../../lib/api/hooks/useAssessments'
import { useUpdateOnboarding } from '../../lib/api/hooks/useOnboarding'
import { OnboardingLayout } from './OnboardingLayout'
import { GlassCard, GlassButton, GlassBadge } from '../../components/ui'
import { PILLARS, type PillarId } from '../../lib/constants'
import type { PillarScore } from '../../lib/api/types'
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
  ExternalLink,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const PILLAR_ICONS: Record<PillarId, React.ReactNode> = {
  identity: <Compass className="w-5 h-5" />,
  emotional: <Brain className="w-5 h-5" />,
  physical: <Heart className="w-5 h-5" />,
  connection: <Users className="w-5 h-5" />,
  mission: <Target className="w-5 h-5" />,
}

const ARCHETYPE_DISPLAY: Record<string, string> = {
  achiever: 'The Achiever',
  optimizer: 'The Optimizer',
  networker: 'The Networker',
  grinder: 'The Grinder',
  philosopher: 'The Philosopher',
}

interface DerivedResults {
  pillarScores: Record<PillarId, number> // percentage (0-100)
  primaryArchetype: string | null // display name
  secondaryArchetype: string | null
  overallScore: number
  microInsights: Record<PillarId, string>
  integrationInsights: string[]
  resultId?: string
}

export function OnboardingResultsPage() {
  const navigate = useNavigate()
  const { data: apiResult, isLoading } = useLatestAssessmentResult()
  const { data: apiQuestions } = useAssessmentQuestions('five-pillars')
  const updateOnboarding = useUpdateOnboarding()

  console.log('[OnboardingResults] apiResult:', JSON.stringify(apiResult, null, 2))
  console.log('[OnboardingResults] isLoading:', isLoading)

  // Derive results from API or fall back to sessionStorage client-side scoring
  const results: DerivedResults | null = useMemo(() => {
    if (apiResult) {
      console.log('[OnboardingResults] Deriving from apiResult, pillar_scores:', apiResult.pillar_scores, 'primary_archetype:', apiResult.primary_archetype)
      // New format: pillar_scores has { raw, level, percentage } objects
      const pillarScores: Record<PillarId, number> = {} as Record<PillarId, number>
      const microInsights: Record<PillarId, string> = {} as Record<PillarId, string>

      if (apiResult.pillar_scores) {
        for (const [key, val] of Object.entries(apiResult.pillar_scores)) {
          const pillarId = key as PillarId
          if (typeof val === 'object' && val !== null && 'percentage' in val) {
            // New format: PillarScore object
            pillarScores[pillarId] = (val as PillarScore).percentage
          } else if (typeof val === 'number') {
            // Legacy format: already a percentage number
            pillarScores[pillarId] = val
          }
        }
      }

      // Extract micro insights
      if (apiResult.micro_insights) {
        if (Array.isArray(apiResult.micro_insights)) {
          // New format: AssessmentInsight[] — extract pillar-keyed insight text
          for (const insight of apiResult.micro_insights) {
            if (insight.pillar && PILLARS[insight.pillar as PillarId]) {
              microInsights[insight.pillar as PillarId] = insight.insight
            }
          }
        }
      }
      // Legacy fallback
      if (apiResult.insights?.micro) {
        for (const [key, val] of Object.entries(apiResult.insights.micro)) {
          if (!microInsights[key as PillarId]) {
            microInsights[key as PillarId] = val
          }
        }
      }

      // Extract integration insights
      let integrationInsights: string[] = []
      if (apiResult.integration_insights && Array.isArray(apiResult.integration_insights)) {
        integrationInsights = apiResult.integration_insights.map((i) => i.insight)
      } else if (apiResult.insights?.integration) {
        integrationInsights = apiResult.insights.integration
      }

      // Fill missing micro insights with simple generated ones
      const allPillarIds: PillarId[] = ['identity', 'emotional', 'physical', 'connection', 'mission']
      for (const pid of allPillarIds) {
        if (!microInsights[pid] && pillarScores[pid] !== undefined) {
          const pillar = PILLARS[pid]
          const score = pillarScores[pid]
          if (score >= 75) {
            microInsights[pid] = `Strong foundation in ${pillar.name}. Continue leveraging this strength.`
          } else if (score >= 42) {
            microInsights[pid] = `${pillar.name} shows room for growth. Consider focused protocols.`
          } else {
            microInsights[pid] = `${pillar.name} is a key growth opportunity. Prioritize development here.`
          }
        }
      }

      // Primary archetype display — normalize DB keys ("The Achiever" → "achiever") for lookup
      const rawPrimary = apiResult.primary_archetype ?? apiResult.archetypes?.[0] ?? null
      const rawSecondary = apiResult.secondary_archetype ?? apiResult.archetypes?.[1] ?? null
      const normalizeKey = (k: string) => k.replace(/^The\s+/i, '').toLowerCase()
      const primaryNorm = rawPrimary ? normalizeKey(rawPrimary) : null
      const secondaryNorm = rawSecondary ? normalizeKey(rawSecondary) : null
      const primaryArchetype = primaryNorm
        ? ARCHETYPE_DISPLAY[primaryNorm] ?? rawPrimary
        : null
      const secondaryArchetype = secondaryNorm
        ? ARCHETYPE_DISPLAY[secondaryNorm] ?? rawSecondary
        : null

      // Overall score from pillar percentages
      const pillarValues = Object.values(pillarScores)
      const overallScore = pillarValues.length > 0
        ? Math.round(pillarValues.reduce((sum, s) => sum + s, 0) / pillarValues.length)
        : apiResult.overall_score ?? 0

      return {
        pillarScores,
        primaryArchetype,
        secondaryArchetype,
        overallScore,
        microInsights,
        integrationInsights,
        resultId: apiResult.id,
      }
    }

    // Fallback: client-side scoring from sessionStorage
    const storedAnswers = sessionStorage.getItem('assessmentAnswers')
    if (!storedAnswers || !apiQuestions || apiQuestions.length === 0) return null

    const answers = JSON.parse(storedAnswers) as Record<string, number>
    const questionsForScoring = apiQuestions.map(q => ({
      id: q.id,
      section: q.section ?? q.question_type,
      pillar: q.pillar ?? q.pillar_category,
      question_type: q.question_type,
      pillar_category: q.pillar_category,
    }))

    const pillarScores = calculatePillarScores(answers, questionsForScoring)
    const archetypes = determineArchetypesFromAnswers(answers, questionsForScoring)
    const pillarValues = Object.values(pillarScores)
    const overallScore = pillarValues.length > 0
      ? Math.round(pillarValues.reduce((sum, s) => sum + s, 0) / pillarValues.length)
      : 0

    return {
      pillarScores,
      primaryArchetype: archetypes[0] ?? null,
      secondaryArchetype: archetypes[1] ?? null,
      overallScore,
      microInsights: generateSimpleMicroInsights(pillarScores),
      integrationInsights: generateSimpleIntegrationInsights(pillarScores, archetypes),
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

  const { pillarScores, primaryArchetype, overallScore, microInsights, integrationInsights, resultId } = results

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
          {primaryArchetype ? (
            <>You are <span className="text-koppar">{primaryArchetype}</span></>
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
      {primaryArchetype && (
        <GlassCard variant="base" className="!p-5 mb-6">
          <h3 className="font-display text-base font-semibold text-kalkvit mb-3">
            Your Archetype{results.secondaryArchetype ? 's' : ''}
          </h3>
          <div className="flex flex-wrap gap-2 mb-2">
            <GlassBadge variant="koppar" className="text-sm py-1.5 px-3">
              {primaryArchetype}
            </GlassBadge>
            {results.secondaryArchetype && (
              <GlassBadge variant="default" className="text-sm py-1.5 px-3">
                {results.secondaryArchetype}
              </GlassBadge>
            )}
          </div>
          <p className="text-kalkvit/60 text-sm">
            {results.secondaryArchetype
              ? `You show traits of multiple archetypes, with ${primaryArchetype} being your primary style.`
              : `You strongly identify as ${primaryArchetype}. This archetype shapes how you approach challenges and growth.`}
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
                  {microInsights[pillarId] && (
                    <p className="text-xs text-kalkvit/50">{microInsights[pillarId]}</p>
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
      {integrationInsights.length > 0 && (
        <GlassCard variant="elevated" className="!p-5 mb-6">
          <h3 className="font-display text-base font-semibold text-kalkvit mb-3">
            Key Insights
          </h3>
          <div className="space-y-2.5">
            {integrationInsights.map((insight, index) => (
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

      <div className="flex items-center justify-between">
        {resultId && (
          <GlassButton
            variant="ghost"
            onClick={() => navigate(`/assessment/results?id=${resultId}`)}
          >
            View Full Report
            <ExternalLink className="w-4 h-4" />
          </GlassButton>
        )}
        <div className="ml-auto">
          <GlassButton
            variant="primary"
            onClick={handleContinue}
            disabled={updateOnboarding.isPending}
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </GlassButton>
        </div>
      </div>
    </OnboardingLayout>
  )
}

export default OnboardingResultsPage
