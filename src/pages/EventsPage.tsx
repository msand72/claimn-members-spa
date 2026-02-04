import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge, GlassTabs, GlassAvatar } from '../components/ui'
import {
  useEvents,
  useMyEvents,
  useRegisterForEvent,
  useUnregisterFromEvent,
  type ClaimnEvent,
} from '../lib/api/hooks'
import {
  Calendar,
  Clock,
  Users,
  Loader2,
  AlertTriangle,
  CalendarDays,
  UserCheck,
  UserMinus,
} from 'lucide-react'

function formatEventDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
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
  if (minutes < 60) return `${minutes}min`
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
}

function CapacityBar({ registered, capacity }: { registered: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min((registered / capacity) * 100, 100) : 0
  const isFull = registered >= capacity

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-kalkvit/50">
          {registered}/{capacity} spots
        </span>
        {isFull && (
          <span className="text-tegelrod font-medium">Full</span>
        )}
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isFull ? 'bg-tegelrod' : 'bg-gradient-to-r from-koppar to-brandAmber'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function EventCard({ event }: { event: ClaimnEvent }) {
  const registerMutation = useRegisterForEvent()
  const unregisterMutation = useUnregisterFromEvent()
  const isMutating = registerMutation.isPending || unregisterMutation.isPending
  const isFull = event.registered_count >= event.capacity
  const isPast = new Date(event.scheduled_date) < new Date()

  const handleRegister = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    registerMutation.mutate(event.id)
  }

  const handleUnregister = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    unregisterMutation.mutate(event.id)
  }

  return (
    <Link to={`/events/${event.id}`}>
      <GlassCard variant="base" className="hover:border-koppar/30 transition-colors h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <GlassBadge variant="koppar" className="text-xs">
            {event.event_type === 'brotherhood_call' ? 'Brotherhood Call' : 'GO Session'}
          </GlassBadge>
          <GlassBadge variant="default" className="text-xs">
            {event.tier_required}
          </GlassBadge>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-kalkvit mb-3 line-clamp-2">{event.title}</h3>

        {/* Date & Time */}
        <div className="flex items-center gap-4 text-sm text-kalkvit/60 mb-2">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatEventDate(event.scheduled_date)}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-kalkvit/60 mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatEventTime(event.scheduled_date)}
          </span>
          <span className="text-kalkvit/40">|</span>
          <span>{formatDuration(event.duration_minutes)}</span>
        </div>

        {/* Facilitator */}
        {event.facilitator && (
          <div className="flex items-center gap-2 mb-4">
            <GlassAvatar
              src={event.facilitator.avatar_url}
              alt={event.facilitator.name}
              size="sm"
            />
            <span className="text-sm text-kalkvit/70">{event.facilitator.name}</span>
          </div>
        )}

        {/* Capacity */}
        <div className="mt-auto">
          <CapacityBar registered={event.registered_count} capacity={event.capacity} />

          {/* Action */}
          {!isPast && (
            <div className="mt-4">
              {event.is_registered ? (
                <GlassButton
                  variant="ghost"
                  className="w-full"
                  onClick={handleUnregister}
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
                  onClick={handleRegister}
                  disabled={isMutating || isFull}
                >
                  {isMutating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  {isFull ? 'Full' : 'Register'}
                </GlassButton>
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </Link>
  )
}

function EventsGrid({
  events,
  isLoading,
  emptyMessage,
}: {
  events: ClaimnEvent[]
  isLoading: boolean
  emptyMessage: string
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-koppar animate-spin" />
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <GlassCard variant="base" className="text-center py-12">
        <CalendarDays className="w-12 h-12 text-kalkvit/20 mx-auto mb-4" />
        <h3 className="font-medium text-kalkvit mb-2">{emptyMessage}</h3>
        <p className="text-kalkvit/50 text-sm">
          Check back later for upcoming events.
        </p>
      </GlassCard>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}

export function EventsPage() {
  const [activeTab, setActiveTab] = useState('brotherhood_call')
  const [statusFilter, setStatusFilter] = useState<'upcoming' | 'past'>('upcoming')

  // API hooks
  const {
    data: brotherhoodData,
    isLoading: isLoadingBrotherhood,
    error: brotherhoodError,
  } = useEvents({ type: 'brotherhood_call', status: statusFilter })

  const {
    data: goSessionData,
    isLoading: isLoadingGo,
    error: goError,
  } = useEvents({ type: 'go_session', status: statusFilter })

  const {
    data: myEventsData,
    isLoading: isLoadingMyEvents,
    error: myEventsError,
  } = useMyEvents()

  const brotherhoodEvents = Array.isArray(brotherhoodData?.data) ? brotherhoodData.data : []
  const goSessionEvents = Array.isArray(goSessionData?.data) ? goSessionData.data : []
  const myEvents = Array.isArray(myEventsData?.data) ? myEventsData.data : []

  const error = brotherhoodError || goError || myEventsError

  const tabs = [
    { value: 'brotherhood_call', label: 'Brotherhood Calls' },
    { value: 'go_session', label: 'GO Sessions' },
    { value: 'my_events', label: 'My Events' },
  ]

  const statusTabs = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' },
  ]

  // Filter my events by status
  const filteredMyEvents = myEvents.filter((event) => {
    const eventDate = new Date(event.scheduled_date)
    const now = new Date()
    return statusFilter === 'upcoming' ? eventDate >= now : eventDate < now
  })

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto">
          <GlassCard variant="base" className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-tegelrod mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">Failed to load events</h3>
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
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">
              Events
            </h1>
            <p className="text-kalkvit/60">
              Join Brotherhood Calls and GO Sessions to connect and grow
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <GlassCard variant="base" className="text-center py-4">
            <Users className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">
              {isLoadingBrotherhood ? '-' : brotherhoodEvents.length}
            </p>
            <p className="text-xs text-kalkvit/50">Brotherhood Calls</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <CalendarDays className="w-6 h-6 text-skogsgron mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">
              {isLoadingGo ? '-' : goSessionEvents.length}
            </p>
            <p className="text-xs text-kalkvit/50">GO Sessions</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <UserCheck className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">
              {isLoadingMyEvents ? '-' : myEvents.length}
            </p>
            <p className="text-xs text-kalkvit/50">My Registrations</p>
          </GlassCard>
        </div>

        {/* Main Tabs */}
        <GlassTabs tabs={tabs} value={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* Status Sub-filter */}
        <GlassTabs
          tabs={statusTabs}
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as 'upcoming' | 'past')}
          variant="pills"
          size="sm"
          className="mb-6"
        />

        {/* Content */}
        {activeTab === 'brotherhood_call' && (
          <EventsGrid
            events={brotherhoodEvents}
            isLoading={isLoadingBrotherhood}
            emptyMessage={`No ${statusFilter} Brotherhood Calls`}
          />
        )}

        {activeTab === 'go_session' && (
          <EventsGrid
            events={goSessionEvents}
            isLoading={isLoadingGo}
            emptyMessage={`No ${statusFilter} GO Sessions`}
          />
        )}

        {activeTab === 'my_events' && (
          <EventsGrid
            events={filteredMyEvents}
            isLoading={isLoadingMyEvents}
            emptyMessage={`No ${statusFilter} registered events`}
          />
        )}
      </div>
    </MainLayout>
  )
}

export default EventsPage
