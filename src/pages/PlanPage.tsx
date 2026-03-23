import { useState, useEffect, useMemo } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge } from '../components/ui'
import {
  SparklesIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { cn } from '../lib/utils'
import { PILLAR_CONFIG, type PillarId } from '../tokens/pillars'
import { PlanItemCard } from '../components/coaching/PlanItemCard'
import {
  useCoachingPlan,
  useGeneratePlan,
  useAcceptPlan,
  useArchivePlan,
} from '../lib/api/hooks/useCoaching'

// ── Day Mapping ──────────────────────────────────────

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// day_of_week in the API uses 1=Mon, 7=Sun
function getTodayDayNum(): number {
  const jsDay = new Date().getDay() // 0=Sun
  return jsDay === 0 ? 7 : jsDay
}

// ── Generation Loading Steps ─────────────────────────

const GENERATION_STEPS = [
  'Analyzing your goals...',
  'Reviewing your protocols...',
  'Checking your KPI trends...',
  'Building your personalized plan...',
]

function GeneratingAnimation() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s < GENERATION_STEPS.length - 1 ? s + 1 : s))
    }, 1200)
    return () => clearInterval(timer)
  }, [])

  return (
    <GlassCard variant="base" className="text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-koppar/10 flex items-center justify-center mx-auto mb-6">
        <ArrowPathIcon className="w-8 h-8 text-koppar animate-spin" />
      </div>
      <h3 className="font-display text-xl font-semibold text-kalkvit mb-4">
        Creating Your Plan
      </h3>
      <div className="space-y-2 max-w-xs mx-auto">
        {GENERATION_STEPS.map((text, i) => (
          <p
            key={text}
            className={cn(
              'text-sm transition-all duration-500',
              i <= step ? 'text-kalkvit/70' : 'text-kalkvit/20',
              i === step && 'text-koppar font-medium'
            )}
          >
            {i < step ? '✓ ' : i === step ? '→ ' : '  '}
            {text}
          </p>
        ))}
      </div>
    </GlassCard>
  )
}

// ── Main Component ───────────────────────────────────

export function PlanPage() {
  const { data: planData, isLoading } = useCoachingPlan()
  const generatePlan = useGeneratePlan()
  const acceptPlan = useAcceptPlan()
  const archivePlan = useArchivePlan()

  const [selectedDay, setSelectedDay] = useState<number | 'anytime'>(getTodayDayNum())
  const [isGenerating, setIsGenerating] = useState(false)

  const plan = planData?.plan ?? null
  const items = plan?.items ?? []
  const isDraft = plan?.status === 'draft'
  const isActive = plan?.status === 'active'

  const focusPillarConfig = plan?.focus_pillar ? PILLAR_CONFIG[plan.focus_pillar as PillarId] : null

  // Count completed items
  const completedCount = items.filter((i) => i.status === 'completed').length
  const totalCount = items.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Filter items by selected day
  const filteredItems = useMemo(() => {
    if (selectedDay === 'anytime') {
      return items.filter((i) => !i.day_of_week || i.day_of_week.length === 0)
    }
    return items.filter((i) =>
      i.day_of_week && i.day_of_week.includes(selectedDay as number)
    )
  }, [items, selectedDay])

  // Count items per day (for badge display)
  const itemsPerDay = useMemo(() => {
    const counts: Record<string, number> = { anytime: 0 }
    for (let d = 1; d <= 7; d++) counts[d] = 0
    for (const item of items) {
      if (!item.day_of_week || item.day_of_week.length === 0) {
        counts.anytime++
      } else {
        for (const d of item.day_of_week) {
          counts[d] = (counts[d] || 0) + 1
        }
      }
    }
    return counts
  }, [items])

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      await generatePlan.mutateAsync()
    } finally {
      setIsGenerating(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto flex items-center justify-center py-12">
          <ArrowPathIcon className="w-8 h-8 text-koppar animate-spin" />
        </div>
      </MainLayout>
    )
  }

  // Generating state
  if (isGenerating) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <GeneratingAnimation />
        </div>
      </MainLayout>
    )
  }

  // Empty state — no plan
  if (!plan) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <GlassCard variant="base" className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-koppar/10 flex items-center justify-center mx-auto mb-6">
              <SparklesIcon className="w-10 h-10 text-koppar" />
            </div>
            <h2 className="font-display text-2xl font-bold text-kalkvit mb-3">
              Your AI Growth Plan
            </h2>
            <p className="text-kalkvit/60 max-w-md mx-auto mb-8">
              Your AI coach can create a personalized weekly plan based on your goals, protocols, KPIs, and assessment results.
            </p>
            <GlassButton
              variant="primary"
              onClick={handleGenerate}
              disabled={generatePlan.isPending}
            >
              <SparklesIcon className="w-4 h-4" />
              Generate My Plan
            </GlassButton>
            {generatePlan.isError && (
              <p className="text-sm text-tegelrod mt-4">Failed to generate plan. Please try again.</p>
            )}
          </GlassCard>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-1">
                {plan.title}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                {focusPillarConfig && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
                    style={{ color: focusPillarConfig.color, borderColor: focusPillarConfig.colorBorder, backgroundColor: focusPillarConfig.colorLo }}
                  >
                    {focusPillarConfig.shortName} Focus
                  </span>
                )}
                <GlassBadge variant={isDraft ? 'warning' : 'success'} className="text-[10px]">
                  {isDraft ? 'Draft' : 'Active'}
                </GlassBadge>
              </div>
            </div>
            <div className="flex gap-2">
              {isDraft && (
                <>
                  <GlassButton
                    variant="primary"
                    onClick={() => acceptPlan.mutate()}
                    disabled={acceptPlan.isPending}
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    {acceptPlan.isPending ? 'Accepting...' : 'Accept Plan'}
                  </GlassButton>
                  <GlassButton
                    variant="ghost"
                    onClick={() => archivePlan.mutate()}
                    disabled={archivePlan.isPending}
                  >
                    <TrashIcon className="w-4 h-4" />
                    Discard
                  </GlassButton>
                </>
              )}
              {isActive && (
                <>
                  <GlassButton
                    variant="secondary"
                    onClick={handleGenerate}
                    disabled={generatePlan.isPending}
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    Regenerate
                  </GlassButton>
                  <GlassButton
                    variant="ghost"
                    onClick={() => { if (confirm('Archive this plan?')) archivePlan.mutate() }}
                    disabled={archivePlan.isPending}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </GlassButton>
                </>
              )}
            </div>
          </div>

          {/* Summary */}
          {plan.summary && (
            <p className="text-sm text-kalkvit/60 mt-3">{plan.summary}</p>
          )}

          {/* Progress bar (active plans only) */}
          {isActive && totalCount > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-kalkvit/50">{completedCount} of {totalCount} completed</span>
                <span className="text-koppar font-medium">{progressPercent}%</span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-koppar rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Day selector + Items */}
        <div className="lg:flex lg:gap-6">
          {/* Day selector */}
          <div className="mb-4 lg:mb-0 lg:w-48 lg:flex-shrink-0">
            {/* Mobile: horizontal scroll */}
            <div className="flex lg:flex-col gap-1.5 overflow-x-auto scrollbar-hide pb-2 lg:pb-0">
              {DAY_NAMES.map((name, i) => {
                const dayNum = i + 1
                const isToday = dayNum === getTodayDayNum()
                const isSelected = selectedDay === dayNum
                const count = itemsPerDay[dayNum] || 0
                return (
                  <button
                    key={dayNum}
                    onClick={() => setSelectedDay(dayNum)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0',
                      'lg:w-full lg:justify-between',
                      isSelected
                        ? 'bg-koppar text-kalkvit'
                        : isToday
                          ? 'bg-koppar/10 text-koppar border border-koppar/20'
                          : 'bg-white/[0.04] text-kalkvit/60 hover:bg-white/[0.08]'
                    )}
                  >
                    <span className="lg:hidden">{name}</span>
                    <span className="hidden lg:inline">{DAY_FULL[i]}</span>
                    {count > 0 && (
                      <span className={cn(
                        'text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center',
                        isSelected ? 'bg-kalkvit/20' : 'bg-white/[0.08]'
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
              {/* Anytime */}
              <button
                onClick={() => setSelectedDay('anytime')}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0',
                  'lg:w-full lg:justify-between lg:mt-2',
                  selectedDay === 'anytime'
                    ? 'bg-koppar text-kalkvit'
                    : 'bg-white/[0.04] text-kalkvit/60 hover:bg-white/[0.08]'
                )}
              >
                Anytime
                {(itemsPerDay.anytime || 0) > 0 && (
                  <span className={cn(
                    'text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center',
                    selectedDay === 'anytime' ? 'bg-kalkvit/20' : 'bg-white/[0.08]'
                  )}>
                    {itemsPerDay.anytime}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Items list */}
          <div className="flex-1 space-y-3">
            {filteredItems.length > 0 ? (
              filteredItems
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((item) => (
                  <PlanItemCard
                    key={item.id}
                    item={item}
                    isCheckable={isActive}
                  />
                ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-kalkvit/40">
                  {selectedDay === 'anytime'
                    ? 'No flexible items in this plan'
                    : `No items scheduled for ${DAY_FULL[(selectedDay as number) - 1]}`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default PlanPage
