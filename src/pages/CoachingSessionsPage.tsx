import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassAvatar, GlassBadge } from '../components/ui'
import { Calendar, Clock, Target, TrendingUp, FileText, ChevronRight, Play, CheckCircle } from 'lucide-react'
import { cn } from '../lib/utils'

interface CoachingSession {
  id: number
  title: string
  coach: {
    name: string
    initials: string
  }
  date: string
  duration: number
  status: 'scheduled' | 'in_progress' | 'completed'
  goals: string[]
  progress: number
  hasNotes: boolean
  hasRecording: boolean
}

const mockCoachingSessions: CoachingSession[] = [
  {
    id: 1,
    title: 'Q1 Goal Setting & Strategy',
    coach: { name: 'Michael Chen', initials: 'MC' },
    date: 'Tomorrow, 10:00 AM',
    duration: 60,
    status: 'scheduled',
    goals: ['Define Q1 objectives', 'Create action plan', 'Set KPIs'],
    progress: 0,
    hasNotes: false,
    hasRecording: false,
  },
  {
    id: 2,
    title: 'Leadership Development Review',
    coach: { name: 'Michael Chen', initials: 'MC' },
    date: 'Jan 20, 2026',
    duration: 60,
    status: 'completed',
    goals: ['Review delegation progress', 'Discuss team feedback', 'Plan next steps'],
    progress: 100,
    hasNotes: true,
    hasRecording: true,
  },
  {
    id: 3,
    title: 'Performance Optimization',
    coach: { name: 'Sarah Thompson', initials: 'ST' },
    date: 'Jan 15, 2026',
    duration: 45,
    status: 'completed',
    goals: ['Analyze current habits', 'Identify bottlenecks', 'Create optimization plan'],
    progress: 100,
    hasNotes: true,
    hasRecording: false,
  },
  {
    id: 4,
    title: 'Morning Routine Deep Dive',
    coach: { name: 'Sarah Thompson', initials: 'ST' },
    date: 'Jan 8, 2026',
    duration: 30,
    status: 'completed',
    goals: ['Review wake-up consistency', 'Optimize morning stack'],
    progress: 100,
    hasNotes: true,
    hasRecording: true,
  },
]

function SessionCard({ session }: { session: CoachingSession }) {
  const statusConfig = {
    scheduled: { variant: 'koppar' as const, label: 'Scheduled', icon: Calendar },
    in_progress: { variant: 'warning' as const, label: 'In Progress', icon: Play },
    completed: { variant: 'success' as const, label: 'Completed', icon: CheckCircle },
  }

  const status = statusConfig[session.status]
  const StatusIcon = status.icon

  return (
    <GlassCard variant="base" className="mb-4">
      <div className="flex items-start gap-4">
        <GlassAvatar initials={session.coach.initials} size="lg" />
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-kalkvit">{session.title}</h3>
              <p className="text-sm text-koppar">{session.coach.name}</p>
            </div>
            <GlassBadge variant={status.variant} className="flex items-center gap-1">
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </GlassBadge>
          </div>

          <div className="flex items-center gap-4 text-sm text-kalkvit/60 mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {session.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {session.duration} min
            </span>
          </div>

          {/* Goals */}
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
            {session.status === 'scheduled' && (
              <GlassButton variant="primary" className="text-sm">
                Join Session
                <ChevronRight className="w-4 h-4" />
              </GlassButton>
            )}
            {session.hasNotes && (
              <Link to={`/coaching/session-notes?id=${session.id}`}>
                <GlassButton variant="secondary" className="text-sm">
                  <FileText className="w-4 h-4" />
                  View Notes
                </GlassButton>
              </Link>
            )}
            {session.hasRecording && (
              <GlassButton variant="ghost" className="text-sm">
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

  const filteredSessions = mockCoachingSessions.filter((session) => {
    if (filter === 'all') return true
    return session.status === filter
  })

  const scheduledCount = mockCoachingSessions.filter((s) => s.status === 'scheduled').length
  const completedCount = mockCoachingSessions.filter((s) => s.status === 'completed').length
  const totalHours = mockCoachingSessions
    .filter((s) => s.status === 'completed')
    .reduce((acc, s) => acc + s.duration, 0) / 60

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Coaching Sessions</h1>
            <p className="text-kalkvit/60">Track your coaching journey and progress</p>
          </div>
          <Link to="/book-session">
            <GlassButton variant="primary">
              Book Session
            </GlassButton>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <GlassCard variant="base" className="text-center">
            <p className="text-3xl font-display font-bold text-kalkvit">{scheduledCount}</p>
            <p className="text-sm text-kalkvit/60">Scheduled</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center">
            <p className="text-3xl font-display font-bold text-kalkvit">{completedCount}</p>
            <p className="text-sm text-kalkvit/60">Completed</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center">
            <p className="text-3xl font-display font-bold text-koppar">{totalHours.toFixed(1)}h</p>
            <p className="text-sm text-kalkvit/60">Total Hours</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center">
            <p className="text-3xl font-display font-bold text-skogsgron">92%</p>
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
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))
        ) : (
          <GlassCard variant="base" className="text-center py-12">
            <p className="text-kalkvit/60">No sessions found.</p>
          </GlassCard>
        )}
      </div>
    </MainLayout>
  )
}
