import { useParams, Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge, GlassAvatar } from '../components/ui'
import {
  useEvent,
  useRegisterForEvent,
  useUnregisterFromEvent,
} from '../lib/api/hooks'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Loader2,
  AlertTriangle,
  UserCheck,
  UserMinus,
} from 'lucide-react'

function formatEventDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatEventTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs} hour${hrs > 1 ? 's' : ''}`
}

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: event, isLoading, error } = useEvent(id || '')
  const registerMutation = useRegisterForEvent()
  const unregisterMutation = useUnregisterFromEvent()
  const isMutating = registerMutation.isPending || unregisterMutation.isPending

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-koppar animate-spin" />
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !event) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Link
            to="/events"
            className="inline-flex items-center gap-1 text-sm text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
          <GlassCard variant="base" className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-tegelrod mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">Failed to load event</h3>
            <p className="text-kalkvit/50 text-sm">
              This event may not exist or there was a connection issue.
            </p>
          </GlassCard>
        </div>
      </MainLayout>
    )
  }

  const isPast = new Date(event.scheduled_date) < new Date()
  const isFull = event.registered_count >= event.capacity
  const capacityPct = event.capacity > 0 ? Math.min((event.registered_count / event.capacity) * 100, 100) : 0

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          to="/events"
          className="inline-flex items-center gap-1 text-sm text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>

        {/* Hero Section */}
        <GlassCard variant="elevated" className="mb-6">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <GlassBadge variant="koppar">
              {event.event_type === 'brotherhood_call' ? 'Brotherhood Call' : 'GO Session'}
            </GlassBadge>
            <GlassBadge variant="default">
              {event.tier_required}
            </GlassBadge>
            {event.is_registered && (
              <GlassBadge variant="success">
                Registered
              </GlassBadge>
            )}
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-4">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-kalkvit/60">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-koppar" />
              {formatEventDate(event.scheduled_date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-koppar" />
              {formatEventTime(event.scheduled_date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-koppar" />
              {formatDuration(event.duration_minutes)}
            </span>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <GlassCard variant="base">
              <h2 className="font-display text-lg font-semibold text-kalkvit mb-3">
                About This Event
              </h2>
              <p className="text-kalkvit/70 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Facilitator Card */}
            <GlassCard variant="base">
              <h2 className="font-display text-lg font-semibold text-kalkvit mb-4">
                Facilitator
              </h2>
              <div className="flex items-center gap-3">
                <GlassAvatar
                  src={event.facilitator.avatar_url}
                  alt={event.facilitator.name}
                  size="lg"
                />
                <div>
                  <p className="font-medium text-kalkvit">{event.facilitator.name}</p>
                  <p className="text-xs text-kalkvit/50">Event Facilitator</p>
                </div>
              </div>
            </GlassCard>

            {/* Capacity Card */}
            <GlassCard variant="base">
              <h2 className="font-display text-lg font-semibold text-kalkvit mb-4">
                Capacity
              </h2>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-koppar" />
                <span className="text-kalkvit font-medium">
                  {event.registered_count}/{event.capacity} spots
                </span>
                {isFull && (
                  <GlassBadge variant="error" className="text-xs ml-auto">
                    Full
                  </GlassBadge>
                )}
              </div>
              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full transition-all ${
                    isFull ? 'bg-tegelrod' : 'bg-gradient-to-r from-koppar to-brandAmber'
                  }`}
                  style={{ width: `${capacityPct}%` }}
                />
              </div>

              {/* Register / Unregister */}
              {!isPast && (
                <>
                  {event.is_registered ? (
                    <GlassButton
                      variant="ghost"
                      className="w-full"
                      onClick={() => unregisterMutation.mutate(event.id)}
                      disabled={isMutating}
                    >
                      {isMutating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserMinus className="w-4 h-4" />
                      )}
                      Unregister
                    </GlassButton>
                  ) : (
                    <GlassButton
                      variant="primary"
                      className="w-full"
                      onClick={() => registerMutation.mutate(event.id)}
                      disabled={isMutating || isFull}
                    >
                      {isMutating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                      {isFull ? 'Event Full' : 'Register'}
                    </GlassButton>
                  )}
                </>
              )}

              {isPast && (
                <p className="text-center text-sm text-kalkvit/40">
                  This event has already taken place.
                </p>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default EventDetailPage
