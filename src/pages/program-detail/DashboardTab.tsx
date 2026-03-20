import { Link } from 'react-router-dom'
import { GlassCard, GlassButton, GlassBadge, GlassAvatar } from '../../components/ui'
import {
  BoltIcon,
  CheckCircleIcon,
  ViewfinderCircleIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'
import { cn } from '../../lib/utils'
import type {
  Sprint,
  ProgramAssessment,
  ProgramCohort,
  ProgramCohortMember,
  AccountabilityGroup,
  AccountabilityMember,
  CheckIn,
} from '../../lib/api/types'

interface DashboardTabProps {
  programId: string
  sprints: Sprint[]
  activeSprint: Sprint | undefined
  completedSprints: number
  hasSprints: boolean
  assessments: ProgramAssessment[]
  completedAssessments: number
  progress: number
  cohort: ProgramCohort | null
  programGroup: AccountabilityGroup | null
  groupDetail: AccountabilityGroup | undefined
  groupMembers: AccountabilityMember[]
  recentCheckIns: CheckIn[]
  onNavigateToTab: (tab: string) => void
}

export function DashboardTab({
  programId,
  sprints,
  activeSprint,
  completedSprints,
  hasSprints,
  assessments,
  completedAssessments,
  progress,
  cohort,
  programGroup,
  groupDetail,
  groupMembers,
  recentCheckIns,
  onNavigateToTab,
}: DashboardTabProps) {
  return (
    <div className="space-y-6">
      {/* Sprint Timeline (only if program has sprints) */}
      {hasSprints && (
        <GlassCard variant="base">
          <h3 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
            <BoltIcon className="w-5 h-5 text-koppar" />
            Sprint Progress
          </h3>
          <div className="flex items-center gap-1">
            {sprints.map((sprint, i) => (
              <div key={sprint.id} className="flex items-center flex-1">
                <button
                  onClick={() => onNavigateToTab('sprints')}
                  className="group flex flex-col items-center flex-1 cursor-pointer"
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                      sprint.status === 'completed'
                        ? 'bg-skogsgron/20 text-skogsgron'
                        : sprint.status === 'active'
                          ? 'bg-koppar/20 text-koppar ring-2 ring-koppar/40'
                          : 'bg-white/[0.06] text-kalkvit/30'
                    )}
                  >
                    {sprint.status === 'completed' ? (
                      <CheckCircleIcon className="w-4 h-4" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className={cn(
                    'text-[10px] mt-1 text-center leading-tight max-w-[60px] truncate',
                    sprint.status === 'active' ? 'text-koppar' : 'text-kalkvit/40'
                  )}>
                    {sprint.title.split(' ').slice(0, 2).join(' ')}
                  </span>
                </button>
                {i < sprints.length - 1 && (
                  <div className={cn(
                    'h-0.5 flex-1 min-w-2 -mt-4',
                    sprint.status === 'completed' ? 'bg-skogsgron/30' : 'bg-white/[0.06]'
                  )} />
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Current Sprint */}
      {activeSprint && (
        <GlassCard variant="elevated">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-xs text-koppar font-medium uppercase tracking-wider mb-1">
                Current Sprint
              </p>
              <h3 className="font-semibold text-kalkvit text-lg">
                {activeSprint.title}
              </h3>
            </div>
            <GlassBadge variant="success">Active</GlassBadge>
          </div>
          {activeSprint.description && (
            <p className="text-sm text-kalkvit/60 mb-4">{activeSprint.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-kalkvit/50 mb-4">
            {activeSprint.focus_area && (
              <span className="flex items-center gap-1">
                <ViewfinderCircleIcon className="w-3 h-3" />
                {activeSprint.focus_area}
              </span>
            )}
            {activeSprint.end_date && (
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                Ends {new Date(activeSprint.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
          {(activeSprint.progress ?? 0) > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-kalkvit/50">Progress</span>
                <span className="text-skogsgron font-medium">{activeSprint.progress}%</span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-skogsgron to-emerald-400 rounded-full transition-all"
                  style={{ width: `${activeSprint.progress}%` }}
                />
              </div>
            </div>
          )}
          <GlassButton variant="primary" className="text-sm" onClick={() => onNavigateToTab('sprints')}>
            View Sprint
            <ArrowRightIcon className="w-4 h-4" />
          </GlassButton>
        </GlassCard>
      )}

      {/* Quick Stats Row */}
      <div className={cn('grid gap-3', hasSprints ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2')}>
        {hasSprints && (
          <>
            <GlassCard variant="base" className="text-center !py-4">
              <p className="font-display text-2xl font-bold text-kalkvit">{completedSprints}</p>
              <p className="text-xs text-kalkvit/50">Sprints Done</p>
            </GlassCard>
            <GlassCard variant="base" className="text-center !py-4">
              <p className="font-display text-2xl font-bold text-kalkvit">{sprints.length - completedSprints}</p>
              <p className="text-xs text-kalkvit/50">Remaining</p>
            </GlassCard>
          </>
        )}
        <GlassCard variant="base" className="text-center !py-4">
          <p className="font-display text-2xl font-bold text-kalkvit">{completedAssessments}/{assessments.length}</p>
          <p className="text-xs text-kalkvit/50">Assessments</p>
        </GlassCard>
        <GlassCard variant="base" className="text-center !py-4">
          <p className="font-display text-2xl font-bold text-kalkvit">{progress}%</p>
          <p className="text-xs text-kalkvit/50">Overall</p>
        </GlassCard>
      </div>

      {/* Next Assessment */}
      {assessments.length > 0 && (() => {
        const nextAssessment = assessments.find((a) => !a.is_completed)
        if (!nextAssessment) return null
        return (
          <GlassCard variant="base">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-koppar/20 text-koppar flex items-center justify-center">
                <ClipboardDocumentCheckIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-koppar font-medium uppercase tracking-wider mb-0.5">Next Assessment</p>
                <h4 className="font-semibold text-kalkvit">{nextAssessment.name}</h4>
                <p className="text-xs text-kalkvit/50 mt-1">
                  {nextAssessment.question_count} questions
                  {nextAssessment.is_required && ' · Required'}
                </p>
              </div>
              <Link to={`/programs/${programId}/assessment/${nextAssessment.id}`}>
                <GlassButton variant="primary" className="text-sm">
                  Start
                  <ArrowRightIcon className="w-4 h-4" />
                </GlassButton>
              </Link>
            </div>
          </GlassCard>
        )
      })()}

      {/* Accountability Group Snippet */}
      {programGroup && (
        <GlassCard variant="base">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-xs text-koppar font-medium uppercase tracking-wider mb-0.5">Your Group</p>
              <h4 className="font-semibold text-kalkvit">{groupDetail?.name || programGroup.name}</h4>
            </div>
            <div className="flex items-center gap-2 text-xs text-kalkvit/50">
              {programGroup.meeting_schedule && (
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  {programGroup.meeting_schedule}
                </span>
              )}
            </div>
          </div>
          {/* Group member avatars */}
          {groupMembers.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex -space-x-2">
                {groupMembers.map((member) => (
                  <GlassAvatar
                    key={member.member_id}
                    initials={
                      member.display_name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || '?'
                    }
                    src={member.avatar_url}
                    size="sm"
                  />
                ))}
              </div>
              <span className="text-xs text-kalkvit/50">
                {groupMembers.length} member{groupMembers.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {/* Latest check-in snippet */}
          {recentCheckIns.length > 0 && (() => {
            const latest = recentCheckIns[0]
            const memberProfile = groupMembers.find((m) => m.member_id === latest.member_id)
            return (
              <div className="p-3 rounded-xl bg-white/[0.04] text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-kalkvit text-xs">
                    {memberProfile?.display_name || 'Member'}
                  </span>
                  <span className="text-[10px] text-kalkvit/40">
                    {new Date(latest.check_in_date || latest.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-kalkvit/60 text-xs line-clamp-2">
                  {latest.progress_update || latest.commitments_for_next || 'Check-in submitted'}
                </p>
              </div>
            )
          })()}
          <GlassButton
            variant="ghost"
            className="text-sm mt-3"
            onClick={() => onNavigateToTab('community')}
          >
            View All
            <ArrowRightIcon className="w-4 h-4" />
          </GlassButton>
        </GlassCard>
      )}

      {/* Cohort Snippet */}
      {cohort && (
        <GlassCard variant="base">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-xs text-koppar font-medium uppercase tracking-wider mb-0.5">Your Cohort</p>
              <h4 className="font-semibold text-kalkvit">{cohort.name}</h4>
            </div>
            <GlassBadge variant={cohort.status === 'active' ? 'success' : 'default'}>
              {cohort.status === 'active' ? 'Active' : cohort.status}
            </GlassBadge>
          </div>
          {cohort.members && cohort.members.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {cohort.members.slice(0, 6).map((member: ProgramCohortMember) => (
                  <GlassAvatar
                    key={member.member_id}
                    initials={
                      member.display_name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || '?'
                    }
                    src={member.avatar_url}
                    size="sm"
                  />
                ))}
              </div>
              <span className="text-xs text-kalkvit/50">
                {cohort.members.length} member{cohort.members.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  )
}
