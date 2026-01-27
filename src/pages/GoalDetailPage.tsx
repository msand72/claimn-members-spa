import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import {
  GlassCard,
  GlassButton,
  GlassBadge,
  GlassInput,
  GlassModal,
  GlassModalFooter,
} from '../components/ui'
import { PILLARS, GOAL_STATUSES } from '../lib/constants'
import { useGoal, useUpdateGoal, useDeleteGoal, useLogKPI } from '../lib/api/hooks'
import type { KPI } from '../lib/api/types'
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
} from 'lucide-react'
import { cn } from '../lib/utils'

export function GoalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // API hooks
  const { data: goal, isLoading, error } = useGoal(id || '')
  const updateGoal = useUpdateGoal()
  const deleteGoal = useDeleteGoal()
  const logKPI = useLogKPI()

  const [showLogModal, setShowLogModal] = useState(false)
  const [selectedKpi, setSelectedKpi] = useState<KPI | null>(null)
  const [logValue, setLogValue] = useState('')

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

  // Get KPIs from goal
  const kpis = goal.kpis || []

  // Calculate overall progress (from goal or average of KPIs)
  const overallProgress = goal.progress

  const handleLogKpi = (kpi: KPI) => {
    setSelectedKpi(kpi)
    setLogValue('')
    setShowLogModal(true)
  }

  const handleSubmitLog = async () => {
    if (!selectedKpi || !logValue) return

    try {
      await logKPI.mutateAsync({
        kpiId: selectedKpi.id,
        data: { value: parseFloat(logValue) },
      })
      setShowLogModal(false)
      setSelectedKpi(null)
      setLogValue('')
    } catch (err) {
      console.error('Failed to log KPI:', err)
    }
  }

  const handleMarkComplete = async () => {
    try {
      await updateGoal.mutateAsync({
        id: goal.id,
        data: { status: 'completed' },
      })
    } catch (err) {
      console.error('Failed to update goal:', err)
    }
  }

  const handleDeleteGoal = async () => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      await deleteGoal.mutateAsync(goal.id)
      navigate('/goals')
    } catch (err) {
      console.error('Failed to delete goal:', err)
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
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">{goal.title}</h1>
            <p className="text-kalkvit/60">{goal.description}</p>
          </div>
          <div className="flex gap-2">
            <GlassButton variant="ghost" className="p-2">
              <Edit2 className="w-4 h-4" />
            </GlassButton>
            <GlassButton variant="ghost" className="p-2">
              <MoreHorizontal className="w-4 h-4" />
            </GlassButton>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <GlassCard variant="elevated" className="text-center py-4">
            <TrendingUp className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">{overallProgress}%</p>
            <p className="text-xs text-kalkvit/50">Overall Progress</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <Target className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">{kpis.length}</p>
            <p className="text-xs text-kalkvit/50">KPIs Tracked</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <Calendar className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">
              {daysUntilTarget !== null && daysUntilTarget > 0 ? daysUntilTarget : '--'}
            </p>
            <p className="text-xs text-kalkvit/50">Days Remaining</p>
          </GlassCard>
        </div>

        {/* Overall Progress Card */}
        <GlassCard variant="elevated" className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-kalkvit">Progress Overview</h3>
            <span className="text-2xl font-bold text-koppar">{overallProgress}%</span>
          </div>
          <div className="h-4 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-koppar to-brandAmber rounded-full transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-kalkvit/50">
            <span>Started {new Date(goal.created_at).toLocaleDateString()}</span>
            {goal.target_date && <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>}
          </div>
        </GlassCard>

        {/* KPIs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-kalkvit">Key Performance Indicators</h3>
            <GlassButton variant="ghost" className="text-sm">
              <Plus className="w-4 h-4" />
              Add KPI
            </GlassButton>
          </div>

          {kpis.length === 0 ? (
            <GlassCard variant="base" className="text-center py-8">
              <Target className="w-10 h-10 text-kalkvit/20 mx-auto mb-3" />
              <p className="text-kalkvit/50 text-sm">No KPIs added yet</p>
              <p className="text-kalkvit/40 text-xs mt-1">Add KPIs to track your progress</p>
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
      </div>
    </MainLayout>
  )
}
