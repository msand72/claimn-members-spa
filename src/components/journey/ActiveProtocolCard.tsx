import { Link } from 'react-router-dom'
import { ArrowRight, ListChecks } from 'lucide-react'
import { GlassCard, GlassButton, GlassBadge } from '../ui'
import type { JourneyProtocol } from '../../lib/api/hooks/useJourney'

interface ActiveProtocolCardProps {
  protocol: JourneyProtocol
  /** Optional next task */
  nextTask?: { title: string } | null
}

export function ActiveProtocolCard({ protocol, nextTask }: ActiveProtocolCardProps) {
  // Derive current week from step count (assuming ~tasks-per-week grouping)
  const estimatedWeek = protocol?.total_steps > 0
    ? Math.max(1, Math.ceil((protocol.current_step / protocol.total_steps) * 4))
    : 1

  if (!protocol) {
    return null
  }

  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <ListChecks className="w-4 h-4 text-koppar" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-kalkvit/40">
          Active Protocol
        </span>
      </div>

      {/* Title + badge row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4 className="font-display text-base font-semibold text-kalkvit truncate">
          {protocol.title}
        </h4>
        <GlassBadge variant="koppar">{protocol.progress_pct}%</GlassBadge>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-koppar rounded-full transition-all duration-500"
          style={{ width: `${protocol.progress_pct}%` }}
        />
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-xs text-kalkvit/50 mb-3">
        <span>Week {estimatedWeek}</span>
        <span className="text-kalkvit/20">&middot;</span>
        <span>
          Step {protocol.current_step} of {protocol.total_steps}
        </span>
        {protocol.assigned_by_expert && (
          <>
            <span className="text-kalkvit/20">&middot;</span>
            <GlassBadge variant="default" className="text-[10px] px-2 py-0.5">
              Expert assigned
            </GlassBadge>
          </>
        )}
      </div>

      {/* Next task preview */}
      {nextTask && (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-3 mb-3">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-kalkvit/30 block mb-1">
            Next task
          </span>
          <p className="text-sm text-kalkvit/80">{nextTask.title}</p>
        </div>
      )}

      {/* Continue button */}
      <Link to={`/protocols/${protocol.slug}`}>
        <GlassButton variant="primary" className="w-full justify-center">
          Continue <ArrowRight className="w-4 h-4 ml-1" />
        </GlassButton>
      </Link>
    </GlassCard>
  )
}

export default ActiveProtocolCard