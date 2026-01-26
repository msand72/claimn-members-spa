import { useParams, Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge } from '../components/ui'
import { PILLARS } from '../lib/constants'
import type { PillarId } from '../lib/constants'
import {
  ChevronLeft,
  Clock,
  Target,
  Calendar,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react'
import { cn } from '../lib/utils'

interface ProtocolWeek {
  week: number
  title: string
  description: string
  tasks: {
    id: string
    title: string
    completed: boolean
  }[]
  status: 'completed' | 'current' | 'upcoming'
}

interface Protocol {
  id: string
  slug: string
  name: string
  pillar: PillarId
  description: string
  fullDescription: string
  timeline: string
  stat: string
  benefits: string[]
  weeks: ProtocolWeek[]
}

// Mock protocol data
const protocols: Record<string, Protocol> = {
  'sleep-testosterone': {
    id: 'sleep-testosterone',
    slug: 'sleep-testosterone',
    name: 'Sleep-Testosterone Optimization',
    pillar: 'physical',
    description: 'Strategic sleep optimization unlocks measurable hormonal advantages.',
    fullDescription:
      'This 6-week protocol systematically optimizes your sleep to boost testosterone levels naturally. By implementing evidence-based sleep hygiene practices, temperature regulation, and circadian rhythm optimization, you can achieve significant improvements in hormonal health and overall vitality.',
    timeline: '6 weeks',
    stat: '30% Recovery Boost',
    benefits: [
      'Improved testosterone production through optimized deep sleep',
      'Better recovery and muscle protein synthesis',
      'Enhanced cognitive function and focus',
      'Reduced cortisol and stress response',
      'Increased energy and motivation',
    ],
    weeks: [
      {
        week: 1,
        title: 'Sleep Environment Audit',
        description: 'Optimize your bedroom for perfect sleep conditions',
        tasks: [
          { id: 't1-1', title: 'Remove all light sources from bedroom', completed: true },
          { id: 't1-2', title: 'Set thermostat to 65-68°F (18-20°C)', completed: true },
          { id: 't1-3', title: 'Get blackout curtains or sleep mask', completed: true },
          { id: 't1-4', title: 'Remove electronics from bedroom', completed: false },
        ],
        status: 'completed',
      },
      {
        week: 2,
        title: 'Sleep Schedule Consistency',
        description: 'Lock in your circadian rhythm with consistent timing',
        tasks: [
          { id: 't2-1', title: 'Set fixed wake time (same every day)', completed: true },
          { id: 't2-2', title: 'Set fixed bedtime (7-9 hours before wake)', completed: true },
          { id: 't2-3', title: 'No snooze button for the week', completed: false },
          { id: 't2-4', title: 'Track sleep times in journal', completed: false },
        ],
        status: 'current',
      },
      {
        week: 3,
        title: 'Evening Wind-Down Protocol',
        description: 'Prepare your body and mind for optimal rest',
        tasks: [
          { id: 't3-1', title: 'No screens 90 minutes before bed', completed: false },
          { id: 't3-2', title: 'Implement 10-minute stretching routine', completed: false },
          { id: 't3-3', title: 'Practice 4-7-8 breathing technique', completed: false },
          { id: 't3-4', title: 'Write 3 things youre grateful for', completed: false },
        ],
        status: 'upcoming',
      },
      {
        week: 4,
        title: 'Nutrition Timing',
        description: 'Align eating patterns with sleep optimization',
        tasks: [
          { id: 't4-1', title: 'No caffeine after 2pm', completed: false },
          { id: 't4-2', title: 'Finish eating 3 hours before bed', completed: false },
          { id: 't4-3', title: 'Add magnesium supplement before bed', completed: false },
          { id: 't4-4', title: 'Limit alcohol to 2 drinks max, 4 hours before bed', completed: false },
        ],
        status: 'upcoming',
      },
      {
        week: 5,
        title: 'Morning Light Protocol',
        description: 'Leverage light exposure for circadian optimization',
        tasks: [
          { id: 't5-1', title: 'Get 10-30 min sunlight within first hour', completed: false },
          { id: 't5-2', title: 'Avoid sunglasses during morning light', completed: false },
          { id: 't5-3', title: 'Use light therapy box if needed', completed: false },
          { id: 't5-4', title: 'Track energy levels throughout day', completed: false },
        ],
        status: 'upcoming',
      },
      {
        week: 6,
        title: 'Integration & Maintenance',
        description: 'Consolidate habits and create sustainable routine',
        tasks: [
          { id: 't6-1', title: 'Review and adjust all protocols', completed: false },
          { id: 't6-2', title: 'Identify top 3 highest-impact changes', completed: false },
          { id: 't6-3', title: 'Create personalized sleep checklist', completed: false },
          { id: 't6-4', title: 'Schedule monthly sleep audit', completed: false },
        ],
        status: 'upcoming',
      },
    ],
  },
  'stress-to-performance': {
    id: 'stress-to-performance',
    slug: 'stress-to-performance',
    name: 'Stress-to-Performance Conversion',
    pillar: 'emotional',
    description: 'Channel the male stress response into productive action.',
    fullDescription:
      'Transform your relationship with stress using this 6-week protocol. Learn to recognize stress signals, reframe them as performance enhancers, and channel that energy into focused action. Based on cutting-edge research on the stress-performance relationship.',
    timeline: '6 weeks',
    stat: '45% Recovery Improvement',
    benefits: [
      'Recognize stress as a performance enhancer, not enemy',
      'Develop resilience through deliberate exposure',
      'Master physiological regulation techniques',
      'Build sustainable stress management habits',
      'Improve decision-making under pressure',
    ],
    weeks: [],
  },
}

// Mock active protocol status
const mockActiveStatus = {
  isActive: true,
  startedAt: '2026-01-15',
  currentWeek: 2,
  completionPercentage: 35,
  status: 'active' as const,
}

export function ProtocolDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const protocol = slug ? protocols[slug] : null

  if (!protocol) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="font-display text-2xl font-bold text-kalkvit mb-4">
            Protocol not found
          </h1>
          <Link to="/protocols">
            <GlassButton variant="secondary">
              <ChevronLeft className="w-4 h-4" />
              Back to Protocols
            </GlassButton>
          </Link>
        </div>
      </MainLayout>
    )
  }

  const pillar = PILLARS[protocol.pillar]
  const isActive = mockActiveStatus.isActive && protocol.slug === 'sleep-testosterone'

  // Calculate overall progress
  const totalTasks = protocol.weeks.reduce((sum, week) => sum + week.tasks.length, 0)
  const completedTasks = protocol.weeks.reduce(
    (sum, week) => sum + week.tasks.filter((t) => t.completed).length,
    0
  )
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <Link
          to="/protocols"
          className="inline-flex items-center gap-1 text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Protocols
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <GlassBadge variant="koppar">{pillar.name}</GlassBadge>
              {isActive && (
                <GlassBadge variant="success">
                  <Play className="w-3 h-3" />
                  Active
                </GlassBadge>
              )}
            </div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">
              {protocol.name}
            </h1>
            <p className="text-kalkvit/60">{protocol.description}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-koppar">{protocol.stat}</p>
            <p className="text-xs text-kalkvit/50">Expected Result</p>
          </div>
        </div>

        {/* Progress Card (if active) */}
        {isActive && (
          <GlassCard variant="elevated" className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-kalkvit">Your Progress</h3>
              <div className="flex gap-2">
                <GlassButton variant="ghost" className="p-2">
                  <Pause className="w-4 h-4" />
                </GlassButton>
                <GlassButton variant="ghost" className="p-2">
                  <RotateCcw className="w-4 h-4" />
                </GlassButton>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-kalkvit/60">Overall Completion</span>
                <span className="text-lg font-bold text-koppar">{progressPercent}%</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-koppar to-brandAmber rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="font-display text-xl font-bold text-kalkvit">
                  Week {mockActiveStatus.currentWeek}
                </p>
                <p className="text-xs text-kalkvit/50">Current Week</p>
              </div>
              <div>
                <p className="font-display text-xl font-bold text-kalkvit">
                  {completedTasks}/{totalTasks}
                </p>
                <p className="text-xs text-kalkvit/50">Tasks Done</p>
              </div>
              <div>
                <p className="font-display text-xl font-bold text-kalkvit">
                  {protocol.weeks.length - mockActiveStatus.currentWeek}
                </p>
                <p className="text-xs text-kalkvit/50">Weeks Left</p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* About */}
        <GlassCard variant="base" className="mb-8">
          <h3 className="font-semibold text-kalkvit mb-4">About This Protocol</h3>
          <p className="text-kalkvit/70 leading-relaxed mb-6">{protocol.fullDescription}</p>

          <div className="flex items-center gap-6 text-sm text-kalkvit/50 mb-6">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {protocol.timeline}
            </span>
            <span className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              {protocol.weeks.length} weeks
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {totalTasks} tasks
            </span>
          </div>

          <h4 className="font-medium text-kalkvit mb-3">Key Benefits</h4>
          <ul className="space-y-2">
            {protocol.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-kalkvit/70">
                <CheckCircle2 className="w-4 h-4 text-skogsgron flex-shrink-0 mt-0.5" />
                {benefit}
              </li>
            ))}
          </ul>
        </GlassCard>

        {/* Weekly Breakdown */}
        {protocol.weeks.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-kalkvit mb-4">Weekly Breakdown</h3>
            <div className="space-y-4">
              {protocol.weeks.map((week) => (
                <GlassCard
                  key={week.week}
                  variant={week.status === 'current' ? 'accent' : 'base'}
                  className={cn(
                    'transition-all',
                    week.status === 'current' && 'ring-1 ring-koppar/30'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-koppar">Week {week.week}</span>
                        {week.status === 'current' && (
                          <GlassBadge variant="koppar" className="text-xs">
                            Current
                          </GlassBadge>
                        )}
                        {week.status === 'completed' && (
                          <GlassBadge variant="success" className="text-xs">
                            <CheckCircle2 className="w-3 h-3" />
                            Done
                          </GlassBadge>
                        )}
                      </div>
                      <h4 className="font-semibold text-kalkvit">{week.title}</h4>
                      <p className="text-sm text-kalkvit/60">{week.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-koppar">
                        {week.tasks.filter((t) => t.completed).length}/{week.tasks.length}
                      </span>
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                    {week.tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3">
                        <button
                          className={cn(
                            'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                            task.completed
                              ? 'bg-skogsgron border-skogsgron'
                              : 'border-kalkvit/30 hover:border-koppar'
                          )}
                        >
                          {task.completed && <CheckCircle2 className="w-3 h-3 text-kalkvit" />}
                        </button>
                        <span
                          className={cn(
                            'text-sm',
                            task.completed
                              ? 'text-kalkvit/50 line-through'
                              : 'text-kalkvit/80'
                          )}
                        >
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        {!isActive && (
          <div className="text-center">
            <GlassButton variant="primary" className="px-8">
              <Play className="w-4 h-4" />
              Start This Protocol
            </GlassButton>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
