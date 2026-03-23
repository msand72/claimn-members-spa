import { useState } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassTabs } from '../components/ui'
import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { InsightCard } from '../components/coaching/InsightCard'
import {
  useCoachingInsights,
  useCoachingPreferences,
  type CoachingInsight,
} from '../lib/api/hooks/useCoaching'
import { PILLAR_CONFIG } from '../tokens/pillars'
import { cn } from '../lib/utils'

const PILLAR_TABS = [
  { value: 'all', label: 'All' },
  ...Object.values(PILLAR_CONFIG).map((p) => ({ value: p.id, label: p.shortName })),
]

const TYPE_TABS = [
  { value: 'all', label: 'All Types' },
  { value: 'daily_summary', label: 'Daily' },
  { value: 'weekly_review', label: 'Weekly' },
  { value: 'nudge', label: 'Nudges' },
  { value: 'milestone', label: 'Milestones' },
]

export function CoachingInsightsPage() {
  const [pillarFilter, setPillarFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)

  const { data: prefs } = useCoachingPreferences()

  const { data: insightsData, isLoading, error } = useCoachingInsights({
    page,
    limit: 20,
    pillar: pillarFilter !== 'all' ? pillarFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
  })

  const insights: CoachingInsight[] = Array.isArray(insightsData?.data) ? insightsData.data : []
  const pagination = insightsData?.pagination
  const hasMore = pagination?.has_next ?? false

  // Not enabled — show opt-in message
  if (prefs && !prefs.ai_coaching_enabled) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto text-center py-16">
          <SparklesIcon className="w-16 h-16 text-koppar/30 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-kalkvit mb-2">AI Coach</h1>
          <p className="text-kalkvit/60 mb-6">
            Enable AI Coaching from the Hub to start receiving personalized insights.
          </p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2 flex items-center gap-3">
            <SparklesIcon className="w-7 h-7 text-koppar" />
            AI Coach
          </h1>
          <p className="text-kalkvit/60">Personalized insights based on your goals, protocols, and progress</p>
        </div>

        {/* Pillar filter */}
        <div className="mb-4 overflow-x-auto">
          <GlassTabs
            tabs={PILLAR_TABS}
            value={pillarFilter}
            onChange={(v) => { setPillarFilter(v); setPage(1) }}
            className="min-w-max"
          />
        </div>

        {/* Type filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setTypeFilter(tab.value); setPage(1) }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                typeFilter === tab.value
                  ? 'bg-koppar/20 text-koppar border border-koppar/30'
                  : 'bg-white/[0.04] text-kalkvit/50 hover:bg-white/[0.08] hover:text-kalkvit/70'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <ArrowPathIcon className="w-8 h-8 text-koppar animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <GlassCard variant="base" className="text-center py-12">
            <p className="text-tegelrod mb-2">Failed to load insights</p>
            <p className="text-kalkvit/50 text-sm">Please try again later</p>
          </GlassCard>
        )}

        {/* Insights list */}
        {!isLoading && !error && insights.length > 0 && (
          <div className="space-y-4">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="text-center pt-4">
                <GlassButton
                  variant="secondary"
                  onClick={() => setPage((p) => p + 1)}
                >
                  Load more
                </GlassButton>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && insights.length === 0 && (
          <GlassCard variant="base" className="text-center py-12">
            <SparklesIcon className="w-12 h-12 text-kalkvit/15 mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">No insights yet</h3>
            <p className="text-kalkvit/50 text-sm">
              Your AI coach will start generating personalized insights based on your activity.
            </p>
          </GlassCard>
        )}
      </div>
    </MainLayout>
  )
}

export default CoachingInsightsPage
