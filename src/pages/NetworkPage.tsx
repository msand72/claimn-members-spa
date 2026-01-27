import { useState, useEffect } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassInput, GlassAvatar, GlassBadge } from '../components/ui'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  UserPlus,
  MapPin,
  Heart,
  Loader2,
  Users,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useNetwork, useSendConnectionRequest, type NetworkMember } from '../lib/api'
import { ARCHETYPES } from '../lib/constants'

const ITEMS_PER_PAGE = 12

const archetypeFilters = ['All Archetypes', ...ARCHETYPES]

function MemberCard({ member }: { member: NetworkMember }) {
  const sendConnection = useSendConnectionRequest()

  const handleConnect = () => {
    if (member.connection_status === 'none') {
      console.log('[NetworkPage] Sending connection request to:', member.user_id)
      sendConnection.mutate({ recipient_id: member.user_id })
    }
  }

  const displayName = member.display_name || 'Anonymous'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const location = [member.city, member.country].filter(Boolean).join(', ')
  const isConnected = member.connection_status === 'connected'
  const isPending = member.connection_status === 'pending' || member.connection_status === 'received'
  const sharedCount = member.shared_interests || 0

  return (
    <GlassCard variant="base" className="p-4">
      <div className="flex items-start gap-4">
        <GlassAvatar initials={initials} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-kalkvit truncate">{displayName}</h3>
            {member.archetype && (
              <GlassBadge variant="koppar" className="text-xs hidden sm:inline-flex">
                {member.archetype}
              </GlassBadge>
            )}
          </div>
          {member.bio && (
            <p className="text-sm text-kalkvit/70 line-clamp-2 mt-1">{member.bio}</p>
          )}
          {location && (
            <div className="flex items-center gap-1 mt-1 text-xs text-kalkvit/40">
              <MapPin className="w-3 h-3" />
              {location}
            </div>
          )}
        </div>
      </div>

      {/* Pillar focus */}
      {member.pillar_focus && member.pillar_focus.length > 0 && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-1">
            {member.pillar_focus.slice(0, 3).map((pillar) => (
              <span
                key={pillar}
                className="px-2 py-0.5 text-xs rounded border bg-white/[0.04] text-kalkvit/60 border-white/10 capitalize"
              >
                {pillar}
              </span>
            ))}
            {member.pillar_focus.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-kalkvit/40">
                +{member.pillar_focus.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Shared interests badge */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2 text-xs text-kalkvit/50">
          {sharedCount > 0 ? (
            <span className="flex items-center gap-1 text-koppar">
              <Heart className="w-3 h-3" />
              {sharedCount} shared interests
            </span>
          ) : (
            <span>Brotherhood Member</span>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        {isConnected ? (
          <>
            <GlassButton variant="secondary" className="flex-1 text-sm py-2">
              <MessageCircle className="w-4 h-4" />
              Message
            </GlassButton>
            <GlassBadge variant="success" className="self-center">
              Connected
            </GlassBadge>
          </>
        ) : isPending ? (
          <GlassBadge variant="warning" className="w-full justify-center py-2">
            {member.connection_status === 'received' ? 'Accept Request' : 'Pending'}
          </GlassBadge>
        ) : (
          <GlassButton
            variant="primary"
            className="w-full text-sm py-2"
            onClick={handleConnect}
            disabled={sendConnection.isPending}
          >
            {sendConnection.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {sendConnection.isPending ? 'Sending...' : 'Connect'}
          </GlassButton>
        )}
      </div>
    </GlassCard>
  )
}

export function NetworkPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArchetype, setSelectedArchetype] = useState('All Archetypes')
  const [currentPage, setCurrentPage] = useState(1)

  // Get archetype filter value
  const archetypeFilter = selectedArchetype !== 'All Archetypes'
    ? selectedArchetype
    : undefined

  // Fetch network members from API
  const {
    data: networkData,
    isLoading,
    error,
  } = useNetwork({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    search: searchQuery || undefined,
    archetype: archetypeFilter,
    sort: 'display_name:asc',
  })

  // Debug logging
  useEffect(() => {
    console.log('[NetworkPage] Network data state:', {
      loading: isLoading,
      error,
      data: networkData,
      filters: { searchQuery, selectedArchetype, currentPage },
    })
  }, [networkData, isLoading, error, searchQuery, selectedArchetype, currentPage])

  const members = networkData?.data || []
  const pagination = networkData?.pagination
  const totalPages = pagination?.total_pages || 1
  const totalMembers = pagination?.total || 0

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleArchetypeChange = (value: string) => {
    setSelectedArchetype(value)
    setCurrentPage(1)
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Network</h1>
            <p className="text-kalkvit/60">Discover and connect with members across the community</p>
          </div>
          <GlassCard variant="accent" leftBorder={false} className="px-6 py-3 text-center">
            <p className="text-sm text-kalkvit/60">Total Members</p>
            <p className="font-display text-2xl font-bold text-kalkvit">
              {isLoading ? '...' : totalMembers}
            </p>
          </GlassCard>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kalkvit/40" />
              <GlassInput
                placeholder="Search by name..."
                className="pl-12"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {archetypeFilters.map((archetype) => (
              <button
                key={archetype}
                onClick={() => handleArchetypeChange(archetype)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                  selectedArchetype === archetype
                    ? 'bg-koppar text-kalkvit'
                    : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1] hover:text-kalkvit'
                )}
              >
                {archetype}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-kalkvit/50 mb-4">
          {isLoading ? 'Loading...' : `Showing ${members.length} of ${totalMembers} members`}
        </p>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-koppar animate-spin" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <GlassCard variant="base" className="text-center py-12">
            <p className="text-tegelrod mb-2">Failed to load network</p>
            <p className="text-kalkvit/50 text-sm">Please try again later</p>
          </GlassCard>
        )}

        {/* Empty state */}
        {!isLoading && !error && members.length === 0 && (
          <GlassCard variant="base" className="text-center py-12">
            <Users className="w-12 h-12 text-kalkvit/20 mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">No members found</h3>
            <p className="text-kalkvit/50 text-sm">
              {searchQuery ? 'Try a different search term' : 'No members in the network yet'}
            </p>
          </GlassCard>
        )}

        {/* Members Grid */}
        {!isLoading && !error && members.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {members.map((member) => (
              <MemberCard key={member.user_id} member={member} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <GlassButton
              variant="ghost"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || !pagination?.has_prev}
              className="p-2"
            >
              <ChevronLeft className="w-5 h-5" />
            </GlassButton>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first, last, current, and adjacent pages
                const showPage =
                  page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1

                if (!showPage) {
                  // Show ellipsis
                  if (page === 2 || page === totalPages - 1) {
                    return (
                      <span key={page} className="px-2 text-kalkvit/40">
                        ...
                      </span>
                    )
                  }
                  return null
                }

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'w-10 h-10 rounded-xl text-sm font-medium transition-all',
                      currentPage === page
                        ? 'bg-koppar text-kalkvit'
                        : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1]'
                    )}
                  >
                    {page}
                  </button>
                )
              })}
            </div>

            <GlassButton
              variant="ghost"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || !pagination?.has_next}
              className="p-2"
            >
              <ChevronRight className="w-5 h-5" />
            </GlassButton>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
