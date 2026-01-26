import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassAvatar, GlassBadge } from '../components/ui'
import { Calendar, Clock, Users, Target, CheckCircle, ArrowLeft, ChevronRight, Zap } from 'lucide-react'
import { cn } from '../lib/utils'

interface Sprint {
  id: number
  title: string
  description: string
  program: string
  startDate: string
  endDate: string
  duration: string
  status: 'upcoming' | 'active' | 'completed'
  participants: number
  maxParticipants: number
  goals: string[]
  progress?: number
  facilitator: {
    name: string
    initials: string
  }
}

const mockSprints: Sprint[] = [
  {
    id: 1,
    title: 'Morning Mastery Sprint',
    description: 'Join 30 other members in building an unshakeable morning routine over 21 days.',
    program: 'Morning Mastery Protocol',
    startDate: 'Feb 1, 2026',
    endDate: 'Feb 21, 2026',
    duration: '21 days',
    status: 'upcoming',
    participants: 24,
    maxParticipants: 30,
    goals: ['Wake up by 5:30 AM', 'Complete morning stack', 'Daily check-in'],
    facilitator: { name: 'Michael Chen', initials: 'MC' },
  },
  {
    id: 2,
    title: 'Deep Work Challenge',
    description: 'Master focused work with daily accountability and peer support.',
    program: 'Deep Work Protocol',
    startDate: 'Jan 15, 2026',
    endDate: 'Feb 5, 2026',
    duration: '21 days',
    status: 'active',
    participants: 28,
    maxParticipants: 30,
    goals: ['4 hours deep work daily', 'Zero distractions', 'Weekly review'],
    progress: 65,
    facilitator: { name: 'Sarah Thompson', initials: 'ST' },
  },
  {
    id: 3,
    title: 'Leadership Intensive',
    description: 'Accelerate your leadership growth with intensive daily challenges.',
    program: 'Leadership Accelerator',
    startDate: 'Dec 1, 2025',
    endDate: 'Dec 31, 2025',
    duration: '30 days',
    status: 'completed',
    participants: 25,
    maxParticipants: 25,
    goals: ['Daily leadership action', 'Peer feedback', 'Coach check-in'],
    progress: 100,
    facilitator: { name: 'David Wilson', initials: 'DW' },
  },
  {
    id: 4,
    title: 'Networking Sprint',
    description: 'Build meaningful connections with structured outreach challenges.',
    program: 'Social Mastery Framework',
    startDate: 'Feb 10, 2026',
    endDate: 'Mar 3, 2026',
    duration: '21 days',
    status: 'upcoming',
    participants: 12,
    maxParticipants: 20,
    goals: ['5 new connections/week', 'Follow-up system', 'Value-first approach'],
    facilitator: { name: 'Emily Davis', initials: 'ED' },
  },
]

function SprintCard({ sprint }: { sprint: Sprint }) {
  const statusConfig = {
    upcoming: { variant: 'koppar' as const, label: 'Upcoming', color: 'text-koppar' },
    active: { variant: 'success' as const, label: 'Active', color: 'text-skogsgron' },
    completed: { variant: 'default' as const, label: 'Completed', color: 'text-kalkvit/50' },
  }

  const status = statusConfig[sprint.status]
  const spotsLeft = sprint.maxParticipants - sprint.participants

  return (
    <GlassCard variant="base" className="group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-koppar/20">
            <Zap className="w-5 h-5 text-koppar" />
          </div>
          <div>
            <h3 className="font-semibold text-kalkvit group-hover:text-koppar transition-colors">
              {sprint.title}
            </h3>
            <p className="text-xs text-kalkvit/50">{sprint.program}</p>
          </div>
        </div>
        <GlassBadge variant={status.variant}>{status.label}</GlassBadge>
      </div>

      <p className="text-sm text-kalkvit/60 mb-4">{sprint.description}</p>

      {/* Dates and duration */}
      <div className="flex items-center gap-4 text-sm text-kalkvit/50 mb-4">
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {sprint.startDate}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {sprint.duration}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {sprint.participants}/{sprint.maxParticipants}
        </span>
      </div>

      {/* Goals */}
      <div className="mb-4">
        <p className="text-xs text-kalkvit/40 mb-2 flex items-center gap-1">
          <Target className="w-3 h-3" />
          Sprint Goals
        </p>
        <div className="flex flex-wrap gap-2">
          {sprint.goals.map((goal, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 rounded-lg bg-white/[0.06] text-kalkvit/70"
            >
              {goal}
            </span>
          ))}
        </div>
      </div>

      {/* Progress for active sprints */}
      {sprint.status === 'active' && sprint.progress !== undefined && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-kalkvit/50">Progress</span>
            <span className="text-skogsgron">{sprint.progress}%</span>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-skogsgron rounded-full transition-all"
              style={{ width: `${sprint.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Facilitator and CTA */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <GlassAvatar initials={sprint.facilitator.initials} size="sm" />
          <span className="text-sm text-kalkvit/60">{sprint.facilitator.name}</span>
        </div>
        {sprint.status === 'upcoming' && (
          <GlassButton variant="primary" className="text-sm">
            Join Sprint
            {spotsLeft <= 5 && <span className="text-xs ml-1">({spotsLeft} spots left)</span>}
          </GlassButton>
        )}
        {sprint.status === 'active' && (
          <GlassButton variant="secondary" className="text-sm">
            View Progress
            <ChevronRight className="w-4 h-4" />
          </GlassButton>
        )}
        {sprint.status === 'completed' && (
          <GlassButton variant="ghost" className="text-sm">
            <CheckCircle className="w-4 h-4 text-skogsgron" />
            View Results
          </GlassButton>
        )}
      </div>
    </GlassCard>
  )
}

export function ProgramsSprintsPage() {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'completed'>('all')

  const filteredSprints = mockSprints.filter((sprint) => {
    if (filter === 'all') return true
    return sprint.status === filter
  })

  const activeCount = mockSprints.filter((s) => s.status === 'active').length
  const upcomingCount = mockSprints.filter((s) => s.status === 'upcoming').length
  const completedCount = mockSprints.filter((s) => s.status === 'completed').length

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <Link
          to="/programs"
          className="inline-flex items-center gap-2 text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Programs
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Sprints</h1>
            <p className="text-kalkvit/60">
              Intensive group challenges to accelerate your growth
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <GlassCard variant="base" className="text-center">
            <p className="text-3xl font-display font-bold text-skogsgron">{activeCount}</p>
            <p className="text-sm text-kalkvit/60">Active Sprints</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center">
            <p className="text-3xl font-display font-bold text-koppar">{upcomingCount}</p>
            <p className="text-sm text-kalkvit/60">Upcoming</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center">
            <p className="text-3xl font-display font-bold text-kalkvit">{completedCount}</p>
            <p className="text-sm text-kalkvit/60">Completed</p>
          </GlassCard>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'active', 'upcoming', 'completed'] as const).map((f) => (
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

        {/* Sprints Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSprints.map((sprint) => (
            <SprintCard key={sprint.id} sprint={sprint} />
          ))}
        </div>

        {filteredSprints.length === 0 && (
          <GlassCard variant="base" className="text-center py-12">
            <p className="text-kalkvit/60">No sprints found.</p>
          </GlassCard>
        )}
      </div>
    </MainLayout>
  )
}
