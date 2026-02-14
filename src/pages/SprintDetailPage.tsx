import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import {
  GlassCard,
  GlassButton,
  GlassBadge,
  GlassAvatar,
} from '../components/ui'
import {
  useSprint,
  useSprintGoals,
  useSprintProgress,
  useCompleteSprintGoal,
  useUpdateSprintProgress,
} from '../lib/api/hooks'
import type { SprintGoal } from '../lib/api/types'
import {
  ArrowLeft,
  Clock,
  Users,
  Calendar,
  Target,
  CheckCircle,
  Circle,
  Zap,
  Loader2,
  AlertTriangle,
  Play,
  StickyNote,
} from 'lucide-react'
import { cn } from '../lib/utils'

const statusConfig = {
  upcoming: { variant: 'koppar' as const, label: 'Upcoming' },
  active: { variant: 'success' as const, label: 'Active' },
  completed: { variant: 'default' as const, label: 'Completed' },
}

function GoalCard({
  goal,
  isCompleted,
  onComplete,
  isCompleting,
  sprintStatus,
}: {
  goal: SprintGoal
  isCompleted: boolean
  onComplete: () => void
  isCompleting: boolean
  sprintStatus: string
}) {
  const canComplete = sprintStatus === 'active' && !isCompleted

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl transition-all',
        isCompleted
          ? 'bg-skogsgron/10 border border-skogsgron/20'
          : 'bg-white/[0.04] border border-white/[0.06]',
        canComplete && 'hover:border-koppar/30 cursor-pointer'
      )}
      onClick={canComplete ? onComplete : undefined}
      role={canComplete ? 'button' : undefined}
      tabIndex={canComplete ? 0 : undefined}
      onKeyDown={
        canComplete
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onComplete()
              }
            }
          : undefined
      }
    >
      <div className="flex-shrink-0 mt-0.5">
        {isCompleting ? (
          <Loader2 className="w-5 h-5 text-koppar animate-spin" />
        ) : isCompleted ? (
          <CheckCircle className="w-5 h-5 text-skogsgron" />
        ) : (
          <Circle
            className={cn(
              'w-5 h-5',
              canComplete ? 'text-kalkvit/40 hover:text-koppar' : 'text-kalkvit/20'
            )}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              'font-medium text-sm',
              isCompleted ? 'text-kalkvit/50 line-through' : 'text-kalkvit'
            )}
          >
            {goal.title}
            {goal.is_required && (
              <span className="ml-1.5 text-xs text-koppar font-normal">Required</span>
            )}
          </h4>
        </div>
        {goal.description && (
          <p className="text-xs text-kalkvit/50 mt-1">{goal.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          {goal.category && (
            <span className="text-xs px-2 py-0.5 rounded-lg bg-white/[0.06] text-kalkvit/50">
              {goal.category}
            </span>
          )}
          {goal.target_metric && (
            <span className="text-xs px-2 py-0.5 rounded-lg bg-white/[0.06] text-kalkvit/50">
              {goal.target_metric}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function SprintDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [completingGoalId, setCompletingGoalId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  const { data: sprint, isLoading, error } = useSprint(id || '')
  const { data: goalsData, isLoading: isLoadingGoals } = useSprintGoals(id || '')
  const { data: progress, isLoading: isLoadingProgress } = useSprintProgress(id || '')

  const completeGoalMutation = useCompleteSprintGoal()
  const updateProgressMutation = useUpdateSprintProgress()

  const goals = Array.isArray(goalsData?.data) ? goalsData.data : []
  const goalsCompleted = progress?.goals_completed ?? 0
  const totalGoals = progress?.total_goals ?? goals.length
  const progressPercentage = progress?.progress_percentage ?? 0
  const sprintStatus = sprint?.status ?? 'upcoming'

  const handleCompleteGoal = async (goalId: string) => {
    if (!id || completingGoalId) return
    setCompletingGoalId(goalId)
    try {
      await completeGoalMutation.mutateAsync({ sprintId: id, goalId })
    } finally {
      setCompletingGoalId(null)
    }
  }

  const handleSaveNotes = async () => {
    if (!id || !notes.trim()) return
    setIsSavingNotes(true)
    try {
      await updateProgressMutation.mutateAsync({
        sprintId: id,
        data: { notes: notes.trim() },
      })
    } finally {
      setIsSavingNotes(false)
    }
  }

  const handleStartSprint = async () => {
    if (!id) return
    await updateProgressMutation.mutateAsync({
      sprintId: id,
      data: { status: 'in_progress' },
    })
  }

  // Set notes from progress data when it loads
  const currentNotes = progress?.notes ?? ''
  if (currentNotes && !notes && !isSavingNotes) {
    setNotes(currentNotes)
  }

  const facilitatorInitials = sprint?.facilitator?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-koppar animate-spin" />
        </div>
      </MainLayout>
    )
  }

  if (error || !sprint) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Link
            to="/programs/sprints"
            className="inline-flex items-center gap-2 text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sprints
          </Link>
          <GlassCard variant="base" className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-tegelrod mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">Sprint not found</h3>
            <p className="text-kalkvit/50 text-sm">
              This sprint may have been removed or the link is incorrect.
            </p>
          </GlassCard>
        </div>
      </MainLayout>
    )
  }

  const status = statusConfig[sprint.status] || statusConfig.upcoming

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          to="/programs/sprints"
          className="inline-flex items-center gap-2 text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sprints
        </Link>

        {/* Sprint Header */}
        <GlassCard variant="elevated" className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <GlassBadge variant={status.variant}>{status.label}</GlassBadge>
            {sprint.facilitator && (
              <div className="flex items-center gap-1.5 ml-auto">
                {sprint.facilitator.avatar_url ? (
                  <img
                    src={sprint.facilitator.avatar_url}
                    alt={sprint.facilitator.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <GlassAvatar initials={facilitatorInitials} size="sm" />
                )}
                <span className="text-sm text-kalkvit/60">{sprint.facilitator.name}</span>
              </div>
            )}
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">
            {sprint.title}
          </h1>
          <p className="text-kalkvit/60 mb-6">{sprint.description}</p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-kalkvit/50 mb-6">
            {sprint.start_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-koppar" />
                {new Date(sprint.start_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {sprint.end_date && (
                  <>
                    {' — '}
                    {new Date(sprint.end_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </>
                )}
              </span>
            )}
            {sprint.duration && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-koppar" />
                {sprint.duration}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-koppar" />
              {sprint.participants}/{sprint.max_participants} participants
            </span>
          </div>

          {/* Progress bar */}
          {!isLoadingProgress && progress && sprintStatus !== 'upcoming' && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-kalkvit/60">
                  {goalsCompleted} of {totalGoals} goals completed
                </span>
                <span className="text-koppar font-semibold">{progressPercentage}%</span>
              </div>
              <div className="h-2 bg-white/[0.1] rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    progressPercentage >= 100
                      ? 'bg-skogsgron'
                      : 'bg-gradient-to-r from-koppar to-brand-amber'
                  )}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Start button for not_started sprints */}
          {progress?.status === 'not_started' && sprintStatus === 'active' && (
            <GlassButton variant="primary" onClick={handleStartSprint}>
              <Play className="w-4 h-4" />
              Start Sprint
            </GlassButton>
          )}
        </GlassCard>

        {/* Goals Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-koppar" />
            <h2 className="font-serif text-xl font-semibold text-kalkvit">
              Sprint Goals
            </h2>
            {!isLoadingGoals && goals.length > 0 && (
              <GlassBadge variant="default">{goals.length}</GlassBadge>
            )}
          </div>

          {isLoadingGoals ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-koppar animate-spin" />
            </div>
          ) : goals.length > 0 ? (
            <div className="space-y-3">
              {goals.map((goal, index) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  isCompleted={index < goalsCompleted}
                  onComplete={() => handleCompleteGoal(goal.id)}
                  isCompleting={completingGoalId === goal.id}
                  sprintStatus={sprintStatus}
                />
              ))}
            </div>
          ) : (
            <GlassCard variant="base" className="text-center py-8">
              <Zap className="w-8 h-8 text-kalkvit/30 mx-auto mb-3" />
              <p className="text-kalkvit/50 text-sm">
                No specific goals defined for this sprint yet.
              </p>
              {sprint.goals && sprint.goals.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {sprint.goals.map((g, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1 rounded-lg bg-white/[0.06] text-kalkvit/60"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </GlassCard>
          )}
        </div>

        {/* Notes Section */}
        {sprintStatus !== 'upcoming' && (
          <GlassCard variant="base">
            <div className="flex items-center gap-2 mb-4">
              <StickyNote className="w-5 h-5 text-koppar" />
              <h2 className="font-serif text-lg font-semibold text-kalkvit">
                Sprint Notes
              </h2>
            </div>
            <textarea
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-sm text-kalkvit placeholder:text-kalkvit/30 focus:outline-none focus:border-koppar/40 resize-none min-h-[120px]"
              placeholder="Write your reflections, learnings, or notes for this sprint..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex justify-end mt-3">
              <GlassButton
                variant="secondary"
                className="text-sm"
                onClick={handleSaveNotes}
                disabled={isSavingNotes || !notes.trim()}
              >
                {isSavingNotes ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Save Notes'
                )}
              </GlassButton>
            </div>
          </GlassCard>
        )}
      </div>
    </MainLayout>
  )
}

export default SprintDetailPage
