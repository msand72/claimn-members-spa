import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { useJourney } from '../../lib/api/hooks/useJourney'

const STORAGE_KEY = 'journey_widget_expanded'

function getStoredExpanded(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored !== null ? JSON.parse(stored) : true
  } catch {
    return true
  }
}

interface CircularProgressProps {
  pct: number
  size?: number
  strokeWidth?: number
}

function CircularProgress({ pct, size = 40, strokeWidth = 3 }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-white/10"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="text-koppar transition-all duration-500"
      />
      {/* Percentage text */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-kalkvit text-[10px] font-semibold"
        transform={`rotate(90, ${size / 2}, ${size / 2})`}
      >
        {Math.round(pct)}%
      </text>
    </svg>
  )
}

function WidgetSkeleton() {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 mx-2 mb-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-white/10 rounded" />
        <div className="w-5 h-5 bg-white/10 rounded" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 w-32 bg-white/10 rounded" />
        <div className="h-3 w-20 bg-white/10 rounded" />
      </div>
    </div>
  )
}

export function JourneyWidget() {
  const { data, isLoading, isError } = useJourney()
  const [expanded, setExpanded] = useState(getStoredExpanded)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expanded))
  }, [expanded])

  if (isLoading) return <WidgetSkeleton />
  if (isError || !data) return null

  const journey = data
  const progressPct = journey.active_protocol?.progress_pct ?? 0

  if (!expanded) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 mx-2 mb-3">
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center justify-center"
          aria-label="Expand journey widget"
        >
          <CircularProgress pct={progressPct} />
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 mx-2 mb-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-kalkvit/40">
          Journey
        </span>
        <button
          onClick={() => setExpanded(false)}
          className="text-kalkvit/40 hover:text-kalkvit/70 transition-colors"
          aria-label="Collapse journey widget"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {/* Focus Pillar */}
      <p className="text-xs font-medium text-kalkvit/70 mb-2">
        {journey.current_focus_pillar ?? 'No focus set'}
      </p>

      {/* Active Protocol */}
      {journey.active_protocol && (
        <div className="flex items-center gap-2 mb-2">
          <CircularProgress pct={journey.active_protocol.progress_pct} />
          <p className="text-xs font-medium text-kalkvit truncate flex-1">
            {journey.active_protocol.title}
          </p>
        </div>
      )}

      {/* Weekly Stats */}
      <p className="text-[11px] text-kalkvit/50 mb-2">
        {journey.weekly_stats.tasks_completed}/{journey.weekly_stats.tasks_total} tasks
        {' · '}
        {journey.weekly_stats.streak_days} day streak
      </p>

      {/* View Journey Link */}
      <Link
        to="/"
        className="flex items-center gap-1.5 text-[11px] font-medium text-koppar hover:text-koppar/80 transition-colors"
      >
        <Eye className="w-3.5 h-3.5" />
        View Journey
      </Link>
    </div>
  )
}
