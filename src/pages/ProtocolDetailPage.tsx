import { useState } from 'react'
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
  type ProtocolWeek,
  type ProtocolSection,
  type ImplementationStep,
  type ImplementationGuide,
  type ProtocolStat,
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

function ScientificFoundation({ content }: { content: string }) {
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
  // Note: useLogProtocolProgress is available for weekly progress logging
  // but currently task-level progress uses useUpdateProtocolProgress

  const isLoading = isLoadingProtocol || isLoadingActive
  const error = protocolError

  // Track which task is being updated
  const updatingTaskId = progressMutation.isPending
    ? (progressMutation.variables?.data.task_id ?? null)
    : null

  const handleStart = async () => {
    if (!slug) return
    setActionError(null)
    try {
      await startMutation.mutateAsync({
        protocol_slug: slug,
        protocol_name: protocol?.title || slug,
        pillar: protocol?.pillar,
        duration_weeks: protocol?.duration_weeks,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
      setActionError(`Failed to start protocol: ${msg}`)
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

        {/* Progress Card (if started) */}
        {hasStarted && activeProtocol && (
          <ProgressTracker
            activeProtocol={activeProtocol}
            totalTasks={totalTasks}
            completedTasksCount={completedTasksCount}
            totalWeeks={weeks.length}
            onPause={handlePause}
            onResume={handleResume}
            isPausing={pauseMutation.isPending}
            isResuming={resumeMutation.isPending}
          />
        )}

        {/* Scientific Foundation */}
        <ScientificFoundation content={protocol.scientific_foundation || ''} />

        {/* Protocol Sections */}
        <ProtocolSections sections={sections} />

        {/* Implementation Timeline */}
        <ImplementationTimeline steps={implementationTimeline} />

        {/* Implementation Guides */}
        <ImplementationGuides guides={implementationGuides} />

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

        {/* Action Button */}
        {!hasStarted && (
          <div className="text-center py-8">
            <GlassButton
              variant="primary"
              className="px-8 py-3"
              onClick={handleStart}
              disabled={startMutation.isPending}
            >
              {startMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start This Protocol
                </>
              )}
            </GlassButton>
            <p className="text-kalkvit/50 text-sm mt-3">
              Begin your transformation journey with this evidence-based protocol
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default ProtocolDetailPage
