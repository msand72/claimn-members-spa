import { useState } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge, GlassInput } from '../components/ui'
import { FileText, Video, Download, Search, BookOpen, Headphones, ExternalLink } from 'lucide-react'

const categories = ['All', 'Guides', 'Videos', 'Podcasts', 'Templates']

const resources = [
  {
    id: 1,
    title: 'Getting Started with CLAIM\'N',
    description: 'A comprehensive guide to making the most of your membership',
    type: 'guide',
    icon: BookOpen,
    category: 'Guides',
    duration: '15 min read',
    isNew: true,
  },
  {
    id: 2,
    title: 'Mindset Mastery Workshop',
    description: 'Expert-led video series on developing an unshakeable mindset',
    type: 'video',
    icon: Video,
    category: 'Videos',
    duration: '45 min',
    isNew: true,
  },
  {
    id: 3,
    title: 'Brotherhood Podcast: Episode 42',
    description: 'Conversations with successful members about their journey',
    type: 'podcast',
    icon: Headphones,
    category: 'Podcasts',
    duration: '32 min',
    isNew: false,
  },
  {
    id: 4,
    title: 'Goal Setting Template',
    description: 'Downloadable template for tracking your personal goals',
    type: 'template',
    icon: FileText,
    category: 'Templates',
    duration: 'PDF',
    isNew: false,
  },
  {
    id: 5,
    title: 'Nutrition Protocol Guide',
    description: 'Complete guide to optimizing your nutrition for peak performance',
    type: 'guide',
    icon: BookOpen,
    category: 'Guides',
    duration: '25 min read',
    isNew: false,
  },
  {
    id: 6,
    title: 'Morning Routine Masterclass',
    description: 'Design your perfect morning routine for maximum productivity',
    type: 'video',
    icon: Video,
    category: 'Videos',
    duration: '60 min',
    isNew: false,
  },
]

export function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredResources = resources.filter((resource) => {
    const matchesCategory = activeCategory === 'All' || resource.category === activeCategory
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <GlassCard key={resource.id} variant="base" className="group cursor-pointer hover:border-koppar/30">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-koppar/10">
                  <resource.icon className="w-6 h-6 text-koppar" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className="font-semibold text-kalkvit group-hover:text-koppar transition-colors line-clamp-2">
                      {resource.title}
                    </h3>
                    {resource.isNew && <GlassBadge variant="koppar">New</GlassBadge>}
                  </div>
                  <p className="text-sm text-kalkvit/60 mb-3 line-clamp-2">{resource.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-kalkvit/40">{resource.duration}</span>
                    <GlassButton variant="ghost" className="text-xs p-2">
                      {resource.type === 'template' ? (
                        <Download className="w-4 h-4" />
                      ) : (
                        <ExternalLink className="w-4 h-4" />
                      )}
                    </GlassButton>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <p className="text-kalkvit/60">No resources found matching your criteria.</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
