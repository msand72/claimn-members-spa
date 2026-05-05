import {
  ChartBarIcon,
  BoltIcon,
  ShieldCheckIcon,
  MoonIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
} from '@heroicons/react/24/outline'
import { GlassCard, GlassBadge } from '../../components/ui'
import { cn } from '../../lib/utils'
import {
  BIOMARKER_CONFIGS,
  BIOMARKER_ORDER,
  CVC_SHORT_LABELS,
  type CVCBiomarker,
} from '../../lib/cvc/constants'
import { computeTrend, normalizeScore, type TrendDirection } from '../../lib/cvc/interpretation'
import type { CVCAssessmentStatus } from '../../lib/api/types'

interface CVCTrendCardProps {
  /** Completed CVC entries (must have category_scores). Component renders nothing if fewer than 2. */
  completedCVCs: CVCAssessmentStatus[]
  /** Optional override for the heading. Defaults to "Biomarker Trends". */
  heading?: string
}

const biomarkerIcons: Record<CVCBiomarker, React.ReactNode> = {
  vital_energy: <BoltIcon className="w-5 h-5" />,
  stress_load: <ShieldCheckIcon className="w-5 h-5" />,
  sleep_quality: <MoonIcon className="w-5 h-5" />,
}

const trendConfig: Record<TrendDirection, { icon: React.ReactNode; label: string; color: string }> = {
  improved: { icon: <ArrowTrendingUpIcon className="w-4 h-4" />, label: 'Improved', color: 'text-skogsgron' },
  declined: { icon: <ArrowTrendingDownIcon className="w-4 h-4" />, label: 'Declined', color: 'text-tegelrod' },
  stable:   { icon: <MinusIcon className="w-4 h-4" />,           label: 'Stable',   color: 'text-kalkvit/50' },
}

/**
 * Renders a per-biomarker trend card across completed CVCs. Used in both the
 * Assessments tab Results sub-tab (full view) and the program Dashboard
 * (inline development indicator). Returns null if fewer than 2 CVCs exist.
 */
export function CVCTrendCard({ completedCVCs, heading = 'Biomarker Trends' }: CVCTrendCardProps) {
  if (completedCVCs.length < 2) return null

  return (
    <GlassCard variant="elevated">
      <h3 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
        <ChartBarIcon className="w-5 h-5 text-koppar" />
        {heading}
      </h3>
      <div className="space-y-5">
        {BIOMARKER_ORDER.map((key) => {
          const config = BIOMARKER_CONFIGS[key]

          const dataPoints = completedCVCs
            .filter((c) => c.scores?.category_scores?.[key] != null)
            .map((c) => ({
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
  )
}
