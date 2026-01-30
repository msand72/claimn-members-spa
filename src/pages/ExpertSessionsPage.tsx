import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassAvatar, GlassBadge } from '../components/ui'
import { useCoachingSessions } from '../lib/api/hooks'
import type { CoachingSession } from '../lib/api/types'
import { Calendar, Clock, Video, MessageCircle, Star, ChevronRight, Plus, AlertTriangle } from 'lucide-react'
import { cn } from '../lib/utils'

function formatSessionDate(scheduledAt: string): string {
  const date = new Date(scheduledAt)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  // Check if today
  if (date.toDateString() === now.toDateString()) {
    return 'Today'
  }

  // Check if tomorrow
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow'
  }

  // Otherwise format the date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function formatSessionTime(scheduledAt: string): string {
  const date = new Date(scheduledAt)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function SessionCardSkeleton() {
  return (
    <GlassCard variant="base" className="mb-4">
      <div className="flex items-start justify-between animate-pulse">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/[0.1]" />
          <div>
            <div className="h-5 w-32 bg-white/[0.1] rounded mb-2" />
            <div className="h-4 w-24 bg-white/[0.1] rounded mb-3" />
            <div className="flex items-center gap-4">
              <div className="h-4 w-20 bg-white/[0.1] rounded" />
              <div className="h-4 w-24 bg-white/[0.1] rounded" />
            </div>
          </div>
        </div>
        <div className="h-6 w-20 bg-white/[0.1] rounded" />
      </div>
    </GlassCard>
  )
}

function SessionCard({ session }: { session: CoachingSession }) {
  // Map API status to UI status
  const getUIStatus = (status: CoachingSession['status']): 'upcoming' | 'completed' | 'cancelled' => {
    switch (status) {
      case 'scheduled':
      case 'in_progress':
        return 'upcoming'
      case 'completed':
        return 'completed'
      case 'cancelled':
        return 'cancelled'
      default:
        return 'upcoming'
    }
  }

  const uiStatus = getUIStatus(session.status)

  const statusConfig = {
    upcoming: { variant: 'success' as const, label: 'Upcoming' },
    completed: { variant: 'default' as const, label: 'Completed' },
    cancelled: { variant: 'warning' as const, label: 'Cancelled' },
  }

  const status = statusConfig[uiStatus]

  // Get expert info from session
  const expert = session.expert
  const expertName = expert?.name || 'Expert'
  const expertTitle = expert?.title || 'Coach'
  const expertInitials = expertName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <GlassCard variant="base" className="mb-4">
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          {expert?.avatar_url ? (
            <img
              src={expert.avatar_url}
              alt={expertName}
              className="w-12 h-12 rounded-xl object-cover"
            />
          ) : (
            <GlassAvatar initials={expertInitials} size="lg" />
          )}
          <div>
            <h3 className="font-semibold text-kalkvit">{expertName}</h3>
            <p className="text-sm text-koppar">{expertTitle}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-kalkvit/60">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatSessionDate(session.scheduled_at)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatSessionTime(session.scheduled_at)} ({session.duration} min)
              </span>
              <span className="flex items-center gap-1">
                <Video className="w-4 h-4" />
                Video Call
              </span>
            </div>
            {session.has_notes && uiStatus === 'completed' && (
              <p className="mt-3 text-sm text-kalkvit/70 bg-white/[0.03] rounded-lg p-3">
                Session notes available
              </p>
            )}
            {uiStatus === 'completed' && session.progress > 0 && (
              <div className="flex items-center gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'w-4 h-4',
                      i < Math.round(session.progress / 20)
                        ? 'text-brand-amber fill-brand-amber'
                        : 'text-kalkvit/20'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <GlassBadge variant={status.variant}>{status.label}</GlassBadge>
          {uiStatus === 'upcoming' && (
            <div className="flex gap-2 mt-2">
              <GlassButton variant="ghost" className="p-2">
                <MessageCircle className="w-4 h-4" />
              </GlassButton>
              {session.meeting_url && (
                <GlassButton variant="primary" className="text-sm" onClick={() => window.open(session.meeting_url!, '_blank')}>
                  Join Call
                  <ChevronRight className="w-4 h-4" />
                </GlassButton>
              )}
            </div>
          )}
          {uiStatus === 'completed' && !session.has_notes && (
            <Link to="/coaching/session-notes">
              <GlassButton variant="secondary" className="text-sm mt-2">
                Leave Review
              </GlassButton>
            </Link>
          )}
        </div>
      </div>
    </GlassCard>
  )
}

export function ExpertSessionsPage() {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all')

  // Fetch sessions based on filter
  const { data: sessionsData, isLoading, error } = useCoachingSessions(
    filter === 'all'
      ? undefined
      : filter === 'upcoming'
        ? { status: 'scheduled' }
        : { status: 'completed' }
  )

  const sessions = Array.isArray(sessionsData?.data) ? sessionsData.data : []

  // Map API status to UI filter status
  const getUIStatus = (status: CoachingSession['status']): 'upcoming' | 'completed' | 'cancelled' => {
    switch (status) {
      case 'scheduled':
      case 'in_progress':
        return 'upcoming'
      case 'completed':
        return 'completed'
      case 'cancelled':
        return 'cancelled'
      default:
        return 'upcoming'
    }
  }

  // Filter sessions based on selected filter
  const filteredSessions = useMemo(() => {
    if (filter === 'all') return sessions
    if (filter === 'upcoming') return sessions.filter((s) => getUIStatus(s.status) === 'upcoming')
    if (filter === 'completed')
      return sessions.filter(
        (s) => getUIStatus(s.status) === 'completed' || getUIStatus(s.status) === 'cancelled'
      )
    return sessions
  }, [sessions, filter])

  // Calculate stats from real data
  const upcomingCount = useMemo(
    () => sessions.filter((s) => getUIStatus(s.status) === 'upcoming').length,
    [sessions]
  )

  const completedCount = useMemo(
    () => sessions.filter((s) => getUIStatus(s.status) === 'completed').length,
    [sessions]
  )

  // Calculate average rating from completed sessions with progress
  const avgRating = useMemo(() => {
    const completedWithProgress = sessions.filter(
      (s) => getUIStatus(s.status) === 'completed' && s.progress > 0
    )
    if (completedWithProgress.length === 0) return null
    const total = completedWithProgress.reduce((acc, s) => acc + s.progress / 20, 0)
    return (total / completedWithProgress.length).toFixed(1)
  }, [sessions])

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
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">My Sessions</h1>
            <p className="text-kalkvit/60">Manage your coaching sessions with experts</p>
          </div>
          <Link to="/book-session">
            <GlassButton variant="primary">
              <Plus className="w-4 h-4" />
              Book New Session
            </GlassButton>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <GlassCard variant="base" className="text-center">
            <p className="text-3xl font-display font-bold text-kalkvit">
              {isLoading ? '-' : upcomingCount}
            </p>
            <p className="text-sm text-kalkvit/60">Upcoming</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center">
            <p className="text-3xl font-display font-bold text-kalkvit">
              {isLoading ? '-' : completedCount}
            </p>
            <p className="text-sm text-kalkvit/60">Completed</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center">
            <p className="text-3xl font-display font-bold text-koppar">
              {isLoading ? '-' : avgRating || '-'}
            </p>
            <p className="text-sm text-kalkvit/60">Avg Rating Given</p>
          </GlassCard>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'upcoming', 'completed'] as const).map((f) => (
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
          <>
            <SessionCardSkeleton />
            <SessionCardSkeleton />
            <SessionCardSkeleton />
          </>
        ) : filteredSessions.length > 0 ? (
          filteredSessions.map((session) => <SessionCard key={session.id} session={session} />)
        ) : (
          <GlassCard variant="base" className="text-center py-12">
            <p className="text-kalkvit/60">No sessions found.</p>
            <Link to="/book-session">
              <GlassButton variant="primary" className="mt-4">
                Book Your First Session
              </GlassButton>
            </Link>
          </GlassCard>
        )}
      </div>
    </MainLayout>
  )
}

export default ExpertSessionsPage;
