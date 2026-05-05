import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { GlassCard, GlassButton, GlassBadge } from '../../components/ui'
import {
  MoonIcon,
  ShieldCheckIcon,
  MinusIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  BoltIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { cn } from '../../lib/utils'
import {
  BIOMARKER_CONFIGS,
  BIOMARKER_ORDER,
  type CVCBiomarker,
} from '../../lib/cvc/constants'
import {
  interpretBiomarker,
  interpretVitalityIndex,
  normalizeScore,
} from '../../lib/cvc/interpretation'
import type { ProgramAssessment, CVCAssessmentStatus } from '../../lib/api/types'
import { CVCTrendCard } from './CVCTrendCard'
import { CVCAnswersModal } from '../../components/CVCAnswersModal'

interface VitalityTabProps {
  programId: string
  assessments: ProgramAssessment[]
  cvcAssessments: CVCAssessmentStatus[]
  completedAssessments: number
  isLoadingAssessments: boolean
}

export function VitalityTab({
  programId,
  cvcAssessments,
  isLoadingAssessments,
}: VitalityTabProps) {
  // Sub-tabs inside the renamed Assessments tab: Take (the assessments list)
  // and Results (CVC report inline + CA result card routing to /assessment/results).
  // Honor `?sub=results` so the program Dashboard's CVC card can deep-link
  // straight to the trend view without an extra click.
  const [searchParams] = useSearchParams()
  const [activeSubTab, setActiveSubTab] = useState<'take' | 'results'>(
    searchParams.get('sub') === 'results' ? 'results' : 'take'
  )

  // Selected CVC submission to render in Results — set by Take's "See result"
  // button (B8 fix for the wrong-CVC bug). Falls back to latest when nothing
  // explicitly selected (e.g. arriving via Dashboard CVC card with no `sid`).
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null)

  // Per-area answers modal — opens from a biomarker breakdown card. Carries
  // the submission_id at click-time so the modal renders the answers for the
  // CVC the user was viewing (not whatever's "current" by the time it opens).
  const [modalCategory, setModalCategory] = useState<{ key: string; label: string; submissionId: string } | null>(null)

  // Source of truth is cvcAssessments — it contains both CVC entries
  // (baseline/midline/final) and the virtual claim_assessment entries
  // when the program declares the claim_assessment component.
  const totalCount = cvcAssessments.length
  const completedCount = cvcAssessments.filter((c) => c.is_completed).length
  const typeLabels: Record<string, string> = {
    baseline: 'Pre-Season',
    midline: 'Mid-Season',
    final: 'Post-Season',
    claim_assessment_baseline: 'Claim Assessment (start)',
    claim_assessment_final: 'Claim Assessment (end)',
  }

  // CVC results — entries with category_scores. CA entries don't have these
  // (their result shape is archetype + pillar data on a separate page).
  const completedCVCs = cvcAssessments
    .filter((c: CVCAssessmentStatus) => c.scores?.category_scores)
    .sort((a: CVCAssessmentStatus, b: CVCAssessmentStatus) => {
      const order: Record<string, number> = { baseline: 0, midline: 1, final: 2, custom: 3 }
      return (order[a.type] ?? 3) - (order[b.type] ?? 3)
    })

  // CA result — completed claim_assessment_baseline or claim_assessment_final.
  // Routes to /assessment/results, the existing dedicated CA results page.
  const completedCA = cvcAssessments.find(
    (c) => (c.type === 'claim_assessment_baseline' || c.type === 'claim_assessment_final') && c.is_completed
  )

  const hasAnyResults = completedCVCs.length > 0 || !!completedCA

  if (isLoadingAssessments) {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowPathIcon className="w-8 h-8 text-koppar animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <div className="flex gap-2">
        {(['take', 'results'] as const).map((sub) => (
          <button
            key={sub}
            onClick={() => setActiveSubTab(sub)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              activeSubTab === sub
                ? 'bg-koppar/20 text-koppar'
                : 'bg-white/[0.06] text-kalkvit/50 hover:text-kalkvit/70'
            )}
          >
            {sub === 'take' ? 'Take' : 'Results'}
          </button>
        ))}
      </div>

      {/* ===== Take sub-tab — assessments list with progress + CTAs ===== */}
      {activeSubTab === 'take' && (
        <GlassCard variant="base">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-kalkvit flex items-center gap-2">
              <ClipboardDocumentCheckIcon className="w-5 h-5 text-koppar" />
              Assessments
            </h3>
            <span className="text-sm text-kalkvit/50">
              {completedCount} of {totalCount} completed
            </span>
          </div>
          <div className="h-2 bg-white/[0.1] rounded-full overflow-hidden mb-4">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                completedCount === totalCount && totalCount > 0
                  ? 'bg-skogsgron'
                  : 'bg-gradient-to-r from-koppar to-brand-amber'
              )}
              style={{
                width: `${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%`,
              }}
            />
          </div>

          <div className="space-y-3">
            {cvcAssessments.map((entry: CVCAssessmentStatus) => {
              const isClaim = entry.type === 'claim_assessment_baseline' || entry.type === 'claim_assessment_final'
              // Claim Assessment uses an external deep_link (typically /assessment).
              // CVC entries route to the program-assessment flow.
              const targetPath = isClaim
                ? entry.deep_link || '/assessment'
                : `/programs/${programId}/assessment/${entry.assessment_id}`
              const label = typeLabels[entry.type] || entry.name
              return (
                <div
                  key={entry.assessment_id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.04]"
                >
                  {entry.is_completed ? (
                    <CheckCircleIcon className="w-5 h-5 text-skogsgron shrink-0" />
                  ) : (
                    <MinusIcon className="w-5 h-5 text-kalkvit/30 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-kalkvit">
                      {label}
                    </p>
                    {entry.scores ? (
                      <p className="text-xs text-skogsgron">
                        {Math.round(entry.scores.percentage_score)}% vitality
                      </p>
                    ) : isClaim ? (
                      <p className="text-xs text-kalkvit/40">
                        Din arketyp och din profil över de fem pelarna
                      </p>
                    ) : entry.deadline_date ? (
                      <p className="text-xs text-kalkvit/40">
                        Senast {new Date(entry.deadline_date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                      </p>
                    ) : null}
                  </div>
                  {!entry.is_completed ? (
                    <Link to={targetPath}>
                      <GlassButton variant="primary" className="text-xs">
                        Take now
                        <ArrowRightIcon className="w-3 h-3" />
                      </GlassButton>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2">
                      <GlassBadge variant="success" className="text-xs">Done</GlassBadge>
                      {isClaim ? (
                        <Link
                          to={
                            entry.result_id
                              ? `/assessment/results?id=${entry.result_id}&returnTo=${encodeURIComponent(`/programs/${programId}#vitality`)}`
                              : `/assessment/results?returnTo=${encodeURIComponent(`/programs/${programId}#vitality`)}`
                          }
                        >
                          <GlassButton variant="ghost" className="text-xs">
                            See result
                            <ArrowRightIcon className="w-3 h-3" />
                          </GlassButton>
                        </Link>
                      ) : (
                        <GlassButton
                          variant="ghost"
                          className="text-xs"
                          onClick={() => {
                            // Scope the Results sub-tab to THIS specific submission
                            // so the user sees the report they clicked, not "latest" (B8 fix).
                            setSelectedSubmissionId(entry.submission_id ?? null)
                            setActiveSubTab('results')
                          }}
                        >
                          See result
                          <ArrowRightIcon className="w-3 h-3" />
                        </GlassButton>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </GlassCard>
      )}

      {/* ===== Results sub-tab — CA card + inline CVC vitality report ===== */}
      {activeSubTab === 'results' && (
        <>
          {!hasAnyResults ? (
            <GlassCard variant="base" className="text-center py-12">
              <ChartBarIcon className="w-8 h-8 text-kalkvit/30 mx-auto mb-3" />
              <p className="text-kalkvit/50 text-sm">
                Complete an assessment to see your results here.
              </p>
            </GlassCard>
          ) : (
            <>
              {/* CA Result entry — routes to existing /assessment/results page */}
              {completedCA && (
                <Link
                  to={`/assessment/results?returnTo=${encodeURIComponent(`/programs/${programId}#vitality`)}`}
                  className="block"
                >
                  <GlassCard variant="base" className="hover:border-koppar/30 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-koppar/20 flex items-center justify-center flex-shrink-0">
                        <SparklesIcon className="w-5 h-5 text-koppar" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-kalkvit">Claim Assessment Results</h4>
                        <p className="text-xs text-kalkvit/50 mt-0.5">
                          Your archetype + profile across the five pillars
                        </p>
                      </div>
                      <ArrowRightIcon className="w-4 h-4 text-kalkvit/40 flex-shrink-0" />
                    </div>
                  </GlassCard>
                </Link>
              )}

              {/* Inline CVC vitality report — renders the SELECTED CVC if Take's
                  See result was clicked, otherwise the latest. B8 fix for the
                  wrong-CVC bug (clicking Pre-Season would show Mid-Season). */}
              {completedCVCs.length > 0 && (() => {
                const displayed =
                  (selectedSubmissionId
                    ? completedCVCs.find((c) => c.submission_id === selectedSubmissionId)
                    : null) ?? completedCVCs[completedCVCs.length - 1]
                const displayedScores = displayed.scores!
                const vitalityIndex = displayedScores.percentage_score ?? 0
                const vitalityInterp = interpretVitalityIndex(vitalityIndex)

                const biomarkerIcons: Record<CVCBiomarker, React.ReactNode> = {
                  vital_energy: <BoltIcon className="w-5 h-5" />,
                  stress_load: <ShieldCheckIcon className="w-5 h-5" />,
                  sleep_quality: <MoonIcon className="w-5 h-5" />,
                }

                return (
                  <>
                    {/* Hero — Vitality Index */}
                    <GlassCard variant="elevated">
                      <div className="text-center mb-4">
                        <h3 className="font-display text-lg font-semibold text-kalkvit mb-1">
                          Overall Vitality Index
                        </h3>
                        <p className="text-xs text-kalkvit/50">
                          Composite score across all three biomarkers
                        </p>
                      </div>

                      <div className="flex justify-center mb-2">
                        <div className="relative w-28 h-28">
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
                            <span className="font-display text-3xl font-bold text-koppar">
                              {Math.round(vitalityIndex)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-center mb-4">
                        <GlassBadge variant={vitalityInterp.variant}>{vitalityInterp.level}</GlassBadge>
                        <p className="text-xs text-kalkvit/40 mt-2">{vitalityInterp.description}</p>
                      </div>

                      {/* Quick stat cards */}
                      <div className="grid grid-cols-3 gap-2">
                        {BIOMARKER_ORDER.map((key) => {
                          const config = BIOMARKER_CONFIGS[key]
                          const raw = displayedScores.category_scores?.[key] ?? 0
                          const interp = interpretBiomarker(key, raw)
                          return (
                            <div
                              key={key}
                              className="text-center p-2 rounded-xl bg-white/[0.04] border border-white/10"
                            >
                              <div className={cn('flex items-center justify-center gap-1 mb-0.5', interp.colorClass)}>
                                {biomarkerIcons[key]}
                                <span className="text-lg font-bold">{raw.toFixed(1)}</span>
                              </div>
                              <p className="text-[10px] text-kalkvit/50">{config.label}</p>
                            </div>
                          )
                        })}
                      </div>
                    </GlassCard>

                    {/* Biomarker Breakdown */}
                    {BIOMARKER_ORDER.map((key) => {
                      const config = BIOMARKER_CONFIGS[key]
                      const raw = displayedScores.category_scores?.[key] ?? 0
                      const interp = interpretBiomarker(key, raw)
                      const barPct = normalizeScore(key, raw)

                      return (
                        <GlassCard key={key} variant="base">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                              config.lowerIsBetter ? 'bg-skogsgron/20' : 'bg-koppar/20',
                            )}>
                              <div className={config.lowerIsBetter ? 'text-skogsgron' : 'text-koppar'}>
                                {biomarkerIcons[key]}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-kalkvit text-sm">
                                  {config.label}
                                  <span className="text-kalkvit/40 font-normal text-xs ml-1">
                                    ({config.instrument})
                                  </span>
                                </h4>
                                <div className="flex items-center gap-1">
                                  <span className={cn('text-lg font-bold', interp.colorClass)}>
                                    {raw.toFixed(1)}
                                  </span>
                                  <span className="text-xs text-kalkvit/40">/ {config.maxScore}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 mb-2">
                                <GlassBadge variant={interp.variant}>{interp.level}</GlassBadge>
                                <span className="text-[10px] text-kalkvit/30">
                                  {config.lowerIsBetter ? 'Lower is better' : 'Higher is better'}
                                </span>
                              </div>

                              <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden mb-2">
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

                              {/* Per-area answers modal trigger (B8) — only when
                                  the displayed CVC has a submission_id. */}
                              {displayed.submission_id && (
                                <button
                                  onClick={() => setModalCategory({
                                    key,
                                    label: config.label,
                                    submissionId: displayed.submission_id!,
                                  })}
                                  className="mt-2 text-xs text-koppar hover:text-koppar/80 inline-flex items-center gap-1 transition-colors"
                                >
                                  Se dina svar
                                  <ArrowRightIcon className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </GlassCard>
                      )
                    })}

                    {/* Trends (2+ CVCs) — extracted to a shared component so the
                        program Dashboard can show the same development. */}
                    <CVCTrendCard completedCVCs={completedCVCs} />

                    {/* Actions */}
                    <div className="flex gap-2">
                      <GlassButton variant="secondary" className="text-sm" onClick={() => window.print()}>
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Save PDF
                      </GlassButton>
                      <Link to="/kpis" title="Leaves this program — opens your platform-wide KPI dashboard">
                        <GlassButton variant="ghost" className="text-sm">
                          <ChartBarIcon className="w-4 h-4" />
                          All my KPIs (across programs)
                          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </GlassButton>
                      </Link>
                    </div>
                  </>
                )
              })()}
            </>
          )}
        </>
      )}

      {/* Per-area answers modal (B8) */}
      <CVCAnswersModal
        isOpen={modalCategory !== null}
        onClose={() => setModalCategory(null)}
        submissionId={modalCategory?.submissionId ?? null}
        category={modalCategory?.key ?? ''}
        categoryLabel={modalCategory?.label ?? ''}
      />
    </div>
  )
}
