import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassAvatar, GlassBadge } from '../components/ui'
import { useSprints, useJoinSprint } from '../lib/api/hooks'
import type { Sprint } from '../lib/api/types'
import {
  Calendar,
  Clock,
  Users,
  Target,
  CheckCircle,
  ArrowLeft,
  ChevronRight,
  Zap,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '../lib/utils'

function SprintCard({
  sprint,
  onJoin,
  isJoining,
  onViewProgress,
  onViewResults,
}: {
  sprint: Sprint
  onJoin: (sprintId: string) => void
  isJoining: boolean
  onViewProgress: (sprintId: string) => void
  onViewResults: (sprintId: string) => void
}) {
  const statusConfig = {
    upcoming: { variant: 'koppar' as const, label: 'Upcoming', color: 'text-koppar' },
    active: { variant: 'success' as const, label: 'Active', color: 'text-skogsgron' },
    completed: { variant: 'default' as const, label: 'Completed', color: 'text-kalkvit/50' },
  }

  const status = statusConfig[sprint.status]
  const spotsLeft = sprint.max_participants - sprint.participants

  const facilitatorInitials = sprint.facilitator?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <GlassCard variant="base" className="group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-koppar/20">
            <Zap className="w-5 h-5 text-koppar" />
          </div>
          <div>
            <h3 className="font-semibold text-kalkvit group-hover:text-koppar transition-colors">
              {sprint.title}
            </h3>
            <p className="text-xs text-kalkvit/50">Program Sprint</p>
          </div>
        </div>
        <GlassBadge variant={status.variant}>{status.label}</GlassBadge>
      </div>

      <p className="text-sm text-kalkvit/60 mb-4">{sprint.description}</p>

      {/* Dates and duration */}
      <div className="flex items-center gap-4 text-sm text-kalkvit/50 mb-4">
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {new Date(sprint.start_date).toLocaleDateString()}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {sprint.duration}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {sprint.participants}/{sprint.max_participants}
        </span>
      </div>

      {/* Goals */}
      {sprint.goals && sprint.goals.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-kalkvit/40 mb-2 flex items-center gap-1">
            <Target className="w-3 h-3" />
            Sprint Goals
          </p>
          <div className="flex flex-wrap gap-2">
            {sprint.goals.map((goal, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded-lg bg-white/[0.06] text-kalkvit/70"
              >
                {goal}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Progress for active sprints */}
      {sprint.status === 'active' && sprint.progress !== undefined && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-kalkvit/50">Progress</span>
            <span className="text-skogsgron">{sprint.progress}%</span>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-skogsgron rounded-full transition-all"
              style={{ width: `${sprint.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Facilitator and CTA */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        {sprint.facilitator ? (
          <div className="flex items-center gap-2">
            {sprint.facilitator.avatar_url ? (
              <img
                src={sprint.facilitator.avatar_url}
                alt={sprint.facilitator.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <GlassAvatar initials={facilitatorInitials} size="sm" />
            )}
            <span className="text-sm text-kalkvit/60">{sprint.facilitator.name}</span>
          </div>
        ) : (
          <div />
        )}
        {sprint.status === 'upcoming' && (
          <GlassButton
            variant="primary"
            className="text-sm"
            onClick={() => onJoin(sprint.id)}
            disabled={isJoining || spotsLeft <= 0}
          >
            {isJoining ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Join Sprint
                {spotsLeft <= 5 && spotsLeft > 0 && (
                  <span className="text-xs ml-1">({spotsLeft} spots left)</span>
                )}
              </>
            )}
          </GlassButton>
        )}
        {sprint.status === 'active' && (
          <GlassButton
            variant="secondary"
            className="text-sm"
            onClick={() => onViewProgress(sprint.id)}
          >
            View Progress
            <ChevronRight className="w-4 h-4" />
          </GlassButton>
        )}
        {sprint.status === 'completed' && (
          <GlassButton
            variant="ghost"
            className="text-sm"
            onClick={() => onViewResults(sprint.id)}
          >
            <CheckCircle className="w-4 h-4 text-skogsgron" />
            View Results
          </GlassButton>
        )}
      </div>
    </GlassCard>
  )
}

export function ProgramsSprintsPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'completed'>('all')
  const [joiningSprintId, setJoiningSprintId] = useState<string | null>(null)

  const {
    data: sprintsData,
    isLoading,
    error,
  } = useSprints(undefined, {
    status: filter !== 'all' ? filter : undefined,
  })

  const joinMutation = useJoinSprint()

  const sprints = Array.isArray(sprintsData?.data) ? sprintsData.data : []

  const handleJoin = async (sprintId: string) => {
    setJoiningSprintId(sprintId)
    try {
      await joinMutation.mutateAsync({ sprint_id: sprintId })
    } finally {
      setJoiningSprintId(null)
    }
  }

  const handleViewProgress = (sprintId: string) => {
    navigate(`/programs/sprints/${sprintId}`)
  }

  const handleViewResults = (sprintId: string) => {
    navigate(`/programs/sprints/${sprintId}`)
  }

  const activeCount = sprints.filter((s) => s.status === 'active').length
  const upcomingCount = sprints.filter((s) => s.status === 'upcoming').length
  const completedCount = sprints.filter((s) => s.status === 'completed').length

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto">
          <GlassCard variant="base" className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-tegelrod mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">Failed to load sprints</h3>
            <p className="text-kalkvit/50 text-sm">
              Please try refreshing the page or check your connection.
            </p>
          </GlassCard>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <Link
          to="/programs"
          className="inline-flex items-center gap-2 text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Programs
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">Sprints</h1>
            <p className="text-kalkvit/60">
              Intensive group challenges to accelerate your growth
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <GlassCard variant="base" className="text-center">
            <p className="text-2xl sm:text-3xl font-display font-bold text-skogsgron">
              {isLoading ? '-' : activeCount}
            </p>
            <p className="text-sm text-kalkvit/60">Active Sprints</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center">
            <p className="text-2xl sm:text-3xl font-display font-bold text-koppar">
              {isLoading ? '-' : upcomingCount}
            </p>
            <p className="text-sm text-kalkvit/60">Upcoming</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center">
            <p className="text-2xl sm:text-3xl font-display font-bold text-kalkvit">
              {isLoading ? '-' : completedCount}
            </p>
            <p className="text-sm text-kalkvit/60">Completed</p>
          </GlassCard>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'active', 'upcoming', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize',
                filter === f
                  ? 'bg-koppar text-kalkvit'
                  : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1] hover:text-kalkvit'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sprints Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-koppar animate-spin" />
          </div>
        ) : sprints.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sprints.map((sprint) => (
              <SprintCard
                key={sprint.id}
                sprint={sprint}
                onJoin={handleJoin}
                isJoining={joiningSprintId === sprint.id}
                onViewProgress={handleViewProgress}
                onViewResults={handleViewResults}
              />
            ))}
          </div>
        ) : (
          <GlassCard variant="base" className="text-center py-12">
            <p className="text-kalkvit/60">No sprints found.</p>
          </GlassCard>
        )}
      </div>
    </MainLayout>
  )
}

export default ProgramsSprintsPage;
