import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GlassCard, GlassButton, GlassModal, GlassModalFooter } from '../ui'
import {
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { PillarIcon } from '../icons'
import { PILLAR_CONFIG, type PillarId } from '../../tokens/pillars'
import {
  useCoachingPreferences,
  useUpdateCoachingPreferences,
  useCoachingInsightsLatest,
  useReadInsight,
  useDismissInsight,
  type CoachingInsight,
} from '../../lib/api/hooks/useCoaching'

// ── Helpers ──────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function PillarDot({ pillar }: { pillar: string | null }) {
  if (!pillar) return null
  const config = PILLAR_CONFIG[pillar as PillarId]
  if (!config) return null
  return (
    <div
      className="w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: config.color }}
    />
  )
}

// ── Skeleton ─────────────────────────────────────────

function InsightRowSkeleton() {
  return (
    <div className="flex items-start gap-3 py-2.5 animate-pulse">
      <div className="w-2 h-2 rounded-full bg-white/[0.1] mt-2 flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-3/4 bg-white/[0.1] rounded" />
        <div className="h-3 w-full bg-white/[0.06] rounded" />
      </div>
      <div className="h-3 w-10 bg-white/[0.06] rounded flex-shrink-0" />
    </div>
  )
}

// ── Insight Detail Modal ─────────────────────────────

function InsightDetailModal({
  insight,
  isOpen,
  onClose,
}: {
  insight: CoachingInsight | null
  isOpen: boolean
  onClose: () => void
}) {
  const readInsight = useReadInsight()
  const dismissInsight = useDismissInsight()

  if (!insight) return null

  const pillarConfig = insight.pillar ? PILLAR_CONFIG[insight.pillar as PillarId] : null

  const handleMarkRead = () => {
    readInsight.mutate(insight.id)
    onClose()
  }

  const handleDismiss = () => {
    dismissInsight.mutate(insight.id)
    onClose()
  }

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title={insight.title} size="sm">
      <div className="space-y-4">
        {pillarConfig && (
          <div className="flex items-center gap-2">
            <PillarIcon pillar={insight.pillar as PillarId} size={32} className="w-5 h-5" />
            <span className="text-sm font-medium" style={{ color: pillarConfig.color }}>
              {pillarConfig.shortName}
            </span>
            {insight.priority === 'high' && (
              <span className="text-xs text-brandAmber font-medium ml-auto">High priority</span>
            )}
            {insight.priority === 'urgent' && (
              <span className="text-xs text-tegelrod font-medium ml-auto">Urgent</span>
            )}
          </div>
        )}
        <p className="text-sm text-kalkvit/80 leading-relaxed whitespace-pre-wrap">{insight.body}</p>
        {insight.action_url && (
          <Link
            to={insight.action_url}
            className="inline-flex items-center gap-1.5 text-sm text-koppar hover:text-koppar/80 transition-colors"
            onClick={onClose}
          >
            Take action <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        )}
        <p className="text-xs text-kalkvit/40">{formatTimeAgo(insight.created_at)}</p>
      </div>
      <GlassModalFooter>
        <GlassButton variant="ghost" onClick={handleDismiss} disabled={dismissInsight.isPending}>
          <XMarkIcon className="w-4 h-4" />
          Dismiss
        </GlassButton>
        {!insight.read_at && (
          <GlassButton variant="primary" onClick={handleMarkRead} disabled={readInsight.isPending}>
            <CheckCircleIcon className="w-4 h-4" />
            Mark as read
          </GlassButton>
        )}
      </GlassModalFooter>
    </GlassModal>
  )
}

// ── Main Component ───────────────────────────────────

export function CoachPanel() {
  const navigate = useNavigate()
  const { data: prefs, isLoading: prefsLoading, error: prefsError } = useCoachingPreferences()
  const updatePrefs = useUpdateCoachingPreferences()
  const { data: insights, isLoading: insightsLoading, error: insightsError } = useCoachingInsightsLatest()

  const [selectedInsight, setSelectedInsight] = useState<CoachingInsight | null>(null)

  // Graceful degradation — hide on error
  if (prefsError) return null

  // Loading state
  if (prefsLoading) {
    return (
      <GlassCard variant="base">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-white/[0.1] animate-pulse" />
          <div className="h-5 w-24 bg-white/[0.1] rounded animate-pulse" />
        </div>
        <InsightRowSkeleton />
        <InsightRowSkeleton />
      </GlassCard>
    )
  }

  // Opt-in state — AI not enabled
  if (!prefs?.ai_coaching_enabled) {
    return (
      <GlassCard variant="accent" className="hover:border-koppar/30 transition-colors">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-koppar/20 flex items-center justify-center flex-shrink-0">
            <SparklesIcon className="w-6 h-6 text-koppar" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg font-semibold text-kalkvit mb-1">AI Coach</h3>
            <p className="text-sm text-kalkvit/60 mb-4">
              Get daily personalized insights based on your goals, protocols, and progress.
            </p>
            <GlassButton
              variant="primary"
              onClick={() => updatePrefs.mutate({ ai_coaching_enabled: true })}
              disabled={updatePrefs.isPending}
            >
              {updatePrefs.isPending ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <SparklesIcon className="w-4 h-4" />
              )}
              Enable AI Coaching
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    )
  }

  // Enabled state — show insights
  const insightsList = Array.isArray(insights) ? insights : []
  const hasInsights = insightsList.length > 0

  // Hide if insights fail to load (don't break the Hub)
  if (insightsError && !hasInsights) return null

  return (
    <>
      <GlassCard variant="base" className="hover:border-koppar/30 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-kalkvit flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-koppar" />
            AI Coach
          </h2>
          <Link
            to="/coaching/ai"
            className="text-sm text-koppar hover:text-koppar/80 transition-colors flex items-center gap-1"
          >
            View all <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {insightsLoading ? (
          <div>
            <InsightRowSkeleton />
            <InsightRowSkeleton />
          </div>
        ) : hasInsights ? (
          <div className="divide-y divide-white/[0.06]">
            {insightsList.slice(0, 3).map((insight) => (
              <button
                key={insight.id}
                onClick={() => setSelectedInsight(insight)}
                className="w-full flex items-start gap-3 py-2.5 text-left hover:bg-white/[0.03] -mx-2 px-2 rounded-lg transition-colors"
              >
                <PillarDot pillar={insight.pillar} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-kalkvit truncate">{insight.title}</p>
                  <p className="text-xs text-kalkvit/50 truncate">{insight.body}</p>
                </div>
                <span className="text-[10px] text-kalkvit/40 flex-shrink-0 mt-0.5">
                  {formatTimeAgo(insight.created_at)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-kalkvit/40 text-center py-4">
            Your AI coach is analyzing your progress. Insights will appear here soon.
          </p>
        )}

        {/* Chat shortcut */}
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <button
            onClick={() => navigate('/coaching/ai/chat')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-left hover:bg-white/[0.06] transition-colors"
          >
            <SparklesIcon className="w-4 h-4 text-koppar flex-shrink-0" />
            <span className="text-sm text-kalkvit/40">Ask your coach anything...</span>
          </button>
        </div>
      </GlassCard>

      <InsightDetailModal
        insight={selectedInsight}
        isOpen={!!selectedInsight}
        onClose={() => setSelectedInsight(null)}
      />
    </>
  )
}
