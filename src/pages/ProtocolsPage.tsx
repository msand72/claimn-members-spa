import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge, GlassTabs } from '../components/ui'
import { PILLARS } from '../lib/constants'
import type { PillarId } from '../lib/constants'
import {
  useActiveProtocols,
  useProtocolLibrary,
  usePauseProtocol,
  type ProtocolTemplate,
} from '../lib/api/hooks'
import type { ActiveProtocol } from '../lib/api/types'
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
  Loader2,
  AlertTriangle,
} from 'lucide-react'

function ActiveProtocolCard({
  active,
  protocol,
  onPause,
  isPausing,
}: {
  active: ActiveProtocol
  protocol?: ProtocolTemplate
  onPause: (id: string) => void
  isPausing: boolean
}) {
  const pillarId = (protocol?.pillar || 'identity') as PillarId
  const pillar = PILLARS[pillarId]

  // Calculate total weeks from protocol template or use a default
  const totalWeeks = protocol?.weeks?.length || 6

  return (
    <GlassCard variant="elevated" className="mb-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <GlassBadge variant="koppar" className="mb-2">
            {pillar.name}
          </GlassBadge>
          <h3 className="font-display text-xl font-semibold text-kalkvit">
            {active.protocol_name}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-koppar">{active.progress_percentage}%</p>
          <p className="text-xs text-kalkvit/50">Complete</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-koppar to-brandAmber rounded-full transition-all"
            style={{ width: `${active.progress_percentage}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm text-kalkvit/60 mb-4">
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          Week {active.current_week} of {totalWeeks}
        </span>
        <span className="flex items-center gap-1">
          <Target className="w-4 h-4" />
          Started {new Date(active.started_at).toLocaleDateString()}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link to={`/shop/protocols/${active.protocol_slug}`} className="flex-1">
          <GlassButton variant="primary" className="w-full">
            <TrendingUp className="w-4 h-4" />
            View Progress
          </GlassButton>
        </Link>
        <GlassButton
          variant="ghost"
          onClick={() => onPause(active.id)}
          disabled={isPausing}
        >
          {isPausing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Pause className="w-4 h-4" />
          )}
        </GlassButton>
      </div>
    </GlassCard>
  )
}

function ProtocolCard({
  protocol,
  isActive,
}: {
  protocol: ProtocolTemplate
  isActive: boolean
}) {
  const pillarId = protocol.pillar as PillarId
  const pillar = PILLARS[pillarId]

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
  const [pausingId, setPausingId] = useState<string | null>(null)

  // API hooks
  const {
    data: activeProtocolsData,
    isLoading: isLoadingActive,
    error: activeError,
  } = useActiveProtocols()
  const {
    data: libraryData,
    isLoading: isLoadingLibrary,
    error: libraryError,
  } = useProtocolLibrary()
  const pauseMutation = usePauseProtocol()

  const activeProtocols = Array.isArray(activeProtocolsData) ? activeProtocolsData : []
  const protocolLibrary = Array.isArray(libraryData) ? libraryData : []

  const handlePause = async (id: string) => {
    setPausingId(id)
    try {
      await pauseMutation.mutateAsync(id)
    } finally {
      setPausingId(null)
    }
  }

  const activeProtocolSlugs = activeProtocols.map((ap) => ap.protocol_slug)

  const tabs = [
    { value: 'my-protocols', label: `My Protocols (${activeProtocols.length})` },
    { value: 'library', label: 'Protocol Library' },
  ]

  // Group protocols by pillar
  const protocolsByPillar = protocolLibrary.reduce(
    (acc, protocol) => {
      const pillarId = protocol.pillar as PillarId
      if (!acc[pillarId]) acc[pillarId] = []
      acc[pillarId].push(protocol)
      return acc
    },
    {} as Record<PillarId, ProtocolTemplate[]>
  )

  // Calculate stats
  const completedCount = activeProtocols.filter((p) => p.status === 'completed').length
  const avgProgress =
    activeProtocols.length > 0
      ? Math.round(
          activeProtocols.reduce((sum, ap) => sum + ap.progress_percentage, 0) /
            activeProtocols.length
        )
      : 0

  const isLoading = isLoadingActive || isLoadingLibrary
  const error = activeError || libraryError

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto">
          <GlassCard variant="base" className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-tegelrod mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">Failed to load protocols</h3>
            <p className="text-kalkvit/50 text-sm">
              Please try refreshing the page or check your connection.
            </p>
          </GlassCard>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">
              Protocols
            </h1>
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
              {isLoading ? '-' : activeProtocols.filter((p) => p.status === 'active').length}
            </p>
            <p className="text-xs text-kalkvit/50">Active Protocols</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <CheckCircle2 className="w-6 h-6 text-skogsgron mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">
              {isLoading ? '-' : completedCount}
            </p>
            <p className="text-xs text-kalkvit/50">Completed</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <TrendingUp className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">
              {isLoading ? '-' : `${avgProgress}%`}
            </p>
            <p className="text-xs text-kalkvit/50">Avg Progress</p>
          </GlassCard>
        </div>

        {/* Tabs */}
        <GlassTabs tabs={tabs} value={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-koppar animate-spin" />
          </div>
        ) : activeTab === 'my-protocols' ? (
          activeProtocols.filter((p) => p.status === 'active').length > 0 ? (
            <div>
              {activeProtocols
                .filter((p) => p.status === 'active')
                .map((active) => {
                  const protocol = protocolLibrary.find(
                    (p) => p.slug === active.protocol_slug
                  )
                  return (
                    <ActiveProtocolCard
                      key={active.id}
                      active={active}
                      protocol={protocol}
                      onPause={handlePause}
                      isPausing={pausingId === active.id}
                    />
                  )
                })}
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
                  <h2 className="font-serif text-xl font-semibold text-kalkvit mb-4">
                    {pillar.name}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {protocols.map((protocol) => (
                      <ProtocolCard
                        key={protocol.slug}
                        protocol={protocol}
                        isActive={activeProtocolSlugs.includes(protocol.slug)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
            {Object.keys(protocolsByPillar).length === 0 && (
              <GlassCard variant="base" className="text-center py-12">
                <Flame className="w-12 h-12 text-kalkvit/20 mx-auto mb-4" />
                <h3 className="font-medium text-kalkvit mb-2">
                  Protocol library is empty
                </h3>
                <p className="text-kalkvit/50 text-sm">
                  Protocols will appear here once they are added.
                </p>
              </GlassCard>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default ProtocolsPage;
