import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassAvatar, GlassBadge } from '../components/ui'
import { useCoachingSessions } from '../lib/api/hooks'
import type { CoachingSession } from '../lib/api/types'
import {
  Calendar,
  Clock,
  Target,
  TrendingUp,
  FileText,
  ChevronRight,
  Play,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '../lib/utils'

function SessionCard({ session }: { session: CoachingSession }) {
  const statusConfig = {
    scheduled: { variant: 'koppar' as const, label: 'Scheduled', icon: Calendar },
    in_progress: { variant: 'warning' as const, label: 'In Progress', icon: Play },
    completed: { variant: 'success' as const, label: 'Completed', icon: CheckCircle },
    cancelled: { variant: 'error' as const, label: 'Cancelled', icon: AlertTriangle },
  }

  const status = statusConfig[session.status]
  const StatusIcon = status.icon

  const coachInitials = session.expert
    ? session.expert.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'CO'

  const formattedDate = new Date(session.scheduled_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <GlassCard variant="base" className="mb-4">
      <div className="flex items-start gap-4">
        <GlassAvatar initials={coachInitials} size="lg" />
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-kalkvit">{session.title}</h3>
              <p className="text-sm text-koppar">{session.expert?.name || 'Coach'}</p>
            </div>
            <GlassBadge variant={status.variant} className="flex items-center gap-1">
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </GlassBadge>
          </div>

          <div className="flex items-center gap-4 text-sm text-kalkvit/60 mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {session.duration} min
            </span>
          </div>

          {/* Goals */}
          {session.goals && session.goals.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-kalkvit/50 mb-2 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Session Goals
              </p>
              <div className="flex flex-wrap gap-2">
                {session.goals.map((goal, i) => (
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

          {/* Progress bar for completed sessions */}
          {session.status === 'completed' && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-kalkvit/50">Goals Achieved</span>
                <span className="text-skogsgron">{session.progress}%</span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-skogsgron rounded-full transition-all"
                  style={{ width: `${session.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-3 border-t border-white/10">
            {session.status === 'scheduled' && session.meeting_url && (
              <GlassButton variant="primary" className="text-sm" onClick={() => window.open(session.meeting_url!, '_blank')}>
                Join Session
                <ChevronRight className="w-4 h-4" />
              </GlassButton>
            )}
            {session.has_notes && (
              <Link to={`/coaching/session-notes?id=${session.id}`}>
                <GlassButton variant="secondary" className="text-sm">
                  <FileText className="w-4 h-4" />
                  View Notes
                </GlassButton>
              </Link>
            )}
            {session.has_recording && session.recording_url && (
              <GlassButton variant="ghost" className="text-sm" onClick={() => window.open(session.recording_url!, '_blank')}>
                <Play className="w-4 h-4" />
                Recording
              </GlassButton>
            )}
            {session.status === 'completed' && (
              <Link to="/coaching/resources" className="ml-auto">
                <GlassButton variant="ghost" className="text-sm text-koppar">
                  <TrendingUp className="w-4 h-4" />
                  Resources
                </GlassButton>
              </Link>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

export function CoachingSessionsPage() {
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed'>('all')

  const {
    data: sessionsData,
    isLoading,
    error,
  } = useCoachingSessions({
    status: filter !== 'all' ? filter : undefined,
  })

  const sessions = Array.isArray(sessionsData?.data) ? sessionsData.data : []

  const scheduledCount = sessions.filter((s) => s.status === 'scheduled').length
  const completedCount = sessions.filter((s) => s.status === 'completed').length
  const totalHours =
    sessions.filter((s) => s.status === 'completed').reduce((acc, s) => acc + s.duration, 0) / 60
  const avgProgress =
    completedCount > 0
      ? Math.round(
          sessions.filter((s) => s.status === 'completed').reduce((acc, s) => acc + s.progress, 0) /
            completedCount
        )
      : 0

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <GlassCard variant="base" className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-tegelrod mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">Failed to load sessions</h3>
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
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">
              Coaching Sessions
            </h1>
            <p className="text-kalkvit/60">Track your coaching journey and progress</p>
          </div>
          <Link to="/book-session">
            <GlassButton variant="primary">Book Session</GlassButton>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <GlassCard variant="base" className="text-center">
            <p className="text-2xl sm:text-3xl font-display font-bold text-kalkvit">
              {isLoading ? '-' : scheduledCount}
            </p>
            <p className="text-sm text-kalkvit/60">Scheduled</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center">
            <p className="text-2xl sm:text-3xl font-display font-bold text-kalkvit">
              {isLoading ? '-' : completedCount}
            </p>
            <p className="text-sm text-kalkvit/60">Completed</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center">
            <p className="text-2xl sm:text-3xl font-display font-bold text-koppar">
              {isLoading ? '-' : `${totalHours.toFixed(1)}h`}
            </p>
            <p className="text-sm text-kalkvit/60">Total Hours</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center">
            <p className="text-2xl sm:text-3xl font-display font-bold text-skogsgron">
              {isLoading ? '-' : `${avgProgress}%`}
            </p>
            <p className="text-sm text-kalkvit/60">Goals Achieved</p>
          </GlassCard>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'scheduled', 'completed'] as const).map((f) => (
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

        {/* Sessions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-koppar animate-spin" />
          </div>
        ) : sessions.length > 0 ? (
          sessions.map((session) => <SessionCard key={session.id} session={session} />)
        ) : (
          <GlassCard variant="base" className="text-center py-12">
            <p className="text-kalkvit/60">No sessions found.</p>
          </GlassCard>
        )}
      </div>
    </MainLayout>
  )
}

export default CoachingSessionsPage;
