import { useState } from 'react'
import { stripHtml } from '../lib/sanitize'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge } from '../components/ui'
import { SortBar, sortItems, type SortState } from '../components/ui'
import { PILLARS, PILLAR_IDS } from '../lib/constants'
import type { PillarId } from '../lib/constants'
import { PillarIcon } from '../components/icons'
import { PILLAR_CONFIG } from '../tokens/pillars'
import {
  useProtocols,
  useMyActiveProtocols,
  type ProtocolTemplate,
} from '../lib/api/hooks'
import {
  FireIcon,
  ClockIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { cn } from '../lib/utils'

// Filter tabs including 'all'
const FILTER_TABS = [
  { id: 'all', label: 'All' },
  ...PILLAR_IDS.map((id) => ({ id, label: PILLARS[id].name })),
]

function ProtocolCard({
  protocol,
  isActive,
}: {
  protocol: ProtocolTemplate
  isActive: boolean
}) {
  const pillarId = (protocol.pillar || 'identity') as PillarId
  const pillar = PILLARS[pillarId] || PILLARS.identity

  // Use headline_stat if available, otherwise fall back to stat
  const headlineStat = protocol.headline_stat || protocol.stat || ''

  return (
    <Link to={`/protocols/${protocol.slug}`}>
      <GlassCard
        variant="base"
        pillar={pillarId}
        className="h-full hover:border-koppar/30 transition-all hover:scale-[1.02] cursor-pointer p-5 md:p-7 relative overflow-hidden"
      >
        <PillarIcon pillar={pillarId} size={80} className="absolute top-2 right-2 opacity-[0.10] pointer-events-none" />
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center" style={{ backgroundColor: PILLAR_CONFIG[pillarId]?.colorLo }}>
              <PillarIcon pillar={pillarId} size={32} />
            </div>
            <GlassBadge variant="koppar" className="text-xs whitespace-nowrap">
              {pillar.name}
            </GlassBadge>
          </div>
          {isActive && (
            <GlassBadge variant="success" className="text-xs whitespace-nowrap flex-shrink-0">
              Active
            </GlassBadge>
          )}
          {protocol.is_featured && !isActive && (
            <GlassBadge variant="warning" className="text-xs whitespace-nowrap flex-shrink-0 flex items-center gap-1">
              <SparklesIcon className="w-3 h-3" />
              Featured
            </GlassBadge>
          )}
        </div>

        <h3 className="font-display text-lg font-semibold text-kalkvit mb-2 line-clamp-2">
          {protocol.name}
        </h3>

        {headlineStat && (
          <p className="text-koppar font-medium text-sm mb-2">{headlineStat}</p>
        )}

        <p className="text-sm text-kalkvit/60 mb-4 line-clamp-2">
          {stripHtml(protocol.description)}
        </p>

        <div className="flex items-center justify-between text-xs text-kalkvit/50 pt-3 border-t border-white/10">
          <span className="flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            {protocol.timeline || 'Multi-week'}
          </span>
          <span className="flex items-center gap-1 text-koppar">
            View Details
            <ChevronRightIcon className="w-3 h-3" />
          </span>
        </div>
      </GlassCard>
    </Link>
  )
}

export function ProtocolsPage() {
  const [selectedPillar, setSelectedPillar] = useState<string>('all')
  const [sort, setSort] = useState<SortState>({ key: 'name', direction: 'asc' })

  // API hooks
  const {
    data: protocolsData,
    isLoading: isLoadingProtocols,
    error: protocolsError,
  } = useProtocols(selectedPillar !== 'all' ? selectedPillar : undefined)

  const {
    data: activeProtocolsData,
    isLoading: isLoadingActive,
    error: activeError,
  } = useMyActiveProtocols({ status: 'active' })

  // Defensive data handling
  const protocolsRaw = Array.isArray(protocolsData) ? protocolsData : []
  const protocols = sortItems(protocolsRaw, sort, {
    name: (p) => p.name,
    pillar: (p) => p.pillar || '',
  })
  const activeProtocols = Array.isArray(activeProtocolsData) ? activeProtocolsData : []
  const activeProtocolSlugs = new Set(activeProtocols.map((ap) => ap.protocol_slug))

  const isLoading = isLoadingProtocols || isLoadingActive
  const error = protocolsError || activeError

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto">
          <GlassCard variant="base" className="text-center py-12">
            <ExclamationTriangleIcon className="w-12 h-12 text-tegelrod mx-auto mb-4" />
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
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">
                Transformation Protocols
              </h1>
              <p className="text-kalkvit/60 max-w-2xl">
                Evidence-based programs designed to create lasting change. Each protocol provides
                a structured path with weekly tasks, progress tracking, and measurable outcomes.
              </p>
            </div>
            {activeProtocols.length > 0 && (
              <Link to="/my-protocols">
                <GlassButton variant="secondary" className="flex items-center gap-2">
                  <FireIcon className="w-4 h-4 text-koppar" />
                  My Protocols ({activeProtocols.length})
                </GlassButton>
              </Link>
            )}
          </div>
        </div>

        {/* Pillar Filter Tabs */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedPillar(tab.id)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                  selectedPillar === tab.id
                    ? 'bg-koppar text-kalkvit'
                    : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1] hover:text-kalkvit'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-serif text-xl font-semibold text-kalkvit">Protocols</h2>
          <SortBar
            options={[
              { key: 'name', label: 'Name' },
              { key: 'pillar', label: 'Pillar' },
            ]}
            value={sort}
            onChange={setSort}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <ArrowPathIcon className="w-8 h-8 text-koppar animate-spin" />
          </div>
        )}

        {/* Protocols Grid */}
        {!isLoading && protocols.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {protocols.map((protocol) => (
              <ProtocolCard
                key={protocol.slug}
                protocol={protocol}
                isActive={activeProtocolSlugs.has(protocol.slug)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && protocols.length === 0 && (
          <GlassCard variant="base" className="text-center py-12">
            <FireIcon className="w-12 h-12 text-kalkvit/20 mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">
              No protocols found
            </h3>
            <p className="text-kalkvit/50 text-sm">
              {selectedPillar !== 'all'
                ? `No protocols available for ${PILLARS[selectedPillar as PillarId]?.name || selectedPillar}. Try selecting a different pillar.`
                : 'Protocols will appear here once they are added.'}
            </p>
          </GlassCard>
        )}
      </div>
    </MainLayout>
  )
}

export default ProtocolsPage
