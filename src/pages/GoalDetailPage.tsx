import { useParams, Link } from 'react-router-dom'
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
import type { PillarId, GoalStatus } from '../lib/constants'
import {
  ChevronLeft,
  Target,
  Calendar,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  User,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '../lib/utils'

interface KPILog {
  date: string
  value: number
}

interface KPI {
  id: string
  name: string
  targetValue: number
  currentValue: number
  unit: string
  logs: KPILog[]
}

interface Goal {
  id: string
  title: string
  description: string
  pillar: PillarId
  targetDate: string
  status: GoalStatus
  createdBy: 'member' | 'expert'
  createdAt: string
  kpis: KPI[]
}

// Mock goal data
const mockGoals: Record<string, Goal> = {
  '1': {
    id: '1',
    title: 'Improve Sleep Quality',
    description:
      'Achieve consistent 7+ hours of quality sleep with improved HRV scores and morning energy levels.',
    pillar: 'physical',
    targetDate: '2026-03-15',
    status: 'active',
    createdBy: 'expert',
    createdAt: '2026-01-10',
    kpis: [
      {
        id: 'kpi-1',
        name: 'Hours of Sleep',
        targetValue: 7.5,
        currentValue: 6.8,
        unit: 'hours',
        logs: [
          { date: '2026-01-20', value: 6.5 },
          { date: '2026-01-21', value: 7.0 },
          { date: '2026-01-22', value: 6.2 },
          { date: '2026-01-23', value: 7.2 },
          { date: '2026-01-24', value: 6.8 },
          { date: '2026-01-25', value: 7.1 },
          { date: '2026-01-26', value: 6.8 },
        ],
      },
      {
        id: 'kpi-2',
        name: 'HRV Score',
        targetValue: 50,
        currentValue: 42,
        unit: 'ms',
        logs: [
          { date: '2026-01-20', value: 38 },
          { date: '2026-01-21', value: 41 },
          { date: '2026-01-22', value: 39 },
          { date: '2026-01-23', value: 44 },
          { date: '2026-01-24', value: 43 },
          { date: '2026-01-25', value: 45 },
          { date: '2026-01-26', value: 42 },
        ],
      },
      {
        id: 'kpi-3',
        name: 'Energy Level',
        targetValue: 8,
        currentValue: 6.5,
        unit: '/10',
        logs: [
          { date: '2026-01-20', value: 5 },
          { date: '2026-01-21', value: 6 },
          { date: '2026-01-22', value: 6 },
          { date: '2026-01-23', value: 7 },
          { date: '2026-01-24', value: 7 },
          { date: '2026-01-25', value: 7 },
          { date: '2026-01-26', value: 6.5 },
        ],
      },
    ],
  },
  '2': {
    id: '2',
    title: 'Build Deep Work Habit',
    description:
      'Develop consistent deep work blocks of 90+ minutes with high focus and meaningful output.',
    pillar: 'mission',
    targetDate: '2026-02-28',
    status: 'active',
    createdBy: 'member',
    createdAt: '2026-01-15',
    kpis: [
      {
        id: 'kpi-4',
        name: 'Deep Work Hours',
        targetValue: 4,
        currentValue: 2.5,
        unit: 'hours/day',
        logs: [
          { date: '2026-01-20', value: 1.5 },
          { date: '2026-01-21', value: 2.0 },
          { date: '2026-01-22', value: 2.5 },
          { date: '2026-01-23', value: 3.0 },
          { date: '2026-01-24', value: 2.0 },
          { date: '2026-01-25', value: 2.5 },
          { date: '2026-01-26', value: 2.5 },
        ],
      },
    ],
  },
}

export function GoalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const goal = id ? mockGoals[id] : null

  const [showLogModal, setShowLogModal] = useState(false)
  const [selectedKpi, setSelectedKpi] = useState<KPI | null>(null)
  const [logValue, setLogValue] = useState('')

  if (!goal) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
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

  const pillar = PILLARS[goal.pillar]
  const statusInfo = GOAL_STATUSES.find((s) => s.id === goal.status)

  // Calculate days until target
  const daysUntilTarget = Math.ceil(
    (new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  // Calculate overall progress (average of all KPIs)
  const overallProgress =
    goal.kpis.length > 0
      ? Math.round(
          goal.kpis.reduce((sum, kpi) => {
            const progress = Math.min((kpi.currentValue / kpi.targetValue) * 100, 100)
            return sum + progress
          }, 0) / goal.kpis.length
        )
      : 0

  const handleLogKpi = (kpi: KPI) => {
    setSelectedKpi(kpi)
    setLogValue('')
    setShowLogModal(true)
  }

  const handleSubmitLog = () => {
    // In real app, this would call API
    console.log('Logging KPI:', selectedKpi?.id, logValue)
    setShowLogModal(false)
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
              <GlassBadge variant="koppar">{pillar.name}</GlassBadge>
              <GlassBadge
                variant={goal.status === 'completed' ? 'success' : goal.status === 'paused' ? 'warning' : 'default'}
              >
                {statusInfo?.name || goal.status}
              </GlassBadge>
              {goal.createdBy === 'expert' && (
                <GlassBadge variant="koppar">
                  <User className="w-3 h-3" />
                  Expert Assigned
                </GlassBadge>
              )}
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
            <p className="font-display text-2xl font-bold text-kalkvit">{goal.kpis.length}</p>
            <p className="text-xs text-kalkvit/50">KPIs Tracked</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <Calendar className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">
              {daysUntilTarget > 0 ? daysUntilTarget : 0}
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
            <span>Started {new Date(goal.createdAt).toLocaleDateString()}</span>
            <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
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

          <div className="space-y-4">
            {goal.kpis.map((kpi) => {
              const progress = Math.min((kpi.currentValue / kpi.targetValue) * 100, 100)
              const trend =
                kpi.logs.length >= 2
                  ? kpi.logs[kpi.logs.length - 1].value - kpi.logs[kpi.logs.length - 2].value
                  : 0

              return (
                <GlassCard key={kpi.id} variant="base">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-kalkvit">{kpi.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold text-koppar">
                          {kpi.currentValue}
                          <span className="text-sm font-normal text-kalkvit/50">{kpi.unit}</span>
                        </span>
                        <span className="text-kalkvit/40">/</span>
                        <span className="text-kalkvit/60">
                          {kpi.targetValue}
                          {kpi.unit}
                        </span>
                        {trend !== 0 && (
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded',
                              trend > 0
                                ? 'bg-skogsgron/20 text-skogsgron'
                                : 'bg-tegelrod/20 text-tegelrod'
                            )}
                          >
                            {trend > 0 ? '+' : ''}
                            {trend.toFixed(1)}
                          </span>
                        )}
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

                  {/* Mini Chart / Recent Logs */}
                  <div className="flex items-end gap-1 h-12">
                    {kpi.logs.slice(-7).map((log, index) => {
                      const height = (log.value / kpi.targetValue) * 100
                      return (
                        <div
                          key={index}
                          className="flex-1 bg-koppar/30 rounded-t transition-all hover:bg-koppar/50"
                          style={{ height: `${Math.min(height, 100)}%` }}
                          title={`${log.date}: ${log.value}${kpi.unit}`}
                        />
                      )
                    })}
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-kalkvit/40">
                    <span>7 days ago</span>
                    <span>Today</span>
                  </div>
                </GlassCard>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 flex-wrap">
          <GlassButton variant="secondary">
            <CheckCircle2 className="w-4 h-4" />
            Mark Complete
          </GlassButton>
          <GlassButton variant="ghost">
            <Trash2 className="w-4 h-4" />
            Delete Goal
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
              Current: {selectedKpi?.currentValue}
              {selectedKpi?.unit} | Target: {selectedKpi?.targetValue}
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
            <GlassButton variant="primary" onClick={handleSubmitLog} disabled={!logValue}>
              Log Value
            </GlassButton>
          </GlassModalFooter>
        </GlassModal>
      </div>
    </MainLayout>
  )
}
