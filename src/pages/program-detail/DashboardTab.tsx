import { Link } from 'react-router-dom'
import { GlassCard, GlassButton, GlassBadge, GlassAvatar } from '../../components/ui'
import {
  BoltIcon,
  CheckCircleIcon,
  ViewfinderCircleIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightIcon,
  CalendarIcon,
  HeartIcon,
  SparklesIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { cn } from '../../lib/utils'
import type {
  Sprint,
  ProgramCohort,
  ProgramCohortMember,
  AccountabilityGroup,
  AccountabilityMember,
  CheckIn,
  CVCAssessmentStatus,
  ClaimnEvent,
  CoachingSession,
} from '../../lib/api/types'
import { CVCTrendCard } from './CVCTrendCard'

interface DashboardTabProps {
  programId: string
  sprints: Sprint[]
  activeSprint: Sprint | undefined
  completedSprints: number
  hasSprints: boolean
  /**
   * Unified assessment list from /assessments-status — includes CVC entries,
   * standard program_assessments rows (when the `assessments` component is
   * declared), and virtual claim_assessment_baseline / _final entries.
   * This is the single source of truth for the assessment counter and the
   * Next Assessment card. Empty array if the program has no assessment
   * components.
   */
  assessmentEntries: CVCAssessmentStatus[]
  progress: number
  cohort: ProgramCohort | null
  programGroup: AccountabilityGroup | null
  groupDetail: AccountabilityGroup | undefined
  groupMembers: AccountabilityMember[]
  recentCheckIns: CheckIn[]
  onNavigateToTab: (tab: string) => void
  /** Group sessions (GO Energy / Connection / Presence) — used for "Done X/N" stats. */
  goSessions: ClaimnEvent[]
  /** Coach sessions allocated to this enrollment — used for coach-call status. */
  coachSessions: CoachingSession[]
  hasGroupSessions: boolean
  hasCoachCalls: boolean
}

export function DashboardTab({
  programId,
  sprints,
  activeSprint,
  completedSprints,
  hasSprints,
  assessmentEntries,
  progress,
  cohort,
  programGroup,
  groupDetail,
  groupMembers,
  recentCheckIns,
  onNavigateToTab,
  goSessions,
  coachSessions,
  hasGroupSessions,
  hasCoachCalls,
}: DashboardTabProps) {
  const totalAssessments = assessmentEntries.length
  const completedAssessments = assessmentEntries.filter((e) => e.is_completed).length

  // Group sessions: "done" = the user was registered AND the session is in the past.
  const now = new Date()
  const totalGroupSessions = goSessions.length
  const completedGroupSessions = goSessions.filter(
    (s) => s.is_registered && new Date(s.scheduled_date) < now
  ).length

  // Coach calls: "done" = explicit completed status. Booked = scheduled but not yet past.
  const totalCoachSessions = coachSessions.length
  const completedCoachSessions = coachSessions.filter((s) => s.status === 'completed').length

  // Result-link cards: only render when at least one CVC OR CA result exists.
  const completedCVCs = assessmentEntries.filter(
    (e) => e.scores?.category_scores && (e.type === 'baseline' || e.type === 'midline' || e.type === 'final')
  )
  const latestCVCScore = completedCVCs.length > 0
    ? Math.round(completedCVCs[completedCVCs.length - 1].scores!.percentage_score ?? 0)
    : null
  const completedCA = assessmentEntries.find(
    (e) => (e.type === 'claim_assessment_baseline' || e.type === 'claim_assessment_final') && e.is_completed
  )
  const hasAnyResults = completedCVCs.length > 0 || !!completedCA

  // Display labels per assessment type. CVC types use season language;
  // claim variants get pre/post labels.
  const typeLabels: Record<string, string> = {
    baseline: 'Pre-Season Vitality Check',
    midline: 'Mid-Season Vitality Check',
    final: 'Post-Season Vitality Check',
    claim_assessment_baseline: 'Claim Assessment (start)',
    claim_assessment_final: 'Claim Assessment (end)',
  }

  function isClaimEntry(type: string): boolean {
    return type === 'claim_assessment_baseline' || type === 'claim_assessment_final'
  }

  function targetForEntry(entry: CVCAssessmentStatus): string {
    if (isClaimEntry(entry.type)) return entry.deep_link || '/assessment'
    return `/programs/${programId}/assessment/${entry.assessment_id}`
  }
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

      {/* Quick Stats Row — auto-flows to whatever cards apply for this program. */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
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
        {hasGroupSessions && totalGroupSessions > 0 && (
          <GlassCard variant="base" className="text-center !py-4">
            <p className="font-display text-2xl font-bold text-kalkvit">{completedGroupSessions}/{totalGroupSessions}</p>
            <p className="text-xs text-kalkvit/50">Group Sessions</p>
          </GlassCard>
        )}
        {hasCoachCalls && totalCoachSessions > 0 && (
          <GlassCard variant="base" className="text-center !py-4">
            <p className="font-display text-2xl font-bold text-kalkvit">{completedCoachSessions}/{totalCoachSessions}</p>
            <p className="text-xs text-kalkvit/50">Coach Calls</p>
          </GlassCard>
        )}
        {totalAssessments > 0 && (
          <GlassCard variant="base" className="text-center !py-4">
            <p className="font-display text-2xl font-bold text-kalkvit">{completedAssessments}/{totalAssessments}</p>
            <p className="text-xs text-kalkvit/50">Assessments</p>
          </GlassCard>
        )}
        <GlassCard variant="base" className="text-center !py-4">
          <p className="font-display text-2xl font-bold text-kalkvit">{progress}%</p>
          <p className="text-xs text-kalkvit/50">Overall</p>
        </GlassCard>
      </div>

      {/* CVC trend rendered inline once 2+ CVCs are completed — same component
          used in the Assessments tab Results sub-tab. */}
      {completedCVCs.length >= 2 && (
        <CVCTrendCard completedCVCs={completedCVCs} heading="Vitality trend" />
      )}

      {/* Results — entry points to the existing result/trend visualizations.
          Hidden until at least one CVC or CA is completed (no point linking to
          empty result pages). */}
      {hasAnyResults && (
        <div className="space-y-2">
          <p className="text-xs text-koppar font-medium uppercase tracking-wider px-1">
            Results
          </p>
          {completedCVCs.length > 0 && (
            <Link
              to={`/programs/${programId}?sub=results#vitality`}
              className="block"
            >
              <GlassCard variant="base" className="hover:border-koppar/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-koppar/20 text-koppar flex items-center justify-center">
                    <HeartIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-kalkvit">Vitality (CVC)</h4>
                    <p className="text-xs text-kalkvit/50 mt-0.5">
                      {latestCVCScore !== null && <>Latest: {latestCVCScore}% · </>}
                      {completedCVCs.length}/3 measurements completed · See trend over time
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-koppar">
                    <ChartBarIcon className="w-4 h-4" />
                    <ArrowRightIcon className="w-4 h-4" />
                  </div>
                </div>
              </GlassCard>
            </Link>
          )}
          {completedCA && (
            <Link
              to={`/assessment/results?returnTo=${encodeURIComponent(`/programs/${programId}#dashboard`)}`}
              className="block"
            >
              <GlassCard variant="base" className="hover:border-koppar/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-koppar/20 text-koppar flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-kalkvit">Claim Assessment</h4>
                    <p className="text-xs text-kalkvit/50 mt-0.5">
                      Your archetype and your profile across the five pillars
                    </p>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-koppar" />
                </div>
              </GlassCard>
            </Link>
          )}
        </div>
      )}

      {/* Open assessments — every incomplete entry that's currently visible.
          visible_from_date controls when in-program / post-program assessments
          appear; pre-program entries (visible_from_date null) are always visible.
          The full counter above still reflects total program scope so
          participants see what's coming. */}
      {totalAssessments > 0 && (() => {
        const todayISO = new Date().toISOString().slice(0, 10)
        const incomplete = assessmentEntries.filter((e) => {
          if (e.is_completed) return false
          if (e.visible_from_date == null) return true
          return e.visible_from_date <= todayISO
        })
        if (incomplete.length === 0) return null
        // Sort priority: deadline_date ASC, then by type (claim_assessment
        // variants before CVC variants when deadlines tie — Claim is the
        // broader self-knowledge piece and makes a better onboarding moment).
        const typePriority: Record<string, number> = {
          claim_assessment_baseline: 0,
          baseline: 1,
          midline: 2,
          claim_assessment_final: 3,
          final: 4,
        }
        const sorted = [...incomplete].sort((a, b) => {
          if (a.deadline_date && b.deadline_date) {
            const dateDiff = new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime()
            if (dateDiff !== 0) return dateDiff
          } else if (a.deadline_date) return -1
          else if (b.deadline_date) return 1
          return (typePriority[a.type] ?? 99) - (typePriority[b.type] ?? 99)
        })
        const headingLabel = sorted.length === 1 ? 'Next Assessment' : 'Open Assessments'
        return (
          <div className="space-y-2">
            <p className="text-xs text-koppar font-medium uppercase tracking-wider px-1">
              {headingLabel}
            </p>
            {sorted.map((entry) => {
              const displayName = typeLabels[entry.type] || entry.name
              return (
                <GlassCard key={entry.assessment_id} variant="base">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-koppar/20 text-koppar flex items-center justify-center">
                      <ClipboardDocumentCheckIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-kalkvit">{displayName}</h4>
                      <p className="text-xs text-kalkvit/50 mt-1">
                        {entry.deadline_date && (
                          <>By {new Date(entry.deadline_date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}</>
                        )}
                      </p>
                    </div>
                    <Link to={targetForEntry(entry)}>
                      <GlassButton variant="primary" className="text-sm">
                        Start
                        <ArrowRightIcon className="w-4 h-4" />
                      </GlassButton>
                    </Link>
                  </div>
                </GlassCard>
              )
            })}
          </div>
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
