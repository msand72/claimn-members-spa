import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge } from '../components/ui'
import { PILLARS } from '../lib/constants'
import type { PillarId } from '../lib/constants'
import {
  useProtocolTemplate,
  useActiveProtocolBySlug,
  useStartProtocol,
  usePauseProtocol,
  useResumeProtocol,
  useUpdateProtocolProgress,
  type ProtocolWeek,
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
} from 'lucide-react'
import { cn } from '../lib/utils'

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
  const isCurrentWeek = week.week === currentWeek
  const isPastWeek = week.week < currentWeek
  const completedCount = week.tasks.filter((t) => completedTasks[t.id]).length
  const status = isPastWeek ? 'completed' : isCurrentWeek ? 'current' : 'upcoming'

  return (
    <GlassCard
      variant={isCurrentWeek ? 'accent' : 'base'}
      className={cn('transition-all', isCurrentWeek && 'ring-1 ring-koppar/30')}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
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
          <p className="text-sm text-kalkvit/60">{week.description}</p>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-koppar">
            {completedCount}/{week.tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
        {week.tasks.map((task) => {
          const isCompleted = completedTasks[task.id] || false
          const isTaskUpdating = isUpdating === task.id

          return (
            <div key={task.id} className="flex items-center gap-3">
              <button
                onClick={() => onToggleTask(task.id, !isCompleted)}
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
  } = useProtocolTemplate(slug || '')

  const {
    data: activeProtocol,
    isLoading: isLoadingActive,
  } = useActiveProtocolBySlug(slug || '')

  const startMutation = useStartProtocol()
  const pauseMutation = usePauseProtocol()
  const resumeMutation = useResumeProtocol()
  const progressMutation = useUpdateProtocolProgress()

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
      await startMutation.mutateAsync({ protocol_slug: slug })
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

  const pillarId = protocol.pillar as PillarId
  const pillar = PILLARS[pillarId]
  const isActive = activeProtocol && activeProtocol.status === 'active'
  const isPaused = activeProtocol && activeProtocol.status === 'paused'
  const hasStarted = !!activeProtocol

  // Get completed tasks from active protocol
  const completedTasks = activeProtocol?.completed_tasks || {}

  // Calculate overall progress
  const totalTasks = protocol.weeks.reduce((sum, week) => sum + week.tasks.length, 0)
  const completedTasksCount = Object.values(completedTasks).filter(Boolean).length
  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0

  const currentWeek = activeProtocol?.current_week || 1

  // Mock benefits since API might not return them
  const benefits = [
    'Evidence-based protocol for optimal results',
    'Structured weekly progression',
    'Track your progress with task completion',
    'Build sustainable habits over time',
  ]

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

        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
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
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">
              {protocol.name}
            </h1>
            <p className="text-kalkvit/60">{protocol.description}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-koppar">{protocol.stat}</p>
            <p className="text-xs text-kalkvit/50">Expected Result</p>
          </div>
        </div>

        {/* Progress Card (if started) */}
        {hasStarted && (
          <GlassCard variant="elevated" className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-kalkvit">Your Progress</h3>
              <div className="flex gap-2">
                {isActive && (
                  <GlassButton
                    variant="ghost"
                    className="p-2"
                    onClick={handlePause}
                    disabled={pauseMutation.isPending}
                  >
                    {pauseMutation.isPending ? (
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
                    onClick={handleResume}
                    disabled={resumeMutation.isPending}
                  >
                    {resumeMutation.isPending ? (
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

            <div className="grid grid-cols-3 gap-4 text-center">
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
                  {Math.max(0, protocol.weeks.length - currentWeek)}
                </p>
                <p className="text-xs text-kalkvit/50">Weeks Left</p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* About */}
        <GlassCard variant="base" className="mb-8">
          <h3 className="font-semibold text-kalkvit mb-4">About This Protocol</h3>
          <p className="text-kalkvit/70 leading-relaxed mb-6">{protocol.description}</p>

          <div className="flex items-center gap-6 text-sm text-kalkvit/50 mb-6">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {protocol.timeline}
            </span>
            <span className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              {protocol.weeks.length} weeks
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {totalTasks} tasks
            </span>
          </div>

          <h4 className="font-medium text-kalkvit mb-3">Key Benefits</h4>
          <ul className="space-y-2">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-kalkvit/70">
                <CheckCircle2 className="w-4 h-4 text-skogsgron flex-shrink-0 mt-0.5" />
                {benefit}
              </li>
            ))}
          </ul>
        </GlassCard>

        {/* Weekly Breakdown */}
        {protocol.weeks.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-kalkvit mb-4">Weekly Breakdown</h3>
            <div className="space-y-4">
              {protocol.weeks.map((week) => (
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
          <div className="text-center">
            <GlassButton
              variant="primary"
              className="px-8"
              onClick={handleStart}
              disabled={startMutation.isPending}
            >
              {startMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start This Protocol
                </>
              )}
            </GlassButton>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
