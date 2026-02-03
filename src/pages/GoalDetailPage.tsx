import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import {
  GlassCard,
  GlassButton,
  GlassBadge,
  GlassInput,
  GlassModal,
  GlassModalFooter,
  GlassSelect,
} from '../components/ui'
import { PILLARS, GOAL_STATUSES, KPI_TYPES, TRACKING_FREQUENCIES } from '../lib/constants'
import {
  useGoal,
  useUpdateGoal,
  useDeleteGoal,
  useLogKPI,
  useCreateKPI,
  useActionItems,
  useCreateActionItem,
  useToggleActionItem,
  useDeleteActionItem,
} from '../lib/api/hooks'
import type { KPI, ActionItem } from '../lib/api/types'
import {
  ChevronLeft,
  Target,
  Calendar,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  Square,
  CheckSquare,
  ListTodo,
  X,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { AskExpertButton } from '../components/AskExpertButton'

export function GoalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // API hooks
  const { data: goal, isLoading, error } = useGoal(id || '')
  const updateGoal = useUpdateGoal()
  const deleteGoal = useDeleteGoal()
  const logKPI = useLogKPI()
  const createKPI = useCreateKPI()

  // Action items (subtasks) for this goal
  const { data: actionItemsData } = useActionItems({ goal_id: id || '', status: undefined })
  const createActionItem = useCreateActionItem()
  const toggleActionItem = useToggleActionItem()
  const deleteActionItem = useDeleteActionItem()

  const [showLogModal, setShowLogModal] = useState(false)
  const [selectedKpi, setSelectedKpi] = useState<KPI | null>(null)
  const [logValue, setLogValue] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [showAddKpiModal, setShowAddKpiModal] = useState(false)
  const [newKpi, setNewKpi] = useState({ kpiType: '', targetValue: '', frequency: 'daily' })
  const [actionError, setActionError] = useState<string | null>(null)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)

  // IMPORTANT: All hooks (useMemo, useCallback, etc.) must be called BEFORE any early returns.
  // React requires hooks to be called in the same order every render.

  // Get KPIs from goal (safe for null goal)
  const kpis = goal?.kpis || []

  // Get subtasks (action items linked to this goal)
  const subtasks: ActionItem[] = useMemo(() => {
    if (!actionItemsData) return []
    const raw = actionItemsData as any
    if (Array.isArray(raw)) return raw
    if (raw && Array.isArray(raw.data)) return raw.data
    return []
  }, [actionItemsData])

  const completedSubtasks = subtasks.filter((s) => s.status === 'completed').length
  const totalSubtasks = subtasks.length

  // Calculate progress from actual drivers (subtasks + KPIs)
  const hasDrivers = kpis.length > 0 || totalSubtasks > 0
  const calculatedProgress = useMemo(() => {
    if (!hasDrivers) return goal?.progress ?? 0 // fallback to API value
    const parts: number[] = []
    // Subtask progress
    if (totalSubtasks > 0) {
      parts.push((completedSubtasks / totalSubtasks) * 100)
    }
    // KPI progress
    if (kpis.length > 0) {
      const avgKpi = kpis.reduce(
        (sum, k) => sum + Math.min((k.current_value / k.target_value) * 100, 100),
        0
      ) / kpis.length
      parts.push(avgKpi)
    }
    return parts.length > 0 ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0
  }, [hasDrivers, goal?.progress, totalSubtasks, completedSubtasks, kpis])

  // Early returns AFTER all hooks
  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-koppar animate-spin" />
        </div>
      </MainLayout>
    )
  }

  if (error || !goal) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <AlertCircle className="w-12 h-12 text-tegelrod/50 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-kalkvit mb-4">Goal not found</h1>
          <Link to="/goals">
            <GlassButton variant="secondary">
              <ChevronLeft className="w-4 h-4" />
              Back to Goals
            </GlassButton>
          </Link>
        </div>
      </MainLayout>
    )
  }

  const pillar = goal.pillar_id ? PILLARS[goal.pillar_id] : null
  const statusInfo = GOAL_STATUSES.find((s) => s.id === goal.status)

  // Calculate days until target
  const daysUntilTarget = goal.target_date
    ? Math.ceil(
        (new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : null

  const overallProgress = calculatedProgress

  const handleLogKpi = (kpi: KPI) => {
    setSelectedKpi(kpi)
    setLogValue('')
    setShowLogModal(true)
  }

  const handleSubmitLog = async () => {
    if (!selectedKpi || !logValue) return
    setActionError(null)

    try {
      await logKPI.mutateAsync({
        kpiId: selectedKpi.id,
        data: { value: parseFloat(logValue) },
      })
      setShowLogModal(false)
      setSelectedKpi(null)
      setLogValue('')
    } catch (_err) {
      setActionError('Failed to log KPI value. Please try again.')
    }
  }

  const handleMarkComplete = async () => {
    setActionError(null)
    try {
      await updateGoal.mutateAsync({
        id: goal.id,
        data: { status: 'completed' },
      })
    } catch (_err) {
      setActionError('Failed to update goal status. Please try again.')
    }
  }

  const handleDeleteGoal = async () => {
    if (!confirm('Are you sure you want to delete this goal?')) return
    setActionError(null)

    try {
      await deleteGoal.mutateAsync(goal.id)
      navigate('/goals')
    } catch (_err) {
      setActionError('Failed to delete goal. Please try again.')
    }
  }

  const handleStartEdit = () => {
    setEditTitle(goal.title)
    setEditDescription(goal.description || '')
    setIsEditing(true)
    setActionError(null)
  }

  const handleSaveEdit = async () => {
    setActionError(null)
    try {
      await updateGoal.mutateAsync({
        id: goal.id,
        data: {
          title: editTitle,
          description: editDescription,
        },
      })
      setIsEditing(false)
    } catch (_err) {
      setActionError('Failed to save changes. Please try again.')
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditTitle('')
    setEditDescription('')
  }

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !id) return
    setActionError(null)
    try {
      await createActionItem.mutateAsync({
        title: newSubtaskTitle.trim(),
        goal_id: id,
        priority: 'medium',
      })
      setNewSubtaskTitle('')
      setIsAddingSubtask(false)
    } catch (_err) {
      setActionError('Failed to add subtask. Please try again.')
    }
  }

  const handleToggleSubtask = async (item: ActionItem) => {
    setActionError(null)
    try {
      await toggleActionItem.mutateAsync({
        id: item.id,
        completed: item.status !== 'completed',
      })
    } catch (_err) {
      setActionError('Failed to update subtask. Please try again.')
    }
  }

  const handleDeleteSubtask = async (itemId: string) => {
    setActionError(null)
    try {
      await deleteActionItem.mutateAsync(itemId)
    } catch (_err) {
      setActionError('Failed to delete subtask. Please try again.')
    }
  }

  const handleCreateKpi = async () => {
    if (!newKpi.kpiType || !newKpi.targetValue) return
    setActionError(null)

    const selectedKpiType = [...KPI_TYPES.biological, ...KPI_TYPES.action].find(
      (k) => k.id === newKpi.kpiType
    )

    try {
      await createKPI.mutateAsync({
        goalId: goal.id,
        data: {
          name: selectedKpiType?.name || newKpi.kpiType,
          type: 'number',
          target_value: parseFloat(newKpi.targetValue),
          unit: selectedKpiType?.unit || null,
          frequency: newKpi.frequency as 'daily' | 'weekly' | 'monthly',
        },
      })
      setShowAddKpiModal(false)
      setNewKpi({ kpiType: '', targetValue: '', frequency: 'daily' })
    } catch (_err) {
      setActionError('Failed to create KPI. Please try again.')
    }
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <Link
          to="/goals"
          className="inline-flex items-center gap-1 text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Goals
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {pillar && <GlassBadge variant="koppar">{pillar.name}</GlassBadge>}
              <GlassBadge
                variant={goal.status === 'completed' ? 'success' : goal.status === 'archived' ? 'warning' : 'default'}
              >
                {statusInfo?.name || goal.status}
              </GlassBadge>
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <GlassInput
                  label="Title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <GlassInput
                  label="Description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
                <div className="flex gap-2">
                  <GlassButton
                    variant="primary"
                    onClick={handleSaveEdit}
                    disabled={updateGoal.isPending || !editTitle.trim()}
                  >
                    {updateGoal.isPending ? 'Saving...' : 'Save'}
                  </GlassButton>
                  <GlassButton variant="ghost" onClick={handleCancelEdit}>
                    Cancel
                  </GlassButton>
                </div>
              </div>
            ) : (
              <>
                <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">{goal.title}</h1>
                <p className="text-kalkvit/60">{goal.description}</p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <GlassButton variant="ghost" className="p-2" onClick={handleStartEdit}>
              <Edit2 className="w-4 h-4" />
            </GlassButton>
            <GlassButton variant="ghost" className="p-2">
              <MoreHorizontal className="w-4 h-4" />
            </GlassButton>
          </div>
        </div>

        {/* Ask Expert */}
        <div className="mb-6">
          <AskExpertButton
            context={`Goal: ${goal.title}`}
          />
        </div>

        {/* Action Error */}
        {actionError && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-tegelrod/10 border border-tegelrod/30">
            <p className="text-sm text-tegelrod">{actionError}</p>
          </div>
        )}

        {/* Stats */}
        <div className={cn('grid gap-4 mb-8', hasDrivers ? 'grid-cols-3' : 'grid-cols-2')}>
          {hasDrivers && (
            <GlassCard variant="elevated" className="text-center py-4">
              <TrendingUp className="w-6 h-6 text-koppar mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-kalkvit">{overallProgress}%</p>
              <p className="text-xs text-kalkvit/50">Overall Progress</p>
            </GlassCard>
          )}
          <GlassCard variant="base" className="text-center py-4">
            <ListTodo className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">
              {totalSubtasks > 0 ? `${completedSubtasks}/${totalSubtasks}` : '0'}
            </p>
            <p className="text-xs text-kalkvit/50">Subtasks</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <Calendar className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">
              {daysUntilTarget !== null && daysUntilTarget > 0 ? daysUntilTarget : '--'}
            </p>
            <p className="text-xs text-kalkvit/50">Days Remaining</p>
          </GlassCard>
        </div>

        {/* Overall Progress Card — only show when there are actual drivers */}
        {hasDrivers ? (
          <GlassCard variant="elevated" className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-kalkvit">Progress Overview</h3>
              <span className="text-2xl font-bold text-koppar">{overallProgress}%</span>
            </div>
            <div className="h-4 bg-white/10 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  overallProgress >= 100 ? 'bg-skogsgron' : 'bg-gradient-to-r from-koppar to-brandAmber'
                )}
                style={{ width: `${Math.min(overallProgress, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-kalkvit/50">
              <span>Started {new Date(goal.created_at).toLocaleDateString()}</span>
              {goal.target_date && <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>}
            </div>
          </GlassCard>
        ) : (
          <GlassCard variant="base" className="mb-8 text-center py-6">
            <Target className="w-8 h-8 text-kalkvit/20 mx-auto mb-2" />
            <p className="text-sm text-kalkvit/60 mb-1">No progress tracking yet</p>
            <p className="text-xs text-kalkvit/40">Add subtasks or KPIs below to track your progress</p>
          </GlassCard>
        )}

        {/* Subtasks */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-kalkvit">Subtasks</h3>
            {!isAddingSubtask && (
              <GlassButton variant="ghost" className="text-sm" onClick={() => setIsAddingSubtask(true)}>
                <Plus className="w-4 h-4" />
                Add Subtask
              </GlassButton>
            )}
          </div>

          {/* Inline add subtask */}
          {isAddingSubtask && (
            <div className="flex items-center gap-2 mb-3">
              <GlassInput
                placeholder="What needs to be done?"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubtask()
                  if (e.key === 'Escape') { setIsAddingSubtask(false); setNewSubtaskTitle('') }
                }}
                className="flex-1"
                autoFocus
              />
              <GlassButton
                variant="primary"
                onClick={handleAddSubtask}
                disabled={!newSubtaskTitle.trim() || createActionItem.isPending}
                className="px-3 py-2"
              >
                {createActionItem.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </GlassButton>
              <GlassButton
                variant="ghost"
                onClick={() => { setIsAddingSubtask(false); setNewSubtaskTitle('') }}
                className="px-3 py-2"
              >
                <X className="w-4 h-4" />
              </GlassButton>
            </div>
          )}

          {subtasks.length === 0 && !isAddingSubtask ? (
            <GlassCard variant="base" className="text-center py-6">
              <ListTodo className="w-8 h-8 text-kalkvit/20 mx-auto mb-2" />
              <p className="text-kalkvit/50 text-sm mb-2">No subtasks yet</p>
              <GlassButton
                variant="ghost"
                className="text-sm text-koppar"
                onClick={() => setIsAddingSubtask(true)}
              >
                <Plus className="w-4 h-4" />
                Add your first subtask
              </GlassButton>
            </GlassCard>
          ) : (
            <div className="space-y-1">
              {subtasks.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors group',
                    'bg-white/[0.04] hover:bg-white/[0.06]'
                  )}
                >
                  <button
                    onClick={() => handleToggleSubtask(item)}
                    className="flex-shrink-0 text-kalkvit/60 hover:text-koppar transition-colors"
                  >
                    {item.status === 'completed' ? (
                      <CheckSquare className="w-5 h-5 text-skogsgron" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                  <span
                    className={cn(
                      'flex-1 text-sm',
                      item.status === 'completed'
                        ? 'text-kalkvit/40 line-through'
                        : 'text-kalkvit'
                    )}
                  >
                    {item.title}
                  </span>
                  {item.priority === 'high' && (
                    <span className="text-xs text-tegelrod/70 font-medium">High</span>
                  )}
                  <button
                    onClick={() => handleDeleteSubtask(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-kalkvit/30 hover:text-tegelrod transition-all flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {totalSubtasks > 0 && (
                <p className="text-xs text-kalkvit/40 pt-2 px-1">
                  {completedSubtasks} of {totalSubtasks} completed
                </p>
              )}
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-kalkvit">Key Performance Indicators</h3>
            <GlassButton variant="ghost" className="text-sm" onClick={() => setShowAddKpiModal(true)}>
              <Plus className="w-4 h-4" />
              Add KPI
            </GlassButton>
          </div>

          {kpis.length === 0 ? (
            <GlassCard variant="base" className="text-center py-6">
              <Target className="w-8 h-8 text-kalkvit/20 mx-auto mb-2" />
              <p className="text-kalkvit/50 text-sm">No KPIs added yet</p>
              <p className="text-kalkvit/40 text-xs mt-1">Add KPIs to measure specific metrics for this goal</p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {kpis.map((kpi) => {
                const progress = Math.min((kpi.current_value / kpi.target_value) * 100, 100)

                return (
                  <GlassCard key={kpi.id} variant="base">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-kalkvit">{kpi.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-2xl font-bold text-koppar">
                            {kpi.current_value}
                            <span className="text-sm font-normal text-kalkvit/50">{kpi.unit}</span>
                          </span>
                          <span className="text-kalkvit/40">/</span>
                          <span className="text-kalkvit/60">
                            {kpi.target_value}
                            {kpi.unit}
                          </span>
                        </div>
                      </div>
                      <GlassButton variant="primary" onClick={() => handleLogKpi(kpi)}>
                        <Plus className="w-4 h-4" />
                        Log
                      </GlassButton>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-kalkvit/50">Progress</span>
                        <span className="text-xs text-koppar font-medium">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            progress >= 100 ? 'bg-skogsgron' : 'bg-gradient-to-r from-koppar to-brandAmber'
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-kalkvit/40">
                      <span>Type: {kpi.type}</span>
                      <span>Frequency: {kpi.frequency}</span>
                    </div>
                  </GlassCard>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 flex-wrap">
          {goal.status !== 'completed' && (
            <GlassButton
              variant="secondary"
              onClick={handleMarkComplete}
              disabled={updateGoal.isPending}
            >
              <CheckCircle2 className="w-4 h-4" />
              {updateGoal.isPending ? 'Updating...' : 'Mark Complete'}
            </GlassButton>
          )}
          <GlassButton
            variant="ghost"
            onClick={handleDeleteGoal}
            disabled={deleteGoal.isPending}
          >
            <Trash2 className="w-4 h-4" />
            {deleteGoal.isPending ? 'Deleting...' : 'Delete Goal'}
          </GlassButton>
        </div>

        {/* Log KPI Modal */}
        <GlassModal
          isOpen={showLogModal}
          onClose={() => setShowLogModal(false)}
          title={`Log ${selectedKpi?.name || 'KPI'}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-kalkvit/60">
              Current: {selectedKpi?.current_value}
              {selectedKpi?.unit} | Target: {selectedKpi?.target_value}
              {selectedKpi?.unit}
            </p>
            <GlassInput
              label="New Value"
              type="number"
              step="0.1"
              placeholder={`Enter value in ${selectedKpi?.unit || 'units'}`}
              value={logValue}
              onChange={(e) => setLogValue(e.target.value)}
            />
          </div>
          <GlassModalFooter>
            <GlassButton variant="ghost" onClick={() => setShowLogModal(false)}>
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={handleSubmitLog}
              disabled={!logValue || logKPI.isPending}
            >
              {logKPI.isPending ? 'Logging...' : 'Log Value'}
            </GlassButton>
          </GlassModalFooter>
        </GlassModal>

        {/* Add KPI Modal */}
        <GlassModal
          isOpen={showAddKpiModal}
          onClose={() => setShowAddKpiModal(false)}
          title="Add New KPI"
        >
          <div className="space-y-4">
            <GlassSelect
              label="KPI Type"
              options={[
                { value: '', label: 'Select KPI type' },
                ...KPI_TYPES.biological.map((k) => ({ value: k.id, label: `${k.name} (Bio)` })),
                ...KPI_TYPES.action.map((k) => ({ value: k.id, label: `${k.name} (Action)` })),
              ]}
              value={newKpi.kpiType}
              onChange={(e) => setNewKpi({ ...newKpi, kpiType: e.target.value })}
            />
            <GlassInput
              label="Target Value"
              type="number"
              placeholder="Enter target value"
              value={newKpi.targetValue}
              onChange={(e) => setNewKpi({ ...newKpi, targetValue: e.target.value })}
            />
            <GlassSelect
              label="Tracking Frequency"
              options={TRACKING_FREQUENCIES.map((f) => ({ value: f.id, label: f.name }))}
              value={newKpi.frequency}
              onChange={(e) => setNewKpi({ ...newKpi, frequency: e.target.value })}
            />
          </div>
          <GlassModalFooter>
            <GlassButton variant="ghost" onClick={() => setShowAddKpiModal(false)}>
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={handleCreateKpi}
              disabled={!newKpi.kpiType || !newKpi.targetValue || createKPI.isPending}
            >
              {createKPI.isPending ? 'Creating...' : 'Add KPI'}
            </GlassButton>
          </GlassModalFooter>
        </GlassModal>
      </div>
    </MainLayout>
  )
}

export default GoalDetailPage;
