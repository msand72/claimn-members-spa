import { useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassStatsCard, GlassBadge } from '../components/ui'
import { useCurrentProfile } from '../lib/api/hooks'
import { useJourney } from '../lib/api/hooks/useJourney'
import { PILLARS, type PillarId } from '../lib/constants'
import { RecommendedProtocol } from '../components/journey/RecommendedProtocol'
import { ActiveProtocolCard } from '../components/journey/ActiveProtocolCard'
import {
  Loader2,
  AlertTriangle,
  Target,
  Flame,
  Newspaper,
  Calendar,
  ArrowRight,
  CheckSquare,
  CheckCircle2,
  Circle,
  X,
  Compass,
  Zap,
  Clock,
  Users,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DISMISSED_PROMPTS_KEY = 'dismissed_prompts'
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

function getDismissedPrompts(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_PROMPTS_KEY) || '{}')
  } catch {
    return {}
  }
}

function dismissPrompt(key: string) {
  const current = getDismissedPrompts()
  current[key] = Date.now()
  localStorage.setItem(DISMISSED_PROMPTS_KEY, JSON.stringify(current))
}

function isPromptDismissed(key: string): boolean {
  const dismissed = getDismissedPrompts()
  const ts = dismissed[key]
  if (!ts) return false
  return Date.now() - ts < TWENTY_FOUR_HOURS
}

const TASK_TYPE_LABELS: Record<string, { label: string; variant: 'koppar' | 'default' | 'outline' }> = {
  action_item: { label: 'Action', variant: 'koppar' },
  protocol_step: { label: 'Protocol', variant: 'default' },
  kpi_log: { label: 'KPI Log', variant: 'outline' },
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-koppar',
  medium: 'text-kalkvit/60',
  low: 'text-kalkvit/40',
}

const PRIORITY_BORDER: Record<string, string> = {
  high: 'border-koppar/40',
  medium: 'border-white/[0.08]',
  low: 'border-white/[0.05]',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JourneyDashboardPage() {
  const { user } = useAuth()
  const { data: profile } = useCurrentProfile()
  const { data: journey, isLoading, isError } = useJourney()

  // Local visual-only checkbox state for today's tasks
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({})

  // Dismissed smart prompts (re-render trigger)
  const [, setDismissedTick] = useState(0)

  const handleDismissPrompt = useCallback((key: string) => {
    dismissPrompt(key)
    setDismissedTick((t) => t + 1)
  }, [])

  const handleToggleTask = useCallback((taskId: string, currentCompleted: boolean) => {
    setCheckedTasks((prev) => ({
      ...prev,
      [taskId]: prev[taskId] !== undefined ? !prev[taskId] : !currentCompleted,
    }))
  }, [])

  // Derived data
  const displayName =
    profile?.display_name || user?.display_name || user?.email?.split('@')[0] || 'Member'

  const focusPillarId = journey?.current_focus_pillar as PillarId | null
  const focusPillar = focusPillarId && focusPillarId in PILLARS ? PILLARS[focusPillarId] : null

  const protocol = journey?.active_protocol ?? null
  const weeklyStats = journey?.weekly_stats
  const tasks = journey?.todays_tasks ?? []
  const sessions = journey?.upcoming_sessions ?? []
  const milestones = journey?.milestones ?? []
  const smartPrompts = (journey?.smart_prompts ?? []).filter(
    (p) => !isPromptDismissed(`${p.type}:${p.action_url}`)
  )

  // Extract a recommended protocol slug from smart prompts (e.g. action_url = "/protocols/my-protocol")
  const recommendedProtocolSlug = useMemo(() => {
    if (protocol) return null // already have an active protocol
    for (const prompt of journey?.smart_prompts ?? []) {
      const match = prompt.action_url.match(/^\/protocols\/([a-z0-9-]+)$/)
      if (match) return match[1]
    }
    return null
  }, [protocol, journey?.smart_prompts])

  // Find the next incomplete protocol_step task for today
  const nextProtocolTask = useMemo(
    () => tasks.find((t) => t.type === 'protocol_step' && !t.completed) ?? null,
    [tasks]
  )

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-koppar" />
        </div>
      </MainLayout>
    )
  }

  // -----------------------------------------------------------------------
  // Error state
  // -----------------------------------------------------------------------
  if (isError) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <AlertTriangle className="w-8 h-8 text-tegelrod" />
          <p className="text-kalkvit/70">Failed to load your journey data.</p>
        </div>
      </MainLayout>
    )
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* ================================================================
            1. Journey Hero
            ================================================================ */}
        <GlassCard variant="elevated" className="mb-8">
          <div className="bg-gradient-to-br from-charcoal to-jordbrun rounded-2xl p-4 md:p-8">
            <div className="flex flex-col gap-4 md:gap-6">
              {/* Focus pillar + greeting */}
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-kalkvit mb-1">
                  {displayName}&rsquo;s Journey
                </h1>
                {focusPillar && (
                  <div className="flex items-center gap-2 mt-2">
                    <Compass className="w-4 h-4 text-koppar" />
                    <span className="text-kalkvit/70 text-sm">
                      Focus: <span className="text-koppar font-medium">{focusPillar.name}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Active protocol progress (compact inline preview) */}
              {protocol && (
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-kalkvit font-medium text-sm">{protocol.title}</span>
                    <span className="text-koppar text-sm font-semibold">
                      {protocol.progress_pct}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-koppar rounded-full transition-all duration-500"
                      style={{ width: `${protocol.progress_pct}%` }}
                    />
                  </div>
                  <p className="text-kalkvit/50 text-xs mt-2">
                    Step {protocol.current_step} of {protocol.total_steps}
                  </p>
                </div>
              )}

              {/* Weekly stats row */}
              {weeklyStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <GlassStatsCard
                    icon={CheckSquare}
                    label="Tasks Done"
                    value={`${weeklyStats.tasks_completed}/${weeklyStats.tasks_total}`}
                    trend="--"
                    trendLabel="this week"
                  />
                  <GlassStatsCard
                    icon={Flame}
                    label="Streak"
                    value={String(weeklyStats.streak_days)}
                    trend="--"
                    trendLabel="days"
                  />
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* ================================================================
            1b. Active Protocol Card / Recommended Protocol
            ================================================================ */}
        {protocol && (
          <div className="mb-8">
            <ActiveProtocolCard protocol={protocol} nextTask={nextProtocolTask} />
          </div>
        )}
        {!protocol && recommendedProtocolSlug && (
          <div className="mb-8">
            <RecommendedProtocol protocolSlug={recommendedProtocolSlug} />
          </div>
        )}

        {/* ================================================================
            2. Smart Prompts
            ================================================================ */}
        {smartPrompts.length > 0 && (
          <div className="space-y-3 mb-8">
            {smartPrompts.map((prompt) => {
              const promptKey = `${prompt.type}:${prompt.action_url}`
              return (
                <div
                  key={promptKey}
                  className={`relative flex items-center justify-between gap-4 p-4 bg-white/[0.03] rounded-xl border ${PRIORITY_BORDER[prompt.priority] || 'border-white/[0.08]'}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Zap className={`w-5 h-5 flex-shrink-0 ${PRIORITY_COLORS[prompt.priority] || 'text-kalkvit/60'}`} />
                    <span className={`text-sm ${PRIORITY_COLORS[prompt.priority] || 'text-kalkvit/60'}`}>
                      {prompt.message}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link to={prompt.action_url}>
                      <GlassButton variant="primary" className="text-xs px-3 py-1">
                        Go <ArrowRight className="w-3 h-3 ml-1" />
                      </GlassButton>
                    </Link>
                    <button
                      onClick={() => handleDismissPrompt(promptKey)}
                      className="text-kalkvit/30 hover:text-kalkvit/60 transition-colors"
                      aria-label="Dismiss prompt"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ================================================================
            3. Today's Tasks + 4. Progress Timeline (two-column)
            ================================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Today's Tasks */}
          <GlassCard>
            <h3 className="font-display text-xl font-semibold text-kalkvit mb-4">
              Today&rsquo;s Tasks
            </h3>
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="w-12 h-12 text-kalkvit/20 mx-auto mb-3" />
                <p className="text-kalkvit/50 text-sm">No tasks for today</p>
                <p className="text-kalkvit/30 text-xs mt-1">
                  Tasks from your protocol and action items will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const isChecked =
                    checkedTasks[task.id] !== undefined ? checkedTasks[task.id] : task.completed
                  const typeInfo = TASK_TYPE_LABELS[task.type] || {
                    label: task.type,
                    variant: 'outline' as const,
                  }
                  return (
                    <button
                      key={task.id}
                      onClick={() => handleToggleTask(task.id, task.completed)}
                      className={`w-full flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.08] hover:border-koppar/30 transition-colors text-left ${
                        isChecked ? 'opacity-60' : ''
                      }`}
                    >
                      {isChecked ? (
                        <CheckCircle2 className="w-5 h-5 text-koppar flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-kalkvit/30 flex-shrink-0" />
                      )}
                      <span
                        className={`flex-1 text-sm ${
                          isChecked ? 'line-through text-kalkvit/40' : 'text-kalkvit/80'
                        }`}
                      >
                        {task.title}
                      </span>
                      <GlassBadge variant={typeInfo.variant}>{typeInfo.label}</GlassBadge>
                    </button>
                  )
                })}
              </div>
            )}
          </GlassCard>

          {/* Progress Timeline */}
          <GlassCard>
            <h3 className="font-display text-xl font-semibold text-kalkvit mb-4">
              Progress Timeline
            </h3>
            {milestones.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-kalkvit/20 mx-auto mb-3" />
                <p className="text-kalkvit/50 text-sm">No milestones yet</p>
                <p className="text-kalkvit/30 text-xs mt-1">
                  Milestones will appear as you progress
                </p>
              </div>
            ) : (
              <div className="relative pl-6">
                {/* Vertical line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/[0.08]" />
                <div className="space-y-4">
                  {milestones.map((milestone, idx) => {
                    const isCompleted = milestone.completed_at !== null
                    return (
                      <div key={`${milestone.type}-${idx}`} className="relative flex items-start gap-3">
                        {/* Dot / check */}
                        <div className="absolute -left-6 mt-0.5">
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-kalkvit/20" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span
                            className={`text-sm font-medium ${
                              isCompleted ? 'text-kalkvit' : 'text-kalkvit/50'
                            }`}
                          >
                            {milestone.label}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-kalkvit/30 text-xs">{milestone.type}</span>
                            {isCompleted && milestone.completed_at && (
                              <span className="text-green-500/70 text-xs">
                                {new Date(milestone.completed_at).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            )}
                            {!isCompleted && (
                              <span className="text-kalkvit/20 text-xs">Upcoming</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* ================================================================
            5. Upcoming Sessions + 6. Quick Actions (two-column)
            ================================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Upcoming Sessions */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-semibold text-kalkvit">
                Upcoming Sessions
              </h3>
              <Link
                to="/coaching/sessions"
                className="text-koppar text-sm hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-kalkvit/20 mx-auto mb-3" />
                <p className="text-kalkvit/50 text-sm">No sessions scheduled</p>
                <p className="text-kalkvit/30 text-xs mt-1">
                  Book a coaching session to keep your momentum going
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <Link
                    key={session.id}
                    to="/coaching/sessions"
                    className="block p-4 bg-white/[0.03] rounded-xl border border-white/[0.08] hover:border-koppar/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-koppar" />
                      <span className="text-kalkvit font-medium">{session.expert_name}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-8">
                      <Clock className="w-3.5 h-3.5 text-kalkvit/40" />
                      <span className="text-kalkvit/60 text-sm">
                        {new Date(session.start_time).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-kalkvit/40">&middot;</span>
                      <GlassBadge variant="outline">{session.type}</GlassBadge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard>
            <h3 className="font-display text-xl font-semibold text-kalkvit mb-4">
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <Link to="/goals">
                <GlassButton variant="primary">
                  <Target className="w-4 h-4" />
                  Set Goals
                </GlassButton>
              </Link>
              <Link to="/protocols">
                <GlassButton variant="secondary">
                  <Flame className="w-4 h-4" />
                  Protocols
                </GlassButton>
              </Link>
              <Link to="/feed">
                <GlassButton variant="secondary">
                  <Newspaper className="w-4 h-4" />
                  Feed
                </GlassButton>
              </Link>
              <Link to="/book-session">
                <GlassButton variant="secondary">
                  <Calendar className="w-4 h-4" />
                  Book Session
                </GlassButton>
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </MainLayout>
  )
}

export default JourneyDashboardPage
