import { GlassCard } from '../../components/ui'
import { ArrowPathIcon, BoltIcon } from '@heroicons/react/24/outline'
import { SprintCard } from './SprintCard'
import type { Sprint } from '../../lib/api/types'

interface SprintsTabProps {
  sprints: Sprint[]
  isLoading: boolean
}

export function SprintsTab({ sprints, isLoading }: SprintsTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowPathIcon className="w-8 h-8 text-koppar animate-spin" />
      </div>
    )
  }

  if (sprints.length > 0) {
    return (
      <div className="space-y-4">
        {sprints.map((sprint, index) => (
          <SprintCard key={sprint.id} sprint={sprint} index={index} />
        ))}
      </div>
    )
  }

  return (
    <GlassCard variant="base" className="text-center py-12">
      <BoltIcon className="w-8 h-8 text-kalkvit/30 mx-auto mb-3" />
      <p className="text-kalkvit/50 text-sm">
        No sprints available for this program yet.
      </p>
    </GlassCard>
  )
}
