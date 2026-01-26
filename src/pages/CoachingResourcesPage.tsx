import { useState } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge } from '../components/ui'
import { FileText, Video, Download, ExternalLink, BookOpen, Headphones, Star, Clock } from 'lucide-react'
import { cn } from '../lib/utils'

interface Resource {
  id: number
  title: string
  description: string
  type: 'pdf' | 'video' | 'audio' | 'article'
  category: string
  duration?: string
  size?: string
  isNew: boolean
  isFeatured: boolean
  addedDate: string
}

const mockResources: Resource[] = [
  {
    id: 1,
    title: 'Leadership Framework Workbook',
    description: 'A comprehensive workbook with exercises to develop your leadership capabilities.',
    type: 'pdf',
    category: 'Leadership',
    size: '2.4 MB',
    isNew: true,
    isFeatured: true,
    addedDate: 'Jan 25, 2026',
  },
  {
    id: 2,
    title: 'Morning Routine Masterclass',
    description: 'Video training on building an unshakeable morning routine that sets you up for success.',
    type: 'video',
    category: 'Habits',
    duration: '45 min',
    isNew: false,
    isFeatured: true,
    addedDate: 'Jan 20, 2026',
  },
  {
    id: 3,
    title: 'Deep Work Audio Guide',
    description: 'Listen to Cal Newport-inspired strategies for achieving focused work sessions.',
    type: 'audio',
    category: 'Productivity',
    duration: '32 min',
    isNew: false,
    isFeatured: false,
    addedDate: 'Jan 15, 2026',
  },
  {
    id: 4,
    title: 'Goal Setting Template',
    description: 'Quarterly goal-setting template with OKR framework for tracking progress.',
    type: 'pdf',
    category: 'Planning',
    size: '856 KB',
    isNew: false,
    isFeatured: false,
    addedDate: 'Jan 10, 2026',
  },
  {
    id: 5,
    title: 'Delegation Strategies for Leaders',
    description: 'Article on effective delegation techniques to scale your impact.',
    type: 'article',
    category: 'Leadership',
    duration: '8 min read',
    isNew: true,
    isFeatured: false,
    addedDate: 'Jan 24, 2026',
  },
  {
    id: 6,
    title: 'Energy Management Workshop',
    description: 'Recorded workshop on managing your energy for peak performance.',
    type: 'video',
    category: 'Performance',
    duration: '1h 15min',
    isNew: false,
    isFeatured: true,
    addedDate: 'Jan 5, 2026',
  },
  {
    id: 7,
    title: 'Mindset Mastery Meditation',
    description: 'Guided meditation for developing a growth mindset and mental resilience.',
    type: 'audio',
    category: 'Mindset',
    duration: '20 min',
    isNew: false,
    isFeatured: false,
    addedDate: 'Dec 28, 2025',
  },
  {
    id: 8,
    title: 'Weekly Review Checklist',
    description: 'Simple checklist to conduct effective weekly reviews and planning sessions.',
    type: 'pdf',
    category: 'Planning',
    size: '245 KB',
    isNew: false,
    isFeatured: false,
    addedDate: 'Dec 20, 2025',
  },
]

const categories = ['All', 'Leadership', 'Habits', 'Productivity', 'Planning', 'Performance', 'Mindset']
const types = ['All Types', 'pdf', 'video', 'audio', 'article']

function ResourceCard({ resource }: { resource: Resource }) {
  const typeConfig = {
    pdf: { icon: FileText, color: 'text-tegelrod', label: 'PDF' },
    video: { icon: Video, color: 'text-koppar', label: 'Video' },
    audio: { icon: Headphones, color: 'text-skogsgron', label: 'Audio' },
    article: { icon: BookOpen, color: 'text-brand-amber', label: 'Article' },
  }

  const config = typeConfig[resource.type]
  const TypeIcon = config.icon

  return (
    <GlassCard variant="base" className="group">
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
              {resource.isNew && <GlassBadge variant="koppar">New</GlassBadge>}
              {resource.isFeatured && (
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
                <GlassButton variant="ghost" className="p-2">
                  <Download className="w-4 h-4" />
                </GlassButton>
              )}
              <GlassButton variant="secondary" className="text-sm">
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

  const filteredResources = mockResources.filter((resource) => {
    const matchesCategory = selectedCategory === 'All' || resource.category === selectedCategory
    const matchesType = selectedType === 'All Types' || resource.type === selectedType
    return matchesCategory && matchesType
  })

  const featuredResources = mockResources.filter((r) => r.isFeatured)

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Coaching Resources</h1>
          <p className="text-kalkvit/60">
            Curated materials to support your coaching journey
          </p>
        </div>

        {/* Featured Section */}
        <div className="mb-8">
          <h2 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-brand-amber" />
            Featured Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredResources.map((resource) => (
              <GlassCard key={resource.id} variant="accent" leftBorder={false} className="text-center">
                <div className={cn('p-3 rounded-xl bg-white/[0.06] w-fit mx-auto mb-3')}>
                  {resource.type === 'pdf' && <FileText className="w-6 h-6 text-tegelrod" />}
                  {resource.type === 'video' && <Video className="w-6 h-6 text-koppar" />}
                  {resource.type === 'audio' && <Headphones className="w-6 h-6 text-skogsgron" />}
                </div>
                <h3 className="font-semibold text-kalkvit text-sm mb-1">{resource.title}</h3>
                <p className="text-xs text-kalkvit/50">{resource.category}</p>
              </GlassCard>
            ))}
          </div>
        </div>

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
        <div className="space-y-4">
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>

        {filteredResources.length === 0 && (
          <GlassCard variant="base" className="text-center py-12">
            <p className="text-kalkvit/60">No resources found matching your criteria.</p>
          </GlassCard>
        )}
      </div>
    </MainLayout>
  )
}
