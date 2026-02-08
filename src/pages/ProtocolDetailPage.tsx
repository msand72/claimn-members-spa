import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge } from '../components/ui'
import { PILLARS } from '../lib/constants'
import type { PillarId } from '../lib/constants'
import {
  useProtocol,
  useActiveProtocolBySlug,
  useStartProtocol,
  usePauseProtocol,
  useResumeProtocol,
  useUpdateProtocolProgress,
  useGoals,
  useCreateGoal,
  useCreateActionItem,
  type ProtocolWeek,
  type ProtocolSection,
  type ImplementationStep,
  type ImplementationGuide,
  type ProtocolStat,
  type TrackingMethod,
  type SuccessMetric,
  type EmergencyProtocol,
} from '../lib/api/hooks'
import {
  ChevronLeft,
  Clock,
  Target,
  Calendar,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Loader2,
  AlertTriangle,
  BookOpen,
  Lightbulb,
  ListChecks,
  Compass,
  Brain,
  Heart,
  Users,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  TrendingUp,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { AskExpertButton } from '../components/AskExpertButton'
import { PlanBuilder } from '../components/PlanBuilder'
import { generatePlanFromProtocol, getProtocolSlugFromGoal } from '../lib/protocol-plan'
import type { SuggestedGoal } from '../lib/protocol-plan'

// Icon mapping for sections
const SECTION_ICONS: Record<string, React.ElementType> = {
  compass: Compass,
  brain: Brain,
  heart: Heart,
  users: Users,
  target: Target,
  lightbulb: Lightbulb,
  book: BookOpen,
  list: ListChecks,
  sparkles: Sparkles,
  file: FileText,
  trending: TrendingUp,
}

// Pillar icon mapping
const PILLAR_ICONS: Record<string, React.ElementType> = {
  identity: Compass,
  emotional: Brain,
  physical: Heart,
  connection: Users,
  mission: Target,
}

function StatsCardsRow({ stats }: { stats: ProtocolStat[] }) {
  if (!stats || stats.length === 0) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((s, index) => {
        const value = s.value || s.stat
        const label = s.label || s.title
        const desc = s.description || s.desc
        if (!value && !label) return null
        return (
          <GlassCard key={index} variant="base" className="text-center py-4">
            <p className="font-display text-2xl font-bold text-koppar mb-1">
              {value}
            </p>
            <p className="text-sm text-kalkvit/80">{label}</p>
            {desc && (
              <p className="text-xs text-kalkvit/50 mt-1">{desc}</p>
            )}
          </GlassCard>
        )
      })}
    </div>
  )
}

function ScientificFoundation({ content, citations }: { content: string; citations?: string[] }) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!content) return null

  const isLong = content.length > 300
  const displayContent = isLong && !isExpanded ? content.slice(0, 300) + '...' : content

  return (
    <GlassCard variant="base" className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-koppar" />
        <h2 className="font-display text-lg font-semibold text-kalkvit">
          Scientific Foundation
        </h2>
      </div>
      <p className="text-kalkvit/70 leading-relaxed whitespace-pre-wrap">
        {displayContent}
      </p>
      {isLong && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 text-koppar text-sm flex items-center gap-1 hover:text-koppar/80 transition-colors"
        >
          {isExpanded ? (
            <>
              Show less <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Read more <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
      {citations && citations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-kalkvit/40 mb-2">References</p>
          <div className="space-y-1">
            {citations.map((citation, i) => (
              <p key={i} className="text-xs text-kalkvit/50">
                {citation}
              </p>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  )
}

function ProtocolSections({ sections }: { sections: ProtocolSection[] }) {
  if (!sections || sections.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="font-display text-lg font-semibold text-kalkvit mb-4">
        Protocol Overview
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => {
          const IconComponent = SECTION_ICONS[section.icon?.toLowerCase() || 'list'] || ListChecks
          return (
            <GlassCard key={section.id} variant="base">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-koppar/10 flex items-center justify-center">
                  <IconComponent className="w-4 h-4 text-koppar" />
                </div>
                <h3 className="font-medium text-kalkvit">{section.title}</h3>
              </div>
              <ul className="space-y-2">
                {section.items.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-kalkvit/70"
                  >
                    <CheckCircle2 className="w-4 h-4 text-skogsgron flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}

function ImplementationTimeline({ steps }: { steps: ImplementationStep[] }) {
  if (!steps || steps.length === 0) return null

  return (
    <GlassCard variant="base" className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-koppar" />
        <h2 className="font-display text-lg font-semibold text-kalkvit">
          Implementation Timeline
        </h2>
      </div>
      <div className="relative">
        {steps.map((step, index) => (
          <div key={step.step} className="flex gap-4 pb-6 last:pb-0">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-koppar/20 flex items-center justify-center text-koppar font-medium text-sm">
                {step.step}
              </div>
              {index < steps.length - 1 && (
                <div className="w-0.5 flex-1 bg-white/10 mt-2" />
              )}
            </div>
            {/* Content */}
            <div className="flex-1 pb-4">
              <h4 className="font-medium text-kalkvit mb-1">{step.title}</h4>
              <p className="text-sm text-kalkvit/60">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

function ImplementationGuides({ guides }: { guides: ImplementationGuide[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (!guides || guides.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="font-display text-lg font-semibold text-kalkvit mb-4">
        Implementation Guides
      </h2>
      <div className="space-y-4">
        {guides.map((guide) => (
          <GlassCard key={guide.id} variant="base">
            <button
              onClick={() => setExpandedId(expandedId === guide.id ? null : guide.id)}
              className="w-full flex items-center justify-between text-left"
            >
              <div>
                <h3 className="font-medium text-kalkvit">{guide.title}</h3>
                <p className="text-sm text-kalkvit/60 mt-1">{guide.description}</p>
              </div>
              {guide.details && guide.details.length > 0 && (
                <ChevronDown
                  className={cn(
                    'w-5 h-5 text-kalkvit/50 transition-transform flex-shrink-0 ml-4',
                    expandedId === guide.id && 'rotate-180'
                  )}
                />
              )}
            </button>
            {expandedId === guide.id && guide.details && guide.details.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <ul className="space-y-2">
                  {guide.details.map((detail, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-kalkvit/70"
                    >
                      <Lightbulb className="w-4 h-4 text-koppar flex-shrink-0 mt-0.5" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

function TrackingMethodsSection({ methods }: { methods: TrackingMethod[] }) {
  if (!methods || methods.length === 0) return null

  return (
    <GlassCard variant="base" className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-koppar" />
        <h2 className="font-display text-lg font-semibold text-kalkvit">
          How to Track Progress
        </h2>
      </div>
      <div className="space-y-3">
        {methods.map((method, i) => (
          <div key={i} className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-skogsgron flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-kalkvit">{method.title}</p>
              {method.description && (
                <p className="text-xs text-kalkvit/60 mt-0.5">{method.description}</p>
              )}
              {method.frequency && (
                <p className="text-xs text-koppar mt-0.5">{method.frequency}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

function SuccessMetricsSection({ metrics }: { metrics: SuccessMetric[] }) {
  if (!metrics || metrics.length === 0) return null

  return (
    <GlassCard variant="base" className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-koppar" />
        <h2 className="font-display text-lg font-semibold text-kalkvit">
          Success Metrics
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {metrics.map((metric, i) => (
          <div key={i} className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
            <p className="text-sm font-medium text-kalkvit">{metric.title}</p>
            {metric.target && (
              <p className="text-lg font-bold text-koppar mt-1">{metric.target}</p>
            )}
            {metric.description && (
              <p className="text-xs text-kalkvit/60 mt-1">{metric.description}</p>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

function EmergencyProtocolsSection({ protocols }: { protocols: EmergencyProtocol[] }) {
  if (!protocols || protocols.length === 0) return null

  return (
    <GlassCard variant="accent" className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-tegelrod" />
        <h2 className="font-display text-lg font-semibold text-kalkvit">
          Emergency Protocols
        </h2>
      </div>
      <div className="space-y-4">
        {protocols.map((protocol, i) => (
          <div key={i}>
            <p className="text-sm font-medium text-kalkvit mb-1">{protocol.title}</p>
            {protocol.description && (
              <p className="text-sm text-kalkvit/70">{protocol.description}</p>
            )}
            {protocol.steps && protocol.steps.length > 0 && (
              <ol className="mt-2 space-y-1">
                {protocol.steps.map((step, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-kalkvit/60">
                    <span className="text-koppar font-medium">{j + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

function RelatedProtocols({ slugs, label }: { slugs: string[]; label: string }) {
  if (!slugs || slugs.length === 0) return null

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-kalkvit/60 mb-3">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {slugs.map((s) => (
          <Link
            key={s}
            to={`/protocols/${s}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.06] text-sm text-koppar hover:bg-white/[0.1] transition-colors"
          >
            {s.replace(/-/g, ' ')}
          </Link>
        ))}
      </div>
    </div>
  )
}

function WeekCard({
  week,
  completedTasks,
  currentWeek,
  onToggleTask,
  isUpdating,
}: {
  week: ProtocolWeek
  completedTasks: Record<string, boolean>
  currentWeek: number
  onToggleTask: (taskId: string, completed: boolean) => void
  isUpdating: string | null
}) {
  const [isExpanded, setIsExpanded] = useState(week.week === currentWeek)
  const isCurrentWeek = week.week === currentWeek
  const isPastWeek = week.week < currentWeek
  const tasks = Array.isArray(week.tasks) ? week.tasks : []
  const completedCount = tasks.filter((t) => completedTasks[t.id]).length
  const status = isPastWeek ? 'completed' : isCurrentWeek ? 'current' : 'upcoming'

  return (
    <GlassCard
      variant={isCurrentWeek ? 'accent' : 'base'}
      className={cn('transition-all', isCurrentWeek && 'ring-1 ring-koppar/30')}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start justify-between text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-koppar">Week {week.week}</span>
            {status === 'current' && (
              <GlassBadge variant="koppar" className="text-xs">
                Current
              </GlassBadge>
            )}
            {status === 'completed' && (
              <GlassBadge variant="success" className="text-xs">
                <CheckCircle2 className="w-3 h-3" />
                Done
              </GlassBadge>
            )}
          </div>
          <h4 className="font-semibold text-kalkvit">{week.title}</h4>
          <p className="text-sm text-kalkvit/60 mt-1">{week.description}</p>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <div className="text-right">
            <span className="text-lg font-bold text-koppar">
              {completedCount}/{tasks.length}
            </span>
          </div>
          <ChevronDown
            className={cn(
              'w-5 h-5 text-kalkvit/50 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Tasks */}
      {isExpanded && tasks.length > 0 && (
        <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
          {tasks.map((task) => {
            const isCompleted = completedTasks[task.id] || false
            const isTaskUpdating = isUpdating === task.id

            return (
              <div key={task.id} className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleTask(task.id, !isCompleted)
                  }}
                  disabled={isTaskUpdating}
                  className={cn(
                    'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                    isCompleted
                      ? 'bg-skogsgron border-skogsgron'
                      : 'border-kalkvit/30 hover:border-koppar'
                  )}
                >
                  {isTaskUpdating ? (
                    <Loader2 className="w-3 h-3 text-kalkvit animate-spin" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-3 h-3 text-kalkvit" />
                  ) : null}
                </button>
                <span
                  className={cn(
                    'text-sm',
                    isCompleted ? 'text-kalkvit/50 line-through' : 'text-kalkvit/80'
                  )}
                >
                  {task.title}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}

function ProgressTracker({
  activeProtocol,
  totalTasks,
  completedTasksCount,
  totalWeeks,
  onPause,
  onResume,
  isPausing,
  isResuming,
}: {
  activeProtocol: {
    id: string
    current_week: number
    started_at: string
    status: string
    progress_percentage: number
  }
  totalTasks: number
  completedTasksCount: number
  totalWeeks: number
  onPause: () => void
  onResume: () => void
  isPausing: boolean
  isResuming: boolean
}) {
  const isActive = activeProtocol.status === 'active'
  const isPaused = activeProtocol.status === 'paused'
  const progressPercent = activeProtocol.progress_percentage || 0
  const currentWeek = activeProtocol.current_week || 1

  return (
    <GlassCard variant="elevated" className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-kalkvit">Your Progress</h3>
        <div className="flex gap-2">
          {isActive && (
            <GlassButton
              variant="ghost"
              className="p-2"
              onClick={onPause}
              disabled={isPausing}
            >
              {isPausing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
            </GlassButton>
          )}
          {isPaused && (
            <GlassButton
              variant="ghost"
              className="p-2"
              onClick={onResume}
              disabled={isResuming}
            >
              {isResuming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
            </GlassButton>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-kalkvit/60">Overall Completion</span>
          <span className="text-lg font-bold text-koppar">{progressPercent}%</span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-koppar to-brandAmber rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div>
          <p className="font-display text-xl font-bold text-kalkvit">
            Week {currentWeek}
          </p>
          <p className="text-xs text-kalkvit/50">Current Week</p>
        </div>
        <div>
          <p className="font-display text-xl font-bold text-kalkvit">
            {completedTasksCount}/{totalTasks}
          </p>
          <p className="text-xs text-kalkvit/50">Tasks Done</p>
        </div>
        <div>
          <p className="font-display text-xl font-bold text-kalkvit">
            {Math.max(0, totalWeeks - currentWeek)}
          </p>
          <p className="text-xs text-kalkvit/50">Weeks Left</p>
        </div>
        <div>
          <p className="font-display text-xl font-bold text-kalkvit">
            {new Date(activeProtocol.started_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </p>
          <p className="text-xs text-kalkvit/50">Started</p>
        </div>
      </div>
    </GlassCard>
  )
}

export function ProtocolDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [actionError, setActionError] = useState<string | null>(null)
  const [justStarted, setJustStarted] = useState(false)
  const [showPlanBuilder, setShowPlanBuilder] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)
  const [isCreatingPlan, setIsCreatingPlan] = useState(false)

  // API hooks
  const {
    data: protocol,
    isLoading: isLoadingProtocol,
    error: protocolError,
  } = useProtocol(slug || '')

  const {
    data: activeProtocol,
    isLoading: isLoadingActive,
  } = useActiveProtocolBySlug(slug || '')

  const startMutation = useStartProtocol()
  const pauseMutation = usePauseProtocol()
  const resumeMutation = useResumeProtocol()
  const progressMutation = useUpdateProtocolProgress()
  const createGoal = useCreateGoal()
  const createActionItem = useCreateActionItem()

  // Fetch goals to find ones linked to this protocol
  const { data: goalsData } = useGoals()
  const linkedGoals = useMemo(() => {
    if (!goalsData || !slug) return []
    const goals = Array.isArray(goalsData) ? goalsData : goalsData?.data
    if (!Array.isArray(goals)) return []
    return goals.filter((g) => getProtocolSlugFromGoal(g.description) === slug)
  }, [goalsData, slug])

  const isLoading = isLoadingProtocol || isLoadingActive
  const error = protocolError

  // Track which task is being updated
  const updatingTaskId = progressMutation.isPending
    ? (progressMutation.variables?.data.task_id ?? null)
    : null

  // Generate suggested plan from protocol template
  const suggestedPlan = useMemo(() => {
    if (!protocol) return []
    return generatePlanFromProtocol(protocol)
  }, [protocol])

  const handleStartClick = () => {
    setPlanError(null)
    setShowPlanBuilder(true)
  }

  const handleConfirmPlan = async (goals: SuggestedGoal[]) => {
    if (!slug || !protocol) return
    setIsCreatingPlan(true)
    setPlanError(null)

    try {
      // 1. Create goals and their action items
      for (const goal of goals) {
        const createdGoal = await createGoal.mutateAsync({
          title: goal.title,
          description: goal.description,
          pillar_id: goal.pillar_id,
          target_date: goal.target_date,
        })

        // Create action items for this goal
        for (const item of goal.actionItems) {
          await createActionItem.mutateAsync({
            title: item.title,
            description: item.description,
            goal_id: createdGoal.id,
            priority: item.priority,
          })
        }
      }

      // 2. Start the protocol (only if not already started)
      if (!activeProtocol) {
        await startMutation.mutateAsync({
          protocol_slug: slug,
          protocol_name: protocol.title || slug,
          pillar: protocol.pillar,
          duration_weeks: protocol.duration_weeks,
        })
        setJustStarted(true)
      }

      setShowPlanBuilder(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
      setPlanError(`Failed to create plan: ${msg}`)
    } finally {
      setIsCreatingPlan(false)
    }
  }

  const handlePause = async () => {
    if (!activeProtocol?.id) return
    setActionError(null)
    try {
      await pauseMutation.mutateAsync(activeProtocol.id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
      setActionError(`Failed to pause protocol: ${msg}`)
    }
  }

  const handleResume = async () => {
    if (!activeProtocol?.id) return
    setActionError(null)
    try {
      await resumeMutation.mutateAsync(activeProtocol.id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
      setActionError(`Failed to resume protocol: ${msg}`)
    }
  }

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    if (!activeProtocol?.id) return
    setActionError(null)
    try {
      await progressMutation.mutateAsync({
        protocolId: activeProtocol.id,
        data: { task_id: taskId, completed },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
      setActionError(`Failed to update task: ${msg}`)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-koppar animate-spin" />
        </div>
      </MainLayout>
    )
  }

  if (error || !protocol) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <AlertTriangle className="w-12 h-12 text-tegelrod mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-kalkvit mb-4">
            Protocol not found
          </h1>
          <Link to="/protocols">
            <GlassButton variant="secondary">
              <ChevronLeft className="w-4 h-4" />
              Back to Protocols
            </GlassButton>
          </Link>
        </div>
      </MainLayout>
    )
  }

  const pillarId = (protocol.pillar || 'identity') as PillarId
  const pillar = PILLARS[pillarId] || PILLARS.identity
  const PillarIcon = PILLAR_ICONS[pillarId] || Target
  const isActive = activeProtocol && activeProtocol.status === 'active'
  const isPaused = activeProtocol && activeProtocol.status === 'paused'
  const hasStarted = !!activeProtocol

  // Get completed tasks from active protocol
  const completedTasks = activeProtocol?.completed_tasks || {}

  // Calculate overall progress
  const weeks = Array.isArray(protocol.weeks) ? protocol.weeks : []
  const totalTasks = weeks.reduce(
    (sum, week) => sum + (Array.isArray(week.tasks) ? week.tasks.length : 0),
    0
  )
  const completedTasksCount = Object.values(completedTasks).filter(Boolean).length
  const currentWeek = activeProtocol?.current_week || 1

  // Get additional protocol data
  const stats = Array.isArray(protocol.stats) ? protocol.stats : []
  const sections = Array.isArray(protocol.protocol_sections) ? protocol.protocol_sections : []
  const implementationTimeline = Array.isArray(protocol.implementation_steps)
    ? protocol.implementation_steps
    : []
  const implementationGuides = Array.isArray(protocol.implementation_guides)
    ? protocol.implementation_guides
    : []

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <Link
          to="/protocols"
          className="inline-flex items-center gap-1 text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Protocols
        </Link>

        {/* Action error banner */}
        {actionError && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-tegelrod/10 border border-tegelrod/20 px-4 py-3 text-sm text-tegelrod">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{actionError}</span>
            <button
              onClick={() => setActionError(null)}
              className="text-tegelrod/60 hover:text-tegelrod transition-colors text-xs font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Hero Image */}
        {protocol.hero_image_url && (
          <div
            className="relative h-48 sm:h-64 rounded-2xl overflow-hidden mb-8 bg-cover bg-center"
            style={{
              backgroundImage: `url(${protocol.hero_image_url})`,
              ...(protocol.hero_background_style && !protocol.hero_image_url
                ? { background: protocol.hero_background_style }
                : {}),
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}

        {/* Prerequisite notice */}
        {protocol.prerequisite_protocol_slugs && protocol.prerequisite_protocol_slugs.length > 0 && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-koppar/10 border border-koppar/20 px-4 py-3 text-sm text-koppar">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Recommended prerequisites</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {protocol.prerequisite_protocol_slugs.map((s) => (
                  <Link
                    key={s}
                    to={`/protocols/${s}`}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-koppar/10 text-xs text-koppar hover:bg-koppar/20 transition-colors"
                  >
                    {s.replace(/-/g, ' ')}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hero Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-koppar/10 flex items-center justify-center">
                  <PillarIcon className="w-5 h-5 text-koppar" />
                </div>
                <GlassBadge variant="koppar">{pillar.name}</GlassBadge>
                {isActive && (
                  <GlassBadge variant="success">
                    <Play className="w-3 h-3" />
                    Active
                  </GlassBadge>
                )}
                {isPaused && (
                  <GlassBadge variant="warning">
                    <Pause className="w-3 h-3" />
                    Paused
                  </GlassBadge>
                )}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">
                {protocol.title}
              </h1>
              {protocol.subtitle && (
                <p className="text-lg text-kalkvit/70 mb-2">{protocol.subtitle}</p>
              )}
              <p className="text-kalkvit/60">{protocol.description}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-koppar">
                {protocol.headline_stat || protocol.stat}
              </p>
              <p className="text-xs text-kalkvit/50">Expected Result</p>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-6 text-sm text-kalkvit/50">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {protocol.duration_weeks ? `${protocol.duration_weeks} weeks` : 'Multi-week program'}
            </span>
            <span className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              {protocol.duration_weeks || weeks.length} weeks
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {totalTasks} tasks
            </span>
          </div>
        </div>

        {/* Ask Expert */}
        <div className="mb-6">
          <AskExpertButton
            context={`Protocol: ${protocol.title}`}
            protocolSlug={slug}
          />
        </div>

        {/* Stats Cards Row */}
        <StatsCardsRow stats={stats} />

        {/* Success banner after starting */}
        {justStarted && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-skogsgron/10 border border-skogsgron/20 px-4 py-3 text-sm text-skogsgron">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">
              Protocol started! Your progress is now being tracked below.
            </span>
            <button
              onClick={() => setJustStarted(false)}
              className="text-skogsgron/60 hover:text-skogsgron"
            >
              &times;
            </button>
          </div>
        )}

        {/* Progress Card (if started) */}
        {hasStarted && activeProtocol && (
          <ProgressTracker
            activeProtocol={activeProtocol}
            totalTasks={totalTasks}
            completedTasksCount={completedTasksCount}
            totalWeeks={protocol.duration_weeks || weeks.length}
            onPause={handlePause}
            onResume={handleResume}
            isPausing={pauseMutation.isPending}
            isResuming={resumeMutation.isPending}
          />
        )}

        {/* Set Up Plan prompt — for protocols started without the PlanBuilder */}
        {hasStarted && linkedGoals.length === 0 && (
          <GlassCard variant="accent" className="mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-koppar/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-koppar" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-kalkvit mb-1">Set up your action plan</h3>
                <p className="text-sm text-kalkvit/60 mb-3">
                  Create goals and action items from this protocol so you know exactly what to do each step of the way.
                </p>
                <GlassButton variant="primary" onClick={handleStartClick}>
                  <ListChecks className="w-4 h-4" />
                  Create Plan
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Scientific Foundation */}
        <ScientificFoundation
          content={protocol.scientific_foundation || ''}
          citations={protocol.scientific_citations}
        />

        {/* Protocol Sections */}
        <ProtocolSections sections={sections} />

        {/* Implementation Timeline */}
        <ImplementationTimeline steps={implementationTimeline} />

        {/* Implementation Guides */}
        <ImplementationGuides guides={implementationGuides} />

        {/* Tracking Methods */}
        <TrackingMethodsSection methods={protocol.tracking_methods || []} />

        {/* Success Metrics */}
        <SuccessMetricsSection metrics={protocol.success_metrics || []} />

        {/* Emergency Protocols */}
        <EmergencyProtocolsSection protocols={protocol.emergency_protocols || []} />

        {/* Weekly Breakdown */}
        {weeks.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-lg font-semibold text-kalkvit mb-4">
              Weekly Breakdown
            </h2>
            <div className="space-y-4">
              {weeks.map((week) => (
                <WeekCard
                  key={week.week}
                  week={week}
                  completedTasks={completedTasks}
                  currentWeek={currentWeek}
                  onToggleTask={handleToggleTask}
                  isUpdating={updatingTaskId}
                />
              ))}
            </div>
          </div>
        )}

        {/* Related Protocols */}
        <RelatedProtocols
          slugs={protocol.related_protocol_slugs || []}
          label="Related Protocols"
        />

        {/* Keywords */}
        {protocol.keywords && protocol.keywords.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {protocol.keywords.map((kw) => (
                <span
                  key={kw}
                  className="px-3 py-1 rounded-full bg-white/[0.06] text-xs text-kalkvit/50"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Linked Goals (visible when protocol is active) */}
        {hasStarted && linkedGoals.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-lg font-semibold text-kalkvit mb-4">
              Your Goals for This Protocol
            </h2>
            <div className="space-y-3">
              {linkedGoals.map((goal) => (
                <Link key={goal.id} to={`/goals/${goal.id}`}>
                  <GlassCard variant="base" className="hover:border-koppar/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <Target className="w-5 h-5 text-koppar flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-kalkvit truncate">{goal.title}</p>
                          <p className="text-xs text-kalkvit/50">
                            {goal.status === 'completed' ? 'Completed' : `${goal.progress || 0}% progress`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        {goal.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-skogsgron" />
                        ) : (
                          <div className="w-12 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-koppar rounded-full"
                              style={{ width: `${Math.min(goal.progress || 0, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        {!hasStarted && (
          <div className="text-center py-8">
            <GlassButton
              variant="primary"
              className="px-8 py-3"
              onClick={handleStartClick}
            >
              <Play className="w-5 h-5" />
              Start This Protocol
            </GlassButton>
            <p className="text-kalkvit/50 text-sm mt-3">
              Begin your transformation journey with this evidence-based protocol
            </p>
          </div>
        )}

        {/* Plan Builder Modal */}
        {protocol && (
          <PlanBuilder
            isOpen={showPlanBuilder}
            onClose={() => setShowPlanBuilder(false)}
            protocolTitle={protocol.title}
            suggestedGoals={suggestedPlan}
            onConfirm={handleConfirmPlan}
            isSubmitting={isCreatingPlan}
            error={planError}
          />
        )}
      </div>
    </MainLayout>
  )
}

export default ProtocolDetailPage
