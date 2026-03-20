import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassAvatar, GlassBadge, GlassInput, GlassTextarea, GlassModal, GlassModalFooter } from '../components/ui'
import { useCoachingSessions, useRescheduleSession, useSubmitReview } from '../lib/api/hooks'
import { safeOpenUrl } from '../lib/url-validation'
import type { CoachingSession } from '../lib/api/types'
import {
  Calendar,
  Clock,
  Video,
  MessageCircle,
  Star,
  ChevronRight,
  Plus,
  AlertTriangle,
  RefreshCw,
  Target,
  FileText,
  Play,
  TrendingUp,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { EmptySessions } from '../components/ui/EmptyStateIllustration'

// ── Helpers ──────────────────────────────────────────

function formatSessionDate(scheduledAt: string): string {
  const date = new Date(scheduledAt)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  if (date.toDateString() === now.toDateString()) return 'Today'
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function formatSessionTime(scheduledAt: string): string {
  return new Date(scheduledAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

type UIStatus = 'upcoming' | 'reschedule_pending' | 'completed' | 'cancelled'

function getUIStatus(status: CoachingSession['status']): UIStatus {
  switch (status) {
    case 'scheduled':
    case 'confirmed':
    case 'in_progress':
      return 'upcoming'
    case 'reschedule_requested':
      return 'reschedule_pending'
    case 'completed':
      return 'completed'
    case 'cancelled':
    case 'cancelled_by_member':
      return 'cancelled'
    default:
      return 'upcoming'
  }
}

// ── Skeleton ─────────────────────────────────────────

function SessionCardSkeleton() {
  return (
    <GlassCard variant="base" className="mb-4">
      <div className="flex items-start gap-4 animate-pulse">
        <div className="w-12 h-12 rounded-xl bg-white/[0.1] shrink-0" />
        <div className="flex-1">
          <div className="h-5 w-32 bg-white/[0.1] rounded mb-2" />
          <div className="h-4 w-24 bg-white/[0.1] rounded mb-3" />
          <div className="flex items-center gap-4">
            <div className="h-4 w-20 bg-white/[0.1] rounded" />
            <div className="h-4 w-24 bg-white/[0.1] rounded" />
          </div>
        </div>
        <div className="h-6 w-20 bg-white/[0.1] rounded" />
      </div>
    </GlassCard>
  )
}

// ── SessionCard ──────────────────────────────────────

function SessionCard({
  session,
  onReschedule,
  onReview,
}: {
  session: CoachingSession
  onReschedule?: (sessionId: string) => void
  onReview?: (sessionId: string) => void
}) {
  const uiStatus = getUIStatus(session.status)

  const statusConfig = {
    upcoming: { variant: 'success' as const, label: 'Upcoming' },
    reschedule_pending: { variant: 'warning' as const, label: 'Reschedule Pending' },
    completed: { variant: 'default' as const, label: 'Completed' },
    cancelled: { variant: 'warning' as const, label: 'Cancelled' },
  }
  const status = statusConfig[uiStatus]

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
      <div className="flex items-start gap-4">
        {expert?.avatar_url ? (
          <img
            src={expert.avatar_url}
            alt={expertName}
            className="w-12 h-12 rounded-xl object-cover shrink-0"
          />
        ) : (
          <GlassAvatar initials={expertInitials} size="lg" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="min-w-0">
              <h3 className="font-semibold text-kalkvit truncate">
                {session.title || expertName}
              </h3>
              <p className="text-sm text-koppar">{session.title ? expertName : expertTitle}</p>
            </div>
            <GlassBadge variant={status.variant} className="shrink-0 ml-2">
              {status.label}
            </GlassBadge>
          </div>

          {/* Date / time / type */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-kalkvit/60">
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

          {/* Goals */}
          {session.goals && session.goals.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-kalkvit/50 mb-1 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Session Goals
              </p>
              <div className="flex flex-wrap gap-1.5">
                {session.goals.map((goal, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-lg bg-white/[0.06] text-kalkvit/70"
                  >
                    {goal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reschedule info */}
          {uiStatus === 'reschedule_pending' && session.reschedule_proposed_at && (
            <div className="mt-3 text-sm bg-brand-amber/10 border border-brand-amber/20 rounded-lg p-3">
              <p className="text-kalkvit/80">
                <span className="font-medium">Proposed time:</span>{' '}
                {new Date(session.reschedule_proposed_at).toLocaleString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                  hour: 'numeric', minute: '2-digit', hour12: true,
                })}
              </p>
              {session.reschedule_reason && (
                <p className="text-kalkvit/60 mt-1">Reason: {session.reschedule_reason}</p>
              )}
              <p className="text-kalkvit/50 mt-1 text-xs">Waiting for your coach to confirm</p>
            </div>
          )}

          {/* Progress bar for completed */}
          {uiStatus === 'completed' && session.progress > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-kalkvit/50">Goals Achieved</span>
                <span className="text-skogsgron">{session.progress}%</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-skogsgron rounded-full transition-all"
                  style={{ width: `${session.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Notes indicator */}
          {session.has_notes && uiStatus === 'completed' && (
            <p className="mt-2 text-xs text-kalkvit/50 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Session notes available
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/10">
            {(uiStatus === 'upcoming' || uiStatus === 'reschedule_pending') && (
              <>
                {session.meeting_url ? (
                  <GlassButton variant="primary" className="text-sm" onClick={() => safeOpenUrl(session.meeting_url!)}>
                    <Video className="w-4 h-4" />
                    Join Call
                    <ChevronRight className="w-4 h-4" />
                  </GlassButton>
                ) : (
                  <span className="text-xs text-kalkvit/40 flex items-center gap-1">
                    <Video className="w-3.5 h-3.5" />
                    Meeting link will be shared before the session
                  </span>
                )}
                <GlassButton
                  variant="ghost"
                  className="text-sm"
                  onClick={() => onReschedule?.(session.id)}
                  disabled={uiStatus === 'reschedule_pending'}
                >
                  <RefreshCw className={cn('w-4 h-4', uiStatus === 'reschedule_pending' && 'opacity-40')} />
                  Reschedule
                </GlassButton>
                <Link to={`/messages?user=${expert?.id || ''}`}>
                  <GlassButton variant="ghost" className="text-sm">
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </GlassButton>
                </Link>
              </>
            )}
            {uiStatus === 'completed' && (
              <>
                <GlassButton variant="secondary" className="text-sm" onClick={() => onReview?.(session.id)}>
                  <Star className="w-4 h-4" />
                  Rate Session
                </GlassButton>
                {session.has_notes && (
                  <Link to={`/coaching/session-notes?id=${session.id}`}>
                    <GlassButton variant="ghost" className="text-sm">
                      <FileText className="w-4 h-4" />
                      View Notes
                    </GlassButton>
                  </Link>
                )}
                {session.has_recording && session.recording_url && (
                  <GlassButton variant="ghost" className="text-sm" onClick={() => safeOpenUrl(session.recording_url!)}>
                    <Play className="w-4 h-4" />
                    Recording
                  </GlassButton>
                )}
                <Link to="/coaching/resources" className="ml-auto">
                  <GlassButton variant="ghost" className="text-sm text-koppar">
                    <TrendingUp className="w-4 h-4" />
                    Resources
                  </GlassButton>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

// ── CoachingSessionsPage ─────────────────────────────

export function CoachingSessionsPage() {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all')
  const [rescheduleSessionId, setRescheduleSessionId] = useState<string | null>(null)
  const [proposedDatetime, setProposedDatetime] = useState('')
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false)
  const rescheduleSession = useRescheduleSession()

  const [reviewSessionId, setReviewSessionId] = useState<string | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const submitReview = useSubmitReview()

  const { data: sessionsData, isLoading, error } = useCoachingSessions(
    filter === 'all'
      ? undefined
      : filter === 'upcoming'
        ? { status: 'scheduled' }
        : { status: 'completed' }
  )

  const sessions = Array.isArray(sessionsData?.data) ? sessionsData.data : []

  const filteredSessions = useMemo(() => {
    if (filter === 'all') return sessions
    if (filter === 'upcoming') return sessions.filter((s) => {
      const ui = getUIStatus(s.status)
      return ui === 'upcoming' || ui === 'reschedule_pending'
    })
    return sessions.filter((s) => {
      const ui = getUIStatus(s.status)
      return ui === 'completed' || ui === 'cancelled'
    })
  }, [sessions, filter])

  // Stats
  const upcomingCount = useMemo(
    () => sessions.filter((s) => { const ui = getUIStatus(s.status); return ui === 'upcoming' || ui === 'reschedule_pending' }).length,
    [sessions]
  )
  const completedCount = useMemo(
    () => sessions.filter((s) => getUIStatus(s.status) === 'completed').length,
    [sessions]
  )
  const totalHours = useMemo(
    () => sessions.filter((s) => getUIStatus(s.status) === 'completed').reduce((acc, s) => acc + s.duration, 0) / 60,
    [sessions]
  )
  const avgRating = useMemo(() => {
    const rated = sessions.filter((s) => getUIStatus(s.status) === 'completed' && s.progress > 0)
    if (rated.length === 0) return null
    return (rated.reduce((acc, s) => acc + s.progress / 20, 0) / rated.length).toFixed(1)
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
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">
              My Sessions
            </h1>
            <p className="text-kalkvit/60">Manage your coaching sessions and track progress</p>
          </div>
          <Link to="/book-session">
            <GlassButton variant="primary">
              <Plus className="w-4 h-4" />
              Book New Session
            </GlassButton>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <GlassCard variant="base" className="text-center">
            <p className="text-2xl sm:text-3xl font-display font-bold text-kalkvit">
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
          <GlassCard variant="base" className="text-center">
            <p className="text-2xl sm:text-3xl font-display font-bold text-koppar">
              {isLoading ? '-' : `${totalHours.toFixed(1)}h`}
            </p>
            <p className="text-sm text-kalkvit/60">Total Hours</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center">
            <p className="text-2xl sm:text-3xl font-display font-bold text-koppar">
              {isLoading ? '-' : avgRating || '-'}
            </p>
            <p className="text-sm text-kalkvit/60">Avg Rating</p>
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
          filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onReschedule={setRescheduleSessionId}
              onReview={setReviewSessionId}
            />
          ))
        ) : (
          <GlassCard variant="base" className="text-center py-12">
            <EmptySessions className="w-[140px] h-[140px] mx-auto mb-4 text-kalkvit" />
            <p className="text-kalkvit/60">No sessions found.</p>
            <Link to="/book-session">
              <GlassButton variant="primary" className="mt-4">
                Book Your First Session
              </GlassButton>
            </Link>
          </GlassCard>
        )}
      </div>

      {/* Reschedule Modal */}
      <GlassModal
        isOpen={!!rescheduleSessionId}
        onClose={() => {
          setRescheduleSessionId(null)
          setProposedDatetime('')
          setRescheduleReason('')
        }}
        title="Reschedule Session"
        size="sm"
      >
        {rescheduleSuccess ? (
          <div className="text-center py-4">
            <RefreshCw className="w-8 h-8 text-skogsgron mx-auto mb-3" />
            <p className="text-kalkvit font-medium mb-1">Reschedule Requested</p>
            <p className="text-sm text-kalkvit/60">Your coach will confirm the new time.</p>
            <GlassButton
              variant="primary"
              className="mt-4"
              onClick={() => {
                setRescheduleSessionId(null)
                setProposedDatetime('')
                setRescheduleReason('')
                setRescheduleSuccess(false)
              }}
            >
              Done
            </GlassButton>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <GlassInput
                label="Proposed Date & Time"
                type="datetime-local"
                value={proposedDatetime}
                onChange={(e) => setProposedDatetime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
              <GlassTextarea
                label="Reason (optional)"
                placeholder="Why do you need to reschedule?"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                rows={2}
              />
            </div>
            <GlassModalFooter>
              <GlassButton
                variant="ghost"
                onClick={() => {
                  setRescheduleSessionId(null)
                  setProposedDatetime('')
                  setRescheduleReason('')
                }}
                disabled={rescheduleSession.isPending}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                disabled={!proposedDatetime || rescheduleSession.isPending}
                onClick={() => {
                  if (!rescheduleSessionId || !proposedDatetime) return
                  rescheduleSession.mutate(
                    {
                      sessionId: rescheduleSessionId,
                      data: {
                        proposed_datetime: new Date(proposedDatetime).toISOString(),
                        reason: rescheduleReason.trim() || undefined,
                      },
                    },
                    {
                      onSuccess: () => setRescheduleSuccess(true),
                    }
                  )
                }}
              >
                {rescheduleSession.isPending ? 'Requesting...' : 'Request Reschedule'}
              </GlassButton>
            </GlassModalFooter>
            {rescheduleSession.isError && (
              <p className="text-xs text-tegelrod mt-3 text-center">
                {(rescheduleSession.error as any)?.error?.message || 'Failed to request reschedule. Please try again.'}
              </p>
            )}
          </>
        )}
      </GlassModal>

      {/* Review Modal */}
      <GlassModal
        isOpen={!!reviewSessionId}
        onClose={() => {
          setReviewSessionId(null)
          setReviewRating(0)
          setReviewComment('')
          setReviewSuccess(false)
        }}
        title="Rate Your Session"
        size="sm"
      >
        {reviewSuccess ? (
          <div className="text-center py-4">
            <Star className="w-8 h-8 text-brand-amber fill-brand-amber mx-auto mb-3" />
            <p className="text-kalkvit font-medium mb-1">Thank You!</p>
            <p className="text-sm text-kalkvit/60">Your review helps improve the coaching experience.</p>
            <GlassButton
              variant="primary"
              className="mt-4"
              onClick={() => {
                setReviewSessionId(null)
                setReviewRating(0)
                setReviewComment('')
                setReviewSuccess(false)
              }}
            >
              Done
            </GlassButton>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-kalkvit/70 mb-2">How was your session?</p>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          'w-8 h-8 transition-colors',
                          star <= reviewRating
                            ? 'text-brand-amber fill-brand-amber'
                            : 'text-kalkvit/20 hover:text-kalkvit/40'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <GlassTextarea
                label="Comments (optional)"
                placeholder="Share your experience..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
              />
            </div>
            {submitReview.isError && (
              <p className="text-xs text-tegelrod mt-3 text-center">
                {(submitReview.error as any)?.error?.message || 'Failed to submit review. Please try again.'}
              </p>
            )}
            <GlassModalFooter>
              <GlassButton
                variant="ghost"
                onClick={() => {
                  setReviewSessionId(null)
                  setReviewRating(0)
                  setReviewComment('')
                }}
                disabled={submitReview.isPending}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                disabled={reviewRating === 0 || submitReview.isPending}
                onClick={() => {
                  if (!reviewSessionId || reviewRating === 0) return
                  submitReview.mutate(
                    {
                      sessionId: reviewSessionId,
                      data: {
                        rating: reviewRating,
                        comment: reviewComment.trim() || undefined,
                      },
                    },
                    {
                      onSuccess: () => setReviewSuccess(true),
                    }
                  )
                }}
              >
                {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
              </GlassButton>
            </GlassModalFooter>
          </>
        )}
      </GlassModal>
    </MainLayout>
  )
}

export default CoachingSessionsPage
