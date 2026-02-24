import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge, GlassToast } from '../components/ui'
import { useProgram, useProgramCVCStatus, useProgramAssessmentResults, useProgramAssessments } from '../lib/api/hooks'
import type { CVCAssessmentStatus, ProgramAssessment } from '../lib/api/types'
import { CVCPrintReport } from '../components/cvc/CVCPrintReport'
import {
  BIOMARKER_CONFIGS,
  BIOMARKER_ORDER,
  CVC_TYPE_LABELS,
  CVC_SHORT_LABELS,
  type CVCBiomarker,
} from '../lib/cvc/constants'
import {
  interpretBiomarker,
  interpretVitalityIndex,
  normalizeScore,
  computeTrend,
  type TrendDirection,
} from '../lib/cvc/interpretation'
import { cn } from '../lib/utils'
import {
  ArrowLeft,
  Zap,
  Shield,
  Moon,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Share2,
  Loader2,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react'

const BIOMARKER_ICONS: Record<CVCBiomarker, React.ReactNode> = {
  vital_energy: <Zap className="w-5 h-5" />,
  stress_load: <Shield className="w-5 h-5" />,
  sleep_quality: <Moon className="w-5 h-5" />,
}

const TREND_CONFIG: Record<TrendDirection, { icon: React.ReactNode; label: string; color: string }> = {
  improved: { icon: <TrendingUp className="w-4 h-4" />, label: 'Improved', color: 'text-skogsgron' },
  declined: { icon: <TrendingDown className="w-4 h-4" />, label: 'Declined', color: 'text-tegelrod' },
  stable: { icon: <Minus className="w-4 h-4" />, label: 'Stable', color: 'text-kalkvit/50' },
}

// Extract context (non-numeric) answers from assessment results
function extractContextAnswers(
  assessmentResults: Array<{ assessment_id: string; answers: Record<string, string | number> | null }>,
  assessments: ProgramAssessment[],
): Record<string, Record<string, string>> {
  const contextByAssessment: Record<string, Record<string, string>> = {}

  for (const result of assessmentResults) {
    if (!result.answers) continue

    // Find matching assessment to get question metadata
    const assessment = assessments.find((a) => a.id === result.assessment_id)
    const questions = assessment?.questions || []

    // Build a map of question_id → question text for context questions
    const contextQuestions = new Map<string, string>()
    for (const q of questions) {
      // Context questions are identified by category or by having non-numeric answers
      const isContext =
        q.scoring_config?.section === 'context' ||
        q.category === 'context' ||
        q.question_type === 'text'
      if (isContext) {
        contextQuestions.set(q.id, q.text || q.id)
      }
    }

    const entries: Record<string, string> = {}
    for (const [key, value] of Object.entries(result.answers)) {
      // If we have question metadata, use it. Otherwise fall back to type check.
      if (contextQuestions.has(key)) {
        entries[contextQuestions.get(key)!] = String(value)
      } else if (typeof value === 'string' && value.trim().length > 0 && contextQuestions.size === 0) {
        // Fallback: if no question metadata, include string answers (context answers are text)
        entries[key] = value
      }
    }

    if (Object.keys(entries).length > 0) {
      contextByAssessment[result.assessment_id] = entries
    }
  }

  return contextByAssessment
}

export function CVCVitalityReportPage() {
  const { id } = useParams<{ id: string }>()
  const [toast, setToast] = useState<{ variant: 'success' | 'error'; message: string } | null>(null)

  const { data: program } = useProgram(id || '')
  const { data: cvcStatus, isLoading: cvcLoading, error: cvcError } = useProgramCVCStatus(id || '')
  const { data: resultsData } = useProgramAssessmentResults(id || '')
  const { data: assessmentsData } = useProgramAssessments(id || '')

  const completedCVCs = useMemo(
    () =>
      (cvcStatus?.assessments || [])
        .filter((a: CVCAssessmentStatus) => a.is_completed && a.scores?.category_scores)
        .sort((a: CVCAssessmentStatus, b: CVCAssessmentStatus) => {
          const order = { baseline: 0, midline: 1, final: 2, custom: 3 }
          return (order[a.type] ?? 3) - (order[b.type] ?? 3)
        }),
    [cvcStatus],
  )

  const latest = completedCVCs[completedCVCs.length - 1] as CVCAssessmentStatus | undefined
  const latestScores = latest?.scores

  const contextAnswers = useMemo(() => {
    const results = resultsData?.data || []
    const assessments = assessmentsData?.data || []
    return extractContextAnswers(results, assessments)
  }, [resultsData, assessmentsData])

  const handleDownloadReport = () => {
    window.print()
  }

  const handleShareResults = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setToast({ variant: 'success', message: 'Report link copied to clipboard' })
    } catch {
      setToast({ variant: 'error', message: 'Failed to copy link' })
    }
  }

  // Loading state
  if (cvcLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-koppar animate-spin" />
        </div>
      </MainLayout>
    )
  }

  // Error state
  if (cvcError || completedCVCs.length === 0) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto text-center py-24">
          <AlertTriangle className="w-12 h-12 text-brand-amber mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-kalkvit mb-2">
            No Vitality Data Available
          </h1>
          <p className="text-kalkvit/60 mb-6">
            Complete at least one Vitality Check to view your report.
          </p>
          <Link to={`/programs/${id}`}>
            <GlassButton variant="primary">
              <ArrowLeft className="w-4 h-4" />
              Back to Program
            </GlassButton>
          </Link>
        </div>
      </MainLayout>
    )
  }

  const vitalityIndex = latestScores?.percentage_score ?? 0
  const vitalityInterp = interpretVitalityIndex(vitalityIndex)

  return (
    <MainLayout>
      {/* Print-only report */}
      <CVCPrintReport
        programName={program?.title || 'GO Sessions'}
        completedCVCs={completedCVCs}
        contextAnswers={Object.keys(contextAnswers).length > 0 ? contextAnswers : undefined}
      />

      <div className="max-w-4xl mx-auto">
        {/* ===== Section 1: Header ===== */}
        <div className="mb-6">
          <Link
            to={`/programs/${id}`}
            className="inline-flex items-center gap-2 text-sm text-kalkvit/50 hover:text-kalkvit transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Program
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <GlassBadge variant="koppar">CLAIM'N Vitality Report</GlassBadge>
            {latest?.completed_at && (
              <span className="text-xs text-kalkvit/40">
                {CVC_TYPE_LABELS[latest.type] || latest.name} — {new Date(latest.completed_at).toLocaleDateString()}
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-kalkvit">
            {program?.title || 'Vitality Report'}
          </h1>
        </div>

        {/* ===== Section 2: Hero — Vitality Index ===== */}
        <GlassCard variant="elevated" className="mb-8">
          <div className="text-center mb-6">
            <h2 className="font-display text-xl font-semibold text-kalkvit mb-1">
              Overall Vitality Index
            </h2>
            <p className="text-sm text-kalkvit/50">
              Composite score across all three biomarkers
            </p>
          </div>

          {/* Score circle */}
          <div className="flex justify-center mb-2">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke="#B87333"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(vitalityIndex / 100) * 339.3} 339.3`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-4xl font-bold text-koppar">
                  {Math.round(vitalityIndex)}%
                </span>
              </div>
            </div>
          </div>
          <div className="text-center mb-8">
            <GlassBadge variant={vitalityInterp.variant}>{vitalityInterp.level}</GlassBadge>
            <p className="text-xs text-kalkvit/40 mt-2">{vitalityInterp.description}</p>
          </div>

          {/* Quick stat cards — latest biomarker scores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {BIOMARKER_ORDER.map((key) => {
              const config = BIOMARKER_CONFIGS[key]
              const raw = latestScores?.category_scores?.[key] ?? 0
              const interp = interpretBiomarker(key, raw)
              return (
                <div
                  key={key}
                  className="text-center p-3 rounded-xl bg-white/[0.04] border border-white/10"
                >
                  <div className={cn('flex items-center justify-center gap-1.5 mb-1', interp.colorClass)}>
                    {BIOMARKER_ICONS[key]}
                    <span className="text-2xl font-bold">{raw.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-kalkvit/50">{config.label}</p>
                </div>
              )
            })}
          </div>
        </GlassCard>

        {/* ===== Section 3: Biomarker Breakdown ===== */}
        <h2 className="font-display text-xl font-semibold text-kalkvit mb-4">
          Biomarker Breakdown
        </h2>
        <div className="grid grid-cols-1 gap-4 mb-8">
          {BIOMARKER_ORDER.map((key) => {
            const config = BIOMARKER_CONFIGS[key]
            const raw = latestScores?.category_scores?.[key] ?? 0
            const interp = interpretBiomarker(key, raw)
            const barPct = normalizeScore(key, raw)

            return (
              <GlassCard key={key} variant="base">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    config.lowerIsBetter ? 'bg-skogsgron/20' : 'bg-koppar/20',
                  )}>
                    <div className={config.lowerIsBetter ? 'text-skogsgron' : 'text-koppar'}>
                      {BIOMARKER_ICONS[key]}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <h3 className="font-semibold text-kalkvit">
                          {config.label}
                          <span className="text-kalkvit/40 font-normal text-sm ml-2">
                            ({config.instrument})
                          </span>
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xl font-bold', interp.colorClass)}>
                          {raw.toFixed(1)}
                        </span>
                        <span className="text-sm text-kalkvit/40">/ {config.maxScore}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <GlassBadge variant={interp.variant}>{interp.level}</GlassBadge>
                      <span className="text-xs text-kalkvit/30">
                        {config.lowerIsBetter ? 'Lower is better' : 'Higher is better'}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden mb-2">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-700',
                          config.lowerIsBetter
                            ? 'bg-gradient-to-r from-skogsgron to-oliv'
                            : 'bg-gradient-to-r from-koppar to-brand-amber',
                        )}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>

                    <p className="text-xs text-kalkvit/50">{interp.description}</p>
                    <p className="text-xs text-kalkvit/30 mt-1">{config.description}</p>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>

        {/* ===== Section 4: Trends (conditional: 2+ CVCs) ===== */}
        {completedCVCs.length >= 2 && (
          <>
            <h2 className="font-display text-xl font-semibold text-kalkvit mb-4">
              Biomarker Trends
            </h2>
            <GlassCard variant="elevated" className="mb-8">
              <div className="space-y-6">
                {BIOMARKER_ORDER.map((key) => {
                  const config = BIOMARKER_CONFIGS[key]

                  const dataPoints = completedCVCs
                    .filter((c: CVCAssessmentStatus) => c.scores?.category_scores?.[key] != null)
                    .map((c: CVCAssessmentStatus) => ({
                      label: CVC_SHORT_LABELS[c.type] || c.type,
                      value: Number(c.scores!.category_scores![key]),
                    }))

                  if (dataPoints.length < 2) return null

                  // Compute trend from first to last
                  const trend = computeTrend(key, dataPoints[0].value, dataPoints[dataPoints.length - 1].value)
                  const trendInfo = TREND_CONFIG[trend]

                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={config.lowerIsBetter ? 'text-skogsgron' : 'text-koppar'}>
                            {BIOMARKER_ICONS[key]}
                          </span>
                          <span className="text-sm font-medium text-kalkvit">{config.label}</span>
                          <span className="text-xs text-kalkvit/30">({config.instrument})</span>
                        </div>
                        <div className={cn('flex items-center gap-1 text-xs font-medium', trendInfo.color)}>
                          {trendInfo.icon}
                          {trendInfo.label}
                        </div>
                      </div>

                      {/* Bar chart */}
                      <div className="flex items-end gap-3">
                        {dataPoints.map((dp) => {
                          const barPct = normalizeScore(key, dp.value)
                          return (
                            <div key={dp.label} className="flex-1 text-center">
                              <span className="text-xs font-medium text-kalkvit block mb-1">
                                {dp.value.toFixed(1)}
                              </span>
                              <div className="h-20 bg-white/[0.06] rounded-lg overflow-hidden flex items-end">
                                <div
                                  className={cn(
                                    'w-full rounded-lg transition-all duration-500',
                                    config.lowerIsBetter
                                      ? 'bg-gradient-to-t from-skogsgron to-oliv'
                                      : 'bg-gradient-to-t from-koppar to-brand-amber',
                                  )}
                                  style={{ height: `${barPct}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-kalkvit/40 block mt-1">
                                {dp.label}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      <p className="text-xs text-kalkvit/30 mt-1 text-right">
                        {config.lowerIsBetter ? 'Lower is better' : 'Higher is better'}
                      </p>
                    </div>
                  )
                })}

                {/* Vitality Index trend */}
                {completedCVCs.length >= 2 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-kalkvit">Vitality Index</span>
                    </div>
                    <div className="flex items-end gap-3">
                      {completedCVCs.map((cvc: CVCAssessmentStatus) => {
                        const pct = cvc.scores?.percentage_score ?? 0
                        return (
                          <div key={cvc.assessment_id} className="flex-1 text-center">
                            <span className="text-xs font-medium text-kalkvit block mb-1">
                              {Math.round(pct)}%
                            </span>
                            <div className="h-20 bg-white/[0.06] rounded-lg overflow-hidden flex items-end">
                              <div
                                className="w-full rounded-lg bg-gradient-to-t from-koppar to-brand-amber transition-all duration-500"
                                style={{ height: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-kalkvit/40 block mt-1">
                              {CVC_SHORT_LABELS[cvc.type] || cvc.type}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </>
        )}

        {/* ===== Section 5: Context & Reflection (conditional) ===== */}
        {Object.keys(contextAnswers).length > 0 && (
          <>
            <h2 className="font-display text-xl font-semibold text-kalkvit mb-4">
              Context & Reflections
            </h2>
            <div className="grid grid-cols-1 gap-4 mb-8">
              {completedCVCs.map((cvc: CVCAssessmentStatus) => {
                const answers = contextAnswers[cvc.assessment_id]
                if (!answers || Object.keys(answers).length === 0) return null
                return (
                  <GlassCard key={cvc.assessment_id} variant="base">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-4 h-4 text-koppar" />
                      <h3 className="font-semibold text-kalkvit text-sm">
                        {CVC_TYPE_LABELS[cvc.type] || cvc.name}
                      </h3>
                      {cvc.completed_at && (
                        <span className="text-xs text-kalkvit/30 ml-auto">
                          {new Date(cvc.completed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      {Object.entries(answers).map(([question, answer]) => (
                        <div key={question}>
                          <p className="text-xs text-kalkvit/40 mb-0.5">{question}</p>
                          <p className="text-sm text-kalkvit/80">{answer}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )
              })}
            </div>
          </>
        )}

        {/* ===== Section 6: Action Buttons ===== */}
        <div className="flex flex-wrap gap-3 mb-12">
          <Link to={`/programs/${id}`}>
            <GlassButton variant="primary">
              <ArrowLeft className="w-4 h-4" />
              Back to Program
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

export default CVCVitalityReportPage
