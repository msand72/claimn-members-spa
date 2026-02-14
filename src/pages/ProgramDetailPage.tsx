import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge, GlassTabs, GlassTabPanel, GlassAvatar } from '../components/ui'
import { useProgram, useEnrolledPrograms, useEnrollProgram, useSprints } from '../lib/api/hooks'
import type { Sprint } from '../lib/api/types'
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
  )
}

export function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('overview')
  const [isEnrolling, setIsEnrolling] = useState(false)

  const { data: program, isLoading, error } = useProgram(id || '')
  const { data: enrolledData } = useEnrolledPrograms()
  const { data: sprintsData, isLoading: isLoadingSprints } = useSprints(id)
  const enrollMutation = useEnrollProgram()

  const enrolledPrograms = Array.isArray(enrolledData?.data) ? enrolledData.data : []
  const userEnrollment = enrolledPrograms.find((ep) => ep.program_id === id)
  const isEnrolled = !!userEnrollment
  const progress = userEnrollment?.progress || 0

  const sprints = Array.isArray(sprintsData?.data) ? sprintsData.data : []

  const handleEnroll = async () => {
    if (!id) return
    setIsEnrolling(true)
    try {
      await enrollMutation.mutateAsync({ program_id: id })
    } finally {
      setIsEnrolling(false)
    }
  }

  const tabs = [
    { value: 'overview', label: 'Overview', icon: <BookOpen className="w-4 h-4" /> },
    { value: 'sprints', label: 'Sprints', icon: <Zap className="w-4 h-4" />, badge: sprints.length || undefined },
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
            {isEnrolled && (
              <GlassBadge variant="success">Enrolled</GlassBadge>
            )}
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

          {/* Progress bar (if enrolled) */}
          {isEnrolled && progress > 0 && (
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
          ) : isEnrolled ? (
            <GlassButton
              variant="primary"
              onClick={() => setActiveTab('sprints')}
            >
              <Play className="w-4 h-4" />
              Continue Learning
            </GlassButton>
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
      </div>
    </MainLayout>
  )
}

export default ProgramDetailPage
