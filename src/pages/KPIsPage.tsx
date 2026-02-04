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
} from '../components/ui'
import { KPI_TYPES, TRACKING_FREQUENCIES, PILLARS, PILLAR_IDS } from '../lib/constants'
import { useKPIs, useLogKPI, useCreateKPI, useGoals } from '../lib/api/hooks'
import type { KPI } from '../lib/api/types'
import {
  TrendingUp,
  Plus,
  Activity,
  Moon,
  Flame,
  Calendar,
  ChevronRight,
  BarChart3,
  Target,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '../lib/utils'

const getKpiIcon = (kpiType: string) => {
  switch (kpiType) {
    case 'number':
      return BarChart3
    case 'percentage':
      return TrendingUp
    case 'boolean':
      return Activity
    case 'time':
      return Moon
    default:
      return BarChart3
  }
}

function KPICard({ kpi, onLog }: { kpi: KPI; onLog: (kpi: KPI) => void }) {
  const Icon = getKpiIcon(kpi.type)
  const progress = Math.min(100, (kpi.current_value / kpi.target_value) * 100)
  const isOnTarget = kpi.current_value >= kpi.target_value

  return (
    <GlassCard variant="base" className="hover:border-koppar/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-koppar/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-koppar" />
          </div>
          <div>
            <h3 className="font-semibold text-kalkvit">{kpi.name}</h3>
            <span className="text-xs text-kalkvit/50 capitalize">{kpi.frequency}</span>
          </div>
        </div>
      </div>

      {/* Current vs Target */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="font-display text-2xl sm:text-3xl font-bold text-kalkvit">
          {kpi.current_value}
        </span>
        <span className="text-kalkvit/40">/ {kpi.target_value} {kpi.unit}</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isOnTarget ? 'bg-skogsgron' : 'bg-koppar'
            )}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-kalkvit/50">
            {progress.toFixed(0)}% of target
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <GlassBadge variant="default" className="text-xs capitalize">
          {kpi.type}
        </GlassBadge>
        <GlassButton variant="ghost" onClick={() => onLog(kpi)}>
          Log Progress
          <ChevronRight className="w-4 h-4" />
        </GlassButton>
      </div>
    </GlassCard>
  )
}

export function KPIsPage() {
  const [showLogModal, setShowLogModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedKpi, setSelectedKpi] = useState<KPI | null>(null)
  const [logValue, setLogValue] = useState('')
  const [filter, setFilter] = useState<'all' | 'number' | 'percentage' | 'boolean' | 'time'>('all')
  const [newKpi, setNewKpi] = useState({
    kpiType: '',
    targetValue: '',
    pillar: '',
    frequency: 'daily',
    goalId: '',
  })

  const [actionError, setActionError] = useState<string | null>(null)

  // API hooks
  const { data: kpisData, isLoading, error } = useKPIs()
  const logKPI = useLogKPI()
  const createKPI = useCreateKPI()
  const { data: goalsData } = useGoals()

  const kpis = Array.isArray(kpisData?.data) ? kpisData.data : []
  const goals = Array.isArray(goalsData?.data) ? goalsData.data : []

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

  const handleCreateKpi = async () => {
    if (!newKpi.kpiType || !newKpi.targetValue || !newKpi.goalId) return
    setActionError(null)

    const selectedKpiType = [...KPI_TYPES.biological, ...KPI_TYPES.action].find(
      (k) => k.id === newKpi.kpiType
    )

    try {
      await createKPI.mutateAsync({
        goalId: newKpi.goalId,
        data: {
          name: selectedKpiType?.name || newKpi.kpiType,
          type: 'number',
          target_value: parseFloat(newKpi.targetValue),
          unit: selectedKpiType?.unit || null,
          frequency: newKpi.frequency as 'daily' | 'weekly' | 'monthly',
        },
      })
      setShowCreateModal(false)
      setNewKpi({ kpiType: '', targetValue: '', pillar: '', frequency: 'daily', goalId: '' })
    } catch (_err) {
      setActionError('Failed to create KPI. Please try again.')
    }
  }

  const filteredKPIs = kpis.filter((kpi) => {
    if (filter === 'all') return true
    return kpi.type === filter
  })

  // Stats
  const kpisOnTarget = kpis.filter((k) => k.current_value >= k.target_value).length
  const avgProgress = kpis.length > 0
    ? Math.round(
        kpis.reduce((sum, k) => sum + (k.current_value / k.target_value) * 100, 0) / kpis.length
      )
    : 0

  const kpiTypeOptions = [
    { value: '', label: 'Select KPI type' },
    { value: 'divider-bio', label: '── Biological ──', disabled: true },
    ...KPI_TYPES.biological.map((k) => ({ value: k.id, label: k.name })),
    { value: 'divider-action', label: '── Action ──', disabled: true },
    ...KPI_TYPES.action.map((k) => ({ value: k.id, label: k.name })),
  ]

  const pillarOptions = [
    { value: '', label: 'Select pillar (optional)' },
    ...PILLAR_IDS.map((id) => ({ value: id, label: PILLARS[id].name })),
  ]

  const frequencyOptions = TRACKING_FREQUENCIES.map((f) => ({
    value: f.id,
    label: f.name,
  }))

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">KPI Tracking</h1>
            <p className="text-kalkvit/60">Monitor your key performance indicators and track progress</p>
          </div>
          <GlassButton variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Add KPI
          </GlassButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <GlassCard variant="base" className="text-center py-4">
            <BarChart3 className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">{kpis.length}</p>
            <p className="text-xs text-kalkvit/50">Active KPIs</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <Target className="w-6 h-6 text-skogsgron mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">{kpisOnTarget}</p>
            <p className="text-xs text-kalkvit/50">On Target</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <TrendingUp className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">{avgProgress}%</p>
            <p className="text-xs text-kalkvit/50">Avg Progress</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <Flame className="w-6 h-6 text-tegelrod mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">--</p>
            <p className="text-xs text-kalkvit/50">Best Streak</p>
          </GlassCard>
        </div>

        {/* Action Error */}
        {actionError && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-tegelrod/10 border border-tegelrod/30">
            <p className="text-sm text-tegelrod">{actionError}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', 'number', 'percentage', 'boolean', 'time'] as const).map((f) => (
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

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-koppar animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <GlassCard variant="base" className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-tegelrod/50 mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">Failed to load KPIs</h3>
            <p className="text-kalkvit/50 text-sm">Please try again later</p>
          </GlassCard>
        )}

        {/* KPI Grid */}
        {!isLoading && !error && filteredKPIs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKPIs.map((kpi) => (
              <KPICard key={kpi.id} kpi={kpi} onLog={handleLogKpi} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && kpis.length === 0 && (
          <GlassCard variant="base" className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-kalkvit/20 mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">No KPIs yet</h3>
            <p className="text-kalkvit/50 text-sm mb-4">
              Start tracking your progress by adding KPIs to your goals
            </p>
            <GlassButton variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4" />
              Add KPI
            </GlassButton>
          </GlassCard>
        )}

        {/* Daily Log Reminder */}
        {!isLoading && kpis.length > 0 && (
          <GlassCard variant="accent" className="mt-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-koppar/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-koppar" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-kalkvit mb-1">Daily Check-in</h3>
                <p className="text-sm text-kalkvit/60">
                  You have {kpis.filter((k) => k.frequency === 'daily').length} daily KPIs to log today.
                  Keep your progress going!
                </p>
              </div>
              <GlassButton variant="primary">
                Log All
              </GlassButton>
            </div>
          </GlassCard>
        )}

        {/* Log KPI Modal */}
        <GlassModal
          isOpen={showLogModal}
          onClose={() => setShowLogModal(false)}
          title={`Log ${selectedKpi?.name}`}
        >
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className="text-kalkvit/60 mb-2">Current value</p>
              <p className="font-display text-4xl font-bold text-kalkvit">
                {selectedKpi?.current_value} <span className="text-xl text-kalkvit/40">{selectedKpi?.unit}</span>
              </p>
              <p className="text-sm text-kalkvit/50 mt-1">
                Target: {selectedKpi?.target_value} {selectedKpi?.unit}
              </p>
            </div>
            <GlassInput
              label="New Value"
              type="number"
              placeholder={`Enter ${selectedKpi?.unit || 'value'}`}
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
              {logKPI.isPending ? 'Logging...' : 'Log Progress'}
            </GlassButton>
          </GlassModalFooter>
        </GlassModal>

        {/* Create KPI Modal */}
        <GlassModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Add New KPI"
        >
          <div className="space-y-4">
            <GlassSelect
              label="Goal"
              options={[
                { value: '', label: 'Select a goal' },
                ...goals.map((g) => ({ value: g.id, label: g.title })),
              ]}
              value={newKpi.goalId}
              onChange={(e) => setNewKpi({ ...newKpi, goalId: e.target.value })}
            />
            <GlassSelect
              label="KPI Type"
              options={kpiTypeOptions}
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
              label="Related Pillar"
              options={pillarOptions}
              value={newKpi.pillar}
              onChange={(e) => setNewKpi({ ...newKpi, pillar: e.target.value })}
            />
            <GlassSelect
              label="Tracking Frequency"
              options={frequencyOptions}
              value={newKpi.frequency}
              onChange={(e) => setNewKpi({ ...newKpi, frequency: e.target.value })}
            />
          </div>
          <GlassModalFooter>
            <GlassButton variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={handleCreateKpi}
              disabled={!newKpi.goalId || !newKpi.kpiType || !newKpi.targetValue || createKPI.isPending}
            >
              {createKPI.isPending ? 'Creating...' : 'Add KPI'}
            </GlassButton>
          </GlassModalFooter>
        </GlassModal>
      </div>
    </MainLayout>
  )
}

export default KPIsPage;
