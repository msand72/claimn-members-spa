import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge } from '../components/ui'
import { ClockIcon, CheckCircleIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { cn } from '../lib/utils'
import { useProtocols, useMyActiveProtocols, type ProtocolTemplate } from '../lib/api/hooks'
import { PILLARS } from '../lib/constants'
import type { PillarId } from '../lib/constants'
import { EXPERT_SESSION_PRICES } from '../config/stripe-prices'

// Internal Protocol type for display - maps from API ProtocolTemplate
interface Protocol {
  id: string
  slug: string
  title: string
  description: string
  category: string
  duration: string
  isActive: boolean
  modules: number
}

// Map ProtocolTemplate from API to internal Protocol display type
function mapProtocolTemplateToProtocol(
  template: ProtocolTemplate,
  isActive: boolean
): Protocol {
  const pillarId = template.pillar as PillarId
  const pillarName = PILLARS[pillarId]?.name || template.pillar

  // Calculate modules from protocol sections or legacy weeks
  const sections = template.protocol_sections || []
  const moduleCount = sections.length > 0
    ? sections.reduce((sum, section) => sum + (section.items?.length || 0), 0)
    : template.weeks?.reduce((sum, week) => sum + (week.tasks?.length || 0), 0) || 0

  // Compute duration string from duration_weeks
  const durationWeeks = template.duration_weeks || 8
  const duration = `${durationWeeks} week${durationWeeks !== 1 ? 's' : ''}`

  return {
    id: template.slug,
    slug: template.slug,
    title: template.title,
    description: template.description,
    category: pillarName,
    duration,
    isActive,
    modules: moduleCount || sections.length || template.weeks?.length || 0,
  }
}

function ProtocolCard({ protocol }: { protocol: Protocol }) {
  const sessionPrice = EXPERT_SESSION_PRICES[60].amount

  return (
    <GlassCard variant="base" className="overflow-hidden group">
      {/* Header with category and badges */}
      <div className="flex items-center justify-between mb-3">
        <GlassBadge variant="default">{protocol.category}</GlassBadge>
        {protocol.isActive && (
          <GlassBadge variant="success" className="flex items-center gap-1">
            <CheckCircleIcon className="w-3 h-3" />
            Active
          </GlassBadge>
        )}
      </div>

      {/* Title and description */}
      <h3 className="font-display text-xl font-bold text-kalkvit mb-2 group-hover:text-koppar transition-colors">
        {protocol.title}
      </h3>
      <p className="text-sm text-kalkvit/60 mb-4 line-clamp-2">{protocol.description}</p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-kalkvit/50 mb-2">
        <span className="flex items-center gap-1">
          <ClockIcon className="w-4 h-4" />
          {protocol.duration}
        </span>
        {protocol.modules > 0 && (
          <span>{protocol.modules} modules</span>
        )}
      </div>

      {/* Free for members note */}
      <p className="text-xs text-skogsgron mb-4">Included with your membership</p>

      {/* CTA */}
      <div className="pt-4 border-t border-white/10 space-y-2">
        <Link to={`/protocols/${protocol.slug}`} className="block">
          <GlassButton variant="secondary" className="w-full text-sm justify-center">
            View Protocol
          </GlassButton>
        </Link>
        <Link to="/book-session" className="block">
          <GlassButton variant="primary" className="w-full text-sm justify-center gap-2">
            Get Expert Support — ${sessionPrice}/hr
          </GlassButton>
        </Link>
      </div>
    </GlassCard>
  )
}

export function ShopProtocolsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showOwned, setShowOwned] = useState(false)

  // API hooks
  const {
    data: libraryData,
    isLoading: isLoadingLibrary,
    error: libraryError,
  } = useProtocols()

  const {
    data: activeProtocolsData,
    isLoading: isLoadingActive,
    error: activeError,
  } = useMyActiveProtocols()

  const protocolLibrary: ProtocolTemplate[] = Array.isArray(libraryData) ? libraryData
    : Array.isArray((libraryData as unknown as { data: ProtocolTemplate[] })?.data) ? (libraryData as unknown as { data: ProtocolTemplate[] }).data
    : []
  const activeProtocols = Array.isArray(activeProtocolsData) ? activeProtocolsData : []
  const activeProtocolSlugs = new Set(activeProtocols.map((ap) => ap.protocol_slug))

  // Map API protocols to display format
  const protocols: Protocol[] = protocolLibrary.map((template) =>
    mapProtocolTemplateToProtocol(template, activeProtocolSlugs.has(template.slug))
  )

  // Get unique categories from protocols
  const uniqueCategories = ['All', ...new Set(protocols.map((p) => p.category))]

  const filteredProtocols = protocols.filter((protocol) => {
    const matchesCategory = selectedCategory === 'All' || protocol.category === selectedCategory
    const matchesActive = !showOwned || protocol.isActive
    return matchesCategory && matchesActive
  })

  const activeCount = protocols.filter((p) => p.isActive).length
  const isLoading = isLoadingLibrary || isLoadingActive
  const error = libraryError || activeError

  // Error state
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
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">Protocols</h1>
            <p className="text-kalkvit/60">
              Structured programs to transform specific areas of your life
            </p>
          </div>
          <GlassCard variant="accent" leftBorder={false} className="px-6 py-3 text-center">
            <p className="text-sm text-kalkvit/60">Your Protocols</p>
            <p className="font-display text-2xl font-bold text-kalkvit">
              {isLoading ? '-' : activeCount}
            </p>
          </GlassCard>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {uniqueCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  selectedCategory === category
                    ? 'bg-koppar text-kalkvit'
                    : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1] hover:text-kalkvit'
                )}
              >
                {category}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowOwned(!showOwned)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
              showOwned
                ? 'bg-skogsgron/20 text-skogsgron border border-skogsgron/30'
                : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1]'
            )}
          >
            <CheckCircleIcon className="w-4 h-4" />
            Show Active Only
          </button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <ArrowPathIcon className="w-8 h-8 text-koppar animate-spin" />
          </div>
        )}

        {/* Protocols Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProtocols.map((protocol) => (
              <ProtocolCard key={protocol.id} protocol={protocol} />
            ))}
          </div>
        )}

        {!isLoading && filteredProtocols.length === 0 && (
          <GlassCard variant="base" className="text-center py-12">
            <p className="text-kalkvit/60">No protocols found matching your criteria.</p>
          </GlassCard>
        )}
      </div>
    </MainLayout>
  )
}

export default ShopProtocolsPage;
