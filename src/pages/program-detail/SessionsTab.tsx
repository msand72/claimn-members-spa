import { Link } from 'react-router-dom'
import { GlassCard, GlassButton, GlassBadge, GlassAvatar } from '../../components/ui'
import { Calendar, Loader2, Clock, Users, UserCheck, UserMinus, CheckCircle } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { ClaimnEvent } from '../../lib/api/types'
import type { UseMutationResult } from '@tanstack/react-query'

interface SessionsTabProps {
  goSessions: ClaimnEvent[]
  isLoading: boolean
  sessionStatusFilter: 'upcoming' | 'past'
  onSessionStatusFilterChange: (status: 'upcoming' | 'past') => void
  registerMutation: UseMutationResult<unknown, unknown, string, unknown>
  unregisterMutation: UseMutationResult<unknown, unknown, string, unknown>
}

export function SessionsTab({
  goSessions,
  isLoading,
  sessionStatusFilter,
  onSessionStatusFilterChange,
  registerMutation,
  unregisterMutation,
}: SessionsTabProps) {
  return (
    <div className="space-y-4">
      {/* Status sub-filter */}
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
          <Loader2 className="w-8 h-8 text-koppar animate-spin" />
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
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Calendar className="w-5 h-5" />
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
                          <Calendar className="w-3 h-3" />
                          {dateStr}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeStr}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
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
                              <UserMinus className="w-3 h-3" />
                              Unregister
                            </GlassButton>
                          ) : (
                            <GlassButton
                              variant="primary"
                              className="text-xs"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); registerMutation.mutate(session.id) }}
                              disabled={isSessionFull}
                            >
                              <UserCheck className="w-3 h-3" />
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
          <Calendar className="w-8 h-8 text-kalkvit/30 mx-auto mb-3" />
          <p className="text-kalkvit/50 text-sm">
            No {sessionStatusFilter} GO Sessions available.
          </p>
        </GlassCard>
      )}
    </div>
  )
}
