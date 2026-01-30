import { useState } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import {
  GlassCard,
  GlassButton,
  GlassInput,
  GlassBadge,
  GlassModal,
  GlassModalFooter,
  GlassSelect,
  GlassTextarea,
} from '../components/ui'
import { PILLARS, PILLAR_IDS, ACTION_ITEM_PRIORITIES } from '../lib/constants'
import type { PillarId, ActionItemPriority } from '../lib/constants'
import {
  useActionItems,
  useCreateActionItem,
  useToggleActionItem,
} from '../lib/api/hooks'
import type { ActionItem, CreateActionItemRequest } from '../lib/api/types'
import {
  CheckSquare,
  Plus,
  Circle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Loader2,
} from 'lucide-react'
import { cn } from '../lib/utils'

function ActionItemCard({
  item,
  onToggle,
  isToggling,
}: {
  item: ActionItem
  onToggle: (id: string, completed: boolean) => void
  isToggling: boolean
}) {
  const pillarId = item.description?.match(/pillar:(\w+)/)?.[1] as PillarId | undefined
  const pillar = pillarId ? PILLARS[pillarId] : null
  const priorityInfo = ACTION_ITEM_PRIORITIES.find((p) => p.id === item.priority)

  const isOverdue =
    item.due_date && new Date(item.due_date) < new Date() && item.status !== 'completed'
  const isCompleted = item.status === 'completed'

  return (
    <GlassCard
      variant="base"
      className={cn('transition-all', isCompleted && 'opacity-60')}
    >
      <div className="flex items-start gap-4">
        <button
          onClick={() => onToggle(item.id, !isCompleted)}
          className="mt-1 flex-shrink-0"
          disabled={isToggling}
        >
          {isToggling ? (
            <Loader2 className="w-6 h-6 text-kalkvit/30 animate-spin" />
          ) : isCompleted ? (
            <CheckCircle2 className="w-6 h-6 text-skogsgron" />
          ) : (
            <Circle className="w-6 h-6 text-kalkvit/30 hover:text-koppar transition-colors" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {pillar && (
              <GlassBadge variant="koppar" className="text-xs">
                {pillar.name}
              </GlassBadge>
            )}
            <GlassBadge
              variant={
                item.priority === 'high'
                  ? 'error'
                  : item.priority === 'medium'
                    ? 'warning'
                    : 'default'
              }
              className="text-xs"
            >
              {priorityInfo?.name}
            </GlassBadge>
            {item.goal_id && (
              <GlassBadge variant="koppar" className="text-xs">
                <User className="w-3 h-3" />
                Goal Linked
              </GlassBadge>
            )}
          </div>

          <h3
            className={cn(
              'font-medium text-kalkvit mb-1',
              isCompleted && 'line-through text-kalkvit/50'
            )}
          >
            {item.title}
          </h3>
          {item.description && (
            <p className="text-sm text-kalkvit/60 mb-3">{item.description}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-kalkvit/50">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Created {new Date(item.created_at).toLocaleDateString()}
            </span>
            {item.due_date && (
              <span
                className={cn('flex items-center gap-1', isOverdue && 'text-tegelrod')}
              >
                {isOverdue && <AlertTriangle className="w-3 h-3" />}
                <Clock className="w-3 h-3" />
                Due {new Date(item.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

export function ActionItemsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [newItem, setNewItem] = useState<{
    title: string
    description: string
    pillar: string
    dueDate: string
    priority: ActionItemPriority
  }>({
    title: '',
    description: '',
    pillar: '',
    dueDate: '',
    priority: 'medium',
  })
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // API hooks
  const { data: actionItemsData, isLoading, error } = useActionItems()
  const createMutation = useCreateActionItem()
  const toggleMutation = useToggleActionItem()

  const items = actionItemsData?.data || []

  const handleToggle = async (id: string, completed: boolean) => {
    setTogglingId(id)
    try {
      await toggleMutation.mutateAsync({ id, completed })
    } finally {
      setTogglingId(null)
    }
  }

  const handleCreate = async () => {
    if (!newItem.title.trim()) return

    const request: CreateActionItemRequest = {
      title: newItem.title,
      description: newItem.pillar
        ? `${newItem.description}\npillar:${newItem.pillar}`
        : newItem.description,
      priority: newItem.priority,
      due_date: newItem.dueDate || undefined,
    }

    try {
      await createMutation.mutateAsync(request)
      setShowCreateModal(false)
      setNewItem({
        title: '',
        description: '',
        pillar: '',
        dueDate: '',
        priority: 'medium',
      })
    } catch {
      // Error handled by mutation
    }
  }

  const filteredItems =
    filter === 'all'
      ? items
      : filter === 'pending'
        ? items.filter((i) => i.status !== 'completed')
        : items.filter((i) => i.status === 'completed')

  // Sort: completed items last, then by priority
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (a.status !== 'completed' && b.status === 'completed') return -1

    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const pendingCount = items.filter((i) => i.status !== 'completed').length
  const completedCount = items.filter((i) => i.status === 'completed').length
  const overdueCount = items.filter(
    (i) => i.due_date && new Date(i.due_date) < new Date() && i.status !== 'completed'
  ).length

  const pillarOptions = [
    { value: '', label: 'Select a pillar (optional)' },
    ...PILLAR_IDS.map((id) => ({ value: id, label: PILLARS[id].name })),
  ]

  const priorityOptions = ACTION_ITEM_PRIORITIES.map((p) => ({
    value: p.id,
    label: p.name,
  }))

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <GlassCard variant="base" className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-tegelrod mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">Failed to load action items</h3>
            <p className="text-kalkvit/50 text-sm">
              Please try refreshing the page or check your connection.
            </p>
          </GlassCard>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">
              Action Items
            </h1>
            <p className="text-kalkvit/60">
              Track your commitments and to-dos from sessions and self
            </p>
          </div>
          <GlassButton variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Add Item
          </GlassButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <GlassCard variant="base" className="text-center py-4">
            <Clock className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">
              {isLoading ? '-' : pendingCount}
            </p>
            <p className="text-xs text-kalkvit/50">Pending</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <CheckCircle2 className="w-6 h-6 text-skogsgron mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">
              {isLoading ? '-' : completedCount}
            </p>
            <p className="text-xs text-kalkvit/50">Completed</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <AlertTriangle className="w-6 h-6 text-tegelrod mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">
              {isLoading ? '-' : overdueCount}
            </p>
            <p className="text-xs text-kalkvit/50">Overdue</p>
          </GlassCard>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize',
                filter === f
                  ? 'bg-koppar text-kalkvit'
                  : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1]'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Action Items List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-koppar animate-spin" />
          </div>
        ) : sortedItems.length > 0 ? (
          <div className="space-y-3">
            {sortedItems.map((item) => (
              <ActionItemCard
                key={item.id}
                item={item}
                onToggle={handleToggle}
                isToggling={togglingId === item.id}
              />
            ))}
          </div>
        ) : (
          <GlassCard variant="base" className="text-center py-12">
            <CheckSquare className="w-12 h-12 text-kalkvit/20 mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">No action items</h3>
            <p className="text-kalkvit/50 text-sm mb-4">
              Create an action item or they'll appear here after coaching sessions
            </p>
            <GlassButton variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4" />
              Add Item
            </GlassButton>
          </GlassCard>
        )}

        {/* Create Modal */}
        <GlassModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Add Action Item"
        >
          <div className="space-y-4">
            <GlassInput
              label="Title"
              placeholder="What needs to be done?"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
            />
            <GlassTextarea
              label="Description"
              placeholder="Add more details..."
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <GlassSelect
                label="Priority"
                options={priorityOptions}
                value={newItem.priority}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    priority: e.target.value as ActionItemPriority,
                  })
                }
              />
              <GlassSelect
                label="Pillar"
                options={pillarOptions}
                value={newItem.pillar}
                onChange={(e) => setNewItem({ ...newItem, pillar: e.target.value })}
              />
            </div>
            <GlassInput
              label="Due Date"
              type="date"
              value={newItem.dueDate}
              onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
            />
          </div>
          <GlassModalFooter>
            <GlassButton variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={handleCreate}
              disabled={!newItem.title.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Add Item'
              )}
            </GlassButton>
          </GlassModalFooter>
        </GlassModal>
      </div>
    </MainLayout>
  )
}

export default ActionItemsPage;
