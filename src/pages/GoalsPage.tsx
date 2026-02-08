import { useState } from 'react'
import { Link } from 'react-router-dom'
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
import type { PillarId } from '../lib/constants'
import { useGoals, useCreateGoal, useUpdateGoal, useMyActiveProtocols } from '../lib/api/hooks'
import type { Goal, CreateGoalRequest } from '../lib/api/types'
import { getProtocolSlugFromGoal, addProtocolTag, stripProtocolTag } from '../lib/protocol-plan'
import {
  Target,
  Plus,
  ChevronRight,
  TrendingUp,
  Calendar,
  Flame,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ListTodo,
  BookOpen,
} from 'lucide-react'
import { cn } from '../lib/utils'

function GoalCard({ goal, onMarkDone }: { goal: Goal; onMarkDone?: (id: string) => void }) {
  const pillar = goal.pillar_id ? PILLARS[goal.pillar_id] : null
  const statusInfo = GOAL_STATUSES.find((s) => s.id === goal.status)
  const hasKpis = goal.kpis && goal.kpis.length > 0
  const hasProgress = hasKpis || goal.progress > 0
  const protocolSlug = getProtocolSlugFromGoal(goal.description)
  const cleanDescription = stripProtocolTag(goal.description)

  return (
    <GlassCard variant="base" className="hover:border-koppar/30 transition-colors">
      <Link to={`/goals/${goal.id}`} className="block">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {pillar && (
              <GlassBadge variant="koppar" className="text-xs">
                {pillar.name}
              </GlassBadge>
            )}
            {protocolSlug && (
              <GlassBadge variant="default" className="text-xs flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Protocol
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
        {cleanDescription && (
          <p className="text-sm text-kalkvit/60 mb-4 line-clamp-2">{cleanDescription}</p>
        )}

        {/* Progress Bar — only show when there's something driving it */}
        {hasProgress ? (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-kalkvit/60">Progress</span>
              <span className="text-koppar font-medium">{goal.progress ?? 0}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  goal.progress >= 100 ? 'bg-skogsgron' : 'bg-koppar'
                )}
                style={{ width: `${Math.min(goal.progress, 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-4 text-xs text-kalkvit/40">
            <ListTodo className="w-3.5 h-3.5" />
            <span>Add subtasks or KPIs to track progress</span>
          </div>
        )}

        {/* KPIs */}
        {hasKpis && (
          <div className="space-y-2 mb-4">
            {goal.kpis!.slice(0, 2).map((kpi) => (
              <div
                key={kpi.id}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/[0.04]"
              >
                <span className="text-kalkvit/70">{kpi.name}</span>
                <span className="text-kalkvit">
                  {kpi.current_value}
                  <span className="text-kalkvit/40">/{kpi.target_value}</span>
                  {kpi.unit && kpi.unit !== 'scale_1_10' && ` ${kpi.unit}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </Link>

      {/* Footer with quick actions */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          {goal.target_date && (
            <span className="text-xs text-kalkvit/50 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(goal.target_date).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {goal.status === 'active' && onMarkDone && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onMarkDone(goal.id)
              }}
              className="flex items-center gap-1 text-xs text-skogsgron/70 hover:text-skogsgron transition-colors px-2 py-1 rounded-lg hover:bg-skogsgron/10"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Done
            </button>
          )}
          <Link to={`/goals/${goal.id}`}>
            <ChevronRight className="w-4 h-4 text-kalkvit/30" />
          </Link>
        </div>
      </div>
    </GlassCard>
  )
}

export function GoalsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [createError, setCreateError] = useState<string | null>(null)
  const [newGoal, setNewGoal] = useState<CreateGoalRequest>({
    title: '',
    description: '',
    pillar_id: undefined,
    target_date: '',
  })
  const [selectedProtocolSlug, setSelectedProtocolSlug] = useState('')

  // API hooks
  const { data: goalsData, isLoading, error } = useGoals({
    status: filter === 'all' ? undefined : filter,
  })
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal()
  const { data: activeProtocols } = useMyActiveProtocols()

  const goals = Array.isArray(goalsData?.data) ? goalsData.data : []

  const handleMarkDone = async (goalId: string) => {
    try {
      await updateGoal.mutateAsync({ id: goalId, data: { status: 'completed' } })
    } catch {
      // Silently fail — user can retry from detail page
    }
  }

  const activeGoals = goals.filter((g) => g.status === 'active').length
  const completedGoals = goals.filter((g) => g.status === 'completed').length
  const totalProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length)
    : 0

  const pillarOptions = [
    { value: '', label: 'Select a pillar (optional)' },
    ...PILLAR_IDS.map((id) => ({ value: id, label: PILLARS[id].name })),
  ]

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) return
    setCreateError(null)

    // Embed protocol tag in description if a protocol is selected
    let description = newGoal.description || undefined
    if (selectedProtocolSlug && description) {
      description = addProtocolTag(description, selectedProtocolSlug)
    } else if (selectedProtocolSlug) {
      description = `[protocol:${selectedProtocolSlug}]`
    }

    try {
      await createGoal.mutateAsync({
        title: newGoal.title,
        description,
        pillar_id: newGoal.pillar_id || undefined,
        target_date: newGoal.target_date || undefined,
      })
      setShowCreateModal(false)
      setNewGoal({ title: '', description: '', pillar_id: undefined, target_date: '' })
      setSelectedProtocolSlug('')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred'
      setCreateError(`Failed to create goal: ${message}`)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-kalkvit mb-2">Goals & KPIs</h1>
            <p className="text-kalkvit/60">Track your transformation goals and key performance indicators</p>
          </div>
          <GlassButton variant="primary" onClick={() => { setCreateError(null); setShowCreateModal(true) }}>
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
            <p className="font-display text-2xl font-bold text-kalkvit">--</p>
            <p className="text-xs text-kalkvit/50">Day Streak</p>
          </GlassCard>
        </div>

        {/* Active Protocols */}
        {activeProtocols && activeProtocols.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-xl font-bold text-kalkvit mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-koppar" />
              Active Protocols
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeProtocols.map((ap) => (
                <Link key={ap.id} to={`/protocols/${ap.protocol_slug}`}>
                  <GlassCard variant="base" className="hover:border-koppar/30 transition-colors !py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-koppar/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-koppar" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-kalkvit truncate">{ap.protocol_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-koppar rounded-full"
                              style={{ width: `${ap.progress_percentage || 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-kalkvit/50">
                            {ap.progress_percentage || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Section heading */}
        <h2 className="font-display text-xl font-bold text-kalkvit mb-4">My Goals</h2>

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
            <h3 className="font-medium text-kalkvit mb-2">Failed to load goals</h3>
            <p className="text-kalkvit/50 text-sm">
              Please try again later
            </p>
          </GlassCard>
        )}

        {/* Goals Grid */}
        {!isLoading && !error && goals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onMarkDone={handleMarkDone} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && goals.length === 0 && (
          <GlassCard variant="base" className="text-center py-12">
            <Target className="w-12 h-12 text-kalkvit/20 mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">No goals yet</h3>
            <p className="text-kalkvit/50 text-sm mb-4">
              Create your first goal to start tracking your transformation
            </p>
            <GlassButton variant="primary" onClick={() => { setCreateError(null); setShowCreateModal(true) }}>
              <Plus className="w-4 h-4" />
              Create Goal
            </GlassButton>
          </GlassCard>
        )}

        {/* Achievements Section — derived from real goal data */}
        {goals.length > 0 && (
          <div className="mt-12">
            <h2 className="font-serif text-xl font-bold text-kalkvit mb-4">Milestones</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'First Goal Created', icon: Target, earned: goals.length > 0 },
                { name: 'Goal Completed', icon: CheckCircle2, earned: completedGoals > 0 },
                { name: '5 Goals Set', icon: TrendingUp, earned: goals.length >= 5 },
                { name: '10 Goals Completed', icon: Trophy, earned: completedGoals >= 10 },
              ].map((milestone) => (
                <GlassCard
                  key={milestone.name}
                  variant="base"
                  className={cn('text-center py-4', !milestone.earned && 'opacity-40')}
                >
                  <milestone.icon
                    className={cn(
                      'w-8 h-8 mx-auto mb-2',
                      milestone.earned ? 'text-koppar' : 'text-kalkvit/30'
                    )}
                  />
                  <p className="text-sm text-kalkvit">{milestone.name}</p>
                  {milestone.earned && (
                    <p className="text-xs text-koppar mt-1">Earned</p>
                  )}
                </GlassCard>
              ))}
            </div>
          </div>
        )}

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
              value={newGoal.description || ''}
              onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
            />
            <GlassSelect
              label="Related Pillar"
              options={pillarOptions}
              value={newGoal.pillar_id || ''}
              onChange={(e) => setNewGoal({ ...newGoal, pillar_id: e.target.value as PillarId || undefined })}
            />
            <GlassInput
              label="Target Date"
              type="date"
              value={newGoal.target_date || ''}
              onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
            />
            {activeProtocols && activeProtocols.length > 0 && (
              <GlassSelect
                label="Link to Protocol (optional)"
                options={[
                  { value: '', label: 'No protocol' },
                  ...activeProtocols.map((ap) => ({
                    value: ap.protocol_slug,
                    label: ap.protocol_name,
                  })),
                ]}
                value={selectedProtocolSlug}
                onChange={(e) => setSelectedProtocolSlug(e.target.value)}
              />
            )}
          </div>
          {createError && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-tegelrod/10 border border-tegelrod/20 px-4 py-3 text-sm text-tegelrod">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {createError}
            </div>
          )}
          <GlassModalFooter>
            <GlassButton variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={handleCreateGoal}
              disabled={!newGoal.title.trim() || createGoal.isPending}
            >
              {createGoal.isPending ? 'Creating...' : 'Create Goal'}
            </GlassButton>
          </GlassModalFooter>
        </GlassModal>
      </div>
    </MainLayout>
  )
}

export default GoalsPage;
