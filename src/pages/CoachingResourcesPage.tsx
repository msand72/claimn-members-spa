import { useState } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge } from '../components/ui'
import { useCoachingResources } from '../lib/api/hooks'
import { safeOpenUrl } from '../lib/url-validation'
import type { CoachingResource } from '../lib/api/types'
import {
  FileText,
  Video,
  Download,
  ExternalLink,
  BookOpen,
  Headphones,
  Star,
  Clock,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '../lib/utils'

const categories = ['All', 'Leadership', 'Habits', 'Productivity', 'Planning', 'Performance', 'Mindset']
const types = ['All Types', 'pdf', 'video', 'audio', 'article']

const typeConfig = {
  pdf: { icon: FileText, color: 'text-tegelrod', label: 'PDF' },
  video: { icon: Video, color: 'text-koppar', label: 'Video' },
  audio: { icon: Headphones, color: 'text-skogsgron', label: 'Audio' },
  article: { icon: BookOpen, color: 'text-brand-amber', label: 'Article' },
  guide: { icon: BookOpen, color: 'text-brand-amber', label: 'Guide' },
  podcast: { icon: Headphones, color: 'text-skogsgron', label: 'Podcast' },
  template: { icon: FileText, color: 'text-tegelrod', label: 'Template' },
}

function ResourceCard({ resource }: { resource: CoachingResource }) {
  const config = typeConfig[resource.type] || typeConfig.article
  const TypeIcon = config.icon

  const handleOpen = () => {
    if (resource.url) {
      safeOpenUrl(resource.url)
    }
  }

  return (
    <GlassCard
      variant="base"
      className={`group ${resource.url ? 'cursor-pointer' : ''}`}
      onClick={handleOpen}
    >
      <div className="flex items-start gap-4">
        <div className={cn('p-3 rounded-xl bg-white/[0.06]', config.color)}>
          <TypeIcon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-kalkvit group-hover:text-koppar transition-colors">
              {resource.title}
            </h3>
            <div className="flex gap-1 flex-shrink-0">
              {resource.is_new && <GlassBadge variant="koppar">New</GlassBadge>}
              {resource.is_featured && (
                <GlassBadge variant="warning" className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Featured
                </GlassBadge>
              )}
            </div>
          </div>
          <p className="text-sm text-kalkvit/60 mb-3 line-clamp-2">{resource.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-kalkvit/50">
              <GlassBadge variant="default">{resource.category}</GlassBadge>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {resource.duration || resource.size}
              </span>
            </div>
            <div className="flex gap-2">
              {resource.type === 'pdf' && (
                <GlassButton
                  variant="ghost"
                  className="p-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (resource.url) {
                      safeOpenUrl(resource.url)
                    }
                  }}
                >
                  <Download className="w-4 h-4" />
                </GlassButton>
              )}
              <GlassButton
                variant="secondary"
                className="text-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  if (resource.url) {
                    safeOpenUrl(resource.url)
                  }
                }}
              >
                {resource.type === 'article' ? (
                  <>
                    Read <ExternalLink className="w-3 h-3" />
                  </>
                ) : resource.type === 'pdf' ? (
                  'View'
                ) : (
                  'Play'
                )}
              </GlassButton>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

export function CoachingResourcesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedType, setSelectedType] = useState('All Types')

  const {
    data: resourcesData,
    isLoading,
    error,
  } = useCoachingResources({
    category: selectedCategory !== 'All' ? selectedCategory : undefined,
    type: selectedType !== 'All Types' ? selectedType : undefined,
  })

  const resources = resourcesData ?? []
  const featuredResources = resources.filter((r) => r.is_featured)

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto">
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
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">
            Coaching Resources
          </h1>
          <p className="text-kalkvit/60">Curated materials to support your coaching journey</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-koppar animate-spin" />
          </div>
        ) : (
          <>
            {/* Featured Section */}
            {featuredResources.length > 0 && (
              <div className="mb-8">
                <h2 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-brand-amber" />
                  Featured Resources
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {featuredResources.map((resource) => {
                    const config = typeConfig[resource.type] || typeConfig.article
                    const TypeIcon = config.icon
                    return (
                      <GlassCard
                        key={resource.id}
                        variant="accent"
                        leftBorder={false}
                        className={`text-center ${resource.url ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (resource.url) {
                            safeOpenUrl(resource.url)
                          }
                        }}
                      >
                        <div className="p-3 rounded-xl bg-white/[0.06] w-fit mx-auto mb-3">
                          <TypeIcon className={cn('w-6 h-6', config.color)} />
                        </div>
                        <h3 className="font-semibold text-kalkvit text-sm mb-1">
                          {resource.title}
                        </h3>
                        <p className="text-xs text-kalkvit/50">{resource.category}</p>
                      </GlassCard>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      selectedCategory === category
                        ? 'bg-koppar text-kalkvit'
                        : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1]'
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {types.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize',
                      selectedType === type
                        ? 'bg-jordbrun text-kalkvit'
                        : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1]'
                    )}
                  >
                    {type === 'All Types' ? type : type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Resources List */}
            {resources.length > 0 ? (
              <div className="space-y-4">
                {resources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            ) : (
              <GlassCard variant="base" className="text-center py-12">
                <p className="text-kalkvit/60">No resources found matching your criteria.</p>
              </GlassCard>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}

export default CoachingResourcesPage;
