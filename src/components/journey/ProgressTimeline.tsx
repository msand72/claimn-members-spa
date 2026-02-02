import type { JourneyMilestone } from '../../lib/api/hooks/useJourney'
import { Check, Circle } from 'lucide-react'

interface ProgressTimelineProps {
  milestones: JourneyMilestone[]
}

export function ProgressTimeline({ milestones }: ProgressTimelineProps) {
  if (milestones.length === 0) return null

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-3 bottom-3 w-px bg-white/[0.08]" />

      <div className="space-y-4">
        {milestones.map((milestone, i) => {
          const isCompleted = !!milestone.completed_at
          const isCurrent = !isCompleted && (i === 0 || !!milestones[i - 1]?.completed_at)

          return (
            <div key={milestone.type} className="flex items-start gap-4 relative">
              {/* Icon */}
              <div className="relative z-10 shrink-0">
                {isCompleted ? (
                  <div className="w-[30px] h-[30px] rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-[30px] h-[30px] rounded-full bg-koppar/10 border-2 border-koppar flex items-center justify-center animate-pulse">
                    <Circle className="w-3 h-3 text-koppar fill-koppar" />
                  </div>
                ) : (
                  <div className="w-[30px] h-[30px] rounded-full bg-white/[0.03] border border-white/[0.1] flex items-center justify-center">
                    <Circle className="w-3 h-3 text-kalkvit/20" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <h4 className={`text-sm font-medium ${
                  isCompleted ? 'text-kalkvit/80' : isCurrent ? 'text-kalkvit' : 'text-kalkvit/40'
                }`}>
                  {milestone.label}
                </h4>
                {isCompleted && milestone.completed_at && (
                  <p className="text-kalkvit/40 text-xs mt-0.5">
                    {new Date(milestone.completed_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                )}
                {isCurrent && (
                  <p className="text-koppar text-xs mt-0.5">In progress</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
