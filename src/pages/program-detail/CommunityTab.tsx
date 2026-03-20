import { GlassCard, GlassButton, GlassBadge, GlassAvatar } from '../../components/ui'
import {
  Users,
  Star,
  Send,
  HandHeart,
  MessageSquare,
  Calendar,
  Loader2,
  CheckCircle,
  ClipboardCheck,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type {
  ProgramCohort,
  ProgramCohortMember,
  AccountabilityGroup,
  AccountabilityMember,
  CheckIn,
} from '../../lib/api/types'

interface CommunityTabProps {
  userId: string | undefined
  cohort: ProgramCohort | null
  programGroup: AccountabilityGroup | null
  groupDetail: AccountabilityGroup | undefined
  groupMembers: AccountabilityMember[]
  recentCheckIns: CheckIn[]
  isLoadingCheckIns: boolean
  checkInForm: {
    progress_update: string
    challenges: string
    support_needed: string
    commitments_for_next: string
    week_rating: number
  }
  onCheckInFormChange: (updater: (prev: CommunityTabProps['checkInForm']) => CommunityTabProps['checkInForm']) => void
  isSubmittingCheckIn: boolean
  checkInSubmitted: boolean
  onSubmitCheckIn: () => void
}

export function CommunityTab({
  userId,
  cohort,
  programGroup,
  groupDetail,
  groupMembers,
  recentCheckIns,
  isLoadingCheckIns,
  checkInForm,
  onCheckInFormChange,
  isSubmittingCheckIn,
  checkInSubmitted,
  onSubmitCheckIn,
}: CommunityTabProps) {
  return (
    <div className="space-y-6">
      {/* Cohort Section */}
      {cohort && (
        <div className="space-y-4">
          <h3 className="font-semibold text-kalkvit flex items-center gap-2">
            <Users className="w-5 h-5 text-koppar" />
            Your Cohort
          </h3>
          <GlassCard variant="base">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h4 className="font-semibold text-kalkvit">{cohort.name}</h4>
                {cohort.description && (
                  <p className="text-sm text-kalkvit/60 mt-1">{cohort.description}</p>
                )}
              </div>
              <GlassBadge
                variant={
                  cohort.status === 'active' ? 'success'
                    : cohort.status === 'completed' ? 'koppar'
                    : 'default'
                }
              >
                {cohort.status === 'active' ? 'Active' : cohort.status === 'completed' ? 'Completed' : cohort.status}
              </GlassBadge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-kalkvit/50 mb-4">
              {cohort.start_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {new Date(cohort.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {cohort.end_date && (
                    <>
                      {' — '}
                      {new Date(cohort.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </>
                  )}
                </span>
              )}
              {cohort.member_count !== undefined && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {cohort.member_count}{cohort.max_members > 0 ? `/${cohort.max_members}` : ''} members
                </span>
              )}
            </div>

            {/* Cohort members grid */}
            {cohort.members && cohort.members.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cohort.members.map((member: ProgramCohortMember) => (
                  <div
                    key={member.member_id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl bg-white/[0.04]',
                      member.member_id === userId && 'ring-1 ring-koppar/30'
                    )}
                  >
                    <GlassAvatar
                      initials={
                        member.display_name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2) || '?'
                      }
                      src={member.avatar_url}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-kalkvit truncate">
                        {member.display_name}
                        {member.member_id === userId && (
                          <span className="text-xs text-koppar ml-1">(You)</span>
                        )}
                      </p>
                      <p className="text-xs text-kalkvit/50 capitalize">
                        {member.role || 'Member'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* Accountability Group Section */}
      {programGroup && (
        <div className="space-y-4">
          <h3 className="font-semibold text-kalkvit flex items-center gap-2">
            <HandHeart className="w-5 h-5 text-koppar" />
            Accountability Group
          </h3>

          {/* Group info */}
          <GlassCard variant="base">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h4 className="font-semibold text-kalkvit">
                  {groupDetail?.name || programGroup.name}
                </h4>
                <p className="text-sm text-kalkvit/60 mt-1 capitalize">
                  {programGroup.group_type?.replace('_', ' ') || 'Group'}
                </p>
              </div>
              <GlassBadge variant={programGroup.is_active ? 'success' : 'default'}>
                {programGroup.is_active ? 'Active' : 'Inactive'}
              </GlassBadge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-kalkvit/50 mb-4">
              {programGroup.meeting_schedule && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {programGroup.meeting_schedule}
                </span>
              )}
              {programGroup.communication_channel && (
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  {programGroup.communication_channel}
                </span>
              )}
            </div>

            {/* Group members */}
            {groupMembers.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {groupMembers.map((member) => (
                  <div
                    key={member.member_id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl bg-white/[0.04]',
                      member.member_id === userId && 'ring-1 ring-koppar/30'
                    )}
                  >
                    <GlassAvatar
                      initials={
                        member.display_name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2) || '?'
                      }
                      src={member.avatar_url}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-kalkvit truncate">
                        {member.display_name}
                        {member.member_id === userId && (
                          <span className="text-xs text-koppar ml-1">(You)</span>
                        )}
                      </p>
                      <p className="text-xs text-kalkvit/50 capitalize">
                        {member.role || 'Member'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Recent check-ins */}
          <GlassCard variant="base">
            <h4 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-koppar" />
              Recent Check-Ins
            </h4>
            {isLoadingCheckIns ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 text-koppar animate-spin" />
              </div>
            ) : recentCheckIns.length > 0 ? (
              <div className="space-y-3">
                {recentCheckIns.map((checkIn: CheckIn) => {
                  const memberProfile = groupMembers.find(
                    (m) => m.member_id === checkIn.member_id
                  )
                  const isOwn = checkIn.member_id === userId
                  return (
                    <div
                      key={checkIn.id}
                      className={cn(
                        'p-4 rounded-xl bg-white/[0.04]',
                        isOwn && 'ring-1 ring-koppar/20'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <GlassAvatar
                            initials={
                              (memberProfile?.display_name || 'M')
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)
                            }
                            src={memberProfile?.avatar_url}
                            size="sm"
                          />
                          <span className="text-sm font-medium text-kalkvit">
                            {memberProfile?.display_name || 'Member'}
                            {isOwn && <span className="text-xs text-koppar ml-1">(You)</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {checkIn.week_rating && (
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    'w-3 h-3',
                                    i < checkIn.week_rating!
                                      ? 'text-koppar fill-koppar'
                                      : 'text-kalkvit/20'
                                  )}
                                />
                              ))}
                            </div>
                          )}
                          <span className="text-xs text-kalkvit/40">
                            {new Date(checkIn.check_in_date || checkIn.created_at).toLocaleDateString(
                              'en-US',
                              { month: 'short', day: 'numeric' }
                            )}
                          </span>
                        </div>
                      </div>

                      {checkIn.progress_update && (
                        <p className="text-sm text-kalkvit/70 mb-1">
                          <span className="text-kalkvit/40 text-xs">Progress: </span>
                          {checkIn.progress_update}
                        </p>
                      )}
                      {checkIn.challenges && (
                        <p className="text-sm text-kalkvit/70 mb-1">
                          <span className="text-kalkvit/40 text-xs">Challenges: </span>
                          {checkIn.challenges}
                        </p>
                      )}
                      {checkIn.commitments_for_next && (
                        <p className="text-sm text-kalkvit/70">
                          <span className="text-kalkvit/40 text-xs">Next: </span>
                          {checkIn.commitments_for_next}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-kalkvit/50 text-center py-4">
                No check-ins yet. Be the first to share your progress!
              </p>
            )}
          </GlassCard>

          {/* Check-in form */}
          <GlassCard variant="elevated">
            <h4 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-koppar" />
              Submit Check-In
            </h4>

            {checkInSubmitted ? (
              <div className="text-center py-6">
                <CheckCircle className="w-10 h-10 text-skogsgron mx-auto mb-3" />
                <p className="text-kalkvit font-medium">Check-in submitted!</p>
                <p className="text-sm text-kalkvit/50 mt-1">Your group can see your update.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-kalkvit/70 mb-1.5">
                    Progress Update
                  </label>
                  <textarea
                    value={checkInForm.progress_update}
                    onChange={(e) =>
                      onCheckInFormChange((f) => ({ ...f, progress_update: e.target.value }))
                    }
                    placeholder="What have you accomplished this week?"
                    rows={3}
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-kalkvit placeholder-kalkvit/30 focus:outline-none focus:border-koppar/50 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-kalkvit/70 mb-1.5">
                    Challenges
                  </label>
                  <textarea
                    value={checkInForm.challenges}
                    onChange={(e) =>
                      onCheckInFormChange((f) => ({ ...f, challenges: e.target.value }))
                    }
                    placeholder="What obstacles did you face?"
                    rows={2}
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-kalkvit placeholder-kalkvit/30 focus:outline-none focus:border-koppar/50 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-kalkvit/70 mb-1.5">
                    Support Needed
                  </label>
                  <textarea
                    value={checkInForm.support_needed}
                    onChange={(e) =>
                      onCheckInFormChange((f) => ({ ...f, support_needed: e.target.value }))
                    }
                    placeholder="How can your group help you?"
                    rows={2}
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-kalkvit placeholder-kalkvit/30 focus:outline-none focus:border-koppar/50 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-kalkvit/70 mb-1.5">
                    Commitments for Next Week
                  </label>
                  <textarea
                    value={checkInForm.commitments_for_next}
                    onChange={(e) =>
                      onCheckInFormChange((f) => ({ ...f, commitments_for_next: e.target.value }))
                    }
                    placeholder="What will you focus on next?"
                    rows={2}
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-kalkvit placeholder-kalkvit/30 focus:outline-none focus:border-koppar/50 resize-none"
                  />
                </div>

                {/* Week rating */}
                <div>
                  <label className="block text-sm font-medium text-kalkvit/70 mb-2">
                    How was your week? (1-5)
                  </label>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          onCheckInFormChange((f) => ({ ...f, week_rating: i + 1 }))
                        }
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            'w-6 h-6 transition-colors',
                            i < checkInForm.week_rating
                              ? 'text-koppar fill-koppar'
                              : 'text-kalkvit/20 hover:text-kalkvit/40'
                          )}
                        />
                      </button>
                    ))}
                    {checkInForm.week_rating > 0 && (
                      <span className="text-sm text-kalkvit/50 ml-2">
                        {checkInForm.week_rating}/5
                      </span>
                    )}
                  </div>
                </div>

                <GlassButton
                  variant="primary"
                  onClick={onSubmitCheckIn}
                  disabled={
                    isSubmittingCheckIn ||
                    (!checkInForm.progress_update && !checkInForm.challenges && checkInForm.week_rating === 0)
                  }
                  className="w-full"
                >
                  {isSubmittingCheckIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Check-In
                    </>
                  )}
                </GlassButton>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  )
}
