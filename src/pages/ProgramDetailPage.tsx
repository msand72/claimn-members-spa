import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge, GlassTabs, GlassTabPanel, GlassAvatar } from '../components/ui'
import { useProgram, useEnrolledPrograms, useEnrollProgram, useSprints, useProgramAssessments, useProgramAssessmentResults, useProgramCohort, useProgramCompletion, useProgramApplication, useSubmitApplication, useMyAccountabilityGroups, useAccountabilityGroupDetail, useGroupCheckIns, useCreateCheckIn } from '../lib/api/hooks'
import type { Sprint, ProgramCohortMember, CheckIn } from '../lib/api/types'
import { useAuth } from '../contexts/AuthContext'
import {
  ArrowLeft,
  Clock,
  Users,
  CheckCircle,
  Lock,
  Play,
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
} from 'lucide-react'
import { cn } from '../lib/utils'

const difficultyColors = {
  Beginner: 'success',
  Intermediate: 'warning',
  Advanced: 'error',
} as const

function SprintCard({ sprint, index }: { sprint: Sprint; index: number }) {
  const statusConfig = {
    upcoming: { variant: 'default' as const, label: 'Upcoming' },
    active: { variant: 'success' as const, label: 'Active' },
    completed: { variant: 'koppar' as const, label: 'Completed' },
  }

  const status = statusConfig[sprint.status] || statusConfig.upcoming

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

            {sprint.status === 'active' && sprint.progress > 0 && (
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

  const enrolledPrograms = Array.isArray(enrolledData?.data) ? enrolledData.data : []
  const userEnrollment = enrolledPrograms.find((ep) => ep.program_id === id)
  const isEnrolled = !!userEnrollment
  const progress = userEnrollment?.progress || 0

  const sprints = Array.isArray(sprintsData?.data) ? sprintsData.data : []

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

  // Cohort — only fetch for enrolled users
  const { data: cohortData, isLoading: isLoadingCohort } = useProgramCohort(
    isEnrolled ? (id || '') : ''
  )
  const cohorts = Array.isArray(cohortData?.data) ? cohortData.data : []
  const cohort = cohorts[0] || null // User is typically in one cohort per program

  // Accountability — only fetch for enrolled users
  const { data: accountabilityGroups, isLoading: isLoadingAccountability } = useMyAccountabilityGroups({
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

  const tabs = [
    { value: 'overview', label: 'Overview', icon: <BookOpen className="w-4 h-4" /> },
    { value: 'sprints', label: 'Sprints', icon: <Zap className="w-4 h-4" />, badge: sprints.length || undefined },
    ...(isEnrolled && assessments.length > 0
      ? [{ value: 'assessments', label: 'Assessments', icon: <ClipboardCheck className="w-4 h-4" />, badge: assessments.length }]
      : []),
    ...(isEnrolled && cohort
      ? [{ value: 'cohort', label: 'My Cohort', icon: <Users className="w-4 h-4" />, badge: cohort.member_count || undefined }]
      : []),
    ...(isEnrolled && programGroup
      ? [{ value: 'accountability', label: 'Accountability', icon: <HandHeart className="w-4 h-4" /> }]
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

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
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
            {program.name}
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
            <GlassButton variant="ghost" disabled>
              <Lock className="w-4 h-4" />
              Unlock with Premium
            </GlassButton>
          ) : isCompleted ? (
            <GlassButton
              variant="secondary"
              onClick={() => setActiveTab('sprints')}
            >
              <BookOpen className="w-4 h-4" />
              Review Material
            </GlassButton>
          ) : isEnrolled ? (
            <GlassButton
              variant="primary"
              onClick={() => setActiveTab('sprints')}
            >
              <Play className="w-4 h-4" />
              Continue Learning
            </GlassButton>
          ) : program.requires_application ? (
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
                  Apply to {program.name}
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

        {/* Assessments Tab */}
        {isEnrolled && assessments.length > 0 && (
          <GlassTabPanel value="assessments" activeValue={activeTab}>
            {isLoadingAssessments ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-koppar animate-spin" />
              </div>
            ) : (
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
                  const typeLabels: Record<string, string> = {
                    baseline: 'Baseline',
                    midline: 'Midline',
                    final: 'Final',
                    custom: 'Custom',
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
                            {result && result.score !== null && (
                              <span className="text-skogsgron">
                                Score: {result.score}
                                {result.max_score ? `/${result.max_score}` : ''}
                              </span>
                            )}
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
            )}
          </GlassTabPanel>
        )}

        {/* Cohort Tab */}
        {isEnrolled && cohort && (
          <GlassTabPanel value="cohort" activeValue={activeTab}>
            {isLoadingCohort ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-koppar animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Cohort info */}
                <GlassCard variant="base">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold text-kalkvit flex items-center gap-2">
                        <Users className="w-5 h-5 text-koppar" />
                        {cohort.name}
                      </h3>
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

                  <div className="flex flex-wrap items-center gap-4 text-sm text-kalkvit/50">
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
                </GlassCard>

                {/* Cohort members */}
                {cohort.members && cohort.members.length > 0 ? (
                  <GlassCard variant="base">
                    <h4 className="font-semibold text-kalkvit mb-4">
                      Cohort Members ({cohort.members.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {cohort.members.map((member: ProgramCohortMember) => (
                        <div
                          key={member.member_id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04]"
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
                            </p>
                            <p className="text-xs text-kalkvit/50 capitalize">
                              {member.role || 'Member'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                ) : (
                  <GlassCard variant="base" className="text-center py-8">
                    <Users className="w-8 h-8 text-kalkvit/30 mx-auto mb-3" />
                    <p className="text-kalkvit/50 text-sm">
                      Cohort member details will be available soon.
                    </p>
                  </GlassCard>
                )}
              </div>
            )}
          </GlassTabPanel>
        )}

        {/* Accountability Tab */}
        {isEnrolled && programGroup && (
          <GlassTabPanel value="accountability" activeValue={activeTab}>
            {isLoadingAccountability ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-koppar animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group info */}
                <GlassCard variant="base">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold text-kalkvit flex items-center gap-2">
                        <HandHeart className="w-5 h-5 text-koppar" />
                        {groupDetail?.name || programGroup.name}
                      </h3>
                      <p className="text-sm text-kalkvit/60 mt-1 capitalize">
                        {programGroup.group_type?.replace('_', ' ') || 'Group'}
                      </p>
                    </div>
                    <GlassBadge variant={programGroup.is_active ? 'success' : 'default'}>
                      {programGroup.is_active ? 'Active' : 'Inactive'}
                    </GlassBadge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-kalkvit/50">
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
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {groupMembers.length} member{groupMembers.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </GlassCard>

                {/* Group members */}
                {groupMembers.length > 0 && (
                  <GlassCard variant="base">
                    <h4 className="font-semibold text-kalkvit mb-4">Group Members</h4>
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
                  </GlassCard>
                )}

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
          </GlassTabPanel>
        )}
      </div>
    </MainLayout>
  )
}

export default ProgramDetailPage
