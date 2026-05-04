import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GlassCard, GlassButton, GlassBadge, GlassAvatar } from '../../components/ui'
import {
  CalendarIcon,
  ArrowPathIcon,
  ClockIcon,
  UserGroupIcon,
  UserPlusIcon,
  UserMinusIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline'
import { cn } from '../../lib/utils'
import type { ClaimnEvent, CoachingSession, Expert } from '../../lib/api/types'
import type { UseMutationResult } from '@tanstack/react-query'
import { BookingModal } from '../../components/BookingModal'

interface SessionsTabProps {
  goSessions: ClaimnEvent[]
  isLoading: boolean
  sessionStatusFilter: 'upcoming' | 'past'
  onSessionStatusFilterChange: (status: 'upcoming' | 'past') => void
  registerMutation: UseMutationResult<unknown, unknown, string, unknown>
  unregisterMutation: UseMutationResult<unknown, unknown, string, unknown>
  hasGroupSessions: boolean
  hasCoachCalls: boolean
  /** Coach sessions allocated to this program enrollment (filtered by program_enrollment_id). */
  coachSessions: CoachingSession[]
  /** All experts — used to look up the coach name/avatar for each coach_session row. */
  experts: Expert[]
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  coaching: 'Coaching',
  utcheckning: 'Utcheckning',
}

export function SessionsTab({
  goSessions,
  isLoading,
  sessionStatusFilter,
  onSessionStatusFilterChange,
  registerMutation,
  unregisterMutation,
  hasGroupSessions,
  hasCoachCalls,
  coachSessions,
  experts,
}: SessionsTabProps) {
  // Local BookingModal state — opens for a specific awaiting_schedule row.
  // BookingModal sees the session id via redeemSessionId and skips Stripe.
  const [bookingFor, setBookingFor] = useState<{ expert: Expert; sessionId: string } | null>(null)

  const expertById = (id: string): Expert | undefined => experts.find((e) => e.id === id)

  // Sort awaiting first, then upcoming scheduled by date asc, then past
  const sortedCoachSessions = [...coachSessions].sort((a, b) => {
    const aAwaiting = a.status === 'awaiting_schedule' ? 0 : 1
    const bAwaiting = b.status === 'awaiting_schedule' ? 0 : 1
    if (aAwaiting !== bAwaiting) return aAwaiting - bAwaiting
    if (!a.session_date && !b.session_date) return 0
    if (!a.session_date) return -1
    if (!b.session_date) return 1
    return a.session_date.localeCompare(b.session_date)
  })

  const handleOpenBooking = (coachId: string, sessionId: string) => {
    const expert = expertById(coachId)
    if (!expert) return
    setBookingFor({ expert, sessionId })
  }

  return (
    <div className="space-y-6">
      {/* ===== Coach calls section — pre-allocated program-quota sessions ===== */}
      {hasCoachCalls && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-kalkvit flex items-center gap-2">
              <AcademicCapIcon className="w-5 h-5 text-koppar" />
              Coach calls
            </h3>
            {coachSessions.length > 0 && (
              <span className="text-sm text-kalkvit/50">
                {coachSessions.filter((s) => s.status === 'scheduled' || s.status === 'completed').length}/{coachSessions.length} booked
              </span>
            )}
          </div>

          {sortedCoachSessions.length === 0 ? (
            <GlassCard variant="base" className="text-center py-8">
              <AcademicCapIcon className="w-8 h-8 text-kalkvit/30 mx-auto mb-3" />
              <p className="text-kalkvit/50 text-sm">
                No coach calls allocated yet.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {sortedCoachSessions.map((session) => {
                const coach = expertById(session.expert_id)
                const typeLabel = session.session_type ? (SESSION_TYPE_LABELS[session.session_type] || session.session_type) : 'Coaching'
                const isAwaiting = session.status === 'awaiting_schedule'
                const isScheduled = session.status === 'scheduled' || session.status === 'confirmed'
                const isCompleted = session.status === 'completed'

                let dateStr: string | null = null
                let timeStr: string | null = null
                if (session.session_date) {
                  const d = new Date(session.session_date)
                  dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                  timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                }

                return (
                  <GlassCard key={session.id} variant="base" className="hover:border-koppar/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                        isAwaiting
                          ? 'bg-koppar/20 text-koppar'
                          : isCompleted
                            ? 'bg-skogsgron/20 text-skogsgron'
                            : 'bg-skogsgron/20 text-skogsgron'
                      )}>
                        {isCompleted || isScheduled ? (
                          <CheckCircleIcon className="w-5 h-5" />
                        ) : (
                          <AcademicCapIcon className="w-5 h-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-kalkvit">
                            {typeLabel} session{coach ? ` with ${coach.name}` : ''}
                          </h4>
                          {isAwaiting && <GlassBadge variant="koppar">Included</GlassBadge>}
                          {isScheduled && <GlassBadge variant="success">Booked</GlassBadge>}
                          {isCompleted && <GlassBadge variant="default">Completed</GlassBadge>}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-kalkvit/50 mb-3">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {session.duration} min
                          </span>
                          {dateStr && (
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              {dateStr}
                            </span>
                          )}
                          {timeStr && (
                            <span className="flex items-center gap-1">
                              <ClockIcon className="w-3 h-3" />
                              {timeStr}
                            </span>
                          )}
                        </div>

                        {coach && (
                          <div className="flex items-center gap-2 mb-3">
                            <GlassAvatar
                              src={coach.avatar_url}
                              alt={coach.name}
                              size="sm"
                            />
                            <span className="text-xs text-kalkvit/60">{coach.name}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {isAwaiting && (
                            <GlassButton
                              variant="primary"
                              className="text-xs"
                              onClick={() => handleOpenBooking(session.expert_id, session.id)}
                              disabled={!coach}
                            >
                              <CalendarIcon className="w-3 h-3" />
                              Book this session
                            </GlassButton>
                          )}
                          {isScheduled && session.meeting_url && (
                            <a
                              href={session.meeting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <GlassButton variant="primary" className="text-xs">
                                <VideoCameraIcon className="w-3 h-3" />
                                Join meeting
                              </GlassButton>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== Group sessions section ===== */}
      {hasGroupSessions && (
        <div className="space-y-4">
          {hasCoachCalls && (
            <h3 className="font-semibold text-kalkvit flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-koppar" />
              Group sessions
            </h3>
          )}

          {/* Status sub-filter (group sessions only) */}
          <div className="flex gap-2">
            {(['upcoming', 'past'] as const).map((status) => (
              <button
                key={status}
                onClick={() => onSessionStatusFilterChange(status)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                  sessionStatusFilter === status
                    ? 'bg-koppar/20 text-koppar'
                    : 'bg-white/[0.06] text-kalkvit/50 hover:text-kalkvit/70'
                )}
              >
                {status === 'upcoming' ? 'Upcoming' : 'Past'}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <ArrowPathIcon className="w-8 h-8 text-koppar animate-spin" />
            </div>
          ) : goSessions.length > 0 ? (
            <div className="space-y-4">
              {goSessions.map((session) => {
                const isPastSession = new Date(session.scheduled_date) < new Date()
                const isSessionFull = session.registered_count >= session.capacity
                const date = new Date(session.scheduled_date)
                const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

                return (
                  <Link key={session.id} to={`/events/${session.id}`} className="block">
                    <GlassCard variant="base" className="hover:border-koppar/30 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                          session.is_registered
                            ? 'bg-skogsgron/20 text-skogsgron'
                            : 'bg-koppar/20 text-koppar'
                        )}>
                          {session.is_registered ? (
                            <CheckCircleIcon className="w-5 h-5" />
                          ) : (
                            <CalendarIcon className="w-5 h-5" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-kalkvit">{session.title}</h4>
                            {session.is_registered && (
                              <GlassBadge variant="success">Registered</GlassBadge>
                            )}
                          </div>

                          {session.protocol_name && (
                            <p className="text-xs text-koppar italic mb-1">{session.protocol_name}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-xs text-kalkvit/50 mb-3">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              {dateStr}
                            </span>
                            <span className="flex items-center gap-1">
                              <ClockIcon className="w-3 h-3" />
                              {timeStr}
                            </span>
                            <span className="flex items-center gap-1">
                              <UserGroupIcon className="w-3 h-3" />
                              {session.registered_count}/{session.capacity} spots
                            </span>
                          </div>

                          {session.facilitator && (
                            <div className="flex items-center gap-2 mb-3">
                              <GlassAvatar
                                src={session.facilitator.avatar_url}
                                alt={session.facilitator.name}
                                size="sm"
                              />
                              <span className="text-xs text-kalkvit/60">{session.facilitator.name}</span>
                            </div>
                          )}

                          {!isPastSession && (
                            <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                              {session.is_registered ? (
                                <GlassButton
                                  variant="ghost"
                                  className="text-xs"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); unregisterMutation.mutate(session.id) }}
                                >
                                  <UserMinusIcon className="w-3 h-3" />
                                  Unregister
                                </GlassButton>
                              ) : (
                                <GlassButton
                                  variant="primary"
                                  className="text-xs"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); registerMutation.mutate(session.id) }}
                                  disabled={isSessionFull}
                                >
                                  <UserPlusIcon className="w-3 h-3" />
                                  {isSessionFull ? 'Full' : 'Register'}
                                </GlassButton>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                )
              })}
            </div>
          ) : (
            <GlassCard variant="base" className="text-center py-12">
              <CalendarIcon className="w-8 h-8 text-kalkvit/30 mx-auto mb-3" />
              <p className="text-kalkvit/50 text-sm">
                No {sessionStatusFilter} GO Sessions available.
              </p>
            </GlassCard>
          )}
        </div>
      )}

      {/* BookingModal — opens with explicit redeemSessionId so the right
          awaiting_schedule row is targeted (not just oldest by created_at). */}
      {bookingFor && (
        <BookingModal
          expert={bookingFor.expert}
          isOpen={true}
          onClose={() => setBookingFor(null)}
          redeemSessionId={bookingFor.sessionId}
        />
      )}
    </div>
  )
}
