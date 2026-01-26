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
import type { PillarId, ActionItemPriority, ActionItemStatus } from '../lib/constants'
import {
  CheckSquare,
  Plus,
  Circle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  MessageSquare,
} from 'lucide-react'
import { cn } from '../lib/utils'

interface ActionItem {
  id: string
  title: string
  description: string
  source: 'session' | 'call' | 'self' | 'sprint'
  pillar: PillarId | null
  dueDate: string | null
  priority: ActionItemPriority
  status: ActionItemStatus
  createdBy: 'member' | 'expert'
}

// Mock action items
const mockActionItems: ActionItem[] = [
  {
    id: '1',
    title: 'Complete sleep tracking setup',
    description: 'Set up Oura ring sync and configure sleep tracking dashboard',
    source: 'session',
    pillar: 'physical',
    dueDate: '2026-01-28',
    priority: 'high',
    status: 'pending',
    createdBy: 'expert',
  },
  {
    id: '2',
    title: 'Schedule accountability call',
    description: 'Book 30-minute call with accountability partner',
    source: 'call',
    pillar: 'connection',
    dueDate: '2026-01-30',
    priority: 'medium',
    status: 'in_progress',
    createdBy: 'member',
  },
  {
    id: '3',
    title: 'Review values clarification worksheet',
    description: 'Complete the reflection questions from coaching session',
    source: 'session',
    pillar: 'identity',
    dueDate: '2026-02-01',
    priority: 'high',
    status: 'pending',
    createdBy: 'expert',
  },
  {
    id: '4',
    title: 'Try morning breathwork routine',
    description: '10 minutes of box breathing for 7 consecutive days',
    source: 'self',
    pillar: 'emotional',
    dueDate: '2026-02-05',
    priority: 'medium',
    status: 'pending',
    createdBy: 'member',
  },
  {
    id: '5',
    title: 'Update LinkedIn profile',
    description: 'Refresh headline and about section based on new goals',
    source: 'self',
    pillar: 'mission',
    dueDate: null,
    priority: 'low',
    status: 'completed',
    createdBy: 'member',
  },
]

function ActionItemCard({
  item,
  onToggle,
}: {
  item: ActionItem
  onToggle: (id: string) => void
}) {
  const pillar = item.pillar ? PILLARS[item.pillar] : null
  const priorityInfo = ACTION_ITEM_PRIORITIES.find((p) => p.id === item.priority)

  const sourceLabels = {
    session: 'From Session',
    call: 'From Call',
    self: 'Self-Created',
    sprint: 'Sprint Goal',
  }

  const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'completed'

  return (
    <GlassCard
      variant="base"
      className={cn(
        'transition-all',
        item.status === 'completed' && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-4">
        <button
          onClick={() => onToggle(item.id)}
          className="mt-1 flex-shrink-0"
        >
          {item.status === 'completed' ? (
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
              variant={item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'warning' : 'default'}
              className="text-xs"
            >
              {priorityInfo?.name}
            </GlassBadge>
            {item.createdBy === 'expert' && (
              <GlassBadge variant="koppar" className="text-xs">
                <User className="w-3 h-3" />
                Expert
              </GlassBadge>
            )}
          </div>

          <h3
            className={cn(
              'font-medium text-kalkvit mb-1',
              item.status === 'completed' && 'line-through text-kalkvit/50'
            )}
          >
            {item.title}
          </h3>
          <p className="text-sm text-kalkvit/60 mb-3">{item.description}</p>

          <div className="flex items-center gap-4 text-xs text-kalkvit/50">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {sourceLabels[item.source]}
            </span>
            {item.dueDate && (
              <span
                className={cn(
                  'flex items-center gap-1',
                  isOverdue && 'text-tegelrod'
                )}
              >
                {isOverdue && <AlertTriangle className="w-3 h-3" />}
                <Calendar className="w-3 h-3" />
                {new Date(item.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

export function ActionItemsPage() {
  const [items, setItems] = useState(mockActionItems)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    pillar: '',
    dueDate: '',
    priority: 'medium',
  })

  const handleToggle = (id: string) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'completed' ? 'pending' : 'completed' }
          : item
      ) as ActionItem[]
    )
  }

  const filteredItems =
    filter === 'all'
      ? items
      : filter === 'pending'
        ? items.filter((i) => i.status !== 'completed')
        : items.filter((i) => i.status === 'completed')

  // Sort: overdue first, then by priority, then by due date
  const sortedItems = [...filteredItems].sort((a, b) => {
    // Completed items last
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (a.status !== 'completed' && b.status === 'completed') return -1

    // Priority order
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const pendingCount = items.filter((i) => i.status !== 'completed').length
  const completedCount = items.filter((i) => i.status === 'completed').length
  const overdueCount = items.filter(
    (i) => i.dueDate && new Date(i.dueDate) < new Date() && i.status !== 'completed'
  ).length

  const pillarOptions = [
    { value: '', label: 'Select a pillar (optional)' },
    ...PILLAR_IDS.map((id) => ({ value: id, label: PILLARS[id].name })),
  ]

  const priorityOptions = ACTION_ITEM_PRIORITIES.map((p) => ({
    value: p.id,
    label: p.name,
  }))

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Action Items</h1>
            <p className="text-kalkvit/60">Track your commitments and to-dos from sessions and self</p>
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
            <p className="font-display text-2xl font-bold text-kalkvit">{pendingCount}</p>
            <p className="text-xs text-kalkvit/50">Pending</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <CheckCircle2 className="w-6 h-6 text-skogsgron mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">{completedCount}</p>
            <p className="text-xs text-kalkvit/50">Completed</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <AlertTriangle className="w-6 h-6 text-tegelrod mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">{overdueCount}</p>
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
        {sortedItems.length > 0 ? (
          <div className="space-y-3">
            {sortedItems.map((item) => (
              <ActionItemCard key={item.id} item={item} onToggle={handleToggle} />
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
                onChange={(e) => setNewItem({ ...newItem, priority: e.target.value })}
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
            <GlassButton variant="primary" onClick={() => setShowCreateModal(false)}>
              Add Item
            </GlassButton>
          </GlassModalFooter>
        </GlassModal>
      </div>
    </MainLayout>
  )
}
