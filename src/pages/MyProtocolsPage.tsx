import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge, GlassTabs } from '../components/ui'
import { PILLARS } from '../lib/constants'
import type { PillarId } from '../lib/constants'
import {
  useMyActiveProtocols,
  useProtocols,
  usePauseProtocol,
  useResumeProtocol,
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
  RotateCcw,
  Loader2,
  AlertTriangle,
  Archive,
  Compass,
  Brain,
  Heart,
  Users,
} from 'lucide-react'

// Pillar icon mapping
const PILLAR_ICONS: Record<string, React.ElementType> = {
  identity: Compass,
  emotional: Brain,
  physical: Heart,
  connection: Users,
  mission: Target,
}

function ActiveProtocolCard({
  active,
  protocol,
  onPause,
  onResume,
  isPausing,
  isResuming,
}: {
  active: ActiveProtocol
  protocol?: ProtocolTemplate
  onPause: (id: string) => void
  onResume: (id: string) => void
  isPausing: boolean
  isResuming: boolean
}) {
  const pillarId = (protocol?.pillar || 'identity') as PillarId
  const pillar = PILLARS[pillarId] || PILLARS.identity
  const PillarIcon = PILLAR_ICONS[pillarId] || Target

  // Calculate total weeks from protocol template or use a default
  const weeks = protocol?.weeks || []
  const totalWeeks = weeks.length || 6
  const totalTasks = weeks.reduce(
    (sum, week) => sum + (Array.isArray(week.tasks) ? week.tasks.length : 0),
    0
  )

  const isActive = active.status === 'active'
  const isPaused = active.status === 'paused'

  return (
    <GlassCard variant="elevated" className="mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-koppar/10 flex items-center justify-center flex-shrink-0">
            <PillarIcon className="w-5 h-5 text-koppar" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GlassBadge variant="koppar" className="text-xs">
                {pillar.name}
              </GlassBadge>
              {isActive && (
                <GlassBadge variant="success" className="text-xs">
                  <Play className="w-3 h-3" />
                  Active
                </GlassBadge>
              )}
              {isPaused && (
                <GlassBadge variant="warning" className="text-xs">
                  <Pause className="w-3 h-3" />
                  Paused
                </GlassBadge>
              )}
            </div>
            <h3 className="font-display text-xl font-semibold text-kalkvit">
              {active.protocol_name}
            </h3>
            {protocol?.description && (
              <p className="text-sm text-kalkvit/60 mt-1 line-clamp-2">
                {protocol.description}
              </p>
            )}
          </div>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-kalkvit/60 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>Week {active.current_week} of {totalWeeks}</span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4" />
          <span>{totalTasks} total tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Started {new Date(active.started_at).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <span>{Math.max(0, totalWeeks - active.current_week)} weeks left</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-white/10">
        <Link to={`/protocols/${active.protocol_slug}`} className="flex-1">
          <GlassButton variant="primary" className="w-full">
            <TrendingUp className="w-4 h-4" />
            View Progress
          </GlassButton>
        </Link>
        {isActive && (
          <GlassButton
            variant="ghost"
            onClick={() => onPause(active.id)}
            disabled={isPausing}
            className="px-4"
          >
            {isPausing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </GlassButton>
        )}
        {isPaused && (
          <GlassButton
            variant="ghost"
            onClick={() => onResume(active.id)}
            disabled={isResuming}
            className="px-4"
          >
            {isResuming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
          </GlassButton>
        )}
      </div>
    </GlassCard>
  )
}

function CompletedProtocolCard({
  active,
  protocol,
}: {
  active: ActiveProtocol
  protocol?: ProtocolTemplate
}) {
  const pillarId = (protocol?.pillar || 'identity') as PillarId
  const pillar = PILLARS[pillarId] || PILLARS.identity

  return (
    <GlassCard variant="base" className="mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-skogsgron/10 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-skogsgron" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GlassBadge variant="default" className="text-xs">
                {pillar.name}
              </GlassBadge>
              <GlassBadge variant="success" className="text-xs">
                <CheckCircle2 className="w-3 h-3" />
                Completed
              </GlassBadge>
            </div>
            <h3 className="font-display text-lg font-semibold text-kalkvit">
              {active.protocol_name}
            </h3>
            <p className="text-sm text-kalkvit/50 mt-1">
              Completed on {new Date(active.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Link to={`/protocols/${active.protocol_slug}`}>
          <GlassButton variant="ghost" className="text-sm">
            View
            <ChevronRight className="w-4 h-4" />
          </GlassButton>
        </Link>
      </div>
    </GlassCard>
  )
}

export function MyProtocolsPage() {
  const [activeTab, setActiveTab] = useState('active')
  const [pausingId, setPausingId] = useState<string | null>(null)
  const [resumingId, setResumingId] = useState<string | null>(null)

  // API hooks - get all protocols regardless of status
  const {
    data: activeProtocolsData,
    isLoading: isLoadingActive,
    error: activeError,
  } = useMyActiveProtocols()

  const {
    data: protocolsData,
    isLoading: isLoadingProtocols,
    error: protocolsError,
  } = useProtocols()

  const pauseMutation = usePauseProtocol()
  const resumeMutation = useResumeProtocol()

  // Defensive data handling
  const allProtocols = Array.isArray(activeProtocolsData) ? activeProtocolsData : []
  const protocolLibrary = Array.isArray(protocolsData) ? protocolsData : []

  // Create a map of protocol templates by slug
  const protocolMap = new Map<string, ProtocolTemplate>()
  protocolLibrary.forEach((p) => protocolMap.set(p.slug, p))

  // Filter protocols by status
  const activeProtocols = allProtocols.filter(
    (p) => p.status === 'active' || p.status === 'paused'
  )
  const completedProtocols = allProtocols.filter((p) => p.status === 'completed')

  const handlePause = async (id: string) => {
    setPausingId(id)
    try {
      await pauseMutation.mutateAsync(id)
    } finally {
      setPausingId(null)
    }
  }

  const handleResume = async (id: string) => {
    setResumingId(id)
    try {
      await resumeMutation.mutateAsync(id)
    } finally {
      setResumingId(null)
    }
  }

  const isLoading = isLoadingActive || isLoadingProtocols
  const error = activeError || protocolsError

  // Calculate stats
  const activeCount = allProtocols.filter((p) => p.status === 'active').length
  const pausedCount = allProtocols.filter((p) => p.status === 'paused').length
  const completedCount = completedProtocols.length
  const avgProgress =
    activeProtocols.length > 0
      ? Math.round(
          activeProtocols.reduce((sum, ap) => sum + ap.progress_percentage, 0) /
            activeProtocols.length
        )
      : 0

  const tabs = [
    { value: 'active', label: `Active (${activeProtocols.length})` },
    { value: 'completed', label: `Completed (${completedCount})` },
  ]

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
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">
              My Protocols
            </h1>
            <p className="text-kalkvit/60">
              Track your progress and manage your active transformation protocols
            </p>
          </div>
          <Link to="/protocols">
            <GlassButton variant="secondary">
              <Flame className="w-4 h-4" />
              Browse Protocols
            </GlassButton>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <GlassCard variant="base" className="text-center py-4">
            <Flame className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">
              {isLoading ? '-' : activeCount}
            </p>
            <p className="text-xs text-kalkvit/50">Active</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <Pause className="w-6 h-6 text-brandAmber mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">
              {isLoading ? '-' : pausedCount}
            </p>
            <p className="text-xs text-kalkvit/50">Paused</p>
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

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-koppar animate-spin" />
          </div>
        )}

        {/* Active Protocols Tab */}
        {!isLoading && activeTab === 'active' && (
          <>
            {activeProtocols.length > 0 ? (
              <div>
                {activeProtocols.map((active) => {
                  const protocol = protocolMap.get(active.protocol_slug)
                  return (
                    <ActiveProtocolCard
                      key={active.id}
                      active={active}
                      protocol={protocol}
                      onPause={handlePause}
                      onResume={handleResume}
                      isPausing={pausingId === active.id}
                      isResuming={resumingId === active.id}
                    />
                  )
                })}
              </div>
            ) : (
              <GlassCard variant="base" className="text-center py-12">
                <Flame className="w-12 h-12 text-kalkvit/20 mx-auto mb-4" />
                <h3 className="font-medium text-kalkvit mb-2">No active protocols</h3>
                <p className="text-kalkvit/50 text-sm mb-4">
                  Start a protocol to begin your transformation journey
                </p>
                <Link to="/protocols">
                  <GlassButton variant="primary">
                    <Play className="w-4 h-4" />
                    Browse Protocols
                  </GlassButton>
                </Link>
              </GlassCard>
            )}
          </>
        )}

        {/* Completed Protocols Tab */}
        {!isLoading && activeTab === 'completed' && (
          <>
            {completedProtocols.length > 0 ? (
              <div>
                {completedProtocols.map((active) => {
                  const protocol = protocolMap.get(active.protocol_slug)
                  return (
                    <CompletedProtocolCard
                      key={active.id}
                      active={active}
                      protocol={protocol}
                    />
                  )
                })}
              </div>
            ) : (
              <GlassCard variant="base" className="text-center py-12">
                <Archive className="w-12 h-12 text-kalkvit/20 mx-auto mb-4" />
                <h3 className="font-medium text-kalkvit mb-2">No completed protocols</h3>
                <p className="text-kalkvit/50 text-sm">
                  Complete your first protocol to see it here
                </p>
              </GlassCard>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}

export default MyProtocolsPage
