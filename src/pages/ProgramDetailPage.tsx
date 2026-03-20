import { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge, GlassTabs, GlassTabPanel } from '../components/ui'
import { useProgram, useEnrolledPrograms, useEnrollProgram, useSprints, useProgramAssessments, useProgramAssessmentResults, useProgramCVCStatus, useProgramCohort, useProgramCompletion, useProgramApplication, useSubmitApplication, useMyAccountabilityGroups, useAccountabilityGroupDetail, useGroupCheckIns, useCreateCheckIn, useEvents, useRegisterForEvent, useUnregisterFromEvent } from '../lib/api/hooks'
import type { ClaimnEvent } from '../lib/api/types'
import { sanitizeHtml } from '../lib/sanitize'
import { useAuth } from '../contexts/AuthContext'
import {
  ArrowLeftIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
  BoltIcon,
  CalendarIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  PaperAirplaneIcon,
  TrophyIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  XCircleIcon,
  ListBulletIcon,
  Squares2X2Icon,
  HeartIcon,
} from '@heroicons/react/24/outline'
import { CVCPrintReport } from '../components/cvc/CVCPrintReport'
import type { CVCAssessmentStatus } from '../lib/api/types'
import {
  OverviewTab,
  SprintsTab,
  SessionsTab,
  DashboardTab,
  AssessmentsTab,
  VitalityTab,
  CommunityTab,
  computeSprintStatus,
} from './program-detail'

const difficultyColors: Record<string, 'success' | 'warning' | 'error'> = {
  Beginner: 'success',
  Intermediate: 'warning',
  Advanced: 'error',
}

export function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(() => {
    const hash = location.hash.replace('#', '')
    return hash || 'overview'
  })
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [checkInForm, setCheckInForm] = useState({
    progress_update: '',
    challenges: '',
    support_needed: '',
    commitments_for_next: '',
    week_rating: 0,
  })
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false)
  const [checkInSubmitted, setCheckInSubmitted] = useState(false)
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [applicationMotivation, setApplicationMotivation] = useState('')
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false)

  const { data: program, isLoading, error } = useProgram(id || '')
  const { data: enrolledData } = useEnrolledPrograms()
  const { data: sprintsData, isLoading: isLoadingSprints } = useSprints(id)
  const enrollMutation = useEnrollProgram()

  // Detect if this is the GO Sessions program
  const isGoProgram = program?.slug === 'go-sessions-s1' || program?.tier === 'go_sessions'

  // GO Session events — only fetch for GO program
  const [sessionStatusFilter, setSessionStatusFilter] = useState<'upcoming' | 'past'>('upcoming')
  const { data: goSessionData, isLoading: isLoadingGoSessions } = useEvents(
    isGoProgram ? { type: 'session', status: sessionStatusFilter } : undefined
  )
  const goSessions: ClaimnEvent[] = isGoProgram && Array.isArray(goSessionData?.data) ? goSessionData.data : []
  const registerMutation = useRegisterForEvent()
  const unregisterMutation = useUnregisterFromEvent()

  const enrolledPrograms = Array.isArray(enrolledData?.data) ? enrolledData.data : []
  const userEnrollment = enrolledPrograms.find((ep) => ep.program_id === id)
  const isEnrolled = !!userEnrollment
  const progress = userEnrollment?.progress || 0

  const rawSprints = Array.isArray(sprintsData?.data) ? sprintsData.data : []
  const sprints = rawSprints.map((s) => ({ ...s, status: computeSprintStatus(s) }))

  // Assessments — only fetch for enrolled users
  const { data: assessmentsData, isLoading: isLoadingAssessments } = useProgramAssessments(
    isEnrolled ? (id || '') : ''
  )
  const { data: resultsData } = useProgramAssessmentResults(
    isEnrolled ? (id || '') : ''
  )
  const assessments = Array.isArray(assessmentsData?.data) ? assessmentsData.data : []
  const assessmentResults = Array.isArray(resultsData?.data) ? resultsData.data : []
  const completedAssessments = assessments.filter((a) => a.is_completed).length

  // CVC status — fetch for enrolled users (provides category score breakdowns)
  const { data: cvcStatus } = useProgramCVCStatus(
    isEnrolled ? (id || '') : ''
  )
  const cvcAssessments = cvcStatus?.assessments || []

  // Cohort — only fetch for enrolled users
  const { data: cohortData } = useProgramCohort(
    isEnrolled ? (id || '') : ''
  )
  const cohorts = Array.isArray(cohortData?.data) ? cohortData.data : []
  const cohort = cohorts[0] || null // User is typically in one cohort per program

  // Accountability — only fetch for enrolled users
  const { data: accountabilityGroups } = useMyAccountabilityGroups({
    enabled: isEnrolled,
  })
  const programGroup = (accountabilityGroups ?? []).find((g) => g.program_id === id) || null
  const { data: groupDetail } = useAccountabilityGroupDetail(programGroup?.id || '')
  const { data: checkIns, isLoading: isLoadingCheckIns } = useGroupCheckIns(programGroup?.id || '')
  const createCheckIn = useCreateCheckIn()

  const groupMembers = groupDetail?.members ?? []
  const recentCheckIns = (checkIns ?? []).slice(0, 10)

  // Completion — only fetch for enrolled users
  const { data: completion } = useProgramCompletion(
    isEnrolled ? (id || '') : ''
  )
  const isCompleted = userEnrollment?.status === 'completed' || !!completion

  // Application — only fetch when program requires application and user is not enrolled
  const { data: application, isLoading: isLoadingApplication } = useProgramApplication(
    program?.requires_application && !isEnrolled ? (id || '') : ''
  )
  const submitApplication = useSubmitApplication()
  const hasApplication = !!application
  const applicationStatus = application?.status

  const handleEnroll = async () => {
    if (!id) return
    setIsEnrolling(true)
    try {
      await enrollMutation.mutateAsync({ program_id: id })
    } finally {
      setIsEnrolling(false)
    }
  }

  const handleSubmitApplication = async () => {
    if (!id || !applicationMotivation.trim()) return
    setIsSubmittingApplication(true)
    try {
      await submitApplication.mutateAsync({
        program_id: id,
        motivation: applicationMotivation.trim(),
      })
      setShowApplicationForm(false)
      setApplicationMotivation('')
    } finally {
      setIsSubmittingApplication(false)
    }
  }

  const handleSubmitCheckIn = async () => {
    if (!programGroup) return
    setIsSubmittingCheckIn(true)
    try {
      await createCheckIn.mutateAsync({
        groupId: programGroup.id,
        data: {
          progress_update: checkInForm.progress_update || undefined,
          challenges: checkInForm.challenges || undefined,
          support_needed: checkInForm.support_needed || undefined,
          commitments_for_next: checkInForm.commitments_for_next || undefined,
          week_rating: checkInForm.week_rating > 0 ? checkInForm.week_rating : undefined,
        },
      })
      setCheckInForm({ progress_update: '', challenges: '', support_needed: '', commitments_for_next: '', week_rating: 0 })
      setCheckInSubmitted(true)
      setTimeout(() => setCheckInSubmitted(false), 3000)
    } finally {
      setIsSubmittingCheckIn(false)
    }
  }

  // Compute sprint stats for enrolled users
  const completedSprints = sprints.filter((s) => s.status === 'completed').length
  const activeSprint = sprints.find((s) => s.status === 'active')
  const hasCommunityContent = !!cohort || !!programGroup

  // Sync tab with URL hash
  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (hash && hash !== activeTab) {
      setActiveTab(hash)
    } else if (!hash && isEnrolled && activeTab === 'overview') {
      setActiveTab('dashboard')
    }
  }, [isEnrolled, location.hash])

  const hasSprints = sprints.length > 0

  const tabs = isEnrolled
    ? [
        { value: 'dashboard', label: 'Dashboard', icon: <Squares2X2Icon className="w-4 h-4" /> },
        ...(isGoProgram
          ? [{ value: 'sessions', label: 'Sessions', icon: <CalendarIcon className="w-4 h-4" /> }]
          : []),
        ...(hasSprints
          ? [{ value: 'sprints', label: 'Sprints', icon: <BoltIcon className="w-4 h-4" />, badge: sprints.length }]
          : []),
        ...(isGoProgram
          ? [{ value: 'vitality', label: 'Vitality', icon: <HeartIcon className="w-4 h-4" /> }]
          : [{ value: 'assessments', label: 'Assessments', icon: <ClipboardDocumentCheckIcon className="w-4 h-4" />, badge: assessments.length || undefined }]),
        ...(hasCommunityContent
          ? [{ value: 'community', label: 'Community', icon: <UserGroupIcon className="w-4 h-4" /> }]
          : []),
        { value: 'overview', label: 'Overview', icon: <BookOpenIcon className="w-4 h-4" /> },
      ]
    : [
        { value: 'overview', label: 'Overview', icon: <BookOpenIcon className="w-4 h-4" /> },
        ...(isGoProgram
          ? [{ value: 'sessions', label: 'Sessions', icon: <CalendarIcon className="w-4 h-4" /> }]
          : []),
        ...(hasSprints
          ? [{ value: 'sprints', label: 'Sprints', icon: <BoltIcon className="w-4 h-4" />, badge: sprints.length }]
          : []),
      ]

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto flex items-center justify-center py-24">
          <ArrowPathIcon className="w-8 h-8 text-koppar animate-spin" />
        </div>
      </MainLayout>
    )
  }

  if (error || !program) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Link
            to="/programs"
            className="inline-flex items-center gap-2 text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Programs
          </Link>
          <GlassCard variant="base" className="text-center py-12">
            <ExclamationTriangleIcon className="w-12 h-12 text-tegelrod mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">Program not found</h3>
            <p className="text-kalkvit/50 text-sm">
              This program may have been removed or the link is incorrect.
            </p>
          </GlassCard>
        </div>
      </MainLayout>
    )
  }

  // CVC print report data (top-level so it renders outside tab panels)
  const printCVCs = cvcAssessments
    .filter((c: CVCAssessmentStatus) => c.scores?.category_scores)
    .sort((a: CVCAssessmentStatus, b: CVCAssessmentStatus) => {
      const order: Record<string, number> = { baseline: 0, midline: 1, final: 2, custom: 3 }
      return (order[a.type] ?? 3) - (order[b.type] ?? 3)
    })

  return (
    <MainLayout>
      {/* Print-only CVC report — always rendered so print CSS can find it */}
      <CVCPrintReport
        programName={program?.title || 'GO Sessions'}
        completedCVCs={printCVCs}
      />

      <div className="max-w-4xl mx-auto print:hidden">
        {/* Back link */}
        <Link
          to="/programs"
          className="inline-flex items-center gap-2 text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Programs
        </Link>

        {/* Program Header */}
        <GlassCard variant="elevated" className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {program.difficulty && (
              <GlassBadge variant={difficultyColors[program.difficulty]}>
                {program.difficulty}
              </GlassBadge>
            )}
            {program.tier && (
              <GlassBadge variant="koppar">{program.tier}</GlassBadge>
            )}
            {isCompleted ? (
              <GlassBadge variant="koppar">
                <TrophyIcon className="w-3 h-3" />
                Completed
              </GlassBadge>
            ) : isEnrolled ? (
              <GlassBadge variant="success">Enrolled</GlassBadge>
            ) : null}
            {program.is_locked && (
              <GlassBadge variant="default">
                <LockClosedIcon className="w-3 h-3" />
                Premium
              </GlassBadge>
            )}
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">
            {program.title}
          </h1>
          <div className="text-kalkvit/60 mb-6 [&>p]:mb-0" dangerouslySetInnerHTML={{ __html: sanitizeHtml(program.description) }} />

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-kalkvit/50 mb-6">
            <span className="flex items-center gap-1.5">
              <ClockIcon className="w-4 h-4 text-koppar" />
              {program.duration || `${program.duration_months} months`}
            </span>
            <span className="flex items-center gap-1.5">
              <AcademicCapIcon className="w-4 h-4 text-koppar" />
              {program.modules} modules
            </span>
            <span className="flex items-center gap-1.5">
              <UserGroupIcon className="w-4 h-4 text-koppar" />
              {(program.enrolled_count ?? 0).toLocaleString()} enrolled
            </span>
          </div>

          {/* Completion banner */}
          {isCompleted && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-koppar/10 to-brand-amber/10 border border-koppar/20">
              <div className="flex items-center gap-3 mb-2">
                <TrophyIcon className="w-6 h-6 text-koppar" />
                <h3 className="font-semibold text-kalkvit">Program Completed!</h3>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-kalkvit/60">
                {completion?.completed_at && (
                  <span>
                    Completed {new Date(completion.completed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {completion?.final_score && (
                  <span className="text-koppar font-medium">Score: {completion.final_score}</span>
                )}
              </div>
              {completion?.certificate_url && (
                <a
                  href={completion.certificate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block"
                >
                  <GlassButton variant="primary" className="text-sm">
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Download Certificate
                  </GlassButton>
                </a>
              )}
            </div>
          )}

          {/* Progress bar (if enrolled and not completed) */}
          {isEnrolled && !isCompleted && progress > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-kalkvit/60">Your Progress</span>
                <span className="text-koppar font-semibold">{progress}%</span>
              </div>
              <div className="h-2 bg-white/[0.1] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-koppar to-brand-amber rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action button */}
          {program.is_locked ? (
            <Link to="/shop/upgrade">
              <GlassButton variant="ghost">
                <LockClosedIcon className="w-4 h-4" />
                Unlock with Premium
              </GlassButton>
            </Link>
          ) : isCompleted ? (
            <GlassButton
              variant="secondary"
              onClick={() => { setActiveTab('sprints'); window.history.replaceState(null, '', '#sprints') }}
            >
              <BookOpenIcon className="w-4 h-4" />
              Review Material
            </GlassButton>
          ) : isEnrolled ? null
          : program.requires_application ? (
            // Application-required programs
            hasApplication ? (
              // User has already applied — show status
              <div className="space-y-3">
                {applicationStatus === 'pending' && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-amber/10 border border-brand-amber/20">
                    <ClockIcon className="w-5 h-5 text-brand-amber flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-kalkvit">Application Under Review</p>
                      <p className="text-xs text-kalkvit/50">
                        Submitted {new Date(application!.submitted_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )}
                {applicationStatus === 'accepted' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-skogsgron/10 border border-skogsgron/20">
                      <CheckCircleIcon className="w-5 h-5 text-skogsgron flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-kalkvit">Application Accepted!</p>
                        <p className="text-xs text-kalkvit/50">You can now enroll in this program.</p>
                      </div>
                    </div>
                    <GlassButton
                      variant="primary"
                      onClick={handleEnroll}
                      disabled={isEnrolling}
                    >
                      {isEnrolling ? (
                        <>
                          <ArrowPathIcon className="w-4 h-4 animate-spin" />
                          Enrolling...
                        </>
                      ) : (
                        <>
                          Enroll Now
                          <ArrowRightIcon className="w-4 h-4" />
                        </>
                      )}
                    </GlassButton>
                  </div>
                )}
                {applicationStatus === 'rejected' && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-tegelrod/10 border border-tegelrod/20">
                    <XCircleIcon className="w-5 h-5 text-tegelrod flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-kalkvit">Application Not Accepted</p>
                      {application!.review_notes && (
                        <p className="text-xs text-kalkvit/50 mt-1">{application!.review_notes}</p>
                      )}
                    </div>
                  </div>
                )}
                {applicationStatus === 'waitlisted' && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-koppar/10 border border-koppar/20">
                    <ListBulletIcon className="w-5 h-5 text-koppar flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-kalkvit">You're on the Waitlist</p>
                      <p className="text-xs text-kalkvit/50">We'll notify you when a spot opens up.</p>
                    </div>
                  </div>
                )}
              </div>
            ) : showApplicationForm ? (
              // Application form
              <div className="space-y-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <h3 className="font-semibold text-kalkvit flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-koppar" />
                  Apply to {program.title}
                </h3>
                <div>
                  <label className="block text-sm font-medium text-kalkvit/70 mb-1.5">
                    Why do you want to join this program? *
                  </label>
                  <textarea
                    value={applicationMotivation}
                    onChange={(e) => setApplicationMotivation(e.target.value)}
                    placeholder="Share your motivation, goals, and what you hope to achieve..."
                    rows={4}
                    className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-kalkvit placeholder-kalkvit/30 focus:outline-none focus:border-koppar/50 resize-none"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <GlassButton
                    variant="primary"
                    onClick={handleSubmitApplication}
                    disabled={isSubmittingApplication || !applicationMotivation.trim()}
                  >
                    {isSubmittingApplication ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="w-4 h-4" />
                        Submit Application
                      </>
                    )}
                  </GlassButton>
                  <GlassButton
                    variant="ghost"
                    onClick={() => setShowApplicationForm(false)}
                  >
                    Cancel
                  </GlassButton>
                </div>
              </div>
            ) : (
              // Show "Apply" button
              <GlassButton
                variant="primary"
                onClick={() => setShowApplicationForm(true)}
                disabled={isLoadingApplication}
              >
                {isLoadingApplication ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="w-4 h-4" />
                    Apply to Program
                  </>
                )}
              </GlassButton>
            )
          ) : (
            <GlassButton
              variant="primary"
              onClick={handleEnroll}
              disabled={isEnrolling}
            >
              {isEnrolling ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  Enrolling...
                </>
              ) : (
                <>
                  Start Program
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </GlassButton>
          )}
        </GlassCard>

        {/* Tabs */}
        <GlassTabs
          tabs={tabs}
          value={activeTab}
          onChange={(tab: string) => { setActiveTab(tab); window.history.replaceState(null, '', `#${tab}`) }}
          variant="underline"
          fullWidth
          className="mb-6"
        />

        {/* Tab Panels — extracted to program-detail/ */}
        <GlassTabPanel value="overview" activeValue={activeTab}>
          <OverviewTab program={program} sprintCount={sprints.length} />
        </GlassTabPanel>

        <GlassTabPanel value="sprints" activeValue={activeTab}>
          <SprintsTab sprints={sprints} isLoading={isLoadingSprints} />
        </GlassTabPanel>

        {isGoProgram && (
          <GlassTabPanel value="sessions" activeValue={activeTab}>
            <SessionsTab
              goSessions={goSessions}
              isLoading={isLoadingGoSessions}
              sessionStatusFilter={sessionStatusFilter}
              onSessionStatusFilterChange={setSessionStatusFilter}
              registerMutation={registerMutation}
              unregisterMutation={unregisterMutation}
            />
          </GlassTabPanel>
        )}

        {isEnrolled && (
          <GlassTabPanel value="dashboard" activeValue={activeTab}>
            <DashboardTab
              programId={id || ''}
              sprints={sprints}
              activeSprint={activeSprint}
              completedSprints={completedSprints}
              hasSprints={hasSprints}
              assessments={assessments}
              completedAssessments={completedAssessments}
              progress={progress}
              cohort={cohort}
              programGroup={programGroup}
              groupDetail={groupDetail}
              groupMembers={groupMembers}
              recentCheckIns={recentCheckIns}
              onNavigateToTab={(tab: string) => { setActiveTab(tab); window.history.replaceState(null, '', `#${tab}`) }}
            />
          </GlassTabPanel>
        )}

        {isEnrolled && !isGoProgram && (
          <GlassTabPanel value="assessments" activeValue={activeTab}>
            <AssessmentsTab
              programId={id || ''}
              assessments={assessments}
              assessmentResults={assessmentResults}
              cvcAssessments={cvcAssessments}
              completedAssessments={completedAssessments}
              isLoading={isLoadingAssessments}
            />
          </GlassTabPanel>
        )}

        {isEnrolled && isGoProgram && (
          <GlassTabPanel value="vitality" activeValue={activeTab}>
            <VitalityTab
              programId={id || ''}
              assessments={assessments}
              cvcAssessments={cvcAssessments}
              completedAssessments={completedAssessments}
              isLoadingAssessments={isLoadingAssessments}
            />
          </GlassTabPanel>
        )}

        {isEnrolled && hasCommunityContent && (
          <GlassTabPanel value="community" activeValue={activeTab}>
            <CommunityTab
              userId={user?.id}
              cohort={cohort}
              programGroup={programGroup}
              groupDetail={groupDetail}
              groupMembers={groupMembers}
              recentCheckIns={recentCheckIns}
              isLoadingCheckIns={isLoadingCheckIns}
              checkInForm={checkInForm}
              onCheckInFormChange={setCheckInForm}
              isSubmittingCheckIn={isSubmittingCheckIn}
              checkInSubmitted={checkInSubmitted}
              onSubmitCheckIn={handleSubmitCheckIn}
            />
          </GlassTabPanel>
        )}
      </div>
    </MainLayout>
  )
}

export default ProgramDetailPage
