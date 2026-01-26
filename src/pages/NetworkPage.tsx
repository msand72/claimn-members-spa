import { useState, useMemo } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassInput, GlassAvatar, GlassBadge } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useMemberInterests, useInterests } from '../hooks/useInterests'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  UserPlus,
  MapPin,
  Heart,
} from 'lucide-react'
import { cn } from '../lib/utils'

interface NetworkMember {
  id: number
  name: string
  initials: string
  title: string
  company: string
  location: string
  industry: string
  archetype: string | null
  pillarFocus: string | null
  isConnected: boolean
  mutualConnections: number
  interests: string[] // Interest names
}

// Generate mock data for pagination demo
const generateMockMembers = (): NetworkMember[] => {
  const names = [
    'Alex Johnson',
    'Maria Garcia',
    'James Smith',
    'Emma Wilson',
    'Daniel Brown',
    'Sophie Martinez',
    'Michael Davis',
    'Olivia Anderson',
    'William Taylor',
    'Isabella Thomas',
    'Benjamin Jackson',
    'Charlotte White',
    'Lucas Harris',
    'Amelia Martin',
    'Henry Thompson',
    'Mia Robinson',
    'Alexander Clark',
    'Harper Lewis',
    'Sebastian Walker',
    'Evelyn Hall',
    'Jack Allen',
    'Abigail Young',
    'Owen King',
    'Emily Wright',
    'Samuel Scott',
    'Ava Green',
    'Joseph Adams',
    'Ella Baker',
    'David Nelson',
    'Grace Hill',
    'John Carter',
    'Chloe Mitchell',
    'Andrew Perez',
    'Lily Roberts',
    'Ryan Turner',
    'Zoey Phillips',
    'Nathan Campbell',
    'Victoria Parker',
    'Christian Evans',
    'Penelope Edwards',
  ]

  const titles = ['CEO', 'Founder', 'Director', 'VP', 'Manager', 'Consultant', 'Coach', 'Investor']
  const companies = [
    'Startup Inc',
    'Tech Corp',
    'Growth Co',
    'Innovation Labs',
    'Success Partners',
    'Elite Ventures',
  ]
  const locations = [
    'New York',
    'Los Angeles',
    'Chicago',
    'Miami',
    'Austin',
    'Seattle',
    'Denver',
    'Boston',
  ]
  const industries = [
    'Technology',
    'Finance',
    'Healthcare',
    'Real Estate',
    'Marketing',
    'Consulting',
    'E-commerce',
  ]
  const archetypes = [
    'The Achiever',
    'The Optimizer',
    'The Networker',
    'The Grinder',
    'The Philosopher',
  ]
  const pillarFocuses = ['identity', 'emotional', 'physical', 'connection', 'mission']
  const allInterests = [
    'Strength & Combat Sports',
    'Outdoor Adventures',
    'Endurance Sports',
    'Entrepreneurship & Startups',
    'Investing',
    'Leadership & Career',
    'Building & Making',
    'Cooking & Food Culture',
    'Reading & Philosophy',
    'Biohacking & Performance',
    'Fatherhood & Family',
    'Travel & Exploration',
  ]

  return names.map((name, i) => {
    // Generate 2-5 random interests for each member
    const numInterests = Math.floor(Math.random() * 4) + 2
    const shuffled = [...allInterests].sort(() => 0.5 - Math.random())
    const memberInterests = shuffled.slice(0, numInterests)

    return {
      id: i + 1,
      name,
      initials: name
        .split(' ')
        .map((n) => n[0])
        .join(''),
      title: titles[i % titles.length],
      company: companies[i % companies.length],
      location: locations[i % locations.length],
      industry: industries[i % industries.length],
      archetype: i % 3 === 0 ? archetypes[i % archetypes.length] : null,
      pillarFocus: i % 2 === 0 ? pillarFocuses[i % pillarFocuses.length] : null,
      isConnected: i < 8,
      mutualConnections: Math.floor(Math.random() * 15) + 1,
      interests: memberInterests,
    }
  })
}

const ITEMS_PER_PAGE = 12

const industries = [
  'All Industries',
  'Technology',
  'Finance',
  'Healthcare',
  'Real Estate',
  'Marketing',
  'Consulting',
]

function MemberCard({
  member,
  userInterests,
}: {
  member: NetworkMember
  userInterests: string[]
}) {
  const [isConnected] = useState(member.isConnected)
  const [isPending, setIsPending] = useState(false)

  const handleConnect = () => {
    if (!isConnected && !isPending) {
      setIsPending(true)
    }
  }

  // Calculate shared interests
  const sharedInterests = member.interests.filter((interest) => userInterests.includes(interest))
  const sharedCount = sharedInterests.length

  return (
    <GlassCard variant="base" className="p-4">
      <div className="flex items-start gap-4">
        <GlassAvatar initials={member.initials} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-kalkvit truncate">{member.name}</h3>
            {member.archetype && (
              <GlassBadge variant="koppar" className="text-xs hidden sm:inline-flex">
                {member.archetype.replace('The ', '')}
              </GlassBadge>
            )}
          </div>
          <p className="text-sm text-koppar">{member.title}</p>
          <p className="text-xs text-kalkvit/50">{member.company}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-kalkvit/40">
            <MapPin className="w-3 h-3" />
            {member.location}
          </div>
        </div>
      </div>

      {/* Interests */}
      {member.interests.length > 0 && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-1">
            {member.interests.slice(0, 2).map((interest) => (
              <span
                key={interest}
                className={cn(
                  'px-2 py-0.5 text-xs rounded border',
                  sharedInterests.includes(interest)
                    ? 'bg-koppar/20 text-koppar border-koppar/30'
                    : 'bg-white/[0.04] text-kalkvit/60 border-white/10'
                )}
              >
                {interest}
              </span>
            ))}
            {member.interests.length > 2 && (
              <span className="px-2 py-0.5 text-xs text-kalkvit/40">
                +{member.interests.length - 2}
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
              {sharedCount} shared
            </span>
          ) : (
            <span>{member.mutualConnections} mutual</span>
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
            Pending
          </GlassBadge>
        ) : (
          <GlassButton variant="primary" className="w-full text-sm py-2" onClick={handleConnect}>
            <UserPlus className="w-4 h-4" />
            Connect
          </GlassButton>
        )}
      </div>
    </GlassCard>
  )
}

export function NetworkPage() {
  const { user } = useAuth()
  const [allMembers] = useState<NetworkMember[]>(() => generateMockMembers())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries')
  const [showSharedOnly, setShowSharedOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Get user's interests for comparison
  const { data: interests = [] } = useInterests()
  const { data: userInterestIds = [] } = useMemberInterests(user?.id)
  const userInterestNames = interests
    .filter((i) => userInterestIds.includes(i.id))
    .map((i) => i.name)

  // Filter members based on search, industry, and shared interests
  const filteredMembers = useMemo(() => {
    return allMembers.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.company.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesIndustry =
        selectedIndustry === 'All Industries' || member.industry === selectedIndustry

      const matchesShared = !showSharedOnly || member.interests.some((i) => userInterestNames.includes(i))

      return matchesSearch && matchesIndustry && matchesShared
    })
  }, [allMembers, searchQuery, selectedIndustry, showSharedOnly, userInterestNames])

  // Sort by shared interests (most shared first)
  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      const aShared = a.interests.filter((i) => userInterestNames.includes(i)).length
      const bShared = b.interests.filter((i) => userInterestNames.includes(i)).length
      return bShared - aShared
    })
  }, [filteredMembers, userInterestNames])

  // Pagination
  const totalPages = Math.ceil(sortedMembers.length / ITEMS_PER_PAGE)
  const paginatedMembers = sortedMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleIndustryChange = (value: string) => {
    setSelectedIndustry(value)
    setCurrentPage(1)
  }

  const handleSharedToggle = () => {
    setShowSharedOnly(!showSharedOnly)
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
            <p className="font-display text-2xl font-bold text-kalkvit">{allMembers.length}</p>
          </GlassCard>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kalkvit/40" />
              <GlassInput
                placeholder="Search by name, title, or company..."
                className="pl-12"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <button
              onClick={handleSharedToggle}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2',
                showSharedOnly
                  ? 'bg-koppar text-kalkvit'
                  : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1] hover:text-kalkvit'
              )}
            >
              <Heart className="w-4 h-4" />
              Shared Interests Only
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {industries.map((industry) => (
              <button
                key={industry}
                onClick={() => handleIndustryChange(industry)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                  selectedIndustry === industry
                    ? 'bg-koppar text-kalkvit'
                    : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1] hover:text-kalkvit'
                )}
              >
                {industry}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-kalkvit/50 mb-4">
          Showing {paginatedMembers.length} of {sortedMembers.length} members
          {showSharedOnly && ' with shared interests'}
        </p>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {paginatedMembers.map((member) => (
            <MemberCard key={member.id} member={member} userInterests={userInterestNames} />
          ))}
        </div>

        {sortedMembers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-kalkvit/60">No members found matching your criteria.</p>
            {showSharedOnly && (
              <GlassButton variant="secondary" className="mt-4" onClick={handleSharedToggle}>
                Show All Members
              </GlassButton>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <GlassButton
              variant="ghost"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
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
              disabled={currentPage === totalPages}
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
