import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassInput, GlassAvatar, GlassBadge } from '../components/ui'
import { useExperts } from '../lib/api/hooks'
import type { Expert } from '../lib/api/types'
import { Search, Star, Calendar, MessageCircle, Loader2, AlertTriangle } from 'lucide-react'
import { cn } from '../lib/utils'

const specialtyFilters = ['All', 'Leadership', 'Mindset', 'Business', 'Wellness', 'Finance', 'Communication']

function ExpertCard({ expert, onMessage }: { expert: Expert; onMessage: (expert: Expert) => void }) {
  const initials = expert.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <GlassCard variant="base" className="group hover:border-koppar/30 transition-colors">
      <Link to={`/experts/${expert.id}`} className="block">
        <div className="flex items-start gap-4 mb-4">
          {expert.avatar_url ? (
            <img
              src={expert.avatar_url}
              alt={expert.name}
              className="w-16 h-16 rounded-xl object-cover"
            />
          ) : (
            <GlassAvatar initials={initials} size="xl" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-kalkvit truncate group-hover:text-koppar transition-colors">{expert.name}</h3>
              {expert.is_top_rated && <GlassBadge variant="koppar">Top Rated</GlassBadge>}
              <span className="ml-auto font-display text-lg font-bold text-kalkvit whitespace-nowrap">
                ${expert.hourly_rate}<span className="text-xs font-normal text-kalkvit/50"> /hour</span>
              </span>
            </div>
            <p className="text-sm text-koppar truncate">{expert.title}</p>
          </div>
        </div>

        <p className="text-sm text-kalkvit/70 mb-3 line-clamp-2">{expert.bio}</p>

        <div className="flex flex-wrap gap-1 mb-4">
          {expert.specialties.slice(0, 3).map((s) => (
            <GlassBadge key={s} variant="default" className="text-xs">
              {s}
            </GlassBadge>
          ))}
          {expert.specialties.length > 3 && (
            <GlassBadge variant="default" className="text-xs">
              +{expert.specialties.length - 3}
            </GlassBadge>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-kalkvit/50 mb-4">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 text-brand-amber fill-brand-amber" />
            {expert.rating} ({expert.reviews_count})
          </span>
          <span>{expert.total_sessions} sessions</span>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-2 pt-4 border-t border-white/10">
        <span className="text-xs text-skogsgron truncate">
          {expert.availability || 'Contact for availability'}
        </span>
        <div className="flex gap-2 shrink-0">
          <GlassButton variant="ghost" className="p-2" onClick={() => onMessage(expert)}>
            <MessageCircle className="w-4 h-4" />
          </GlassButton>
          <Link to={`/book-session?expert=${expert.id}`}>
            <GlassButton variant="primary" className="whitespace-nowrap">
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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const navigate = useNavigate()

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleMessage = (expert: Expert) => {
    navigate(`/messages?user=${expert.id}`, {
      state: { participantName: expert.name, participantAvatar: expert.avatar_url, participantType: 'expert' },
    })
  }

  const {
    data: expertsData,
    isLoading,
    error,
  } = useExperts({
    search: debouncedSearch || undefined,
    specialty: activeFilter !== 'All' ? activeFilter : undefined,
  })

  const experts = Array.isArray(expertsData?.data) ? expertsData.data : []
  // Sort so top-rated experts appear first
  const sortedExperts = [...experts].sort((a, b) => {
    if (a.is_top_rated && !b.is_top_rated) return -1
    if (!a.is_top_rated && b.is_top_rated) return 1
    return 0
  })

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto">
          <GlassCard variant="base" className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-tegelrod mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">Failed to load experts</h3>
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
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">Expert Coaches</h1>
            <p className="text-kalkvit/60">Connect with world-class coaches and mentors</p>
          </div>
          <GlassCard variant="accent" leftBorder={false} className="px-6 py-3">
            <p className="text-sm text-kalkvit/60">Available Experts</p>
            <p className="font-display text-2xl font-bold text-kalkvit">
              {isLoading ? '-' : experts.length}
            </p>
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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-koppar animate-spin" />
          </div>
        ) : (
          <>
            {/* All Experts (top-rated sorted first) */}
            <div>
              <h2 className="font-serif text-xl font-semibold text-kalkvit mb-4">
                {activeFilter === 'All' && searchQuery === '' ? 'All Experts' : 'Results'}
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedExperts.map((expert) => (
                  <ExpertCard key={expert.id} expert={expert} onMessage={handleMessage} />
                ))}
              </div>
            </div>

            {experts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-kalkvit/60">No experts found matching your criteria.</p>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}

export default ExpertsPage;
