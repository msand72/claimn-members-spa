import { GlassBadge } from '../ui'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { PILLAR_CONFIG, type PillarId } from '../../tokens/pillars'
import { cn } from '../../lib/utils'
import { useUpdatePlanItem, type CoachingPlanItem } from '../../lib/api/hooks/useCoaching'

const ITEM_TYPE_LABELS: Record<string, string> = {
  protocol: 'Protocol',
  goal: 'Goal',
  kpi: 'KPI',
  action: 'Action',
  habit: 'Habit',
  reflection: 'Reflection',
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  '3x-week': '3x/week',
  '2x-week': '2x/week',
  'bi-weekly': 'Bi-weekly',
}

interface PlanItemCardProps {
  item: CoachingPlanItem
  isCheckable: boolean
}

export function PlanItemCard({ item, isCheckable }: PlanItemCardProps) {
  const updateItem = useUpdatePlanItem()
  const pillarConfig = PILLAR_CONFIG[item.pillar as PillarId]
  const isCompleted = item.status === 'completed'
  const isSkipped = item.status === 'skipped'
  const isDone = isCompleted || isSkipped

  const handleToggle = () => {
    if (!isCheckable) return
    const newStatus = isCompleted ? 'pending' : 'completed'
    updateItem.mutate({ itemId: item.id, status: newStatus as 'completed' })
  }

  return (
    <div
      className={cn(
        'relative rounded-xl border bg-white/[0.04] backdrop-blur-[16px] p-4 transition-colors',
        isDone ? 'opacity-60 border-white/[0.06]' : 'border-white/10'
      )}
      style={pillarConfig ? { borderLeftColor: pillarConfig.color, borderLeftWidth: 3 } : undefined}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        {isCheckable && (
          <button
            onClick={handleToggle}
            disabled={updateItem.isPending}
            className={cn(
              'mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors',
              isCompleted
                ? 'bg-skogsgron border-skogsgron'
                : 'border-kalkvit/30 hover:border-koppar'
            )}
          >
            {isCompleted && <CheckCircleIcon className="w-3.5 h-3.5 text-kalkvit" />}
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <GlassBadge variant="default" className="text-[10px] capitalize">
              {ITEM_TYPE_LABELS[item.item_type] || item.item_type}
            </GlassBadge>
            {pillarConfig && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
                style={{ color: pillarConfig.color, borderColor: pillarConfig.colorBorder, backgroundColor: pillarConfig.colorLo }}
              >
                {pillarConfig.shortName}
              </span>
            )}
            <span className="text-[10px] text-kalkvit/40 ml-auto">
              {FREQUENCY_LABELS[item.frequency] || item.frequency}
            </span>
          </div>

          <h4 className={cn(
            'font-medium text-sm text-kalkvit mb-0.5',
            isDone && 'line-through'
          )}>
            {item.title}
          </h4>

          {item.description && (
            <p className={cn(
              'text-xs text-kalkvit/60 line-clamp-2',
              isDone && 'line-through'
            )}>
              {item.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
