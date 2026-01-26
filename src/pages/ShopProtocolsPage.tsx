import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge } from '../components/ui'
import { Clock, Users, Star, CheckCircle, Lock, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'

interface Protocol {
  id: number
  slug: string
  title: string
  description: string
  category: string
  duration: string
  enrolledCount: number
  rating: number
  reviews: number
  price: number
  originalPrice?: number
  isPurchased: boolean
  isNew: boolean
  modules: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  image?: string
}

const mockProtocols: Protocol[] = [
  {
    id: 1,
    slug: 'morning-mastery',
    title: 'Morning Mastery Protocol',
    description: 'Transform your mornings with this science-backed protocol. Build unshakeable discipline and win the first hour of your day.',
    category: 'Habits',
    duration: '4 weeks',
    enrolledCount: 1247,
    rating: 4.9,
    reviews: 312,
    price: 0,
    isPurchased: true,
    isNew: false,
    modules: 12,
    difficulty: 'beginner',
  },
  {
    id: 2,
    slug: 'peak-performance',
    title: 'Peak Performance System',
    description: 'Optimize your energy, focus, and output. Learn the frameworks used by top performers to achieve more in less time.',
    category: 'Performance',
    duration: '6 weeks',
    enrolledCount: 892,
    rating: 4.8,
    reviews: 156,
    price: 197,
    originalPrice: 297,
    isPurchased: false,
    isNew: true,
    modules: 18,
    difficulty: 'intermediate',
  },
  {
    id: 3,
    slug: 'leadership-accelerator',
    title: 'Leadership Accelerator',
    description: 'Develop the mindset and skills of exceptional leaders. Master communication, delegation, and team building.',
    category: 'Leadership',
    duration: '8 weeks',
    enrolledCount: 543,
    rating: 5.0,
    reviews: 89,
    price: 397,
    isPurchased: false,
    isNew: false,
    modules: 24,
    difficulty: 'advanced',
  },
  {
    id: 4,
    slug: 'wealth-mindset',
    title: 'Wealth Mindset Blueprint',
    description: 'Rewire your relationship with money. Build the mental frameworks of successful entrepreneurs and investors.',
    category: 'Mindset',
    duration: '4 weeks',
    enrolledCount: 1089,
    rating: 4.7,
    reviews: 234,
    price: 147,
    isPurchased: false,
    isNew: false,
    modules: 10,
    difficulty: 'beginner',
  },
  {
    id: 5,
    slug: 'deep-work',
    title: 'Deep Work Protocol',
    description: 'Eliminate distractions and master focused work. Produce high-quality output in half the time.',
    category: 'Productivity',
    duration: '3 weeks',
    enrolledCount: 2156,
    rating: 4.9,
    reviews: 467,
    price: 97,
    isPurchased: true,
    isNew: false,
    modules: 8,
    difficulty: 'beginner',
  },
  {
    id: 6,
    slug: 'social-mastery',
    title: 'Social Mastery Framework',
    description: 'Build authentic connections and expand your network. Master the art of meaningful relationships.',
    category: 'Networking',
    duration: '5 weeks',
    enrolledCount: 678,
    rating: 4.6,
    reviews: 123,
    price: 177,
    isPurchased: false,
    isNew: true,
    modules: 15,
    difficulty: 'intermediate',
  },
]

const categories = ['All', 'Habits', 'Performance', 'Leadership', 'Mindset', 'Productivity', 'Networking']

function ProtocolCard({ protocol }: { protocol: Protocol }) {
  const difficultyColors = {
    beginner: 'text-skogsgron',
    intermediate: 'text-koppar',
    advanced: 'text-tegelrod',
  }

  return (
    <GlassCard variant="base" className="overflow-hidden group">
      {/* Header with category and badges */}
      <div className="flex items-center justify-between mb-3">
        <GlassBadge variant="default">{protocol.category}</GlassBadge>
        <div className="flex gap-2">
          {protocol.isNew && <GlassBadge variant="koppar">New</GlassBadge>}
          {protocol.isPurchased && (
            <GlassBadge variant="success" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Owned
            </GlassBadge>
          )}
        </div>
      </div>

      {/* Title and description */}
      <h3 className="font-display text-xl font-bold text-kalkvit mb-2 group-hover:text-koppar transition-colors">
        {protocol.title}
      </h3>
      <p className="text-sm text-kalkvit/60 mb-4 line-clamp-2">{protocol.description}</p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-kalkvit/50 mb-4">
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {protocol.duration}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {protocol.enrolledCount.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <Star className="w-4 h-4 text-brand-amber fill-brand-amber" />
          {protocol.rating} ({protocol.reviews})
        </span>
      </div>

      {/* Modules and difficulty */}
      <div className="flex items-center justify-between text-sm mb-4">
        <span className="text-kalkvit/50">{protocol.modules} modules</span>
        <span className={cn('capitalize', difficultyColors[protocol.difficulty])}>
          {protocol.difficulty}
        </span>
      </div>

      {/* Price and CTA */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        {protocol.isPurchased ? (
          <>
            <span className="text-skogsgron font-medium">Access Granted</span>
            <Link to={`/shop/protocols/${protocol.slug}`}>
              <GlassButton variant="primary" className="text-sm">
                Continue
                <ChevronRight className="w-4 h-4" />
              </GlassButton>
            </Link>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-kalkvit">
                ${protocol.price}
              </span>
              {protocol.originalPrice && (
                <span className="text-sm text-kalkvit/40 line-through">
                  ${protocol.originalPrice}
                </span>
              )}
            </div>
            <Link to={`/shop/protocols/${protocol.slug}`}>
              <GlassButton variant="primary" className="text-sm">
                <Lock className="w-4 h-4" />
                Get Access
              </GlassButton>
            </Link>
          </>
        )}
      </div>
    </GlassCard>
  )
}

export function ShopProtocolsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showOwned, setShowOwned] = useState(false)

  const filteredProtocols = mockProtocols.filter((protocol) => {
    const matchesCategory = selectedCategory === 'All' || protocol.category === selectedCategory
    const matchesOwned = !showOwned || protocol.isPurchased
    return matchesCategory && matchesOwned
  })

  const ownedCount = mockProtocols.filter((p) => p.isPurchased).length

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Protocols</h1>
            <p className="text-kalkvit/60">
              Structured programs to transform specific areas of your life
            </p>
          </div>
          <GlassCard variant="accent" leftBorder={false} className="px-6 py-3 text-center">
            <p className="text-sm text-kalkvit/60">Your Protocols</p>
            <p className="font-display text-2xl font-bold text-kalkvit">{ownedCount}</p>
          </GlassCard>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
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
            <CheckCircle className="w-4 h-4" />
            Show Owned Only
          </button>
        </div>

        {/* Protocols Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProtocols.map((protocol) => (
            <ProtocolCard key={protocol.id} protocol={protocol} />
          ))}
        </div>

        {filteredProtocols.length === 0 && (
          <GlassCard variant="base" className="text-center py-12">
            <p className="text-kalkvit/60">No protocols found matching your criteria.</p>
          </GlassCard>
        )}
      </div>
    </MainLayout>
  )
}
