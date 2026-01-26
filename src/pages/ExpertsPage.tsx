import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassInput, GlassAvatar, GlassBadge } from '../components/ui'
import { Search, Star, Calendar, MessageCircle, Filter } from 'lucide-react'
import { cn } from '../lib/utils'

interface Expert {
  id: number
  name: string
  initials: string
  title: string
  bio: string
  specialties: string[]
  rating: number
  reviews: number
  sessions: number
  hourlyRate: number
  availability: string
  isTopRated?: boolean
}

const mockExperts: Expert[] = [
  {
    id: 1,
    name: 'Michael Chen',
    initials: 'MC',
    title: 'Executive Leadership Coach',
    bio: 'Former Fortune 500 executive with 20+ years of leadership experience. Specializes in helping entrepreneurs scale their businesses.',
    specialties: ['Executive Coaching', 'Team Building', 'Strategic Planning', 'C-Suite Development'],
    rating: 4.9,
    reviews: 127,
    sessions: 450,
    hourlyRate: 199,
    availability: 'Available this week',
    isTopRated: true,
  },
  {
    id: 2,
    name: 'Sarah Thompson',
    initials: 'ST',
    title: 'Performance & Mindset Coach',
    bio: 'Certified performance coach helping high-achievers unlock their full potential through mindset training and habit optimization.',
    specialties: ['Mindset', 'Productivity', 'Goal Setting', 'Habit Formation'],
    rating: 4.8,
    reviews: 89,
    sessions: 320,
    hourlyRate: 149,
    availability: 'Available today',
  },
  {
    id: 3,
    name: 'David Wilson',
    initials: 'DW',
    title: 'Business Growth Mentor',
    bio: 'Serial entrepreneur and angel investor. Built and exited 3 companies. Passionate about helping founders navigate growth challenges.',
    specialties: ['Entrepreneurship', 'Scaling', 'Fundraising', 'Product Strategy'],
    rating: 5.0,
    reviews: 64,
    sessions: 180,
    hourlyRate: 249,
    availability: 'Limited availability',
    isTopRated: true,
  },
  {
    id: 4,
    name: 'Emily Rodriguez',
    initials: 'ER',
    title: 'Health & Wellness Coach',
    bio: 'Holistic wellness expert combining fitness, nutrition, and mental health strategies for optimal performance.',
    specialties: ['Fitness', 'Nutrition', 'Stress Management', 'Work-Life Balance'],
    rating: 4.7,
    reviews: 156,
    sessions: 520,
    hourlyRate: 129,
    availability: 'Available this week',
  },
  {
    id: 5,
    name: 'James Parker',
    initials: 'JP',
    title: 'Financial Strategy Coach',
    bio: 'Former hedge fund manager helping individuals and businesses optimize their financial strategies and build wealth.',
    specialties: ['Wealth Building', 'Investment Strategy', 'Financial Planning', 'Business Finance'],
    rating: 4.9,
    reviews: 78,
    sessions: 210,
    hourlyRate: 229,
    availability: 'Available next week',
    isTopRated: true,
  },
  {
    id: 6,
    name: 'Lisa Anderson',
    initials: 'LA',
    title: 'Communication & Presence Coach',
    bio: 'Executive presence expert helping leaders communicate with impact. Former TEDx speaker coach.',
    specialties: ['Public Speaking', 'Executive Presence', 'Communication', 'Personal Branding'],
    rating: 4.8,
    reviews: 92,
    sessions: 280,
    hourlyRate: 179,
    availability: 'Available this week',
  },
]

const specialtyFilters = ['All', 'Leadership', 'Mindset', 'Business', 'Wellness', 'Finance', 'Communication']

function ExpertCard({ expert }: { expert: Expert }) {
  return (
    <GlassCard variant="base" className="group">
      <div className="flex items-start gap-4 mb-4">
        <GlassAvatar initials={expert.initials} size="xl" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-kalkvit">{expert.name}</h3>
                {expert.isTopRated && <GlassBadge variant="koppar">Top Rated</GlassBadge>}
              </div>
              <p className="text-sm text-koppar">{expert.title}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-xl font-bold text-kalkvit">${expert.hourlyRate}</p>
              <p className="text-xs text-kalkvit/50">/hour</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-kalkvit/70 mb-4 line-clamp-2">{expert.bio}</p>

      <div className="flex flex-wrap gap-1 mb-4">
        {expert.specialties.slice(0, 3).map((s) => (
          <GlassBadge key={s} variant="default" className="text-xs">{s}</GlassBadge>
        ))}
        {expert.specialties.length > 3 && (
          <GlassBadge variant="default" className="text-xs">+{expert.specialties.length - 3}</GlassBadge>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-kalkvit/50 mb-4">
        <span className="flex items-center gap-1">
          <Star className="w-4 h-4 text-brand-amber fill-brand-amber" />
          {expert.rating} ({expert.reviews})
        </span>
        <span>{expert.sessions} sessions</span>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <span className="text-xs text-skogsgron">{expert.availability}</span>
        <div className="flex gap-2">
          <GlassButton variant="ghost" className="p-2">
            <MessageCircle className="w-4 h-4" />
          </GlassButton>
          <Link to="/book-session">
            <GlassButton variant="primary">
              <Calendar className="w-4 h-4" />
              Book Session
            </GlassButton>
          </Link>
        </div>
      </div>
    </GlassCard>
  )
}

export function ExpertsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  const filteredExperts = mockExperts.filter((expert) => {
    const matchesSearch = expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expert.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))

    if (activeFilter === 'All') return matchesSearch
    return matchesSearch && expert.specialties.some(s =>
      s.toLowerCase().includes(activeFilter.toLowerCase())
    )
  })

  const topRatedExperts = mockExperts.filter(e => e.isTopRated)

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Expert Coaches</h1>
            <p className="text-kalkvit/60">Connect with world-class coaches and mentors</p>
          </div>
          <GlassCard variant="accent" leftBorder={false} className="px-6 py-3">
            <p className="text-sm text-kalkvit/60">Available Experts</p>
            <p className="font-display text-2xl font-bold text-kalkvit">{mockExperts.length}</p>
          </GlassCard>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kalkvit/40" />
            <GlassInput
              placeholder="Search by name, specialty, or expertise..."
              className="pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <GlassButton variant="secondary">
            <Filter className="w-4 h-4" />
            Filters
          </GlassButton>
        </div>

        <div className="flex gap-2 flex-wrap mb-8">
          {specialtyFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                activeFilter === filter
                  ? 'bg-koppar text-kalkvit'
                  : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1] hover:text-kalkvit'
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Top Rated Section */}
        {activeFilter === 'All' && searchQuery === '' && (
          <div className="mb-8">
            <h2 className="font-display text-xl font-semibold text-kalkvit mb-4">Top Rated</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topRatedExperts.map((expert) => (
                <ExpertCard key={expert.id} expert={expert} />
              ))}
            </div>
          </div>
        )}

        {/* All Experts */}
        <div>
          <h2 className="font-display text-xl font-semibold text-kalkvit mb-4">
            {activeFilter === 'All' && searchQuery === '' ? 'All Experts' : 'Results'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperts
              .filter(e => activeFilter !== 'All' || searchQuery !== '' || !e.isTopRated)
              .map((expert) => (
                <ExpertCard key={expert.id} expert={expert} />
              ))}
          </div>
        </div>

        {filteredExperts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-kalkvit/60">No experts found matching your criteria.</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
