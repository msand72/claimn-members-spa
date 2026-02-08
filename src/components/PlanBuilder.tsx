import { useState } from 'react'
import {
  GlassCard,
  GlassButton,
  GlassInput,
  GlassModal,
  GlassModalFooter,
  GlassBadge,
} from './ui'
import type { SuggestedGoal, SuggestedActionItem } from '../lib/protocol-plan'
import {
  Target,
  Plus,
  X,
  CheckCircle2,
  Loader2,
  ListChecks,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react'
import { cn } from '../lib/utils'

interface PlanBuilderProps {
  isOpen: boolean
  onClose: () => void
  protocolTitle: string
  suggestedGoals: SuggestedGoal[]
  onConfirm: (goals: SuggestedGoal[]) => Promise<void>
  isSubmitting: boolean
  error: string | null
}

export function PlanBuilder({
  isOpen,
  onClose,
  protocolTitle,
  suggestedGoals,
  onConfirm,
  isSubmitting,
  error,
}: PlanBuilderProps) {
  const [goals, setGoals] = useState<SuggestedGoal[]>(suggestedGoals)
  const [expandedGoalIndex, setExpandedGoalIndex] = useState<number>(0)
  const [newItemTitle, setNewItemTitle] = useState('')
  const [addingToGoal, setAddingToGoal] = useState<number | null>(null)

  const totalItems = goals.reduce((sum, g) => sum + g.actionItems.length, 0)

  const handleRemoveItem = (goalIndex: number, itemIndex: number) => {
    setGoals((prev) =>
      prev.map((g, gi) =>
        gi === goalIndex
          ? { ...g, actionItems: g.actionItems.filter((_, ii) => ii !== itemIndex) }
          : g,
      ),
    )
  }

  const handleAddItem = (goalIndex: number) => {
    if (!newItemTitle.trim()) return
    setGoals((prev) =>
      prev.map((g, gi) =>
        gi === goalIndex
          ? {
              ...g,
              actionItems: [
                ...g.actionItems,
                { title: newItemTitle.trim(), priority: 'medium' as const },
              ],
            }
          : g,
      ),
    )
    setNewItemTitle('')
    setAddingToGoal(null)
  }

  const handleTogglePriority = (goalIndex: number, itemIndex: number) => {
    const cycle: Record<string, 'high' | 'medium' | 'low'> = {
      high: 'medium',
      medium: 'low',
      low: 'high',
    }
    setGoals((prev) =>
      prev.map((g, gi) =>
        gi === goalIndex
          ? {
              ...g,
              actionItems: g.actionItems.map((item, ii) =>
                ii === itemIndex
                  ? { ...item, priority: cycle[item.priority] }
                  : item,
              ),
            }
          : g,
      ),
    )
  }

  const handleUpdateGoalTitle = (goalIndex: number, title: string) => {
    setGoals((prev) =>
      prev.map((g, gi) => (gi === goalIndex ? { ...g, title } : g)),
    )
  }

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Up Your Plan"
    >
      <div className="space-y-4">
        <p className="text-sm text-kalkvit/60">
          We've created a suggested plan from <span className="text-koppar font-medium">{protocolTitle}</span>.
          Review the goal and action items below, then confirm to get started.
        </p>

        {/* Summary strip */}
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-kalkvit/70">
            <Target className="w-4 h-4 text-koppar" />
            {goals.length} goal{goals.length !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5 text-kalkvit/70">
            <ListChecks className="w-4 h-4 text-koppar" />
            {totalItems} action item{totalItems !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Goal cards */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {goals.map((goal, goalIndex) => {
            const isExpanded = expandedGoalIndex === goalIndex
            return (
              <GlassCard key={goalIndex} variant="base" className="!p-3">
                {/* Goal header */}
                <button
                  onClick={() => setExpandedGoalIndex(isExpanded ? -1 : goalIndex)}
                  className="w-full flex items-start justify-between text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-koppar flex-shrink-0" />
                      <span className="font-medium text-kalkvit text-sm truncate">
                        {goal.title}
                      </span>
                    </div>
                    <span className="text-xs text-kalkvit/50">
                      {goal.actionItems.length} action item{goal.actionItems.length !== 1 ? 's' : ''}
                      {goal.pillar_id && ` · ${goal.pillar_id}`}
                      {goal.target_date && ` · Target: ${goal.target_date}`}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-kalkvit/50 flex-shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-kalkvit/50 flex-shrink-0 ml-2" />
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    {/* Editable goal title */}
                    <GlassInput
                      label="Goal title"
                      value={goal.title}
                      onChange={(e) => handleUpdateGoalTitle(goalIndex, e.target.value)}
                      className="mb-3"
                    />

                    {/* Action items */}
                    <div className="space-y-1.5">
                      {goal.actionItems.map((item, itemIndex) => (
                        <ActionItemRow
                          key={itemIndex}
                          item={item}
                          onRemove={() => handleRemoveItem(goalIndex, itemIndex)}
                          onTogglePriority={() => handleTogglePriority(goalIndex, itemIndex)}
                        />
                      ))}
                    </div>

                    {/* Add new action item */}
                    {addingToGoal === goalIndex ? (
                      <div className="flex items-center gap-2 mt-2">
                        <GlassInput
                          placeholder="New action item..."
                          value={newItemTitle}
                          onChange={(e) => setNewItemTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddItem(goalIndex)
                            if (e.key === 'Escape') {
                              setAddingToGoal(null)
                              setNewItemTitle('')
                            }
                          }}
                          className="flex-1"
                          autoFocus
                        />
                        <GlassButton
                          variant="primary"
                          className="px-2 py-1.5"
                          onClick={() => handleAddItem(goalIndex)}
                          disabled={!newItemTitle.trim()}
                        >
                          <Plus className="w-4 h-4" />
                        </GlassButton>
                        <GlassButton
                          variant="ghost"
                          className="px-2 py-1.5"
                          onClick={() => {
                            setAddingToGoal(null)
                            setNewItemTitle('')
                          }}
                        >
                          <X className="w-4 h-4" />
                        </GlassButton>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingToGoal(goalIndex)}
                        className="mt-2 flex items-center gap-1.5 text-xs text-koppar hover:text-koppar/80 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add action item
                      </button>
                    )}
                  </div>
                )}
              </GlassCard>
            )
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-tegelrod/10 border border-tegelrod/20 px-4 py-3 text-sm text-tegelrod">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      <GlassModalFooter>
        <GlassButton variant="ghost" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </GlassButton>
        <GlassButton
          variant="primary"
          onClick={() => onConfirm(goals)}
          disabled={isSubmitting || goals.length === 0}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating plan...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Start Protocol
            </>
          )}
        </GlassButton>
      </GlassModalFooter>
    </GlassModal>
  )
}

function ActionItemRow({
  item,
  onRemove,
  onTogglePriority,
}: {
  item: SuggestedActionItem
  onRemove: () => void
  onTogglePriority: () => void
}) {
  const priorityColors = {
    high: 'text-tegelrod bg-tegelrod/10 border-tegelrod/20',
    medium: 'text-koppar bg-koppar/10 border-koppar/20',
    low: 'text-kalkvit/50 bg-white/[0.04] border-white/10',
  }

  return (
    <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.03] group">
      <CheckCircle2 className="w-3.5 h-3.5 text-kalkvit/30 flex-shrink-0" />
      <span className="flex-1 text-sm text-kalkvit/80 truncate" title={item.title}>
        {item.title}
      </span>
      <button
        onClick={onTogglePriority}
        className={cn(
          'px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors',
          priorityColors[item.priority],
        )}
      >
        {item.priority}
      </button>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-kalkvit/30 hover:text-tegelrod transition-all flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
