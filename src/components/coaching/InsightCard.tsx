import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GlassBadge, GlassButton } from '../ui'
import {
  ArrowRightIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import { PILLAR_CONFIG, type PillarId } from '../../tokens/pillars'
import { useReadInsight, useDismissInsight, type CoachingInsight } from '../../lib/api/hooks/useCoaching'

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

export function InsightCard({ insight }: { insight: CoachingInsight }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [markedRead, setMarkedRead] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const readInsight = useReadInsight()
  const dismissInsight = useDismissInsight()

  const pillarConfig = insight.pillar ? PILLAR_CONFIG[insight.pillar as PillarId] : null
  const isUnread = !insight.read_at && !markedRead
  const bodyPreview = insight.body.length > 120 ? insight.body.slice(0, 120) + '...' : insight.body
  const hasLongBody = insight.body.length > 120

  const handleMarkRead = () => {
    setMarkedRead(true)
    readInsight.mutate(insight.id)
  }

  const handleDismiss = () => {
    setDismissed(true)
    dismissInsight.mutate(insight.id)
  }

  if (dismissed) return null

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-[16px] p-4 sm:p-5 transition-opacity duration-300 ${markedRead ? 'opacity-60' : ''}`}
      style={pillarConfig ? { borderLeftColor: pillarConfig.color, borderLeftWidth: 3 } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {pillarConfig && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
                style={{ color: pillarConfig.color, borderColor: pillarConfig.colorBorder, backgroundColor: pillarConfig.colorLo }}
              >
                {pillarConfig.shortName}
              </span>
            )}
            {insight.insight_type && (
              <GlassBadge variant="default" className="text-[10px] capitalize">
                {insight.insight_type.replace(/_/g, ' ')}
              </GlassBadge>
            )}
            {insight.priority === 'high' && (
              <GlassBadge variant="warning" className="text-[10px]">High</GlassBadge>
            )}
            {insight.priority === 'urgent' && (
              <GlassBadge variant="error" className="text-[10px]">Urgent</GlassBadge>
            )}
            {isUnread && (
              <div className="w-2 h-2 rounded-full bg-koppar flex-shrink-0" />
            )}
          </div>

          <h3 className="font-semibold text-kalkvit text-sm mb-1">{insight.title}</h3>

          <p className="text-sm text-kalkvit/70 leading-relaxed whitespace-pre-wrap">
            {isExpanded ? insight.body : bodyPreview}
          </p>

          {hasLongBody && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-koppar hover:text-koppar/80 transition-colors flex items-center gap-1 mt-1"
            >
              {isExpanded ? (
                <>Show less <ChevronUpIcon className="w-3 h-3" /></>
              ) : (
                <>Read more <ChevronDownIcon className="w-3 h-3" /></>
              )}
            </button>
          )}

          {insight.action_url && (
            <Link
              to={insight.action_url}
              className="inline-flex items-center gap-1 text-xs text-koppar hover:text-koppar/80 transition-colors mt-2"
            >
              Take action <ArrowRightIcon className="w-3 h-3" />
            </Link>
          )}
        </div>

        <span className="text-[10px] text-kalkvit/40 flex-shrink-0 whitespace-nowrap">
          {formatTimeAgo(insight.created_at)}
        </span>
      </div>

      <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-white/[0.06]">
        <GlassButton
          variant="ghost"
          className="text-xs px-2 py-1 lg:opacity-0 lg:group-hover:opacity-100"
          onClick={handleDismiss}
          disabled={dismissInsight.isPending}
        >
          <XMarkIcon className="w-3.5 h-3.5" />
          Dismiss
        </GlassButton>
        {isUnread && (
          <GlassButton
            variant="ghost"
            className="text-xs px-2 py-1"
            onClick={handleMarkRead}
            disabled={readInsight.isPending}
          >
            <CheckCircleIcon className="w-3.5 h-3.5" />
            Mark read
          </GlassButton>
        )}
      </div>
    </div>
  )
}
