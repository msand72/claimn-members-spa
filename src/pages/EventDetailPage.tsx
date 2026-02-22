import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge, GlassAvatar } from '../components/ui'
import {
  useEvent,
  useRegisterForEvent,
  useUnregisterFromEvent,
  useEnrolledPrograms,
  usePrograms,
  useProgramCVCStatus,
} from '../lib/api/hooks'
import type { CVCAssessmentStatus } from '../lib/api/types'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Loader2,
  AlertTriangle,
  UserCheck,
  UserMinus,
  ClipboardCheck,
  CheckCircle,
  Circle,
  BarChart3,
  ArrowRight,
  BookOpen,
} from 'lucide-react'


function formatEventDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatEventTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs} hour${hrs > 1 ? 's' : ''}`
}

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: event, isLoading, error } = useEvent(id || '')
  const registerMutation = useRegisterForEvent()
  const unregisterMutation = useUnregisterFromEvent()

  // For GO sessions: find GO program and fetch CVC assessment status
  const isGoSession = event?.event_type === 'go_session'
  const { data: programsData } = usePrograms()
  const { data: enrolledData } = useEnrolledPrograms()

  const { goProgramId, isEnrolled } = useMemo(() => {
    // Find GO program from programs list (has full slug/tier fields)
    const programs = Array.isArray(programsData?.data) ? programsData.data : []
    const goProgram = programs.find(
      (p) => p.slug === 'go-sessions-s1' || p.tier === 'go_sessions'
    )
    const programId = goProgram?.id || ''

    // Check if user is enrolled
    const enrolled = Array.isArray(enrolledData?.data) ? enrolledData.data : []
    const enrolledMatch = enrolled.find(
      (ep) =>
        ep.program_id === programId ||
        ep.program?.slug === 'go-sessions-s1' ||
        ep.program?.tier === 'go_sessions'
    )

    return {
      goProgramId: enrolledMatch?.program_id || programId,
      isEnrolled: !!enrolledMatch,
    }
  }, [programsData, enrolledData])

  const { data: cvcStatus } = useProgramCVCStatus(
    isGoSession && event?.is_registered && isEnrolled ? goProgramId : ''
  )
  const cvcAssessments = cvcStatus?.assessments || []

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-koppar animate-spin" />
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !event) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Link
            to="/events"
            className="inline-flex items-center gap-1 text-sm text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
          <GlassCard variant="base" className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-tegelrod mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">Failed to load event</h3>
            <p className="text-kalkvit/50 text-sm">
              This event may not exist or there was a connection issue.
            </p>
          </GlassCard>
        </div>
      </MainLayout>
    )
  }

  const isPast = new Date(event.scheduled_date) < new Date()
  const isFull = event.registered_count >= event.capacity
  const capacityPct = event.capacity > 0 ? Math.min((event.registered_count / event.capacity) * 100, 100) : 0

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          to={isGoSession && goProgramId ? `/programs/${goProgramId}` : '/events'}
          className="inline-flex items-center gap-1 text-sm text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {isGoSession && goProgramId ? 'Back to GO Program' : 'Back to Events'}
        </Link>

        {/* Hero Section */}
        <GlassCard variant="elevated" className="mb-6">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <GlassBadge variant="koppar">
              {event.event_type === 'brotherhood_call' ? 'Brotherhood Call' : 'GO Session'}
            </GlassBadge>
            <GlassBadge variant="default">
              {event.tier_required}
            </GlassBadge>
            {event.is_registered && (
              <GlassBadge variant="success">
                Registered
              </GlassBadge>
            )}
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-4">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-kalkvit/60">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-koppar" />
              {formatEventDate(event.scheduled_date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-koppar" />
              {formatEventTime(event.scheduled_date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-koppar" />
              {formatDuration(event.duration_minutes)}
            </span>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Protocol name for GO sessions */}
            {event.event_type === 'go_session' && event.protocol_name && (
              <GlassCard variant="base">
                <p className="font-serif text-lg text-koppar italic">
                  {event.protocol_name}
                </p>
              </GlassCard>
            )}

            {/* Description */}
            <GlassCard variant="base">
              <h2 className="font-display text-lg font-semibold text-kalkvit mb-3">
                About This Event
              </h2>
              <p className="text-kalkvit/70 leading-relaxed whitespace-pre-line">
                {event.long_description || event.description}
              </p>
            </GlassCard>

            {/* Agenda for GO sessions */}
            {event.agenda && event.agenda.length > 0 && (
              <GlassCard variant="base">
                <h2 className="font-display text-lg font-semibold text-kalkvit mb-4">
                  Session Agenda
                </h2>
                <div className="space-y-3">
                  {event.agenda.map((block, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="text-xs text-koppar font-medium whitespace-nowrap w-16 shrink-0 pt-0.5">
                        {block.time_start}&ndash;{block.time_end} min
                      </span>
                      <div>
                        <p className="text-sm font-medium text-kalkvit">{block.label}</p>
                        <p className="text-xs text-kalkvit/50">{block.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Research citations for GO sessions */}
            {event.research_citations && event.research_citations.length > 0 && (
              <GlassCard variant="base">
                <h2 className="font-display text-lg font-semibold text-kalkvit mb-4">
                  Research
                </h2>
                <div className="space-y-3">
                  {event.research_citations.map((citation, i) => (
                    <div key={i} className="border-l-2 border-koppar/30 pl-3">
                      <p className="text-sm text-kalkvit/80">{citation.title}</p>
                      <p className="text-xs text-kalkvit/50">
                        {citation.journal}, {citation.year} &mdash; {citation.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Zoom link for registered GO sessions */}
            {event.event_type === 'go_session' && event.is_registered && event.zoom_url && (
              <GlassCard variant="base" className="border border-koppar/30">
                <h2 className="font-display text-lg font-semibold text-kalkvit mb-3">
                  Join Session
                </h2>
                <a
                  href={event.zoom_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-koppar hover:bg-koppar/90 text-kalkvit text-sm font-medium rounded-lg transition-colors w-full justify-center"
                >
                  Open Zoom
                </a>
              </GlassCard>
            )}

            {/* My GO Program link — registered GO sessions */}
            {isGoSession && event.is_registered && (
              <Link to={goProgramId ? `/programs/${goProgramId}` : '/programs'}>
                <GlassCard variant="base" className="border border-koppar/30 hover:border-koppar/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-koppar" />
                    <div className="flex-1">
                      <p className="font-medium text-kalkvit text-sm">My GO Program</p>
                      <p className="text-xs text-kalkvit/50">Sprints, assessments & progress</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-kalkvit/30 group-hover:text-koppar transition-colors" />
                  </div>
                </GlassCard>
              </Link>
            )}

            {/* Facilitator Card */}
            {event.facilitator && (
              <GlassCard variant="base">
                <h2 className="font-display text-lg font-semibold text-kalkvit mb-4">
                  Facilitator
                </h2>
                <div className="flex items-center gap-3">
                  <GlassAvatar
                    src={event.facilitator.avatar_url}
                    alt={event.facilitator.name}
                    size="lg"
                  />
                  <div>
                    <p className="font-medium text-kalkvit">{event.facilitator.name}</p>
                    <p className="text-xs text-kalkvit/50">Event Facilitator</p>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Capacity Card */}
            <GlassCard variant="base">
              <h2 className="font-display text-lg font-semibold text-kalkvit mb-4">
                Capacity
              </h2>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-koppar" />
                <span className="text-kalkvit font-medium">
                  {event.registered_count}/{event.capacity} spots
                </span>
                {isFull && (
                  <GlassBadge variant="error" className="text-xs ml-auto">
                    Full
                  </GlassBadge>
                )}
              </div>
              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full transition-all ${
                    isFull ? 'bg-tegelrod' : 'bg-gradient-to-r from-koppar to-brandAmber'
                  }`}
                  style={{ width: `${capacityPct}%` }}
                />
              </div>

              {/* Register / Unregister */}
              {!isPast && (
                <>
                  {event.is_registered ? (
                    <GlassButton
                      variant="ghost"
                      className="w-full"
                      onClick={() => unregisterMutation.mutate(event.id)}
                    >
                      <UserMinus className="w-4 h-4" />
                      Unregister
                    </GlassButton>
                  ) : (
                    <GlassButton
                      variant="primary"
                      className="w-full"
                      onClick={() => registerMutation.mutate(event.id)}
                      disabled={isFull}
                    >
                      <UserCheck className="w-4 h-4" />
                      {isFull ? 'Event Full' : 'Register'}
                    </GlassButton>
                  )}
                </>
              )}

              {isPast && !event.is_registered && (
                <p className="text-center text-sm text-kalkvit/40">
                  This event has already taken place.
                </p>
              )}
            </GlassCard>

            {/* CVC Assessments — registered GO sessions */}
            {event.event_type === 'go_session' && event.is_registered && cvcAssessments.length > 0 && (
              <GlassCard variant="base">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardCheck className="w-5 h-5 text-koppar" />
                  <h2 className="font-display text-lg font-semibold text-kalkvit">
                    Vitality Checks
                  </h2>
                </div>
                <div className="space-y-3">
                  {cvcAssessments.map((assessment: CVCAssessmentStatus) => {
                    const typeLabels: Record<string, string> = {
                      baseline: 'Pre-Season',
                      midline: 'Mid-Season',
                      final: 'Post-Season',
                    }
                    return (
                      <div
                        key={assessment.assessment_id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.04]"
                      >
                        {assessment.is_completed ? (
                          <CheckCircle className="w-5 h-5 text-skogsgron shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-kalkvit/30 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-kalkvit truncate">
                            {typeLabels[assessment.type] || assessment.name}
                          </p>
                          {assessment.is_completed && assessment.scores ? (
                            <p className="text-xs text-skogsgron">
                              {Math.round(assessment.scores.percentage_score)}% vitality
                            </p>
                          ) : (
                            <p className="text-xs text-kalkvit/40">Week {assessment.week_number}</p>
                          )}
                        </div>
                        {!assessment.is_completed && goProgramId && (
                          <Link
                            to={`/programs/${goProgramId}/assessment/${assessment.assessment_id}`}
                            className="text-xs text-koppar hover:text-koppar/80 font-medium whitespace-nowrap"
                          >
                            Take now
                          </Link>
                        )}
                        {assessment.is_completed && (
                          <GlassBadge variant="success" className="text-xs shrink-0">
                            Done
                          </GlassBadge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </GlassCard>
            )}

            {/* KPI Biomarkers link — registered GO sessions */}
            {event.event_type === 'go_session' && event.is_registered && (
              <Link to="/kpis">
                <GlassCard variant="base" className="hover:border-koppar/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-koppar" />
                    <div className="flex-1">
                      <p className="font-medium text-kalkvit text-sm">Vitality KPIs</p>
                      <p className="text-xs text-kalkvit/50">Track your biomarker progress</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-kalkvit/30 group-hover:text-koppar transition-colors" />
                  </div>
                </GlassCard>
              </Link>
            )}


          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default EventDetailPage
