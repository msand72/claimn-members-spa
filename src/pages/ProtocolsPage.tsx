import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge, GlassTabs } from '../components/ui'
import { PILLARS } from '../lib/constants'
import type { PillarId } from '../lib/constants'
import {
  Flame,
  Play,
  Clock,
  CheckCircle2,
  ChevronRight,
  Target,
  Calendar,
  TrendingUp,
  Pause,
} from 'lucide-react'

interface Protocol {
  id: string
  slug: string
  name: string
  pillar: PillarId
  description: string
  timeline: string
  stat: string
}

interface ActiveProtocol {
  id: string
  protocol: Protocol
  startedAt: string
  targetCompletionDate: string
  status: 'active' | 'paused' | 'completed'
  completionPercentage: number
  currentWeek: number
  totalWeeks: number
}

// Available protocols from the library
const protocolLibrary: Protocol[] = [
  {
    id: 'sleep-testosterone',
    slug: 'sleep-testosterone',
    name: 'Sleep-Testosterone Optimization',
    pillar: 'physical',
    description: 'Strategic sleep optimization unlocks measurable hormonal advantages.',
    timeline: '6 weeks',
    stat: '30% Recovery Boost',
  },
  {
    id: 'stress-to-performance',
    slug: 'stress-to-performance',
    name: 'Stress-to-Performance Conversion',
    pillar: 'emotional',
    description: 'Channel the male stress response into productive action.',
    timeline: '6 weeks',
    stat: '45% Recovery Improvement',
  },
  {
    id: 'values-clarification',
    slug: 'values-clarification',
    name: 'Values Clarification Framework',
    pillar: 'identity',
    description: 'Systematic framework to identify core values and build decision frameworks.',
    timeline: '4 weeks',
    stat: '40% Performance Advantage',
  },
  {
    id: 'male-friendships',
    slug: 'male-friendships',
    name: 'Building Male Friendships',
    pillar: 'connection',
    description: 'Activity-based bonding builds trust through side-by-side challenge.',
    timeline: '12 weeks',
    stat: '23% Lower Cortisol',
  },
  {
    id: 'flow-state',
    slug: 'flow-state',
    name: 'Flow State Engineering',
    pillar: 'mission',
    description: 'Clear goals + immediate feedback + challenge-skill balance trigger flow.',
    timeline: '90-minute blocks',
    stat: '200-500% Productivity',
  },
]

// Mock active protocols
const mockActiveProtocols: ActiveProtocol[] = [
  {
    id: 'ap1',
    protocol: protocolLibrary[0],
    startedAt: '2026-01-15',
    targetCompletionDate: '2026-02-26',
    status: 'active',
    completionPercentage: 35,
    currentWeek: 2,
    totalWeeks: 6,
  },
  {
    id: 'ap2',
    protocol: protocolLibrary[2],
    startedAt: '2026-01-10',
    targetCompletionDate: '2026-02-07',
    status: 'active',
    completionPercentage: 75,
    currentWeek: 3,
    totalWeeks: 4,
  },
]

function ActiveProtocolCard({ active }: { active: ActiveProtocol }) {
  const pillar = PILLARS[active.protocol.pillar]

  return (
    <GlassCard variant="elevated" className="mb-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <GlassBadge variant="koppar" className="mb-2">
            {pillar.name}
          </GlassBadge>
          <h3 className="font-display text-xl font-semibold text-kalkvit">
            {active.protocol.name}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-koppar">{active.completionPercentage}%</p>
          <p className="text-xs text-kalkvit/50">Complete</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-koppar to-brandAmber rounded-full transition-all"
            style={{ width: `${active.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm text-kalkvit/60 mb-4">
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          Week {active.currentWeek} of {active.totalWeeks}
        </span>
        <span className="flex items-center gap-1">
          <Target className="w-4 h-4" />
          {active.protocol.stat}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <GlassButton variant="primary" className="flex-1">
          <TrendingUp className="w-4 h-4" />
          Log Progress
        </GlassButton>
        <GlassButton variant="ghost">
          <Pause className="w-4 h-4" />
        </GlassButton>
      </div>
    </GlassCard>
  )
}

function ProtocolCard({ protocol, isActive }: { protocol: Protocol; isActive: boolean }) {
  const pillar = PILLARS[protocol.pillar]

  return (
    <GlassCard variant="base" className="hover:border-koppar/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <GlassBadge variant="koppar" className="text-xs">
          {pillar.name}
        </GlassBadge>
        {isActive && (
          <GlassBadge variant="success" className="text-xs">
            Active
          </GlassBadge>
        )}
      </div>

      <h3 className="font-semibold text-kalkvit mb-2">{protocol.name}</h3>
      <p className="text-sm text-kalkvit/60 mb-4 line-clamp-2">{protocol.description}</p>

      <div className="flex items-center justify-between text-xs text-kalkvit/50 mb-4">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {protocol.timeline}
        </span>
        <span className="text-koppar font-medium">{protocol.stat}</span>
      </div>

      <Link to={`/shop/protocols/${protocol.slug}`}>
        <GlassButton variant={isActive ? 'ghost' : 'secondary'} className="w-full">
          {isActive ? 'View Details' : 'Learn More'}
          <ChevronRight className="w-4 h-4" />
        </GlassButton>
      </Link>
    </GlassCard>
  )
}

export function ProtocolsPage() {
  const [activeTab, setActiveTab] = useState('my-protocols')

  const activeProtocolSlugs = mockActiveProtocols.map((ap) => ap.protocol.slug)

  const tabs = [
    { value: 'my-protocols', label: `My Protocols (${mockActiveProtocols.length})` },
    { value: 'library', label: 'Protocol Library' },
  ]

  // Group protocols by pillar
  const protocolsByPillar = protocolLibrary.reduce(
    (acc, protocol) => {
      if (!acc[protocol.pillar]) acc[protocol.pillar] = []
      acc[protocol.pillar].push(protocol)
      return acc
    },
    {} as Record<PillarId, Protocol[]>
  )

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Protocols</h1>
            <p className="text-kalkvit/60">
              Structured transformation programs to optimize your life
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <GlassCard variant="base" className="text-center py-4">
            <Flame className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">
              {mockActiveProtocols.length}
            </p>
            <p className="text-xs text-kalkvit/50">Active Protocols</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <CheckCircle2 className="w-6 h-6 text-skogsgron mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">0</p>
            <p className="text-xs text-kalkvit/50">Completed</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <TrendingUp className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">
              {Math.round(
                mockActiveProtocols.reduce((sum, ap) => sum + ap.completionPercentage, 0) /
                  mockActiveProtocols.length
              )}
              %
            </p>
            <p className="text-xs text-kalkvit/50">Avg Progress</p>
          </GlassCard>
        </div>

        {/* Tabs */}
        <GlassTabs tabs={tabs} value={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* Content */}
        {activeTab === 'my-protocols' ? (
          mockActiveProtocols.length > 0 ? (
            <div>
              {mockActiveProtocols.map((active) => (
                <ActiveProtocolCard key={active.id} active={active} />
              ))}
            </div>
          ) : (
            <GlassCard variant="base" className="text-center py-12">
              <Flame className="w-12 h-12 text-kalkvit/20 mx-auto mb-4" />
              <h3 className="font-medium text-kalkvit mb-2">No active protocols</h3>
              <p className="text-kalkvit/50 text-sm mb-4">
                Start a protocol from the library to begin your transformation
              </p>
              <GlassButton variant="primary" onClick={() => setActiveTab('library')}>
                <Play className="w-4 h-4" />
                Browse Protocols
              </GlassButton>
            </GlassCard>
          )
        ) : (
          <div className="space-y-8">
            {Object.entries(protocolsByPillar).map(([pillarId, protocols]) => {
              const pillar = PILLARS[pillarId as PillarId]
              return (
                <div key={pillarId}>
                  <h2 className="font-display text-xl font-semibold text-kalkvit mb-4">
                    {pillar.name}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {protocols.map((protocol) => (
                      <ProtocolCard
                        key={protocol.id}
                        protocol={protocol}
                        isActive={activeProtocolSlugs.includes(protocol.slug)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
