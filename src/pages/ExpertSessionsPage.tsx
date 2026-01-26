import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassAvatar, GlassBadge } from '../components/ui'
import { Calendar, Clock, Video, MessageCircle, Star, ChevronRight, Plus } from 'lucide-react'
import { cn } from '../lib/utils'

interface Session {
  id: number
  expert: {
    name: string
    initials: string
    title: string
  }
  date: string
  time: string
  duration: number
  status: 'upcoming' | 'completed' | 'cancelled'
  type: 'video' | 'audio'
  notes?: string
  rating?: number
}

const mockSessions: Session[] = [
  {
    id: 1,
    expert: { name: 'Michael Chen', initials: 'MC', title: 'Leadership Coach' },
    date: 'Tomorrow',
    time: '10:00 AM',
    duration: 60,
    status: 'upcoming',
    type: 'video',
  },
  {
    id: 2,
    expert: { name: 'Sarah Thompson', initials: 'ST', title: 'Performance Coach' },
    date: 'Friday, Jan 31',
    time: '2:00 PM',
    duration: 30,
    status: 'upcoming',
    type: 'video',
  },
  {
    id: 3,
    expert: { name: 'David Wilson', initials: 'DW', title: 'Business Mentor' },
    date: 'Jan 20, 2026',
    time: '11:00 AM',
    duration: 60,
    status: 'completed',
    type: 'video',
    notes: 'Discussed Q1 strategy and team scaling plans.',
    rating: 5,
  },
  {
    id: 4,
    expert: { name: 'Michael Chen', initials: 'MC', title: 'Leadership Coach' },
    date: 'Jan 15, 2026',
    time: '9:00 AM',
    duration: 90,
    status: 'completed',
    type: 'video',
    notes: 'Deep dive into leadership frameworks and delegation.',
    rating: 5,
  },
  {
    id: 5,
    expert: { name: 'Sarah Thompson', initials: 'ST', title: 'Performance Coach' },
    date: 'Jan 10, 2026',
    time: '3:00 PM',
    duration: 60,
    status: 'cancelled',
    type: 'video',
  },
]

function SessionCard({ session }: { session: Session }) {
  const statusConfig = {
    upcoming: { variant: 'success' as const, label: 'Upcoming' },
    completed: { variant: 'default' as const, label: 'Completed' },
    cancelled: { variant: 'warning' as const, label: 'Cancelled' },
  }

  const status = statusConfig[session.status]

  return (
    <GlassCard variant="base" className="mb-4">
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <GlassAvatar initials={session.expert.initials} size="lg" />
          <div>
            <h3 className="font-semibold text-kalkvit">{session.expert.name}</h3>
            <p className="text-sm text-koppar">{session.expert.title}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-kalkvit/60">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {session.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {session.time} ({session.duration} min)
              </span>
              <span className="flex items-center gap-1">
                <Video className="w-4 h-4" />
                Video Call
              </span>
            </div>
            {session.notes && (
              <p className="mt-3 text-sm text-kalkvit/70 bg-white/[0.03] rounded-lg p-3">
                {session.notes}
              </p>
            )}
            {session.rating && (
              <div className="flex items-center gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'w-4 h-4',
                      i < session.rating! ? 'text-brand-amber fill-brand-amber' : 'text-kalkvit/20'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <GlassBadge variant={status.variant}>{status.label}</GlassBadge>
          {session.status === 'upcoming' && (
            <div className="flex gap-2 mt-2">
              <GlassButton variant="ghost" className="p-2">
                <MessageCircle className="w-4 h-4" />
              </GlassButton>
              <GlassButton variant="primary" className="text-sm">
                Join Call
                <ChevronRight className="w-4 h-4" />
              </GlassButton>
            </div>
          )}
          {session.status === 'completed' && !session.rating && (
            <GlassButton variant="secondary" className="text-sm mt-2">
              Leave Review
            </GlassButton>
          )}
        </div>
      </div>
    </GlassCard>
  )
}

export function ExpertSessionsPage() {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all')

  const filteredSessions = mockSessions.filter((session) => {
    if (filter === 'all') return true
    if (filter === 'upcoming') return session.status === 'upcoming'
    if (filter === 'completed') return session.status === 'completed' || session.status === 'cancelled'
    return true
  })

  const upcomingCount = mockSessions.filter((s) => s.status === 'upcoming').length
  const completedCount = mockSessions.filter((s) => s.status === 'completed').length

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
            <p className="text-3xl font-display font-bold text-kalkvit">{upcomingCount}</p>
            <p className="text-sm text-kalkvit/60">Upcoming</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center">
            <p className="text-3xl font-display font-bold text-kalkvit">{completedCount}</p>
            <p className="text-sm text-kalkvit/60">Completed</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center">
            <p className="text-3xl font-display font-bold text-koppar">4.9</p>
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
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))
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
