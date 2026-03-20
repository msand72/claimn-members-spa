import { Link } from 'react-router-dom'
import { GlassCard, GlassBadge, GlassAvatar } from '../../components/ui'
import { ClockIcon, CalendarIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { cn } from '../../lib/utils'
import type { Sprint } from '../../lib/api/types'

export function SprintCard({ sprint, index }: { sprint: Sprint; index: number }) {
  const statusConfig = {
    upcoming: { variant: 'default' as const, label: 'Upcoming' },
    active: { variant: 'success' as const, label: 'Active' },
    completed: { variant: 'koppar' as const, label: 'Completed' },
  }

  const status = statusConfig[sprint.status || 'upcoming'] || statusConfig.upcoming

  const facilitatorInitials = sprint.facilitator?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <Link to={`/programs/sprints/${sprint.id}`} className="block">
      <GlassCard variant="base" className="group">
        <div className="flex items-start gap-4">
          <div className={cn(
            'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold',
            sprint.status === 'completed'
              ? 'bg-skogsgron/20 text-skogsgron'
              : sprint.status === 'active'
                ? 'bg-koppar/20 text-koppar'
                : 'bg-white/[0.06] text-kalkvit/40'
          )}>
            {sprint.status === 'completed' ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              index + 1
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-kalkvit group-hover:text-koppar transition-colors">
                {sprint.title}
              </h3>
              <GlassBadge variant={status.variant}>{status.label}</GlassBadge>
            </div>

            {sprint.description && (
              <p className="text-sm text-kalkvit/60 mb-3 line-clamp-2">{sprint.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-kalkvit/50">
              {sprint.duration && (
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" />
                  {sprint.duration}
                </span>
              )}
              {sprint.start_date && (
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  {new Date(sprint.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
              {sprint.facilitator && (
                <span className="flex items-center gap-1">
                  {sprint.facilitator.avatar_url ? (
                    <img src={sprint.facilitator.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                  ) : (
                    <GlassAvatar initials={facilitatorInitials} size="sm" />
                  )}
                  {sprint.facilitator.name}
                </span>
              )}
            </div>

            {sprint.goals && sprint.goals.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {sprint.goals.map((goal, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-lg bg-white/[0.06] text-kalkvit/60"
                  >
                    {goal}
                  </span>
                ))}
              </div>
            )}

            {sprint.status === 'active' && (sprint.progress ?? 0) > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-kalkvit/50">Progress</span>
                  <span className="text-skogsgron">{sprint.progress}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-skogsgron rounded-full transition-all"
                    style={{ width: `${sprint.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </Link>
  )
}
