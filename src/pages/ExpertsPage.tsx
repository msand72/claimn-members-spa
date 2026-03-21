import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassInput, GlassAvatar, GlassBadge } from '../components/ui'
import { useExperts, useSearch } from '../lib/api/hooks'
import { SortBar, sortItems, type SortState } from '../components/ui'
import type { Expert } from '../lib/api/types'
import { MagnifyingGlassIcon, StarIcon, CalendarIcon, ChatBubbleLeftIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { cn } from '../lib/utils'
import { stripHtml } from '../lib/sanitize'
import { BookingModal } from '../components/BookingModal'

// Specialty filters are derived from actual expert data — see below in ExpertsPage

function ExpertCard({ expert, onMessage, onBook }: { expert: Expert; onMessage: (expert: Expert) => void; onBook: (expert: Expert) => void }) {
  const initials = expert.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const hasReviews = expert.reviews_count > 0
  const hasSessions = expert.total_sessions > 0
  const hasStats = hasReviews || hasSessions
  const hasPrice = expert.hourly_rate > 0

  return (
    <GlassCard variant="base" className="group hover:border-koppar/30 transition-colors flex flex-col">
      <Link to={`/experts/${expert.id}`} className="block flex-1">
        {/* Header: avatar + name + badge */}
        <div className="flex items-start gap-4 mb-3">
          {expert.avatar_url ? (
            <img
              src={expert.avatar_url}
              alt={expert.name}
              className="w-14 h-14 rounded-xl object-cover shrink-0"
            />
          ) : (
            <GlassAvatar initials={initials} size="lg" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-kalkvit group-hover:text-koppar transition-colors">{expert.name}</h3>
              {expert.is_top_rated && <GlassBadge variant="koppar">Top Rated</GlassBadge>}
            </div>
            {expert.title && (
              <p className="text-sm text-koppar mt-0.5 line-clamp-2">{expert.title}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        {expert.bio && (
          <p className="text-sm text-kalkvit/70 mb-3 line-clamp-3">{stripHtml(expert.bio)}</p>
        )}

        {/* Specialties */}
        {expert.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {expert.specialties.slice(0, 4).map((s) => (
              <GlassBadge key={s} variant="default" className="text-xs">
                {s}
              </GlassBadge>
            ))}
            {expert.specialties.length > 4 && (
              <GlassBadge variant="default" className="text-xs">
                +{expert.specialties.length - 4}
              </GlassBadge>
            )}
          </div>
        )}

        {/* Stats — only show if there are actual reviews or sessions */}
        {hasStats && (
          <div className="flex items-center gap-4 text-sm text-kalkvit/50 mb-3">
            {hasReviews && (
              <span className="flex items-center gap-1">
                <StarIcon className="w-4 h-4 text-brand-amber fill-brand-amber" />
                {expert.rating} ({expert.reviews_count})
              </span>
            )}
            {hasSessions && <span>{expert.total_sessions} sessions</span>}
          </div>
        )}
      </Link>

      {/* Footer: price + actions */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10 mt-auto">
        {hasPrice ? (
          <span className="font-display text-lg font-bold text-kalkvit whitespace-nowrap">
            ${expert.hourly_rate}<span className="text-xs font-normal text-kalkvit/50"> /hour</span>
          </span>
        ) : (
          <span className="text-xs text-kalkvit/40">Contact for pricing</span>
        )}
        <div className="flex gap-2 shrink-0">
          <GlassButton variant="ghost" className="p-2" onClick={() => onMessage(expert)}>
            <ChatBubbleLeftIcon className="w-4 h-4" />
          </GlassButton>
          <GlassButton variant="primary" className="whitespace-nowrap" onClick={() => onBook(expert)}>
            <CalendarIcon className="w-4 h-4" />
            Book Session
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  )
}

export function ExpertsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [bookingExpert, setBookingExpert] = useState<Expert | null>(null)
  const [sort, setSort] = useState<SortState>({ key: 'rating', direction: 'desc' })
  const navigate = useNavigate()

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleMessage = (expert: Expert) => {
    navigate(`/messages?user=${expert.user_id}`, {
      state: { participantName: expert.name, participantAvatar: expert.avatar_url, participantType: 'expert' },
    })
  }

  // Use Meilisearch when searching, PostgREST when browsing
  const {
    data: expertsData,
    isLoading: isLoadingList,
    error,
  } = useExperts()

  const {
    data: searchData,
    isLoading: isLoadingSearch,
  } = useSearch(debouncedSearch, { type: 'experts', limit: 50, enabled: !!debouncedSearch })

  const isLoading = debouncedSearch ? isLoadingSearch : isLoadingList
  const listExperts = Array.isArray(expertsData?.data) ? expertsData.data : []
  const searchExperts = Array.isArray(searchData?.data) ? searchData.data as unknown as Expert[] : []
  const allExperts = debouncedSearch ? searchExperts : listExperts

  // Build specialty filters from actual expert data
  const specialtyFilters = ['All', ...Array.from(
    new Set(allExperts.flatMap((e) => e.specialties || []))
  ).sort()]

  // Reset filter if selected specialty no longer exists in data
  useEffect(() => {
    if (activeFilter !== 'All' && !specialtyFilters.includes(activeFilter)) {
      setActiveFilter('All')
    }
  }, [specialtyFilters.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side specialty filter
  const experts = activeFilter !== 'All'
    ? allExperts.filter((e) => e.specialties?.includes(activeFilter))
    : allExperts

  const sortedExperts = sortItems(experts, sort, {
    name: (e) => e.name,
    rating: (e) => e.rating,
    sessions: (e) => e.total_sessions,
    reviews: (e) => e.reviews_count,
  })

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto">
          <GlassCard variant="base" className="text-center py-12">
            <ExclamationTriangleIcon className="w-12 h-12 text-tegelrod mx-auto mb-4" />
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
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kalkvit/40" />
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
            <ArrowPathIcon className="w-8 h-8 text-koppar animate-spin" />
          </div>
        ) : (
          <>
            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="font-serif text-xl font-semibold text-kalkvit">
                  {activeFilter === 'All' && searchQuery === '' ? 'All Experts' : 'Results'}
                </h2>
                <SortBar
                  options={[
                    { key: 'name', label: 'Name' },
                    { key: 'rating', label: 'Rating' },
                    { key: 'sessions', label: 'Sessions' },
                    { key: 'reviews', label: 'Reviews' },
                  ]}
                  value={sort}
                  onChange={setSort}
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedExperts.map((expert) => (
                  <ExpertCard key={expert.id} expert={expert} onMessage={handleMessage} onBook={setBookingExpert} />
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

      {/* Booking Modal */}
      {bookingExpert && (
        <BookingModal
          expert={bookingExpert}
          isOpen={!!bookingExpert}
          onClose={() => setBookingExpert(null)}
        />
      )}
    </MainLayout>
  )
}

export default ExpertsPage;
