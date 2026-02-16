import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge, GlassToast } from '../components/ui'
import { PILLARS } from '../lib/constants'
import type { PillarId } from '../lib/constants'
import type { PillarScore, AssessmentInsight, ArchetypeScores } from '../lib/api/types'
import {
  calculatePillarScores,
  determineArchetypesFromAnswers,
  generateSimpleMicroInsights,
  generateSimpleIntegrationInsights,
} from '../lib/assessment/scoring'
import {
  useLatestAssessmentResult,
  useAssessmentResultById,
  useAssessmentQuestions,
  useAssessmentContent,
} from '../lib/api/hooks/useAssessments'
import {
  Compass,
  Brain,
  Heart,
  Users,
  Target,
  ArrowRight,
  Download,
  Share2,
  Sparkles,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  BarChart3,
  Zap,
  Shield,
  Loader2,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { PrintReport } from '../components/PrintReport'

// =====================================================
// Constants
// =====================================================

const PILLAR_ICONS: Record<PillarId, React.ReactNode> = {
  identity: <Compass className="w-5 h-5" />,
  emotional: <Brain className="w-5 h-5" />,
  physical: <Heart className="w-5 h-5" />,
  connection: <Users className="w-5 h-5" />,
  mission: <Target className="w-5 h-5" />,
}

// Fallback display names — content API (DB) takes priority when available
const ARCHETYPE_DISPLAY: Record<string, { name: string; subtitle: string }> = {
  achiever: { name: 'The Achiever', subtitle: 'Results-Driven, Goal-Oriented' },
  optimizer: { name: 'The Optimizer', subtitle: 'Systems-Focused, Efficiency-Driven' },
  networker: { name: 'The Networker', subtitle: 'Connection-Builder, Relationship-Focused' },
  grinder: { name: 'The Grinder', subtitle: 'Discipline-Driven, Relentless Worker' },
  philosopher: { name: 'The Philosopher', subtitle: 'Deep Thinker, Meaning-Seeker' },
  integrator: { name: 'The Integrator', subtitle: 'Balanced, Holistically Developed' },
}

const INSIGHT_TYPE_STYLES: Record<string, { icon: React.ReactNode; color: string }> = {
  pillar_synergy: { icon: <Zap className="w-4 h-4" />, color: 'text-skogsgron' },
  pillar_analysis: { icon: <BarChart3 className="w-4 h-4" />, color: 'text-koppar' },
  dual_integration: { icon: <Users className="w-4 h-4" />, color: 'text-brandAmber' },
  archetype_dominance: { icon: <Shield className="w-4 h-4" />, color: 'text-koppar' },
  archetype_spectrum: { icon: <BarChart3 className="w-4 h-4" />, color: 'text-kalkvit/60' },
  general: { icon: <Sparkles className="w-4 h-4" />, color: 'text-koppar' },
}

// =====================================================
// Types for derived data
// =====================================================

interface DerivedResults {
  resultId?: string
  primaryArchetype: string // lowercase key
  secondaryArchetype: string | null
  primaryPercentage: number
  secondaryPercentage: number
  archetypeScores: Record<string, number>
  isBig5Format: boolean // true = scores are percentages (0-100), false = vote counts (0-6)
  pillarScores: Record<PillarId, PillarScore>
  pillarPercentages: Record<PillarId, number>
  consistencyScore: number
  microInsights: AssessmentInsight[]
  integrationInsights: AssessmentInsight[]
  overallScore: number
}

// =====================================================
// Helper to get content from content map with fallback
// =====================================================

function getContent(
  contentMap: Record<string, string> | undefined,
  key: string,
  fallback: string = ''
): string {
  return contentMap?.[key] ?? fallback
}

// =====================================================
// Component
// =====================================================

export function AssessmentResultsPage() {
  const navigate = useNavigate()
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'info' | 'warning' | 'error' } | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current) }, [])

  // Read ?id= query param (passed from OnboardingResultsPage)
  const [searchParams] = useSearchParams()
  const requestedResultId = searchParams.get('id')

  // Fetch by specific ID if provided, otherwise fetch latest
  const specificResult = useAssessmentResultById(requestedResultId ?? '')
  const latestResult = useLatestAssessmentResult()
  const { data: apiQuestions } = useAssessmentQuestions('five-pillars')
  const { data: contentMap } = useAssessmentContent()

  const apiResult = requestedResultId ? specificResult.data : latestResult.data
  const apiLoading = requestedResultId ? specificResult.isLoading : latestResult.isLoading

  // Derive normalized results
  const results: DerivedResults | null = useMemo(() => {
    if (apiResult) {
      return deriveFromApiResult(apiResult)
    }

    // Still loading
    if (apiLoading) return null

    // Fallback: client-side scoring from sessionStorage
    const storedAnswers = sessionStorage.getItem('assessmentAnswers')
    if (!storedAnswers || !apiQuestions || apiQuestions.length === 0) {
      return null
    }

    let answers: Record<string, number>
    try {
      answers = JSON.parse(storedAnswers) as Record<string, number>
    } catch {
      return null
    }
    const questionsForScoring = apiQuestions.map(q => ({
      id: q.id,
      section: q.section ?? q.question_type,
      pillar: q.pillar ?? q.pillar_category,
      question_type: q.question_type,
      pillar_category: q.pillar_category,
    }))

    const pillarPercentages = calculatePillarScores(answers, questionsForScoring)
    const archetypes = determineArchetypesFromAnswers(answers, questionsForScoring)

    // Build PillarScore objects from percentages
    const pillarScores: Record<PillarId, PillarScore> = {} as Record<PillarId, PillarScore>
    for (const [pid, pct] of Object.entries(pillarPercentages)) {
      const raw = Math.round((pct / 100) * 7 * 10) / 10
      pillarScores[pid as PillarId] = {
        raw,
        level: raw <= 3.5 ? 'low' : raw <= 5.5 ? 'moderate' : 'high',
        percentage: pct,
      }
    }

    const primaryKey = (archetypes[0] ?? 'achiever').replace('The ', '').toLowerCase()
    const pillarValues = Object.values(pillarPercentages)
    const overallScore = pillarValues.length > 0
      ? Math.round(pillarValues.reduce((s, v) => s + v, 0) / pillarValues.length)
      : 0

    // Generate simple insights for offline mode
    const microInsightsMap = generateSimpleMicroInsights(pillarPercentages)
    const microInsights: AssessmentInsight[] = Object.entries(microInsightsMap).map(([pillar, text]) => ({
      type: 'pillar_analysis',
      title: `${PILLARS[pillar as PillarId]?.name ?? pillar} Focus`,
      insight: text,
      pillar,
      level: pillarScores[pillar as PillarId]?.level,
    }))

    const integrationTexts = generateSimpleIntegrationInsights(pillarPercentages, archetypes)
    const integrationInsights: AssessmentInsight[] = integrationTexts.map((text) => ({
      type: 'general',
      title: 'Integration Insight',
      insight: text,
    }))

    return {
      primaryArchetype: primaryKey,
      secondaryArchetype: null,
      primaryPercentage: 0,
      secondaryPercentage: 0,
      archetypeScores: {},
      isBig5Format: false,
      pillarScores,
      pillarPercentages,
      consistencyScore: 0,
      microInsights,
      integrationInsights,
      overallScore,
    }
  }, [apiResult, apiLoading, apiQuestions])

  // Redirect if no data at all
  useEffect(() => {
    if (!apiLoading && !results) {
      navigate('/assessment')
    }
  }, [apiLoading, results, navigate])

  const showToast = useCallback(
    (message: string, variant: 'success' | 'info' | 'warning' | 'error' = 'info') => {
      setToast({ message, variant })
      toastTimerRef.current = setTimeout(() => setToast(null), 3000)
    },
    []
  )

  const handleShareResults = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showToast('Link copied to clipboard!', 'success')
    } catch {
      showToast('Could not copy link. Try manually copying the URL.', 'error')
    }
  }, [showToast])

  const handleDownloadReport = useCallback(() => {
    window.print()
  }, [])

  // Loading
  if (!results) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-koppar mx-auto mb-4" />
            <p className="text-kalkvit/60">Calculating your results...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  const {
    primaryArchetype,
    primaryPercentage,
    archetypeScores,
    isBig5Format,
    pillarScores,
    pillarPercentages,
    consistencyScore,
    microInsights,
    integrationInsights,
    overallScore,
  } = results

  // Content API (DB) takes priority, fall back to hardcoded ARCHETYPE_DISPLAY
  const fallback = ARCHETYPE_DISPLAY[primaryArchetype]
  const archetypeInfo = {
    name: getContent(contentMap, `${primaryArchetype}_name`, fallback?.name ?? primaryArchetype),
    subtitle: getContent(contentMap, `${primaryArchetype}_subtitle`, fallback?.subtitle ?? ''),
  }

  // Sort pillars by percentage
  const sortedPillars = Object.entries(pillarPercentages)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => id as PillarId)
    .filter((id) => PILLARS[id])

  const strongestPillar = sortedPillars[0]
  const weakestPillar = sortedPillars[sortedPillars.length - 1]

  // Top pillar info for hero
  const topPillar = strongestPillar ? PILLARS[strongestPillar] : null
  const topPillarScore = strongestPillar ? pillarPercentages[strongestPillar] : 0

  return (
    <MainLayout>
      <PrintReport results={results} contentMap={contentMap} />
      <div className="max-w-4xl mx-auto print:hidden">
        {/* ============================================= */}
        {/* Section 1: Header */}
        {/* ============================================= */}
        <div className="text-center mb-4">
          <GlassBadge variant="koppar" className="mb-4">
            <Sparkles className="w-4 h-4" />
            CLAIM'N Archetype Results
          </GlassBadge>
        </div>

        {/* ============================================= */}
        {/* Section 2: Hero — Score Circle + Quick Stats */}
        {/* ============================================= */}
        <GlassCard variant="elevated" className="mb-8">
          <div className="text-center mb-6">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-kalkvit mb-1">
              {archetypeInfo.name}
            </h1>
            {archetypeInfo.subtitle && (
              <p className="text-koppar/80 text-lg">{archetypeInfo.subtitle}</p>
            )}
            {getContent(contentMap, `${primaryArchetype}_subtitle`) && (
              <p className="text-kalkvit/60 text-sm mt-2 max-w-lg mx-auto">
                {getContent(contentMap, `${primaryArchetype}_subtitle`)}
              </p>
            )}
          </div>

          {/* Score circle */}
          <div className="flex justify-center mb-8">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke="#B87333"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(overallScore / 100) * 339.3} 339.3`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-4xl font-bold text-koppar">{overallScore}</span>
              </div>
            </div>
          </div>

          {/* Quick stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-white/[0.04] border border-white/10">
              <p className="text-2xl font-bold text-koppar">{primaryPercentage || overallScore}%</p>
              <p className="text-xs text-kalkvit/50 mt-1">Primary Archetype</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/[0.04] border border-white/10">
              <p className="text-2xl font-bold text-koppar">
                {consistencyScore > 0 ? `${Math.round(consistencyScore * 100)}%` : `${overallScore}%`}
              </p>
              <p className="text-xs text-kalkvit/50 mt-1">
                {consistencyScore > 0 ? 'Consistency' : 'Overall Score'}
              </p>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/[0.04] border border-white/10">
              <p className="text-2xl font-bold text-skogsgron">{topPillarScore}%</p>
              <p className="text-xs text-kalkvit/50 mt-1">{topPillar?.name ?? 'Top Pillar'}</p>
            </div>
          </div>
        </GlassCard>

        {/* ============================================= */}
        {/* Section 3: Five Pillar Foundation */}
        {/* ============================================= */}
        <div className="mb-8">
          <h2 className="font-display text-xl font-bold text-kalkvit mb-4">
            Your Five Pillar Foundation
          </h2>
          <div className="space-y-4">
            {sortedPillars.map((pillarId) => {
              const pillar = PILLARS[pillarId]
              const score = pillarPercentages[pillarId]
              const pillarScore = pillarScores[pillarId]
              const isStrongest = pillarId === strongestPillar
              const isWeakest = pillarId === weakestPillar

              // Find micro insight for this pillar
              const insight = microInsights.find((i) => i.pillar === pillarId)

              return (
                <GlassCard
                  key={pillarId}
                  variant={isStrongest ? 'accent' : 'base'}
                  className={cn(isStrongest && 'ring-1 ring-koppar/30')}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'p-3 rounded-xl',
                        isStrongest
                          ? 'bg-koppar/20 text-koppar'
                          : 'bg-white/10 text-kalkvit/60'
                      )}
                    >
                      {PILLAR_ICONS[pillarId]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-kalkvit">{pillar.name}</h4>
                          {pillarScore && (
                            <GlassBadge
                              variant={
                                pillarScore.level === 'high' ? 'success' :
                                pillarScore.level === 'moderate' ? 'koppar' : 'warning'
                              }
                              className="text-xs"
                            >
                              {pillarScore.level === 'high' && <TrendingUp className="w-3 h-3" />}
                              {pillarScore.level === 'low' && <AlertCircle className="w-3 h-3" />}
                              {pillarScore.level}
                            </GlassBadge>
                          )}
                          {isStrongest && (
                            <GlassBadge variant="success" className="text-xs">
                              Strongest
                            </GlassBadge>
                          )}
                          {isWeakest && (
                            <GlassBadge variant="warning" className="text-xs">
                              Growth Area
                            </GlassBadge>
                          )}
                        </div>
                        <span
                          className={cn(
                            'font-display text-xl font-bold',
                            score >= 70 ? 'text-skogsgron' : score >= 40 ? 'text-koppar' : 'text-tegelrod'
                          )}
                        >
                          {score}%
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-1000 ease-out',
                            score >= 70
                              ? 'bg-skogsgron'
                              : score >= 40
                                ? 'bg-gradient-to-r from-koppar to-brandAmber'
                                : 'bg-tegelrod'
                          )}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      {insight && (
                        <p className="text-sm text-kalkvit/60">{insight.insight}</p>
                      )}
                      {/* Content-driven insight from content table */}
                      {!insight && contentMap && pillarScore && (
                        <p className="text-sm text-kalkvit/60">
                          {getContent(contentMap, `${primaryArchetype}_${pillarId}_${pillarScore.level}`)}
                        </p>
                      )}
                    </div>
                  </div>
                </GlassCard>
              )
            })}
          </div>
        </div>

        {/* ============================================= */}
        {/* Section 4: Primary Archetype Deep Dive */}
        {/* ============================================= */}
        <GlassCard variant="elevated" className="mb-8">
          <h2 className="font-display text-xl font-bold text-kalkvit mb-4">
            Primary Archetype Deep Dive
          </h2>

          <div className="space-y-4">
            {/* Strengths */}
            {getContent(contentMap, `${primaryArchetype}_strengths`) && (
              <div>
                <h4 className="font-medium text-koppar mb-2">Core Strengths</h4>
                <p className="text-kalkvit/70 text-sm">
                  {getContent(contentMap, `${primaryArchetype}_strengths`)}
                </p>
              </div>
            )}

            {/* Growth Edges (DB key: {archetype}_weaknesses) */}
            {getContent(contentMap, `${primaryArchetype}_weaknesses`) && (
              <div>
                <h4 className="font-medium text-koppar mb-2">Growth Edges</h4>
                <p className="text-kalkvit/70 text-sm">
                  {getContent(contentMap, `${primaryArchetype}_weaknesses`)}
                </p>
              </div>
            )}

            {/* Description (DB key: {archetype}_description) */}
            {getContent(contentMap, `${primaryArchetype}_description`) && (
              <div className="p-4 rounded-xl bg-koppar/5 border border-koppar/20">
                <h4 className="font-medium text-koppar mb-2">Key Insight</h4>
                <p className="text-kalkvit/80 text-sm">
                  {getContent(contentMap, `${primaryArchetype}_description`)}
                </p>
              </div>
            )}

            {/* Fallback if no content keys */}
            {!contentMap && (
              <p className="text-kalkvit/60 text-sm">
                As {archetypeInfo.name}, you approach growth with a distinctive style.
                Your assessment reveals how this archetype intersects with your pillar scores
                to create unique strengths and opportunities.
              </p>
            )}
          </div>
        </GlassCard>

        {/* ============================================= */}
        {/* Section 5: All Archetype Scores + Consistency */}
        {/* ============================================= */}
        {Object.keys(archetypeScores).length > 0 && (
          <GlassCard variant="base" className="mb-8">
            <h2 className="font-display text-xl font-bold text-kalkvit mb-4">
              All Archetype Scores
            </h2>

            <div className="space-y-3 mb-6">
              {Object.entries(archetypeScores)
                .sort(([, a], [, b]) => b - a)
                .map(([key, score]) => {
                  const info = ARCHETYPE_DISPLAY[key]
                  // Big5: scores are already percentages (0-100); Legacy: vote counts (max ~6)
                  const percentage = isBig5Format ? Math.round(score) : Math.round((score / 6) * 100)
                  const isPrimary = key === primaryArchetype

                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn('text-sm', isPrimary ? 'text-koppar font-medium' : 'text-kalkvit/70')}>
                          {info?.name ?? key}
                        </span>
                        <span className={cn('text-sm font-medium', isPrimary ? 'text-koppar' : 'text-kalkvit/50')}>
                          {percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-700',
                            isPrimary ? 'bg-koppar' : 'bg-white/20'
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Consistency Badge */}
            {consistencyScore > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="p-2 rounded-lg bg-koppar/10">
                  <BarChart3 className="w-4 h-4 text-koppar" />
                </div>
                <div>
                  <p className="text-sm text-kalkvit font-medium">
                    Consistency Score: {Math.round(consistencyScore * 100)}%
                  </p>
                  <p className="text-xs text-kalkvit/50">
                    {consistencyScore >= 0.7
                      ? 'Highly balanced archetype distribution'
                      : consistencyScore >= 0.4
                        ? 'Moderate archetype focus with some variety'
                        : 'Strong dominant archetype with clear specialization'}
                  </p>
                </div>
              </div>
            )}
          </GlassCard>
        )}

        {/* ============================================= */}
        {/* Section 6: Integration Analysis */}
        {/* ============================================= */}
        {integrationInsights.length > 0 && (
          <GlassCard variant="elevated" className="mb-8">
            <h2 className="font-display text-xl font-bold text-kalkvit mb-4">
              Integration Analysis
            </h2>
            <div className="space-y-3">
              {integrationInsights.map((insight, index) => {
                const style = INSIGHT_TYPE_STYLES[insight.type] ?? INSIGHT_TYPE_STYLES.general
                return (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-white/[0.04] border border-white/10"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('mt-0.5', style?.color)}>
                        {style?.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-kalkvit mb-1">{insight.title}</h4>
                        <p className="text-sm text-kalkvit/60">{insight.insight}</p>
                        {insight.priority && (
                          <GlassBadge
                            variant={insight.priority === 'high' ? 'warning' : 'default'}
                            className="text-xs mt-2"
                          >
                            {insight.priority} priority
                          </GlassBadge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        )}

        {/* ============================================= */}
        {/* Section 7: Development Focus Areas */}
        {/* ============================================= */}
        <GlassCard variant="base" className="mb-8">
          <h2 className="font-display text-xl font-bold text-kalkvit mb-4">
            Development Focus Areas
          </h2>
          <div className="space-y-3">
            {sortedPillars
              .slice()
              .reverse() // lowest first
              .filter((pid) => pillarScores[pid]?.level !== 'high')
              .slice(0, 3)
              .map((pillarId, index) => {
                const pillar = PILLARS[pillarId]
                const score = pillarPercentages[pillarId]
                const level = pillarScores[pillarId]?.level

                return (
                  <div key={pillarId} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-koppar/20 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-koppar">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm text-kalkvit font-medium">
                        {pillar.name}
                        <span className="text-kalkvit/40 ml-2">({score}% — {level})</span>
                      </p>
                      <p className="text-xs text-kalkvit/50 mt-0.5">
                        {getContent(
                          contentMap,
                          `${primaryArchetype}_low_${pillarId}`,
                          `Focus on structured development in ${pillar.name.toLowerCase()} to build momentum.`
                        )}
                      </p>
                    </div>
                  </div>
                )
              })}
            {sortedPillars.every((pid) => pillarScores[pid]?.level === 'high') && (
              <p className="text-sm text-kalkvit/60">
                All pillars are at a high level. Focus on integration and synergy between areas.
              </p>
            )}
          </div>
        </GlassCard>

        {/* ============================================= */}
        {/* Section 8: Action Plan */}
        {/* ============================================= */}
        <GlassCard variant="elevated" className="mb-8">
          <h2 className="font-display text-xl font-bold text-kalkvit mb-4">
            Your Action Plan
          </h2>

          <div className="space-y-6">
            {/* 30-day */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-skogsgron" />
                <h4 className="font-medium text-kalkvit text-sm">First 30 Days</h4>
              </div>
              <p className="text-sm text-kalkvit/60 ml-4">
                {getContent(
                  contentMap,
                  `${primaryArchetype}_action_30days`,
                  `Start with your growth area: ${weakestPillar ? PILLARS[weakestPillar].name : 'lowest-scoring pillar'}. Build one daily habit aligned with this pillar.`
                )}
              </p>
            </div>

            {/* 90-day */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-koppar" />
                <h4 className="font-medium text-kalkvit text-sm">90-Day Milestone</h4>
              </div>
              <p className="text-sm text-kalkvit/60 ml-4">
                {getContent(
                  contentMap,
                  `${primaryArchetype}_action_90days`,
                  'Expand your practice across multiple pillars. Begin integrating your archetype strengths with targeted development protocols.'
                )}
              </p>
            </div>

            {/* 6-month+ */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-brandAmber" />
                <h4 className="font-medium text-kalkvit text-sm">6-Month Vision</h4>
              </div>
              <p className="text-sm text-kalkvit/60 ml-4">
                {getContent(
                  contentMap,
                  `${primaryArchetype}_action_longterm`,
                  'Achieve balanced development across all five pillars. Leverage your archetype to mentor others and contribute to the community.'
                )}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* ============================================= */}
        {/* Section 9: Recommended Next Steps */}
        {/* ============================================= */}
        <GlassCard variant="base" className="mb-8">
          <h2 className="font-display text-xl font-bold text-kalkvit mb-4">
            Recommended Next Steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/protocols">
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.04] hover:border-koppar/30 hover:bg-white/[0.06] transition-all group">
                <h4 className="font-medium text-kalkvit mb-1 flex items-center gap-2">
                  Start a Protocol
                  <ChevronRight className="w-4 h-4 text-kalkvit/30 group-hover:text-koppar transition-colors" />
                </h4>
                <p className="text-sm text-kalkvit/60">
                  Begin with the {weakestPillar ? PILLARS[weakestPillar].name : 'recommended'} protocol to address your growth area
                </p>
              </div>
            </Link>
            <Link to="/goals">
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.04] hover:border-koppar/30 hover:bg-white/[0.06] transition-all group">
                <h4 className="font-medium text-kalkvit mb-1 flex items-center gap-2">
                  Set Your Goals
                  <ChevronRight className="w-4 h-4 text-kalkvit/30 group-hover:text-koppar transition-colors" />
                </h4>
                <p className="text-sm text-kalkvit/60">
                  Create measurable goals aligned with your assessment insights
                </p>
              </div>
            </Link>
            <Link to="/book-session">
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.04] hover:border-koppar/30 hover:bg-white/[0.06] transition-all group">
                <h4 className="font-medium text-kalkvit mb-1 flex items-center gap-2">
                  Book a Coaching Session
                  <ChevronRight className="w-4 h-4 text-kalkvit/30 group-hover:text-koppar transition-colors" />
                </h4>
                <p className="text-sm text-kalkvit/60">
                  Get personalized guidance from an expert coach
                </p>
              </div>
            </Link>
            <Link to="/network">
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.04] hover:border-koppar/30 hover:bg-white/[0.06] transition-all group">
                <h4 className="font-medium text-kalkvit mb-1 flex items-center gap-2">
                  Connect with Others
                  <ChevronRight className="w-4 h-4 text-kalkvit/30 group-hover:text-koppar transition-colors" />
                </h4>
                <p className="text-sm text-kalkvit/60">
                  Find members with shared interests and goals
                </p>
              </div>
            </Link>
          </div>
        </GlassCard>

        {/* ============================================= */}
        {/* Action Buttons */}
        {/* ============================================= */}
        <div className="flex flex-wrap gap-4 justify-center mb-8 print:hidden">
          <Link to="/">
            <GlassButton variant="primary">
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </GlassButton>
          </Link>
          <GlassButton variant="secondary" onClick={handleDownloadReport}>
            <Download className="w-4 h-4" />
            Save PDF
          </GlassButton>
          <GlassButton variant="ghost" onClick={handleShareResults}>
            <Share2 className="w-4 h-4" />
            Share Results
          </GlassButton>
          <Link to="/assessment/take">
            <GlassButton variant="ghost">
              <RefreshCw className="w-4 h-4" />
              Retake Assessment
            </GlassButton>
          </Link>
        </div>

        {/* Toast notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50">
            <GlassToast
              variant={toast.variant}
              message={toast.message}
              onClose={() => setToast(null)}
            />
          </div>
        )}
      </div>
    </MainLayout>
  )
}

// =====================================================
// Helper: Derive results from API AssessmentResult
// =====================================================

/** Normalize an archetype key from DB format ("The Achiever") to lowercase ("achiever") */
function normalizeArchetypeKey(key: string): string {
  return key.replace(/^The\s+/i, '').toLowerCase()
}

function deriveFromApiResult(apiResult: {
  id?: string
  primary_archetype?: string
  secondary_archetype?: string | null
  archetype_scores?: ArchetypeScores | Record<string, number>
  pillar_scores?: Record<string, PillarScore | number>
  consistency_score?: number | string
  micro_insights?: AssessmentInsight[]
  integration_insights?: AssessmentInsight[]
  // Legacy
  archetypes?: string[]
  overall_score?: number
  insights?: { micro: Record<PillarId, string>; integration: string[] }
}): DerivedResults {
  // Archetype — always normalize to lowercase key for display lookups
  const rawPrimary = apiResult.primary_archetype ?? apiResult.archetypes?.[0] ?? 'achiever'
  const primaryArchetype = normalizeArchetypeKey(rawPrimary)
  const rawSecondary = apiResult.secondary_archetype ?? apiResult.archetypes?.[1] ?? null
  const secondaryArchetype = rawSecondary ? normalizeArchetypeKey(rawSecondary) : null

  // Archetype scores — handle both Big Five nested format and legacy flat format
  // Big Five: { big5_profile: { C, E, O, A, N }, archetype_match: { achiever: 75, ... } }
  // Legacy:   { achiever: 3, optimizer: 2, ... } (vote counts)
  const archetypeScores: Record<string, number> = {}
  let isBig5Format = false
  if (apiResult.archetype_scores) {
    const scores = apiResult.archetype_scores as Record<string, unknown>
    if (scores.archetype_match && typeof scores.archetype_match === 'object') {
      // Big Five nested format — use archetype_match values (already percentages)
      isBig5Format = true
      for (const [key, val] of Object.entries(scores.archetype_match as Record<string, number>)) {
        archetypeScores[normalizeArchetypeKey(key)] = val
      }
    } else {
      // Legacy flat format — vote counts
      for (const [key, val] of Object.entries(apiResult.archetype_scores)) {
        if (typeof val === 'number') {
          archetypeScores[normalizeArchetypeKey(key)] = val
        }
      }
    }
  }

  const primaryScore = archetypeScores[primaryArchetype] ?? 0
  const secondaryScore = secondaryArchetype ? (archetypeScores[secondaryArchetype] ?? 0) : 0
  // Big Five scores are already percentages; legacy scores are vote counts (max ~6)
  const primaryPercentage = isBig5Format ? Math.round(primaryScore) : Math.round((primaryScore / 6) * 100)
  const secondaryPercentage = secondaryArchetype
    ? (isBig5Format ? Math.round(secondaryScore) : Math.round((secondaryScore / 6) * 100))
    : 0

  // Pillar scores
  const pillarScores: Record<PillarId, PillarScore> = {} as Record<PillarId, PillarScore>
  const pillarPercentages: Record<PillarId, number> = {} as Record<PillarId, number>

  if (apiResult.pillar_scores) {
    for (const [key, val] of Object.entries(apiResult.pillar_scores)) {
      const pillarId = key as PillarId
      if (typeof val === 'object' && val !== null && 'percentage' in val) {
        pillarScores[pillarId] = val as PillarScore
        pillarPercentages[pillarId] = (val as PillarScore).percentage
      } else if (typeof val === 'number') {
        pillarPercentages[pillarId] = val
        const raw = Math.round((val / 100) * 7 * 10) / 10
        pillarScores[pillarId] = {
          raw,
          level: raw <= 3.5 ? 'low' : raw <= 5.5 ? 'moderate' : 'high',
          percentage: val,
        }
      }
    }
  }

  // Consistency — may come as string from DB
  const consistencyScore = typeof apiResult.consistency_score === 'string'
    ? parseFloat(apiResult.consistency_score) || 0
    : apiResult.consistency_score ?? 0

  // Insights
  let microInsights: AssessmentInsight[] = apiResult.micro_insights ?? []
  let integrationInsights: AssessmentInsight[] = apiResult.integration_insights ?? []

  // Legacy insight format
  if (microInsights.length === 0 && apiResult.insights?.micro) {
    microInsights = Object.entries(apiResult.insights.micro).map(([pillar, text]) => ({
      type: 'pillar_analysis',
      title: `${PILLARS[pillar as PillarId]?.name ?? pillar} Focus`,
      insight: text,
      pillar,
    }))
  }
  if (integrationInsights.length === 0 && apiResult.insights?.integration) {
    integrationInsights = apiResult.insights.integration.map((text) => ({
      type: 'general',
      title: 'Integration Insight',
      insight: text,
    }))
  }

  // Overall score
  const pillarValues = Object.values(pillarPercentages)
  const overallScore = pillarValues.length > 0
    ? Math.round(pillarValues.reduce((s, v) => s + v, 0) / pillarValues.length)
    : apiResult.overall_score ?? 0

  return {
    resultId: apiResult.id,
    primaryArchetype,
    secondaryArchetype,
    primaryPercentage,
    secondaryPercentage,
    archetypeScores,
    isBig5Format,
    pillarScores,
    pillarPercentages,
    consistencyScore,
    microInsights,
    integrationInsights,
    overallScore,
  }
}

export default AssessmentResultsPage
