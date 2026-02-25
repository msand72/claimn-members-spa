import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge, GlassTabs, GlassAvatar } from '../components/ui'
import {
  useEvents,
  useMyEvents,
  useRegisterForEvent,
  useUnregisterFromEvent,
  useEnrolledPrograms,
  usePrograms,
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
  Zap,
  ArrowRight,
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
            Brotherhood Call
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
                >
                  <UserMinus className="w-4 h-4" />
                  Unregister
                </GlassButton>
              ) : (
                <GlassButton
                  variant="primary"
                  className="w-full"
                  onClick={handleRegister}
                  disabled={isFull}
                >
                  <UserCheck className="w-4 h-4" />
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

  // API hooks — only Brotherhood Calls (GO Sessions live in the Program page)
  const {
    data: brotherhoodData,
    isLoading: isLoadingBrotherhood,
    error: brotherhoodError,
  } = useEvents({ type: 'brotherhood_call', status: statusFilter })

  const {
    data: myEventsData,
    isLoading: isLoadingMyEvents,
    error: myEventsError,
  } = useMyEvents()

  // Find GO program for the CTA link
  const { data: programsData } = usePrograms()
  const { data: enrolledData } = useEnrolledPrograms()
  const goProgramId = useMemo(() => {
    const programs = Array.isArray(programsData?.data) ? programsData.data : []
    const goProgram = programs.find(
      (p) => p.slug === 'go-sessions-s1' || p.tier === 'go_sessions'
    )
    if (!goProgram) return ''
    const enrolled = Array.isArray(enrolledData?.data) ? enrolledData.data : []
    const enrolledMatch = enrolled.find(
      (ep) =>
        ep.program_id === goProgram.id ||
        ep.program?.slug === 'go-sessions-s1' ||
        ep.program?.tier === 'go_sessions'
    )
    return enrolledMatch?.program_id || goProgram.id
  }, [programsData, enrolledData])

  const brotherhoodEvents = Array.isArray(brotherhoodData?.data) ? brotherhoodData.data : []
  const myEvents = Array.isArray(myEventsData?.data) ? myEventsData.data : []

  // Filter my events: only brotherhood calls, by status
  const filteredMyEvents = myEvents.filter((event) => {
    if (event.event_type === 'session') return false // Sessions are in program page
    const eventDate = new Date(event.scheduled_date)
    const now = new Date()
    return statusFilter === 'upcoming' ? eventDate >= now : eventDate < now
  })

  const error = brotherhoodError || myEventsError

  const tabs = [
    { value: 'brotherhood_call', label: 'Brotherhood Calls' },
    { value: 'my_events', label: 'My Events' },
  ]

  const statusTabs = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' },
  ]

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
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">
              Sessions
            </h1>
            <p className="text-kalkvit/60">
              Join Brotherhood Calls to connect and grow
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <GlassCard variant="base" className="text-center py-4">
            <Users className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">
              {isLoadingBrotherhood ? '-' : brotherhoodEvents.length}
            </p>
            <p className="text-xs text-kalkvit/50">Brotherhood Calls</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <UserCheck className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">
              {isLoadingMyEvents ? '-' : filteredMyEvents.length}
            </p>
            <p className="text-xs text-kalkvit/50">My Registrations</p>
          </GlassCard>
        </div>

        {/* GO Sessions CTA */}
        {goProgramId && (
          <Link to={`/programs/${goProgramId}`} className="block mb-6">
            <div className="glass-accent rounded-2xl px-4 py-3 md:px-5 md:py-4 hover:border-koppar/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-koppar/20 flex items-center justify-center shrink-0">
                  <Zap className="w-4.5 h-4.5 text-koppar" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-sm font-bold text-kalkvit">
                    GO Sessions
                  </h3>
                  <p className="text-xs text-kalkvit/60">
                    View sessions, sprints, vitality checks & more
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-koppar/60 shrink-0" />
              </div>
            </div>
          </Link>
        )}

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
