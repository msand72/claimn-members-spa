import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import {
  GlassCard,
  GlassButton,
  GlassBadge,
  GlassModal,
  GlassModalFooter,
  GlassTextarea,
} from '../components/ui'
import { PILLARS, MILESTONE_STATUSES } from '../lib/constants'
import type { PillarId, MilestoneStatus } from '../lib/constants'
import { useMilestones, useUpdateMilestoneStatus } from '../lib/api/hooks'
import type { Milestone } from '../lib/api/hooks'
import {
  Flag,
  Calendar,
  User,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trophy,
  MessageSquare,
  Loader2,
} from 'lucide-react'
import { cn } from '../lib/utils'

const getStatusIcon = (status: MilestoneStatus) => {
  switch (status) {
    case 'achieved':
      return Trophy
    case 'on_track':
      return CheckCircle2
    case 'delayed':
      return AlertTriangle
    default:
      return Clock
  }
}

const getStatusColor = (status: MilestoneStatus) => {
  switch (status) {
    case 'achieved':
      return 'text-koppar'
    case 'on_track':
      return 'text-skogsgron'
    case 'delayed':
      return 'text-brandAmber'
    default:
      return 'text-kalkvit/50'
  }
}

function MilestoneCard({
  milestone,
  onUpdateStatus,
}: {
  milestone: Milestone
  onUpdateStatus: (milestone: Milestone) => void
}) {
  const pillar = PILLARS[milestone.pillar]
  const statusInfo = MILESTONE_STATUSES.find((s) => s.id === milestone.status)
  const StatusIcon = getStatusIcon(milestone.status)
  const daysUntil = Math.ceil(
    (new Date(milestone.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <GlassCard variant="base" className="hover:border-koppar/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <GlassBadge variant="koppar" className="text-xs">
            {pillar.name}
          </GlassBadge>
        </div>
        <div className={cn('flex items-center gap-1', getStatusColor(milestone.status))}>
          <StatusIcon className="w-4 h-4" />
          <span className="text-xs font-medium">{statusInfo?.name}</span>
        </div>
      </div>

      <h3 className="font-semibold text-kalkvit mb-2">{milestone.title}</h3>
      <p className="text-sm text-kalkvit/60 mb-4 line-clamp-2">{milestone.description}</p>

      {/* Target Date */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1 text-kalkvit/60">
          <Calendar className="w-4 h-4" />
          <span>{new Date(milestone.target_date).toLocaleDateString()}</span>
        </div>
        {daysUntil > 0 && (
          <span
            className={cn(
              'text-xs',
              daysUntil <= 14 ? 'text-brandAmber' : 'text-kalkvit/50'
            )}
          >
            {daysUntil} days remaining
          </span>
        )}
      </div>

      {/* Progress Notes */}
      {milestone.progress_notes && (
        <div className="p-3 rounded-lg bg-white/[0.04] mb-4">
          <div className="flex items-center gap-2 text-xs text-kalkvit/50 mb-1">
            <MessageSquare className="w-3 h-3" />
            Latest notes
          </div>
          <p className="text-sm text-kalkvit/80">{milestone.progress_notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="flex items-center gap-2 text-xs text-kalkvit/50">
          <User className="w-3 h-3" />
          <span>
            {milestone.created_by.name} ({milestone.created_by.role})
          </span>
        </div>
        <GlassButton variant="ghost" onClick={() => onUpdateStatus(milestone)}>
          Update
          <ChevronRight className="w-4 h-4" />
        </GlassButton>
      </div>
    </GlassCard>
  )
}

export function MilestonesPage() {
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)
  const [updateNotes, setUpdateNotes] = useState('')
  const [updateStatus, setUpdateStatus] = useState<MilestoneStatus>('pending')
  const [filter, setFilter] = useState<'all' | MilestoneStatus>('all')

  const { data: rawMilestones, isLoading, error } = useMilestones()
  const milestones = Array.isArray(rawMilestones) ? rawMilestones : []
  const updateMilestone = useUpdateMilestoneStatus()

  const handleUpdateStatus = (milestone: Milestone) => {
    setSelectedMilestone(milestone)
    setUpdateNotes(milestone.progress_notes || '')
    setUpdateStatus(milestone.status)
    setShowUpdateModal(true)
  }

  const handleSubmitUpdate = () => {
    if (!selectedMilestone) return
    updateMilestone.mutate(
      { id: selectedMilestone.id, status: updateStatus, progress_notes: updateNotes },
      {
        onSuccess: () => {
          setShowUpdateModal(false)
          setSelectedMilestone(null)
        },
      }
    )
  }

  const filteredMilestones =
    filter === 'all'
      ? milestones
      : milestones.filter((m) => m.status === filter)

  // Stats
  const totalMilestones = milestones.length
  const onTrackCount = milestones.filter((m) => m.status === 'on_track').length
  const achievedCount = milestones.filter((m) => m.status === 'achieved').length
  const delayedCount = milestones.filter((m) => m.status === 'delayed').length

  // Group by pillar for visualization
  const pillarProgress = Object.keys(PILLARS).map((pillarId) => {
    const pillarMilestones = milestones.filter((m) => m.pillar === pillarId)
    const achieved = pillarMilestones.filter((m) => m.status === 'achieved').length
    const total = pillarMilestones.length
    return {
      pillar: PILLARS[pillarId as PillarId],
      achieved,
      total,
      progress: total > 0 ? Math.round((achieved / total) * 100) : 0,
    }
  })

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-koppar animate-spin" />
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto">
          <GlassCard variant="base" className="text-center py-12">
            <Flag className="w-12 h-12 text-kalkvit/20 mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">Unable to load milestones</h3>
            <p className="text-kalkvit/50 text-sm">Please try again later.</p>
          </GlassCard>
        </div>
      </MainLayout>
    )
  }

  if (milestones.length === 0) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">6-Month Milestones</h1>
              <p className="text-kalkvit/60">
                Key milestones assigned by your expert to track your transformation journey
              </p>
            </div>
          </div>

          <GlassCard variant="elevated" className="text-center py-16">
            <Flag className="w-16 h-16 text-koppar mx-auto mb-6" />
            <h2 className="font-display text-2xl font-bold text-kalkvit mb-3">
              No Milestones Yet
            </h2>
            <p className="text-kalkvit/60 max-w-md mx-auto mb-6">
              Your expert will set milestones during your coaching sessions to track your
              transformation journey across all five pillars.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-session">
                <GlassButton variant="primary">
                  <User className="w-4 h-4" />
                  Book Expert Session
                </GlassButton>
              </Link>
              <Link to="/goals">
                <GlassButton variant="secondary">
                  <Flag className="w-4 h-4" />
                  View Your Goals
                </GlassButton>
              </Link>
            </div>
          </GlassCard>

          <GlassCard variant="accent" className="mt-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-koppar/20 flex items-center justify-center flex-shrink-0">
                <Flag className="w-6 h-6 text-koppar" />
              </div>
              <div>
                <h3 className="font-semibold text-kalkvit mb-2">What are Milestones?</h3>
                <p className="text-sm text-kalkvit/60">
                  Unlike personal goals you set yourself, milestones are significant checkpoints
                  established with your expert to track your transformation journey. They are
                  designed to be achievable within 6 months and cover all five pillars of growth.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">6-Month Milestones</h1>
            <p className="text-kalkvit/60">
              Key milestones assigned by your expert to track your transformation journey
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <GlassCard variant="base" className="text-center py-4">
            <Flag className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">{totalMilestones}</p>
            <p className="text-xs text-kalkvit/50">Total Milestones</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <CheckCircle2 className="w-6 h-6 text-skogsgron mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">{onTrackCount}</p>
            <p className="text-xs text-kalkvit/50">On Track</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <Trophy className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">{achievedCount}</p>
            <p className="text-xs text-kalkvit/50">Achieved</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <AlertTriangle className="w-6 h-6 text-brandAmber mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">{delayedCount}</p>
            <p className="text-xs text-kalkvit/50">Delayed</p>
          </GlassCard>
        </div>

        {/* Pillar Progress Overview */}
        <GlassCard variant="base" className="mb-8">
          <h3 className="font-semibold text-kalkvit mb-4">Progress by Pillar</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {pillarProgress.map(({ pillar, achieved, total, progress }) => (
              <div key={pillar.id} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center mx-auto mb-2">
                  <Flag className={cn('w-5 h-5', `text-${pillar.color}`)} />
                </div>
                <p className="text-xs text-kalkvit/50 mb-1">{pillar.name}</p>
                <p className="text-sm font-medium text-kalkvit">
                  {achieved}/{total}
                </p>
                <div className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-koppar rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', 'pending', 'on_track', 'delayed', 'achieved'] as const).map((f) => {
            const statusInfo = f === 'all' ? null : MILESTONE_STATUSES.find((s) => s.id === f)
            return (
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
                {statusInfo?.name || 'All'}
              </button>
            )
          })}
        </div>

        {/* Milestones Grid */}
        {filteredMilestones.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMilestones.map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        ) : (
          <GlassCard variant="base" className="text-center py-12">
            <Flag className="w-12 h-12 text-kalkvit/20 mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">No milestones found</h3>
            <p className="text-kalkvit/50 text-sm">
              {filter === 'all'
                ? 'Your expert will set milestones during your sessions.'
                : `No ${filter.replace('_', ' ')} milestones.`}
            </p>
          </GlassCard>
        )}

        {/* Update Milestone Modal */}
        <GlassModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          title="Update Milestone"
        >
          <div className="space-y-4">
            {selectedMilestone && (
              <>
                <div className="p-3 rounded-lg bg-white/[0.04]">
                  <h4 className="font-medium text-kalkvit mb-1">{selectedMilestone.title}</h4>
                  <p className="text-sm text-kalkvit/60">{selectedMilestone.description}</p>
                </div>
                <div>
                  <label className="block text-sm text-kalkvit/70 mb-2">Current Status</label>
                  <div className="flex gap-2 flex-wrap">
                    {MILESTONE_STATUSES.map((status) => {
                      const StatusIcon = getStatusIcon(status.id)
                      return (
                        <button
                          key={status.id}
                          onClick={() => setUpdateStatus(status.id)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                            updateStatus === status.id
                              ? 'bg-koppar text-kalkvit'
                              : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1]'
                          )}
                        >
                          <StatusIcon className="w-4 h-4" />
                          {status.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <GlassTextarea
                  label="Progress Notes"
                  placeholder="Share your progress, challenges, or wins..."
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  rows={4}
                />
              </>
            )}
          </div>
          <GlassModalFooter>
            <GlassButton variant="ghost" onClick={() => setShowUpdateModal(false)}>
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={handleSubmitUpdate}
              disabled={updateMilestone.isPending}
            >
              {updateMilestone.isPending ? 'Saving...' : 'Save Update'}
            </GlassButton>
          </GlassModalFooter>
        </GlassModal>
      </div>
    </MainLayout>
  )
}

export default MilestonesPage;
