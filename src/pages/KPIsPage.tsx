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
import type { PillarId, TrackingFrequency } from '../lib/constants'
import {
  TrendingUp,
  Plus,
  Activity,
  Moon,
  Heart,
  Zap,
  Flame,
  Calendar,
  ChevronRight,
  BarChart3,
  Target,
} from 'lucide-react'
import { cn } from '../lib/utils'

interface KPIEntry {
  id: string
  kpiTypeId: string
  name: string
  targetValue: number
  currentValue: number
  unit: string
  pillar: PillarId | null
  frequency: TrackingFrequency
  streak: number
  lastLogged: string | null
  history: { date: string; value: number }[]
}

// Mock KPI data
const mockKPIs: KPIEntry[] = [
  {
    id: '1',
    kpiTypeId: 'sleep_hours',
    name: 'Sleep Hours',
    targetValue: 7.5,
    currentValue: 6.8,
    unit: 'hours',
    pillar: 'physical',
    frequency: 'daily',
    streak: 12,
    lastLogged: '2026-01-26',
    history: [
      { date: '2026-01-20', value: 6.5 },
      { date: '2026-01-21', value: 7.0 },
      { date: '2026-01-22', value: 6.2 },
      { date: '2026-01-23', value: 7.5 },
      { date: '2026-01-24', value: 6.8 },
      { date: '2026-01-25', value: 7.2 },
      { date: '2026-01-26', value: 6.8 },
    ],
  },
  {
    id: '2',
    kpiTypeId: 'stress_level',
    name: 'Stress Level',
    targetValue: 3,
    currentValue: 5,
    unit: '/10',
    pillar: 'emotional',
    frequency: 'daily',
    streak: 8,
    lastLogged: '2026-01-26',
    history: [
      { date: '2026-01-20', value: 6 },
      { date: '2026-01-21', value: 5 },
      { date: '2026-01-22', value: 7 },
      { date: '2026-01-23', value: 4 },
      { date: '2026-01-24', value: 5 },
      { date: '2026-01-25', value: 4 },
      { date: '2026-01-26', value: 5 },
    ],
  },
  {
    id: '3',
    kpiTypeId: 'habit_streak',
    name: 'Morning Routine',
    targetValue: 30,
    currentValue: 12,
    unit: 'days',
    pillar: 'identity',
    frequency: 'daily',
    streak: 12,
    lastLogged: '2026-01-26',
    history: [],
  },
  {
    id: '4',
    kpiTypeId: 'hrv',
    name: 'HRV',
    targetValue: 60,
    currentValue: 52,
    unit: 'ms',
    pillar: 'physical',
    frequency: 'daily',
    streak: 5,
    lastLogged: '2026-01-26',
    history: [
      { date: '2026-01-22', value: 48 },
      { date: '2026-01-23', value: 51 },
      { date: '2026-01-24', value: 49 },
      { date: '2026-01-25', value: 54 },
      { date: '2026-01-26', value: 52 },
    ],
  },
  {
    id: '5',
    kpiTypeId: 'exercise_frequency',
    name: 'Weekly Workouts',
    targetValue: 4,
    currentValue: 3,
    unit: 'sessions',
    pillar: 'physical',
    frequency: 'weekly',
    streak: 6,
    lastLogged: '2026-01-25',
    history: [],
  },
  {
    id: '6',
    kpiTypeId: 'energy_level',
    name: 'Energy Level',
    targetValue: 8,
    currentValue: 6,
    unit: '/10',
    pillar: 'physical',
    frequency: 'daily',
    streak: 3,
    lastLogged: '2026-01-26',
    history: [],
  },
]

const getKpiIcon = (kpiTypeId: string) => {
  switch (kpiTypeId) {
    case 'sleep_hours':
    case 'sleep_quality':
      return Moon
    case 'hrv':
    case 'exercise_frequency':
      return Heart
    case 'stress_level':
      return Activity
    case 'energy_level':
      return Zap
    case 'habit_streak':
      return Flame
    default:
      return BarChart3
  }
}

function KPICard({ kpi, onLog }: { kpi: KPIEntry; onLog: (kpi: KPIEntry) => void }) {
  const Icon = getKpiIcon(kpi.kpiTypeId)
  const pillar = kpi.pillar ? PILLARS[kpi.pillar] : null
  const progress = Math.min(100, (kpi.currentValue / kpi.targetValue) * 100)
  const isOnTarget = kpi.currentValue >= kpi.targetValue

  return (
    <GlassCard variant="base" className="hover:border-koppar/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-koppar/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-koppar" />
          </div>
          <div>
            <h3 className="font-semibold text-kalkvit">{kpi.name}</h3>
            {pillar && (
              <span className="text-xs text-kalkvit/50">{pillar.name}</span>
            )}
          </div>
        </div>
        {kpi.streak > 0 && (
          <div className="flex items-center gap-1 text-tegelrod">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-medium">{kpi.streak}</span>
          </div>
        )}
      </div>

      {/* Current vs Target */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="font-display text-3xl font-bold text-kalkvit">
          {kpi.currentValue}
        </span>
        <span className="text-kalkvit/40">/ {kpi.targetValue} {kpi.unit}</span>
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
          {kpi.lastLogged && (
            <span className="text-xs text-kalkvit/50">
              Last: {new Date(kpi.lastLogged).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Mini Chart (last 7 values) */}
      {kpi.history.length > 0 && (
        <div className="flex items-end gap-1 h-12 mb-4 px-2">
          {kpi.history.slice(-7).map((entry, i) => {
            const maxVal = Math.max(...kpi.history.map((h) => h.value), kpi.targetValue)
            const height = (entry.value / maxVal) * 100
            return (
              <div
                key={i}
                className="flex-1 bg-koppar/40 rounded-t transition-all hover:bg-koppar/60"
                style={{ height: `${height}%` }}
                title={`${entry.date}: ${entry.value}`}
              />
            )
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <GlassBadge variant="default" className="text-xs capitalize">
          {kpi.frequency}
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
  const [selectedKpi, setSelectedKpi] = useState<KPIEntry | null>(null)
  const [logValue, setLogValue] = useState('')
  const [filter, setFilter] = useState<'all' | 'biological' | 'action'>('all')
  const [newKpi, setNewKpi] = useState({
    kpiType: '',
    targetValue: '',
    pillar: '',
    frequency: 'daily',
  })

  const handleLogKpi = (kpi: KPIEntry) => {
    setSelectedKpi(kpi)
    setLogValue('')
    setShowLogModal(true)
  }

  const handleSubmitLog = () => {
    // In real app, would call API
    console.log('Logging KPI:', selectedKpi?.id, 'Value:', logValue)
    setShowLogModal(false)
    setSelectedKpi(null)
  }

  const filteredKPIs = mockKPIs.filter((kpi) => {
    if (filter === 'all') return true
    const isBiological = KPI_TYPES.biological.some((k) => k.id === kpi.kpiTypeId)
    return filter === 'biological' ? isBiological : !isBiological
  })

  // Stats
  const totalStreak = Math.max(...mockKPIs.map((k) => k.streak))
  const kpisOnTarget = mockKPIs.filter((k) => k.currentValue >= k.targetValue).length
  const avgProgress = Math.round(
    mockKPIs.reduce((sum, k) => sum + (k.currentValue / k.targetValue) * 100, 0) / mockKPIs.length
  )

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
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">KPI Tracking</h1>
            <p className="text-kalkvit/60">Monitor your key performance indicators and maintain your streaks</p>
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
            <p className="font-display text-2xl font-bold text-kalkvit">{mockKPIs.length}</p>
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
            <p className="font-display text-2xl font-bold text-kalkvit">{totalStreak}</p>
            <p className="text-xs text-kalkvit/50">Best Streak</p>
          </GlassCard>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'biological', 'action'] as const).map((f) => (
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
              {f === 'biological' ? 'Health & Bio' : f === 'action' ? 'Habits & Actions' : f}
            </button>
          ))}
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKPIs.map((kpi) => (
            <KPICard key={kpi.id} kpi={kpi} onLog={handleLogKpi} />
          ))}
        </div>

        {/* Daily Log Reminder */}
        <GlassCard variant="accent" className="mt-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-koppar/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-koppar" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-kalkvit mb-1">Daily Check-in</h3>
              <p className="text-sm text-kalkvit/60">
                You have {mockKPIs.filter((k) => k.frequency === 'daily').length} daily KPIs to log today.
                Keep your streaks alive!
              </p>
            </div>
            <GlassButton variant="primary">
              Log All
            </GlassButton>
          </div>
        </GlassCard>

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
                {selectedKpi?.currentValue} <span className="text-xl text-kalkvit/40">{selectedKpi?.unit}</span>
              </p>
              <p className="text-sm text-kalkvit/50 mt-1">
                Target: {selectedKpi?.targetValue} {selectedKpi?.unit}
              </p>
            </div>
            <GlassInput
              label="New Value"
              type="number"
              placeholder={`Enter ${selectedKpi?.unit || 'value'}`}
              value={logValue}
              onChange={(e) => setLogValue(e.target.value)}
            />
            {selectedKpi?.streak && selectedKpi.streak > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-tegelrod/10 border border-tegelrod/20">
                <Flame className="w-5 h-5 text-tegelrod" />
                <span className="text-sm text-kalkvit">
                  Current streak: <strong>{selectedKpi.streak} days</strong> - don't break it!
                </span>
              </div>
            )}
          </div>
          <GlassModalFooter>
            <GlassButton variant="ghost" onClick={() => setShowLogModal(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" onClick={handleSubmitLog}>
              Log Progress
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
            <GlassButton variant="primary" onClick={() => setShowCreateModal(false)}>
              Add KPI
            </GlassButton>
          </GlassModalFooter>
        </GlassModal>
      </div>
    </MainLayout>
  )
}
