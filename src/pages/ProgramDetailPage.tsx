import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge, GlassTabs, GlassTabPanel, GlassAvatar } from '../components/ui'
import { useProgram, useEnrolledPrograms, useEnrollProgram, useSprints, useProgramAssessments, useProgramAssessmentResults, useProgramCVCStatus, useProgramCohort, useProgramCompletion, useProgramApplication, useSubmitApplication, useMyAccountabilityGroups, useAccountabilityGroupDetail, useGroupCheckIns, useCreateCheckIn, useEvents, useRegisterForEvent, useUnregisterFromEvent } from '../lib/api/hooks'
import type { Sprint, ProgramCohortMember, CheckIn, CVCAssessmentStatus, ClaimnEvent } from '../lib/api/types'
import { useAuth } from '../contexts/AuthContext'
import {
  ArrowLeft,
  Clock,
  Users,
  CheckCircle,
  Lock,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Target,
  BookOpen,
  Zap,
  Calendar,
  GraduationCap,
  ClipboardCheck,
  Circle,
  MessageSquare,
  Star,
  Send,
  HandHeart,
  Award,
  Download,
  FileText,
  Clock3,
  XCircle,
  ListChecks,
  LayoutDashboard,
  UserCheck,
  UserMinus,
  BarChart3,
  Heart,
  Moon,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { CVCPrintReport } from '../components/cvc/CVCPrintReport'
import {
  BIOMARKER_CONFIGS,
  BIOMARKER_ORDER,
  CVC_SHORT_LABELS,
  type CVCBiomarker,
} from '../lib/cvc/constants'
import {
  interpretBiomarker,
  interpretVitalityIndex,
  normalizeScore,
  computeTrend,
  type TrendDirection,
} from '../lib/cvc/interpretation'

function computeSprintStatus(sprint: Sprint): 'upcoming' | 'active' | 'completed' {
  if (sprint.status) return sprint.status
  const now = new Date()
  if (sprint.end_date && new Date(sprint.end_date) < now) return 'completed'
  if (sprint.start_date && new Date(sprint.start_date) <= now) {
    if (!sprint.end_date || new Date(sprint.end_date) >= now) return 'active'
    return 'completed'
  }
  return 'upcoming'
}

const difficultyColors: Record<string, 'success' | 'warning' | 'error'> = {
  Beginner: 'success',
  Intermediate: 'warning',
  Advanced: 'error',
}

function SprintCard({ sprint, index }: { sprint: Sprint; index: number }) {
  const statusConfig = {
    upcoming: { variant: 'default' as const, label: 'Upcoming' },
    active: { variant: 'success' as const, label: 'Active' },
    completed: { variant: 'koppar' as const, label: 'Completed' },
  }

  const status = statusConfig[sprint.status || 'upcoming'] || statusConfig.upcoming

  const facilitatorInitials = sprint.facilitator?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <Link to={`/programs/sprints/${sprint.id}`} className="block">
      <GlassCard variant="base" className="group">
        <div className="flex items-start gap-4">
          <div className={cn(
            'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold',
            sprint.status === 'completed'
              ? 'bg-skogsgron/20 text-skogsgron'
              : sprint.status === 'active'
                ? 'bg-koppar/20 text-koppar'
                : 'bg-white/[0.06] text-kalkvit/40'
          )}>
            {sprint.status === 'completed' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              index + 1
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-kalkvit group-hover:text-koppar transition-colors">
                {sprint.title}
              </h3>
              <GlassBadge variant={status.variant}>{status.label}</GlassBadge>
            </div>

            {sprint.description && (
              <p className="text-sm text-kalkvit/60 mb-3 line-clamp-2">{sprint.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-kalkvit/50">
              {sprint.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {sprint.duration}
                </span>
              )}
              {sprint.start_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(sprint.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
              {sprint.facilitator && (
                <span className="flex items-center gap-1">
                  {sprint.facilitator.avatar_url ? (
                    <img src={sprint.facilitator.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                  ) : (
                    <GlassAvatar initials={facilitatorInitials} size="sm" />
                  )}
                  {sprint.facilitator.name}
                </span>
              )}
            </div>

            {sprint.goals && sprint.goals.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {sprint.goals.map((goal, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-lg bg-white/[0.06] text-kalkvit/60"
                  >
                    {goal}
                  </span>
                ))}
              </div>
            )}

            {sprint.status === 'active' && (sprint.progress ?? 0) > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-kalkvit/50">Progress</span>
                  <span className="text-skogsgron">{sprint.progress}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-skogsgron rounded-full transition-all"
                    style={{ width: `${sprint.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </Link>
  )
}

export function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
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

  // Default enrolled users to dashboard tab
  useEffect(() => {
    if (isEnrolled && activeTab === 'overview') {
      setActiveTab('dashboard')
    }
  }, [isEnrolled])

  const hasSprints = sprints.length > 0

  const tabs = isEnrolled
    ? [
        { value: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        ...(isGoProgram
          ? [{ value: 'sessions', label: 'Sessions', icon: <Calendar className="w-4 h-4" /> }]
          : []),
        ...(hasSprints
          ? [{ value: 'sprints', label: 'Sprints', icon: <Zap className="w-4 h-4" />, badge: sprints.length }]
          : []),
        ...(isGoProgram
          ? [{ value: 'vitality', label: 'Vitality', icon: <Heart className="w-4 h-4" /> }]
          : [{ value: 'assessments', label: 'Assessments', icon: <ClipboardCheck className="w-4 h-4" />, badge: assessments.length || undefined }]),
        ...(hasCommunityContent
          ? [{ value: 'community', label: 'Community', icon: <Users className="w-4 h-4" /> }]
          : []),
        { value: 'overview', label: 'Overview', icon: <BookOpen className="w-4 h-4" /> },
      ]
    : [
        { value: 'overview', label: 'Overview', icon: <BookOpen className="w-4 h-4" /> },
        ...(isGoProgram
          ? [{ value: 'sessions', label: 'Sessions', icon: <Calendar className="w-4 h-4" /> }]
          : []),
        ...(hasSprints
          ? [{ value: 'sprints', label: 'Sprints', icon: <Zap className="w-4 h-4" />, badge: sprints.length }]
          : []),
      ]

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-koppar animate-spin" />
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
            <ArrowLeft className="w-4 h-4" />
            Back to Programs
          </Link>
          <GlassCard variant="base" className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-tegelrod mx-auto mb-4" />
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
          <ArrowLeft className="w-4 h-4" />
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
                <Award className="w-3 h-3" />
                Completed
              </GlassBadge>
            ) : isEnrolled ? (
              <GlassBadge variant="success">Enrolled</GlassBadge>
            ) : null}
            {program.is_locked && (
              <GlassBadge variant="default">
                <Lock className="w-3 h-3" />
                Premium
              </GlassBadge>
            )}
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">
            {program.title}
          </h1>
          <p className="text-kalkvit/60 mb-6">{program.description}</p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-kalkvit/50 mb-6">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-koppar" />
              {program.duration || `${program.duration_months} months`}
            </span>
            <span className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-koppar" />
              {program.modules} modules
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-koppar" />
              {(program.enrolled_count ?? 0).toLocaleString()} enrolled
            </span>
          </div>

          {/* Completion banner */}
          {isCompleted && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-koppar/10 to-brand-amber/10 border border-koppar/20">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-6 h-6 text-koppar" />
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
                    <Download className="w-4 h-4" />
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
                <Lock className="w-4 h-4" />
                Unlock with Premium
              </GlassButton>
            </Link>
          ) : isCompleted ? (
            <GlassButton
              variant="secondary"
              onClick={() => setActiveTab('sprints')}
            >
              <BookOpen className="w-4 h-4" />
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
                    <Clock3 className="w-5 h-5 text-brand-amber flex-shrink-0" />
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
                      <CheckCircle className="w-5 h-5 text-skogsgron flex-shrink-0" />
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
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enrolling...
                        </>
                      ) : (
                        <>
                          Enroll Now
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </GlassButton>
                  </div>
                )}
                {applicationStatus === 'rejected' && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-tegelrod/10 border border-tegelrod/20">
                    <XCircle className="w-5 h-5 text-tegelrod flex-shrink-0" />
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
                    <ListChecks className="w-5 h-5 text-koppar flex-shrink-0" />
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
                  <FileText className="w-5 h-5 text-koppar" />
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
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
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
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
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
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enrolling...
                </>
              ) : (
                <>
                  Start Program
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </GlassButton>
          )}
        </GlassCard>

        {/* Tabs */}
        <GlassTabs
          tabs={tabs}
          value={activeTab}
          onChange={setActiveTab}
          variant="underline"
          fullWidth
          className="mb-6"
        />

        {/* Overview Tab */}
        <GlassTabPanel value="overview" activeValue={activeTab}>
          <div className="space-y-6">
            {/* Objectives */}
            {program.objectives && program.objectives.length > 0 && (
              <GlassCard variant="base">
                <h2 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-koppar" />
                  What You'll Achieve
                </h2>
                <ul className="space-y-3">
                  {program.objectives.map((objective, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-skogsgron flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-kalkvit/80">{objective}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}

            {/* Prerequisites */}
            {program.prerequisites && program.prerequisites.length > 0 && (
              <GlassCard variant="base">
                <h2 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-koppar" />
                  Prerequisites
                </h2>
                <ul className="space-y-3">
                  {program.prerequisites.map((prereq, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-4 h-4 rounded-full bg-white/[0.1] flex items-center justify-center text-xs text-kalkvit/50 flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-kalkvit/80">{prereq}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}

            {/* Program structure overview */}
            <GlassCard variant="base">
              <h2 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-koppar" />
                Program Structure
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-white/[0.04]">
                  <p className="font-display text-2xl font-bold text-kalkvit">
                    {program.duration || `${program.duration_months}mo`}
                  </p>
                  <p className="text-xs text-kalkvit/50">Duration</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/[0.04]">
                  <p className="font-display text-2xl font-bold text-kalkvit">{program.modules}</p>
                  <p className="text-xs text-kalkvit/50">Modules</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/[0.04]">
                  <p className="font-display text-2xl font-bold text-kalkvit">{sprints.length}</p>
                  <p className="text-xs text-kalkvit/50">Sprints</p>
                </div>
              </div>
            </GlassCard>

            {/* No objectives/prerequisites - show empty state */}
            {(!program.objectives || program.objectives.length === 0) &&
             (!program.prerequisites || program.prerequisites.length === 0) && (
              <GlassCard variant="base" className="text-center py-8">
                <BookOpen className="w-8 h-8 text-kalkvit/30 mx-auto mb-3" />
                <p className="text-kalkvit/50 text-sm">
                  Program details will be available soon. Check the Sprints tab to see the learning path.
                </p>
              </GlassCard>
            )}
          </div>
        </GlassTabPanel>

        {/* Sprints Tab */}
        <GlassTabPanel value="sprints" activeValue={activeTab}>
          {isLoadingSprints ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-koppar animate-spin" />
            </div>
          ) : sprints.length > 0 ? (
            <div className="space-y-4">
              {sprints.map((sprint, index) => (
                <SprintCard key={sprint.id} sprint={sprint} index={index} />
              ))}
            </div>
          ) : (
            <GlassCard variant="base" className="text-center py-12">
              <Zap className="w-8 h-8 text-kalkvit/30 mx-auto mb-3" />
              <p className="text-kalkvit/50 text-sm">
                No sprints available for this program yet.
              </p>
            </GlassCard>
          )}
        </GlassTabPanel>

        {/* Sessions Tab (GO program only) */}
        {isGoProgram && (
          <GlassTabPanel value="sessions" activeValue={activeTab}>
            <div className="space-y-4">
              {/* Status sub-filter */}
              <div className="flex gap-2">
                {(['upcoming', 'past'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setSessionStatusFilter(status)}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                      sessionStatusFilter === status
                        ? 'bg-koppar/20 text-koppar'
                        : 'bg-white/[0.06] text-kalkvit/50 hover:text-kalkvit/70'
                    )}
                  >
                    {status === 'upcoming' ? 'Upcoming' : 'Past'}
                  </button>
                ))}
              </div>

              {isLoadingGoSessions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-koppar animate-spin" />
                </div>
              ) : goSessions.length > 0 ? (
                <div className="space-y-4">
                  {goSessions.map((session) => {
                    const isPastSession = new Date(session.scheduled_date) < new Date()
                    const isSessionFull = session.registered_count >= session.capacity
                    const date = new Date(session.scheduled_date)
                    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

                    return (
                      <Link key={session.id} to={`/events/${session.id}`} className="block">
                        <GlassCard variant="base" className="hover:border-koppar/30 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                              session.is_registered
                                ? 'bg-skogsgron/20 text-skogsgron'
                                : 'bg-koppar/20 text-koppar'
                            )}>
                              {session.is_registered ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <Calendar className="w-5 h-5" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-semibold text-kalkvit">{session.title}</h4>
                                {session.is_registered && (
                                  <GlassBadge variant="success">Registered</GlassBadge>
                                )}
                              </div>

                              {session.protocol_name && (
                                <p className="text-xs text-koppar italic mb-1">{session.protocol_name}</p>
                              )}

                              <div className="flex flex-wrap items-center gap-3 text-xs text-kalkvit/50 mb-3">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {dateStr}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {timeStr}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {session.registered_count}/{session.capacity} spots
                                </span>
                              </div>

                              {session.facilitator && (
                                <div className="flex items-center gap-2 mb-3">
                                  <GlassAvatar
                                    src={session.facilitator.avatar_url}
                                    alt={session.facilitator.name}
                                    size="sm"
                                  />
                                  <span className="text-xs text-kalkvit/60">{session.facilitator.name}</span>
                                </div>
                              )}

                              {!isPastSession && (
                                <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                                  {session.is_registered ? (
                                    <GlassButton
                                      variant="ghost"
                                      className="text-xs"
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); unregisterMutation.mutate(session.id) }}
                                    >
                                      <UserMinus className="w-3 h-3" />
                                      Unregister
                                    </GlassButton>
                                  ) : (
                                    <GlassButton
                                      variant="primary"
                                      className="text-xs"
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); registerMutation.mutate(session.id) }}
                                      disabled={isSessionFull}
                                    >
                                      <UserCheck className="w-3 h-3" />
                                      {isSessionFull ? 'Full' : 'Register'}
                                    </GlassButton>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </GlassCard>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <GlassCard variant="base" className="text-center py-12">
                  <Calendar className="w-8 h-8 text-kalkvit/30 mx-auto mb-3" />
                  <p className="text-kalkvit/50 text-sm">
                    No {sessionStatusFilter} GO Sessions available.
                  </p>
                </GlassCard>
              )}
            </div>
          </GlassTabPanel>
        )}

        {/* Dashboard Tab (enrolled users only) */}
        {isEnrolled && (
          <GlassTabPanel value="dashboard" activeValue={activeTab}>
            <div className="space-y-6">
              {/* Sprint Timeline (only if program has sprints) */}
              {hasSprints && (
                <GlassCard variant="base">
                  <h3 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-koppar" />
                    Sprint Progress
                  </h3>
                  <div className="flex items-center gap-1">
                    {sprints.map((sprint, i) => (
                      <div key={sprint.id} className="flex items-center flex-1">
                        <button
                          onClick={() => setActiveTab('sprints')}
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
                              <CheckCircle className="w-4 h-4" />
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
                        <Target className="w-3 h-3" />
                        {activeSprint.focus_area}
                      </span>
                    )}
                    {activeSprint.end_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
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
                  <GlassButton variant="primary" className="text-sm" onClick={() => setActiveTab('sprints')}>
                    View Sprint
                    <ArrowRight className="w-4 h-4" />
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
                        <ClipboardCheck className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-koppar font-medium uppercase tracking-wider mb-0.5">Next Assessment</p>
                        <h4 className="font-semibold text-kalkvit">{nextAssessment.name}</h4>
                        <p className="text-xs text-kalkvit/50 mt-1">
                          {nextAssessment.question_count} questions
                          {nextAssessment.is_required && ' · Required'}
                        </p>
                      </div>
                      <Link to={`/programs/${id}/assessment/${nextAssessment.id}`}>
                        <GlassButton variant="primary" className="text-sm">
                          Start
                          <ArrowRight className="w-4 h-4" />
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
                          <Calendar className="w-3 h-3" />
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
                    onClick={() => setActiveTab('community')}
                  >
                    View All
                    <ArrowRight className="w-4 h-4" />
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
          </GlassTabPanel>
        )}

        {/* Assessments Tab */}
        {isEnrolled && (
          <GlassTabPanel value="assessments" activeValue={activeTab}>
            {isLoadingAssessments ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-koppar animate-spin" />
              </div>
            ) : assessments.length > 0 ? (
              <div className="space-y-4">
                {/* Progress summary */}
                <GlassCard variant="base">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-kalkvit flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-koppar" />
                      Assessment Progress
                    </h3>
                    <span className="text-sm text-kalkvit/50">
                      {completedAssessments} of {assessments.length} completed
                    </span>
                  </div>
                  <div className="h-2 bg-white/[0.1] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        completedAssessments === assessments.length
                          ? 'bg-skogsgron'
                          : 'bg-gradient-to-r from-koppar to-brand-amber'
                      )}
                      style={{
                        width: `${assessments.length > 0 ? Math.round((completedAssessments / assessments.length) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </GlassCard>

                {/* Assessment cards */}
                {assessments.map((assessment) => {
                  const result = assessmentResults.find(
                    (r) => r.assessment_id === assessment.id
                  )
                  const cvcData = cvcAssessments.find(
                    (c: CVCAssessmentStatus) => c.assessment_id === assessment.id
                  )
                  const typeLabels: Record<string, string> = {
                    baseline: 'Baseline',
                    midline: 'Midline',
                    final: 'Final',
                    custom: 'Custom',
                  }
                  const categoryLabels: Record<string, string> = {
                    vital_energy: 'Vital Energy',
                    stress_load: 'Stress Load',
                    sleep_quality: 'Sleep Quality',
                  }
                  // Max scale per biomarker for progress bar width
                  const categoryMaxScales: Record<string, number> = {
                    vital_energy: 7,   // SVS avg 1-7
                    stress_load: 40,   // PSS sum 0-40
                    sleep_quality: 15, // PSQI composite 0-15
                  }
                  const lowerIsBetter: Record<string, boolean> = {
                    stress_load: true,
                    sleep_quality: true,
                  }

                  return (
                    <GlassCard key={assessment.id} variant="base" className="group">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                            assessment.is_completed
                              ? 'bg-skogsgron/20 text-skogsgron'
                              : 'bg-koppar/20 text-koppar'
                          )}
                        >
                          {assessment.is_completed ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-kalkvit">
                              {assessment.name}
                            </h4>
                            <GlassBadge
                              variant={assessment.is_completed ? 'success' : 'koppar'}
                            >
                              {typeLabels[assessment.type] || assessment.type}
                            </GlassBadge>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-kalkvit/50 mb-3">
                            <span>{assessment.question_count} questions</span>
                            {assessment.is_required && (
                              <span className="text-koppar">Required</span>
                            )}
                            {cvcData?.scores ? (
                              <span className="text-koppar font-medium">
                                {Math.round(cvcData.scores.percentage_score)}% vitality
                              </span>
                            ) : result && result.score !== null ? (
                              <span className="text-skogsgron">
                                Score: {result.score}
                                {result.max_score ? `/${result.max_score}` : ''}
                              </span>
                            ) : null}
                            {assessment.is_completed && assessment.completed_at && (
                              <span>
                                Completed{' '}
                                {new Date(assessment.completed_at).toLocaleDateString(
                                  'en-US',
                                  { month: 'short', day: 'numeric' }
                                )}
                              </span>
                            )}
                          </div>

                          {/* CVC Category Breakdown */}
                          {cvcData?.scores?.category_scores && (
                            <div className="mb-3 space-y-1.5">
                              {Object.entries(cvcData.scores.category_scores).map(([key, raw]) => {
                                const value = Number(raw) || 0
                                const maxScale = categoryMaxScales[key] || 7
                                const isInverse = lowerIsBetter[key]
                                // For "lower is better", invert the bar: full bar = 0, empty = maxScale
                                const barPercent = isInverse
                                  ? Math.min(((maxScale - value) / maxScale) * 100, 100)
                                  : Math.min((value / maxScale) * 100, 100)
                                return (
                                <div key={key} className="flex items-center gap-2">
                                  <span className="text-[10px] text-kalkvit/50 w-20 shrink-0">
                                    {categoryLabels[key] || key}
                                  </span>
                                  <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                    <div
                                      className={cn(
                                        'h-full rounded-full transition-all',
                                        isInverse
                                          ? 'bg-gradient-to-r from-skogsgron to-oliv'
                                          : 'bg-gradient-to-r from-koppar to-brandAmber'
                                      )}
                                      style={{ width: `${barPercent}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-kalkvit/40 w-8 text-right">
                                    {value.toFixed(1)}
                                  </span>
                                </div>
                                )
                              })}
                            </div>
                          )}

                          {!assessment.is_completed ? (
                            <Link to={`/programs/${id}/assessment/${assessment.id}`}>
                              <GlassButton variant="primary" className="text-sm">
                                Take Assessment
                                <ArrowRight className="w-4 h-4" />
                              </GlassButton>
                            </Link>
                          ) : (
                            <GlassBadge variant="success">
                              <CheckCircle className="w-3 h-3" />
                              Completed
                            </GlassBadge>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  )
                })}
              </div>
            ) : (
              <GlassCard variant="base" className="text-center py-12">
                <ClipboardCheck className="w-8 h-8 text-kalkvit/30 mx-auto mb-3" />
                <p className="text-kalkvit/50 text-sm">
                  No assessments available for this program yet.
                </p>
              </GlassCard>
            )}
          </GlassTabPanel>
        )}

        {/* Vitality Tab (GO program: Assessments + KPI biomarkers combined) */}
        {isEnrolled && isGoProgram && (
          <GlassTabPanel value="vitality" activeValue={activeTab}>
            <div className="space-y-6">
              {/* Vitality Checks progress */}
              {isLoadingAssessments ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-koppar animate-spin" />
                </div>
              ) : (
                <>
                  <GlassCard variant="base">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-kalkvit flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-koppar" />
                        Vitality Checks
                      </h3>
                      <span className="text-sm text-kalkvit/50">
                        {completedAssessments} of {assessments.length} completed
                      </span>
                    </div>
                    <div className="h-2 bg-white/[0.1] rounded-full overflow-hidden mb-4">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          completedAssessments === assessments.length
                            ? 'bg-skogsgron'
                            : 'bg-gradient-to-r from-koppar to-brand-amber'
                        )}
                        style={{
                          width: `${assessments.length > 0 ? Math.round((completedAssessments / assessments.length) * 100) : 0}%`,
                        }}
                      />
                    </div>

                    <div className="space-y-3">
                      {assessments.map((assessment) => {
                        const cvcData = cvcAssessments.find(
                          (c: CVCAssessmentStatus) => c.assessment_id === assessment.id
                        )
                        const typeLabels: Record<string, string> = {
                          baseline: 'Pre-Season',
                          midline: 'Mid-Season',
                          final: 'Post-Season',
                        }
                        return (
                          <div
                            key={assessment.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.04]"
                          >
                            {assessment.is_completed ? (
                              <CheckCircle className="w-5 h-5 text-skogsgron shrink-0" />
                            ) : (
                              <Circle className="w-5 h-5 text-kalkvit/30 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-kalkvit">
                                {typeLabels[assessment.type] || assessment.name}
                              </p>
                              {cvcData?.scores ? (
                                <p className="text-xs text-skogsgron">
                                  {Math.round(cvcData.scores.percentage_score)}% vitality
                                </p>
                              ) : (
                                <p className="text-xs text-kalkvit/40">
                                  {assessment.question_count} questions
                                </p>
                              )}
                            </div>
                            {!assessment.is_completed ? (
                              <Link to={`/programs/${id}/assessment/${assessment.id}`}>
                                <GlassButton variant="primary" className="text-xs">
                                  Take now
                                  <ArrowRight className="w-3 h-3" />
                                </GlassButton>
                              </Link>
                            ) : (
                              <GlassBadge variant="success" className="text-xs">Done</GlassBadge>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </GlassCard>

                  {/* ===== Inline Vitality Report ===== */}
                  {(() => {
                    const completedCVCs = cvcAssessments
                      .filter((c: CVCAssessmentStatus) => c.scores?.category_scores)
                      .sort((a: CVCAssessmentStatus, b: CVCAssessmentStatus) => {
                        const order: Record<string, number> = { baseline: 0, midline: 1, final: 2, custom: 3 }
                        return (order[a.type] ?? 3) - (order[b.type] ?? 3)
                      })

                    if (completedCVCs.length === 0) return null

                    const latest = completedCVCs[completedCVCs.length - 1]
                    const latestScores = latest.scores!
                    const vitalityIndex = latestScores.percentage_score ?? 0
                    const vitalityInterp = interpretVitalityIndex(vitalityIndex)

                    const biomarkerIcons: Record<CVCBiomarker, React.ReactNode> = {
                      vital_energy: <Zap className="w-5 h-5" />,
                      stress_load: <Shield className="w-5 h-5" />,
                      sleep_quality: <Moon className="w-5 h-5" />,
                    }

                    const trendConfig: Record<TrendDirection, { icon: React.ReactNode; label: string; color: string }> = {
                      improved: { icon: <TrendingUp className="w-4 h-4" />, label: 'Improved', color: 'text-skogsgron' },
                      declined: { icon: <TrendingDown className="w-4 h-4" />, label: 'Declined', color: 'text-tegelrod' },
                      stable: { icon: <Minus className="w-4 h-4" />, label: 'Stable', color: 'text-kalkvit/50' },
                    }

                    return (
                      <>
                        {/* Hero — Vitality Index */}
                        <GlassCard variant="elevated">
                          <div className="text-center mb-4">
                            <h3 className="font-display text-lg font-semibold text-kalkvit mb-1">
                              Overall Vitality Index
                            </h3>
                            <p className="text-xs text-kalkvit/50">
                              Composite score across all three biomarkers
                            </p>
                          </div>

                          <div className="flex justify-center mb-2">
                            <div className="relative w-28 h-28">
                              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                                <circle
                                  cx="60" cy="60" r="54" fill="none"
                                  stroke="#B87333"
                                  strokeWidth="8"
                                  strokeLinecap="round"
                                  strokeDasharray={`${(vitalityIndex / 100) * 339.3} 339.3`}
                                  className="transition-all duration-1000 ease-out"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="font-display text-3xl font-bold text-koppar">
                                  {Math.round(vitalityIndex)}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-center mb-4">
                            <GlassBadge variant={vitalityInterp.variant}>{vitalityInterp.level}</GlassBadge>
                            <p className="text-xs text-kalkvit/40 mt-2">{vitalityInterp.description}</p>
                          </div>

                          {/* Quick stat cards */}
                          <div className="grid grid-cols-3 gap-2">
                            {BIOMARKER_ORDER.map((key) => {
                              const config = BIOMARKER_CONFIGS[key]
                              const raw = latestScores.category_scores?.[key] ?? 0
                              const interp = interpretBiomarker(key, raw)
                              return (
                                <div
                                  key={key}
                                  className="text-center p-2 rounded-xl bg-white/[0.04] border border-white/10"
                                >
                                  <div className={cn('flex items-center justify-center gap-1 mb-0.5', interp.colorClass)}>
                                    {biomarkerIcons[key]}
                                    <span className="text-lg font-bold">{raw.toFixed(1)}</span>
                                  </div>
                                  <p className="text-[10px] text-kalkvit/50">{config.label}</p>
                                </div>
                              )
                            })}
                          </div>
                        </GlassCard>

                        {/* Biomarker Breakdown */}
                        {BIOMARKER_ORDER.map((key) => {
                          const config = BIOMARKER_CONFIGS[key]
                          const raw = latestScores.category_scores?.[key] ?? 0
                          const interp = interpretBiomarker(key, raw)
                          const barPct = normalizeScore(key, raw)

                          return (
                            <GlassCard key={key} variant="base">
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                                  config.lowerIsBetter ? 'bg-skogsgron/20' : 'bg-koppar/20',
                                )}>
                                  <div className={config.lowerIsBetter ? 'text-skogsgron' : 'text-koppar'}>
                                    {biomarkerIcons[key]}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold text-kalkvit text-sm">
                                      {config.label}
                                      <span className="text-kalkvit/40 font-normal text-xs ml-1">
                                        ({config.instrument})
                                      </span>
                                    </h4>
                                    <div className="flex items-center gap-1">
                                      <span className={cn('text-lg font-bold', interp.colorClass)}>
                                        {raw.toFixed(1)}
                                      </span>
                                      <span className="text-xs text-kalkvit/40">/ {config.maxScore}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 mb-2">
                                    <GlassBadge variant={interp.variant}>{interp.level}</GlassBadge>
                                    <span className="text-[10px] text-kalkvit/30">
                                      {config.lowerIsBetter ? 'Lower is better' : 'Higher is better'}
                                    </span>
                                  </div>

                                  <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden mb-2">
                                    <div
                                      className={cn(
                                        'h-full rounded-full transition-all duration-700',
                                        config.lowerIsBetter
                                          ? 'bg-gradient-to-r from-skogsgron to-oliv'
                                          : 'bg-gradient-to-r from-koppar to-brand-amber',
                                      )}
                                      style={{ width: `${barPct}%` }}
                                    />
                                  </div>

                                  <p className="text-xs text-kalkvit/50">{interp.description}</p>
                                </div>
                              </div>
                            </GlassCard>
                          )
                        })}

                        {/* Trends (2+ CVCs) */}
                        {completedCVCs.length >= 2 && (
                          <GlassCard variant="elevated">
                            <h3 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
                              <BarChart3 className="w-5 h-5 text-koppar" />
                              Biomarker Trends
                            </h3>
                            <div className="space-y-5">
                              {BIOMARKER_ORDER.map((key) => {
                                const config = BIOMARKER_CONFIGS[key]

                                const dataPoints = completedCVCs
                                  .filter((c: CVCAssessmentStatus) => c.scores?.category_scores?.[key] != null)
                                  .map((c: CVCAssessmentStatus) => ({
                                    label: CVC_SHORT_LABELS[c.type] || c.type,
                                    value: Number(c.scores!.category_scores![key]),
                                  }))

                                if (dataPoints.length < 2) return null

                                const trend = computeTrend(key, dataPoints[0].value, dataPoints[dataPoints.length - 1].value)
                                const trendInfo = trendConfig[trend]

                                return (
                                  <div key={key}>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className={config.lowerIsBetter ? 'text-skogsgron' : 'text-koppar'}>
                                          {biomarkerIcons[key]}
                                        </span>
                                        <span className="text-sm font-medium text-kalkvit">{config.label}</span>
                                      </div>
                                      <div className={cn('flex items-center gap-1 text-xs font-medium', trendInfo.color)}>
                                        {trendInfo.icon}
                                        {trendInfo.label}
                                      </div>
                                    </div>
                                    <div className="flex items-end gap-3">
                                      {dataPoints.map((dp) => {
                                        const bPct = normalizeScore(key, dp.value)
                                        return (
                                          <div key={dp.label} className="flex-1 text-center">
                                            <span className="text-xs font-medium text-kalkvit block mb-1">
                                              {dp.value.toFixed(1)}
                                            </span>
                                            <div className="h-16 bg-white/[0.06] rounded-lg overflow-hidden flex items-end">
                                              <div
                                                className={cn(
                                                  'w-full rounded-lg transition-all duration-500',
                                                  config.lowerIsBetter
                                                    ? 'bg-gradient-to-t from-skogsgron to-oliv'
                                                    : 'bg-gradient-to-t from-koppar to-brand-amber',
                                                )}
                                                style={{ height: `${bPct}%` }}
                                              />
                                            </div>
                                            <span className="text-[10px] text-kalkvit/40 block mt-1">{dp.label}</span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </GlassCard>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <GlassButton variant="secondary" className="text-sm" onClick={() => window.print()}>
                            <Download className="w-4 h-4" />
                            Save PDF
                          </GlassButton>
                          <Link to="/kpis">
                            <GlassButton variant="ghost" className="text-sm">
                              <BarChart3 className="w-4 h-4" />
                              View KPI Dashboard
                              <ArrowRight className="w-4 h-4" />
                            </GlassButton>
                          </Link>
                        </div>
                      </>
                    )
                  })()}
                </>
              )}
            </div>
          </GlassTabPanel>
        )}

        {/* Community Tab (cohort + accountability merged) */}
        {isEnrolled && hasCommunityContent && (
          <GlassTabPanel value="community" activeValue={activeTab}>
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
                              member.member_id === user?.id && 'ring-1 ring-koppar/30'
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
                                {member.member_id === user?.id && (
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
                              member.member_id === user?.id && 'ring-1 ring-koppar/30'
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
                                {member.member_id === user?.id && (
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
                          const isOwn = checkIn.member_id === user?.id
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
                              setCheckInForm((f) => ({ ...f, progress_update: e.target.value }))
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
                              setCheckInForm((f) => ({ ...f, challenges: e.target.value }))
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
                              setCheckInForm((f) => ({ ...f, support_needed: e.target.value }))
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
                              setCheckInForm((f) => ({ ...f, commitments_for_next: e.target.value }))
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
                                  setCheckInForm((f) => ({ ...f, week_rating: i + 1 }))
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
                          onClick={handleSubmitCheckIn}
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
          </GlassTabPanel>
        )}
      </div>
    </MainLayout>
  )
}

export default ProgramDetailPage
