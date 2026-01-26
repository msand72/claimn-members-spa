import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassInput, GlassBadge } from '../components/ui'
import { Search, ShoppingCart, Star, Clock, Users, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'

interface Product {
  id: number
  name: string
  description: string
  price: number
  originalPrice?: number
  category: string
  rating: number
  reviews: number
  duration?: string
  participants?: number
  isFeatured?: boolean
  isNew?: boolean
}

const mockProducts: Product[] = [
  {
    id: 1,
    name: '30-Day Transformation Protocol',
    description: 'Complete daily protocols for physical and mental transformation. Includes workout plans, nutrition guides, and mindset exercises.',
    price: 149,
    originalPrice: 199,
    category: 'Protocols',
    rating: 4.9,
    reviews: 234,
    duration: '30 days',
    isFeatured: true,
  },
  {
    id: 2,
    name: 'Leadership Mastermind Circle',
    description: 'Join an exclusive circle of high-achievers. Weekly sessions, peer coaching, and direct access to expert mentors.',
    price: 297,
    category: 'Circles',
    rating: 4.8,
    reviews: 89,
    participants: 24,
    isNew: true,
  },
  {
    id: 3,
    name: 'Morning Routine Mastery',
    description: 'Design and implement your perfect morning routine. Science-backed strategies for peak performance.',
    price: 79,
    category: 'Protocols',
    rating: 4.7,
    reviews: 156,
    duration: '14 days',
  },
  {
    id: 4,
    name: '1-on-1 Expert Coaching Session',
    description: 'Book a private session with one of our certified coaches. Personalized guidance for your specific challenges.',
    price: 199,
    category: 'Coaching',
    rating: 5.0,
    reviews: 67,
    duration: '60 min',
  },
  {
    id: 5,
    name: 'Mindset Mastery Course',
    description: 'Deep dive into mental frameworks, stoic philosophy, and building an unshakeable mindset.',
    price: 249,
    category: 'Courses',
    rating: 4.9,
    reviews: 312,
    duration: '8 weeks',
    isFeatured: true,
  },
  {
    id: 6,
    name: 'Entrepreneur Network Access',
    description: 'Premium access to our entrepreneur circle with exclusive resources, events, and networking opportunities.',
    price: 99,
    category: 'Circles',
    rating: 4.6,
    reviews: 178,
    participants: 124,
  },
]

const categories = ['All', 'Protocols', 'Circles', 'Coaching', 'Courses']

function ProductCard({ product }: { product: Product }) {
  return (
    <GlassCard
      variant={product.isFeatured ? 'accent' : 'base'}
      leftBorder={false}
      className="group cursor-pointer hover:scale-[1.02] transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <GlassBadge variant="koppar">{product.category}</GlassBadge>
        <div className="flex gap-2">
          {product.isNew && <GlassBadge variant="success">New</GlassBadge>}
          {product.isFeatured && (
            <GlassBadge variant="warning">
              <Sparkles className="w-3 h-3 mr-1" />
              Featured
            </GlassBadge>
          )}
        </div>
      </div>

      <h3 className="font-display text-lg font-semibold text-kalkvit mb-2 group-hover:text-koppar transition-colors">
        {product.name}
      </h3>
      <p className="text-sm text-kalkvit/60 mb-4 line-clamp-2">{product.description}</p>

      <div className="flex items-center gap-4 text-sm text-kalkvit/50 mb-4">
        <span className="flex items-center gap-1">
          <Star className="w-4 h-4 text-brand-amber fill-brand-amber" />
          {product.rating} ({product.reviews})
        </span>
        {product.duration && (
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {product.duration}
          </span>
        )}
        {product.participants && (
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {product.participants}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold text-kalkvit">${product.price}</span>
          {product.originalPrice && (
            <span className="text-sm text-kalkvit/40 line-through">${product.originalPrice}</span>
          )}
        </div>
        <GlassButton variant="secondary" className="group-hover:bg-koppar group-hover:border-koppar">
          <ShoppingCart className="w-4 h-4" />
          Add
        </GlassButton>
      </div>
    </GlassCard>
  )
}

export function ShopPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeCategory === 'All') return matchesSearch
    return matchesSearch && product.category === activeCategory
  })

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Shop</h1>
            <p className="text-kalkvit/60">Protocols, courses, and resources to accelerate your growth</p>
          </div>
          <Link to="/shop/upgrade">
            <GlassButton variant="primary">
              <Sparkles className="w-4 h-4" />
              Upgrade Membership
              <ArrowRight className="w-4 h-4" />
            </GlassButton>
          </Link>
        </div>

        {/* Search and Categories */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kalkvit/40" />
            <GlassInput
              placeholder="Search products..."
              className="pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                activeCategory === category
                  ? 'bg-koppar text-kalkvit'
                  : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1] hover:text-kalkvit'
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Featured Section */}
        {activeCategory === 'All' && (
          <div className="mb-8">
            <h2 className="font-display text-xl font-semibold text-kalkvit mb-4">Featured</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProducts.filter(p => p.isFeatured).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* All Products */}
        <div>
          <h2 className="font-display text-xl font-semibold text-kalkvit mb-4">
            {activeCategory === 'All' ? 'All Products' : activeCategory}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.filter(p => activeCategory !== 'All' || !p.isFeatured).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-kalkvit/60">No products found matching your criteria.</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
