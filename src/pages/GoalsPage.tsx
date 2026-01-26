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
import { PILLARS, PILLAR_IDS, GOAL_STATUSES } from '../lib/constants'
import type { PillarId, GoalStatus } from '../lib/constants'
import {
  Target,
  Plus,
  ChevronRight,
  TrendingUp,
  Calendar,
  Flame,
  Trophy,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '../lib/utils'

interface Goal {
  id: string
  title: string
  description: string
  pillar: PillarId | null
  targetDate: string | null
  status: GoalStatus
  createdBy: 'member' | 'expert'
  progress: number
  kpis: KPI[]
}

interface KPI {
  id: string
  name: string
  targetValue: number
  currentValue: number
  unit: string
}

// Mock goals data
const mockGoals: Goal[] = [
  {
    id: '1',
    title: 'Improve sleep quality',
    description: 'Establish consistent sleep routine and optimize sleep environment',
    pillar: 'physical',
    targetDate: '2026-04-26',
    status: 'active',
    createdBy: 'expert',
    progress: 65,
    kpis: [
      { id: 'k1', name: 'Sleep Hours', targetValue: 7.5, currentValue: 6.8, unit: 'hours' },
      { id: 'k2', name: 'Sleep Quality', targetValue: 8, currentValue: 6, unit: '/10' },
    ],
  },
  {
    id: '2',
    title: 'Build morning routine',
    description: 'Create a consistent morning routine with breathwork and exercise',
    pillar: 'emotional',
    targetDate: '2026-03-15',
    status: 'active',
    createdBy: 'member',
    progress: 40,
    kpis: [
      { id: 'k3', name: 'Routine Streak', targetValue: 30, currentValue: 12, unit: 'days' },
    ],
  },
  {
    id: '3',
    title: 'Strengthen key relationships',
    description: 'Schedule regular check-ins with 5 close friends and family members',
    pillar: 'connection',
    targetDate: '2026-06-01',
    status: 'active',
    createdBy: 'member',
    progress: 20,
    kpis: [
      { id: 'k4', name: 'Weekly Connections', targetValue: 3, currentValue: 1, unit: 'calls' },
    ],
  },
]

function GoalCard({ goal }: { goal: Goal }) {
  const pillar = goal.pillar ? PILLARS[goal.pillar] : null
  const statusInfo = GOAL_STATUSES.find((s) => s.id === goal.status)

  return (
    <GlassCard variant="base" className="hover:border-koppar/30 transition-colors cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {pillar && (
            <GlassBadge variant="koppar" className="text-xs">
              {pillar.name}
            </GlassBadge>
          )}
          {goal.createdBy === 'expert' && (
            <GlassBadge variant="koppar" className="text-xs">
              Expert Assigned
            </GlassBadge>
          )}
        </div>
        <GlassBadge
          variant={goal.status === 'completed' ? 'success' : 'default'}
          className="text-xs"
        >
          {statusInfo?.name}
        </GlassBadge>
      </div>

      <h3 className="font-semibold text-kalkvit mb-2">{goal.title}</h3>
      <p className="text-sm text-kalkvit/60 mb-4 line-clamp-2">{goal.description}</p>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-kalkvit/60">Progress</span>
          <span className="text-koppar font-medium">{goal.progress}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-koppar rounded-full transition-all"
            style={{ width: `${goal.progress}%` }}
          />
        </div>
      </div>

      {/* KPIs */}
      {goal.kpis.length > 0 && (
        <div className="space-y-2 mb-4">
          {goal.kpis.slice(0, 2).map((kpi) => (
            <div
              key={kpi.id}
              className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/[0.04]"
            >
              <span className="text-kalkvit/70">{kpi.name}</span>
              <span className="text-kalkvit">
                {kpi.currentValue}
                <span className="text-kalkvit/40">/{kpi.targetValue}</span> {kpi.unit}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        {goal.targetDate && (
          <span className="text-xs text-kalkvit/50 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(goal.targetDate).toLocaleDateString()}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-kalkvit/30" />
      </div>
    </GlassCard>
  )
}

export function GoalsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    pillar: '',
    targetDate: '',
  })

  const filteredGoals =
    filter === 'all' ? mockGoals : mockGoals.filter((g) => g.status === filter)

  const activeGoals = mockGoals.filter((g) => g.status === 'active').length
  const completedGoals = mockGoals.filter((g) => g.status === 'completed').length
  const totalProgress = Math.round(
    mockGoals.reduce((sum, g) => sum + g.progress, 0) / mockGoals.length
  )

  const pillarOptions = [
    { value: '', label: 'Select a pillar (optional)' },
    ...PILLAR_IDS.map((id) => ({ value: id, label: PILLARS[id].name })),
  ]

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Goals & KPIs</h1>
            <p className="text-kalkvit/60">Track your transformation goals and key performance indicators</p>
          </div>
          <GlassButton variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Create Goal
          </GlassButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <GlassCard variant="base" className="text-center py-4">
            <Target className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">{activeGoals}</p>
            <p className="text-xs text-kalkvit/50">Active Goals</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <CheckCircle2 className="w-6 h-6 text-skogsgron mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">{completedGoals}</p>
            <p className="text-xs text-kalkvit/50">Completed</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <TrendingUp className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">{totalProgress}%</p>
            <p className="text-xs text-kalkvit/50">Avg Progress</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <Flame className="w-6 h-6 text-tegelrod mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">12</p>
            <p className="text-xs text-kalkvit/50">Day Streak</p>
          </GlassCard>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'active', 'completed'] as const).map((f) => (
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

        {/* Goals Grid */}
        {filteredGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        ) : (
          <GlassCard variant="base" className="text-center py-12">
            <Target className="w-12 h-12 text-kalkvit/20 mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">No goals yet</h3>
            <p className="text-kalkvit/50 text-sm mb-4">
              Create your first goal to start tracking your transformation
            </p>
            <GlassButton variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4" />
              Create Goal
            </GlassButton>
          </GlassCard>
        )}

        {/* Achievements Section */}
        <div className="mt-12">
          <h2 className="font-display text-xl font-bold text-kalkvit mb-4">Recent Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: '7-Day Streak', icon: Flame, earned: true },
              { name: 'First Goal', icon: Target, earned: true },
              { name: 'KPI Master', icon: TrendingUp, earned: false },
              { name: '30-Day Champion', icon: Trophy, earned: false },
            ].map((achievement) => (
              <GlassCard
                key={achievement.name}
                variant="base"
                className={cn('text-center py-4', !achievement.earned && 'opacity-40')}
              >
                <achievement.icon
                  className={cn(
                    'w-8 h-8 mx-auto mb-2',
                    achievement.earned ? 'text-koppar' : 'text-kalkvit/30'
                  )}
                />
                <p className="text-sm text-kalkvit">{achievement.name}</p>
                {achievement.earned && (
                  <p className="text-xs text-koppar mt-1">Earned</p>
                )}
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Create Goal Modal */}
        <GlassModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Goal"
        >
          <div className="space-y-4">
            <GlassInput
              label="Goal Title"
              placeholder="What do you want to achieve?"
              value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
            />
            <GlassTextarea
              label="Description"
              placeholder="Describe your goal in more detail..."
              value={newGoal.description}
              onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
            />
            <GlassSelect
              label="Related Pillar"
              options={pillarOptions}
              value={newGoal.pillar}
              onChange={(e) => setNewGoal({ ...newGoal, pillar: e.target.value })}
            />
            <GlassInput
              label="Target Date"
              type="date"
              value={newGoal.targetDate}
              onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
            />
          </div>
          <GlassModalFooter>
            <GlassButton variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" onClick={() => setShowCreateModal(false)}>
              Create Goal
            </GlassButton>
          </GlassModalFooter>
        </GlassModal>
      </div>
    </MainLayout>
  )
}
