import { useState } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge, GlassInput } from '../components/ui'
import { useResources } from '../lib/api/hooks'
import type { Resource } from '../lib/api/types'
import {
  FileText,
  Video,
  Download,
  Search,
  BookOpen,
  Headphones,
  ExternalLink,
  Loader2,
  AlertTriangle,
} from 'lucide-react'

const categories = ['All', 'Guides', 'Videos', 'Podcasts', 'Templates']

const typeIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  guide: BookOpen,
  video: Video,
  podcast: Headphones,
  template: FileText,
  pdf: FileText,
  audio: Headphones,
  article: BookOpen,
}

function ResourceCard({ resource }: { resource: Resource }) {
  const IconComponent = typeIconMap[resource.type] || FileText

  const handleOpen = () => {
    if (resource.url) {
      window.open(resource.url, '_blank')
    }
  }

  return (
    <GlassCard
      variant="base"
      className={`group hover:border-koppar/30 ${resource.url ? 'cursor-pointer' : ''}`}
      onClick={handleOpen}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-koppar/10">
          <IconComponent className="w-6 h-6 text-koppar" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <h3 className="font-semibold text-kalkvit group-hover:text-koppar transition-colors line-clamp-2">
              {resource.title}
            </h3>
            {resource.is_new && <GlassBadge variant="koppar">New</GlassBadge>}
          </div>
          <p className="text-sm text-kalkvit/60 mb-3 line-clamp-2">{resource.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-kalkvit/40">{resource.duration || resource.size}</span>
            <GlassButton
              variant="ghost"
              className="text-xs p-2"
              onClick={(e) => {
                e.stopPropagation()
                if (resource.url) {
                  window.open(resource.url, '_blank')
                }
              }}
            >
              {resource.type === 'template' || resource.type === 'pdf' ? (
                <Download className="w-4 h-4" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
            </GlassButton>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

export function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const {
    data: resourcesData,
    isLoading,
    error,
  } = useResources({
    category: activeCategory !== 'All' ? activeCategory : undefined,
    search: searchQuery || undefined,
  })

  const resources = Array.isArray(resourcesData) ? resourcesData : []

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto">
          <GlassCard variant="base" className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-tegelrod mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">Failed to load resources</h3>
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
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Resources</h1>
          <p className="text-kalkvit/60">Guides, videos, and templates to support your journey</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kalkvit/40" />
            <GlassInput
              placeholder="Search resources..."
              className="pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === category
                    ? 'bg-koppar text-kalkvit'
                    : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1] hover:text-kalkvit'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Resources Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-koppar animate-spin" />
          </div>
        ) : resources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-kalkvit/60">No resources found matching your criteria.</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default ResourcesPage;
