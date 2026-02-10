import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge, GlassAlert } from '../components/ui'
import { useCheckout, useProtocolTemplate, useActiveProtocolBySlug } from '../lib/api/hooks'
import { isAllowedExternalUrl } from '../lib/url-validation'
import { PILLARS } from '../lib/constants'
import type { PillarId } from '../lib/constants'
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Lock,
  Play,
  FileText,
  Award,
  ChevronRight,
  ChevronDown,
  Loader2,
  AlertTriangle,
  Target,
} from 'lucide-react'
import { cn } from '../lib/utils'
import type { ProtocolWeek } from '../lib/api/hooks/useProtocols'

function WeekCard({ week, index, isPurchased }: { week: ProtocolWeek; index: number; isPurchased: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              isPurchased ? 'bg-koppar/20 text-koppar' : 'bg-white/[0.06] text-kalkvit/40'
            )}
          >
            {index + 1}
          </div>
          <div className="text-left">
            <h4 className="font-medium text-kalkvit">{week.title}</h4>
            <p className="text-xs text-kalkvit/50">
              {week.tasks.length} tasks · Week {week.week}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isPurchased && <Lock className="w-4 h-4 text-kalkvit/40" />}
          <ChevronDown
            className={cn(
              'w-5 h-5 text-kalkvit/50 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </div>
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/10">
          <p className="text-sm text-kalkvit/60 pt-3 mb-3">{week.description}</p>
          <div className="pt-2 space-y-2">
            {week.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-3">
                  <Target className="w-4 h-4 text-koppar" />
                  <span className="text-sm text-kalkvit/70">{task.title}</span>
                </div>
                {isPurchased && (
                  <GlassButton variant="ghost" className="text-xs py-1 px-2">
                    View
                  </GlassButton>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function ShopProtocolDetailPage() {
  const { slug } = useParams()
  const checkout = useCheckout()
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // Fetch protocol template from API
  const { data: protocol, isLoading, error } = useProtocolTemplate(slug || '')

  // Check if user has already started this protocol
  const { data: activeProtocol } = useActiveProtocolBySlug(slug || '')
  const isPurchased = !!activeProtocol

  const handlePurchase = () => {
    setCheckoutError(null)
    checkout.mutate(
      { item_type: 'protocol', item_slug: slug },
      {
        onSuccess: (data) => {
          if (isAllowedExternalUrl(data.checkout_url)) {
            window.location.href = data.checkout_url
          } else {
            setCheckoutError('Invalid checkout URL. Please try again or contact support.')
          }
        },
        onError: () => {
          setCheckoutError('Failed to start checkout. Please try again.')
        },
      }
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-koppar animate-spin" />
        </div>
      </MainLayout>
    )
  }

  // Error state
  if (error || !protocol) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto text-center py-12">
          <AlertTriangle className="w-12 h-12 text-tegelrod mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-kalkvit mb-4">
            Protocol not found
          </h1>
          <p className="text-kalkvit/60 mb-6">
            The protocol you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/shop/protocols">
            <GlassButton variant="secondary">
              <ArrowLeft className="w-4 h-4" />
              Back to Protocols
            </GlassButton>
          </Link>
        </div>
      </MainLayout>
    )
  }

  // Get pillar info
  const pillarId = protocol.pillar as PillarId
  const pillar = PILLARS[pillarId]

  // Get protocol sections and implementation steps from new schema
  const sections = Array.isArray(protocol.protocol_sections) ? protocol.protocol_sections : []
  const implementationSteps = Array.isArray(protocol.implementation_steps) ? protocol.implementation_steps : []
  const durationWeeks = protocol.duration_weeks || 8

  // Calculate stats from sections (fallback to weeks for legacy data)
  const weeks = Array.isArray(protocol.weeks) ? protocol.weeks : []
  const totalTasks = weeks.length > 0
    ? weeks.reduce((sum, week) => sum + (Array.isArray(week.tasks) ? week.tasks.length : 0), 0)
    : sections.reduce((sum, section) => sum + (Array.isArray(section.items) ? section.items.length : 0), 0)

  // Calculate progress if user has started
  const completedTasks = activeProtocol?.completed_tasks || {}
  const completedTasksCount = Object.values(completedTasks).filter(Boolean).length
  const progress = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <Link
          to="/shop/protocols"
          className="inline-flex items-center gap-2 text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Protocols
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <GlassCard variant="elevated">
              <div className="flex items-start justify-between mb-4">
                <GlassBadge variant="koppar">{pillar?.name || protocol.pillar}</GlassBadge>
                {isPurchased && (
                  <GlassBadge variant="success" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Enrolled
                  </GlassBadge>
                )}
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">
                {protocol.title}
              </h1>
              <p className="text-lg text-koppar mb-4">{protocol.headline_stat || protocol.subtitle}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-kalkvit/60 mb-6">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {durationWeeks} week{durationWeeks !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {sections.length || implementationSteps.length} sections
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {totalTasks} tasks
                </span>
              </div>

              {isPurchased && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-kalkvit/60">Your Progress</span>
                    <span className="text-skogsgron font-medium">{progress}%</span>
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-skogsgron rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <p className="text-kalkvit/70">{protocol.description}</p>
            </GlassCard>

            {/* What You'll Achieve */}
            <GlassCard variant="base">
              <h2 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-koppar" />
                What You'll Achieve
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-kalkvit/70">
                  <CheckCircle className="w-5 h-5 text-skogsgron flex-shrink-0 mt-0.5" />
                  {protocol.headline_stat || protocol.subtitle}
                </li>
                <li className="flex items-start gap-3 text-kalkvit/70">
                  <CheckCircle className="w-5 h-5 text-skogsgron flex-shrink-0 mt-0.5" />
                  Evidence-based protocol for optimal results
                </li>
                <li className="flex items-start gap-3 text-kalkvit/70">
                  <CheckCircle className="w-5 h-5 text-skogsgron flex-shrink-0 mt-0.5" />
                  Structured weekly progression over {durationWeeks} weeks
                </li>
                <li className="flex items-start gap-3 text-kalkvit/70">
                  <CheckCircle className="w-5 h-5 text-skogsgron flex-shrink-0 mt-0.5" />
                  Build sustainable habits over time
                </li>
              </ul>
            </GlassCard>

            {/* Scientific Foundation */}
            {protocol.scientific_foundation && (
              <GlassCard variant="base">
                <h2 className="font-semibold text-kalkvit mb-4">Scientific Foundation</h2>
                <p className="text-kalkvit/70 mb-4">{protocol.scientific_foundation}</p>
                {protocol.scientific_citations && protocol.scientific_citations.length > 0 && (
                  <div className="text-xs text-kalkvit/50 space-y-1">
                    {protocol.scientific_citations.map((citation, i) => (
                      <p key={i}>• {citation}</p>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}

            {/* Protocol Sections */}
            {sections.length > 0 && (
              <GlassCard variant="base">
                <h2 className="font-semibold text-kalkvit mb-4">Protocol Overview</h2>
                <div className="space-y-4">
                  {sections.map((section: { title: string; icon?: string; items?: string[] }, i: number) => (
                    <div key={i} className="border border-white/10 rounded-xl p-4">
                      <h4 className="font-medium text-kalkvit mb-2">{section.title}</h4>
                      {section.items && section.items.length > 0 && (
                        <ul className="space-y-1">
                          {section.items.map((item: string, j: number) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-kalkvit/70">
                              <Target className="w-4 h-4 text-koppar flex-shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Implementation Timeline */}
            {implementationSteps.length > 0 && (
              <GlassCard variant="base">
                <h2 className="font-semibold text-kalkvit mb-4">Implementation Timeline</h2>
                <div className="space-y-3">
                  {implementationSteps.map((step: { period?: string; title: string; desc?: string }, i: number) => (
                    <div key={i} className="flex gap-4 p-3 border border-white/10 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-koppar/20 text-koppar flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {step.period || i + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-kalkvit">{step.title}</h4>
                        {step.desc && <p className="text-sm text-kalkvit/60">{step.desc}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Legacy Curriculum (for old week-based protocols) */}
            {weeks.length > 0 && (
              <GlassCard variant="base">
                <h2 className="font-semibold text-kalkvit mb-4">Curriculum</h2>
                <div className="space-y-3">
                  {weeks.map((week, i) => (
                    <WeekCard key={week.week} week={week} index={i} isPurchased={isPurchased} />
                  ))}
                </div>
              </GlassCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <GlassCard variant="accent" leftBorder={false} className="sticky top-6">
              {isPurchased ? (
                <>
                  <div className="text-center mb-4">
                    <p className="text-skogsgron font-medium mb-2">You have access</p>
                    <p className="text-sm text-kalkvit/60">
                      Continue where you left off
                    </p>
                  </div>
                  <Link to={`/protocols/${slug}`}>
                    <GlassButton variant="primary" className="w-full mb-3">
                      <Play className="w-4 h-4" />
                      Continue Learning
                    </GlassButton>
                  </Link>
                  <Link to="/programs/sprints">
                    <GlassButton variant="secondary" className="w-full">
                      Join a Sprint
                      <ChevronRight className="w-4 h-4" />
                    </GlassButton>
                  </Link>
                </>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <p className="text-sm text-skogsgron">Included with membership</p>
                  </div>
                  <GlassButton
                    variant="primary"
                    className="w-full"
                    onClick={handlePurchase}
                    disabled={checkout.isPending}
                  >
                    {checkout.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {checkout.isPending ? 'Processing...' : 'Get Started'}
                  </GlassButton>
                  {checkoutError && (
                    <GlassAlert variant="error" className="mt-3">
                      {checkoutError}
                    </GlassAlert>
                  )}
                </>
              )}

              <div className="mt-6 pt-6 border-t border-white/10 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-kalkvit/60">
                  <CheckCircle className="w-4 h-4 text-skogsgron" />
                  Lifetime access
                </div>
                <div className="flex items-center gap-2 text-kalkvit/60">
                  <CheckCircle className="w-4 h-4 text-skogsgron" />
                  Track your progress
                </div>
                <div className="flex items-center gap-2 text-kalkvit/60">
                  <CheckCircle className="w-4 h-4 text-skogsgron" />
                  Community access
                </div>
                <div className="flex items-center gap-2 text-kalkvit/60">
                  <CheckCircle className="w-4 h-4 text-skogsgron" />
                  Sprint eligibility
                </div>
              </div>
            </GlassCard>

            {/* About */}
            <GlassCard variant="base">
              <h3 className="font-semibold text-kalkvit mb-3">About This Protocol</h3>
              <p className="text-sm text-kalkvit/60">{protocol.description}</p>
            </GlassCard>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default ShopProtocolDetailPage;
