import { GlassCard } from '../../components/ui'
import { ViewfinderCircleIcon, CheckCircleIcon, BookOpenIcon, AcademicCapIcon } from '@heroicons/react/24/outline'

interface OverviewTabProps {
  program: {
    objectives?: string[]
    prerequisites?: string[]
    duration?: string
    duration_months?: number
    modules?: number
  }
  sprintCount: number
}

export function OverviewTab({ program, sprintCount }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Objectives */}
      {program.objectives && program.objectives.length > 0 && (
        <GlassCard variant="base">
          <h2 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
            <ViewfinderCircleIcon className="w-5 h-5 text-koppar" />
            What You'll Achieve
          </h2>
          <ul className="space-y-3">
            {program.objectives.map((objective, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircleIcon className="w-4 h-4 text-skogsgron flex-shrink-0 mt-0.5" />
                <span className="text-sm text-kalkvit/80">{objective}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      {/* Prerequisites */}
      {program.prerequisites && program.prerequisites.length > 0 && (
        <GlassCard variant="base">
          <h2 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
            <BookOpenIcon className="w-5 h-5 text-koppar" />
            Prerequisites
          </h2>
          <ul className="space-y-3">
            {program.prerequisites.map((prereq, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-4 h-4 rounded-full bg-white/[0.1] flex items-center justify-center text-xs text-kalkvit/50 flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-kalkvit/80">{prereq}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      {/* Program structure overview */}
      <GlassCard variant="base">
        <h2 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
          <AcademicCapIcon className="w-5 h-5 text-koppar" />
          Program Structure
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-white/[0.04]">
            <p className="font-display text-2xl font-bold text-kalkvit">
              {program.duration || `${program.duration_months}mo`}
            </p>
            <p className="text-xs text-kalkvit/50">Duration</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/[0.04]">
            <p className="font-display text-2xl font-bold text-kalkvit">{program.modules}</p>
            <p className="text-xs text-kalkvit/50">Modules</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/[0.04]">
            <p className="font-display text-2xl font-bold text-kalkvit">{sprintCount}</p>
            <p className="text-xs text-kalkvit/50">Sprints</p>
          </div>
        </div>
      </GlassCard>

      {/* No objectives/prerequisites - show empty state */}
      {(!program.objectives || program.objectives.length === 0) &&
       (!program.prerequisites || program.prerequisites.length === 0) && (
        <GlassCard variant="base" className="text-center py-8">
          <BookOpenIcon className="w-8 h-8 text-kalkvit/30 mx-auto mb-3" />
          <p className="text-kalkvit/50 text-sm">
            Program details will be available soon. Check the Sprints tab to see the learning path.
          </p>
        </GlassCard>
      )}
    </div>
  )
}
