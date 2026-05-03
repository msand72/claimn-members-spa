import { Link } from 'react-router-dom'
import { GlassCard, GlassButton, GlassBadge } from '../../components/ui'
import {
  MoonIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'
import { cn } from '../../lib/utils'
import {
  BIOMARKER_CONFIGS,
  BIOMARKER_ORDER,
  CVC_SHORT_LABELS,
  type CVCBiomarker,
} from '../../lib/cvc/constants'
import {
  interpretBiomarker,
  interpretVitalityIndex,
  normalizeScore,
  computeTrend,
  type TrendDirection,
} from '../../lib/cvc/interpretation'
import type { ProgramAssessment, CVCAssessmentStatus } from '../../lib/api/types'

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
  // Note: `assessments` and `completedAssessments` props remain on the interface
  // for caller compatibility, but the rendering now derives counts directly from
  // cvcAssessments (which includes the virtual claim_assessment entry).
  return (
    <div className="space-y-6">
      {/* Vitality Checks progress */}
      {isLoadingAssessments ? (
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="w-8 h-8 text-koppar animate-spin" />
        </div>
      ) : (
        <>
          <GlassCard variant="base">
            {(() => {
              // Source of truth is cvcAssessments — it contains both CVC entries
              // (baseline/midline/final) and the virtual claim_assessment entry
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
              return (
                <>
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
                            <GlassBadge variant="success" className="text-xs">Done</GlassBadge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}
          </GlassCard>

          {/* ===== Inline Vitality Report ===== */}
          {(() => {
            const completedCVCs = cvcAssessments
              .filter((c: CVCAssessmentStatus) => c.scores?.category_scores)
              .sort((a: CVCAssessmentStatus, b: CVCAssessmentStatus) => {
                const order: Record<string, number> = { baseline: 0, midline: 1, final: 2, custom: 3 }
                return (order[a.type] ?? 3) - (order[b.type] ?? 3)
              })

            if (completedCVCs.length === 0) return null

            const latest = completedCVCs[completedCVCs.length - 1]
            const latestScores = latest.scores!
            const vitalityIndex = latestScores.percentage_score ?? 0
            const vitalityInterp = interpretVitalityIndex(vitalityIndex)

            const biomarkerIcons: Record<CVCBiomarker, React.ReactNode> = {
              vital_energy: <BoltIcon className="w-5 h-5" />,
              stress_load: <ShieldCheckIcon className="w-5 h-5" />,
              sleep_quality: <MoonIcon className="w-5 h-5" />,
            }

            const trendConfig: Record<TrendDirection, { icon: React.ReactNode; label: string; color: string }> = {
              improved: { icon: <ArrowTrendingUpIcon className="w-4 h-4" />, label: 'Improved', color: 'text-skogsgron' },
              declined: { icon: <ArrowTrendingDownIcon className="w-4 h-4" />, label: 'Declined', color: 'text-tegelrod' },
              stable: { icon: <MinusIcon className="w-4 h-4" />, label: 'Stable', color: 'text-kalkvit/50' },
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
                      const raw = latestScores.category_scores?.[key] ?? 0
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
                  const raw = latestScores.category_scores?.[key] ?? 0
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
                        </div>
                      </div>
                    </GlassCard>
                  )
                })}

                {/* Trends (2+ CVCs) */}
                {completedCVCs.length >= 2 && (
                  <GlassCard variant="elevated">
                    <h3 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
                      <ChartBarIcon className="w-5 h-5 text-koppar" />
                      Biomarker Trends
                    </h3>
                    <div className="space-y-5">
                      {BIOMARKER_ORDER.map((key) => {
                        const config = BIOMARKER_CONFIGS[key]

                        const dataPoints = completedCVCs
                          .filter((c: CVCAssessmentStatus) => c.scores?.category_scores?.[key] != null)
                          .map((c: CVCAssessmentStatus) => ({
                            label: CVC_SHORT_LABELS[c.type] || c.type,
                            value: Number(c.scores!.category_scores![key]),
                          }))

                        if (dataPoints.length < 2) return null

                        const trend = computeTrend(key, dataPoints[0].value, dataPoints[dataPoints.length - 1].value)
                        const trendInfo = trendConfig[trend]

                        return (
                          <div key={key}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={config.lowerIsBetter ? 'text-skogsgron' : 'text-koppar'}>
                                  {biomarkerIcons[key]}
                                </span>
                                <span className="text-sm font-medium text-kalkvit">{config.label}</span>
                              </div>
                              <div className={cn('flex items-center gap-1 text-xs font-medium', trendInfo.color)}>
                                {trendInfo.icon}
                                {trendInfo.label}
                              </div>
                            </div>
                            <div className="flex items-end gap-3">
                              {dataPoints.map((dp) => {
                                const bPct = normalizeScore(key, dp.value)
                                return (
                                  <div key={dp.label} className="flex-1 text-center">
                                    <span className="text-xs font-medium text-kalkvit block mb-1">
                                      {dp.value.toFixed(1)}
                                    </span>
                                    <div className="h-16 bg-white/[0.06] rounded-lg overflow-hidden flex items-end">
                                      <div
                                        className={cn(
                                          'w-full rounded-lg transition-all duration-500',
                                          config.lowerIsBetter
                                            ? 'bg-gradient-to-t from-skogsgron to-oliv'
                                            : 'bg-gradient-to-t from-koppar to-brand-amber',
                                        )}
                                        style={{ height: `${bPct}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] text-kalkvit/40 block mt-1">{dp.label}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </GlassCard>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <GlassButton variant="secondary" className="text-sm" onClick={() => window.print()}>
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Save PDF
                  </GlassButton>
                  <Link to="/kpis">
                    <GlassButton variant="ghost" className="text-sm">
                      <ChartBarIcon className="w-4 h-4" />
                      View KPI Dashboard
                      <ArrowRightIcon className="w-4 h-4" />
                    </GlassButton>
                  </Link>
                </div>
              </>
            )
          })()}
        </>
      )}
    </div>
  )
}
