import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassInput, GlassBadge } from '../components/ui'
import { Search, Users, Globe, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'
import { useCircles, useMyCircles, useJoinCircle, type Circle } from '../lib/api'

const categories = ['All', 'My Circles']

interface CircleCardProps {
  circle: Circle
}

function CircleCard({ circle }: CircleCardProps) {
  const navigate = useNavigate()
  const joinCircle = useJoinCircle()

  const handleCardClick = () => {
    if (circle.is_member) {
      navigate(`/circles/${circle.id}`)
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (circle.is_member) {
      navigate(`/circles/${circle.id}`)
    } else {
      joinCircle.mutate(circle.id)
    }
  }

  return (
    <GlassCard
      variant="base"
      className={cn(
        'group hover:border-koppar/30 transition-all',
        circle.is_member && 'cursor-pointer'
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <GlassBadge variant="default">
            <Globe className="w-3 h-3 mr-1" />
            Open
          </GlassBadge>
        </div>
        {circle.is_member && (
          <GlassBadge variant="success">Member</GlassBadge>
        )}
      </div>

      <h3 className="font-display text-xl font-semibold text-kalkvit mb-2 group-hover:text-koppar transition-colors">
        {circle.name}
      </h3>
      <p className="text-sm text-kalkvit/60 mb-4 line-clamp-2">{circle.description || 'No description'}</p>

      <div className="flex items-center gap-4 text-sm text-kalkvit/50 mb-4">
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {circle.member_count} members
        </span>
      </div>

      <GlassButton
        variant={circle.is_member ? 'secondary' : 'primary'}
        className="w-full"
        onClick={handleButtonClick}
        disabled={joinCircle.isPending}
      >
        {circle.is_member ? (
          <>Enter Circle <ArrowRight className="w-4 h-4" /></>
        ) : joinCircle.isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Joining...</>
        ) : (
          <>Join Circle</>
        )}
      </GlassButton>
    </GlassCard>
  )
}

export function CirclesPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch circles from API
  const {
    data: circlesData,
    isLoading: circlesLoading,
    error: circlesError,
  } = useCircles({ limit: 50 })

  const {
    data: myCirclesData,
    isLoading: myCirclesLoading,
  } = useMyCircles()

  const allCircles = circlesData?.data || []
  const myCircles = myCirclesData || []

  // Filter circles based on search and category
  const filteredCircles = (activeCategory === 'My Circles' ? myCircles : allCircles).filter((circle) => {
    const matchesSearch = circle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (circle.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const myCirclesCount = myCircles.length
  const isLoading = circlesLoading || (activeCategory === 'My Circles' && myCirclesLoading)

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Circles</h1>
            <p className="text-kalkvit/60">Join focused groups and connect with like-minded members</p>
          </div>
          <GlassCard variant="accent" leftBorder={false} className="px-6 py-3">
            <p className="text-sm text-kalkvit/60">Your Circles</p>
            <p className="font-display text-2xl font-bold text-kalkvit">{myCirclesCount}</p>
          </GlassCard>
        </div>

        {/* Search and Categories */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kalkvit/40" />
            <GlassInput
              placeholder="Search circles..."
              className="pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
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

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-koppar animate-spin" />
          </div>
        )}

        {/* Error state */}
        {circlesError && (
          <GlassCard variant="base" className="text-center py-12">
            <p className="text-tegelrod mb-2">Failed to load circles</p>
            <p className="text-kalkvit/50 text-sm">Please try again later</p>
          </GlassCard>
        )}

        {/* Circles Grid */}
        {!isLoading && !circlesError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCircles.map((circle) => (
              <CircleCard
                key={circle.id}
                circle={circle}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !circlesError && filteredCircles.length === 0 && (
          <GlassCard variant="base" className="text-center py-12">
            <Users className="w-12 h-12 text-kalkvit/20 mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">No circles found</h3>
            <p className="text-kalkvit/50 text-sm">
              {searchQuery ? 'Try a different search term' :
               activeCategory === 'My Circles' ? 'Join a circle to get started' :
               'No circles available yet'}
            </p>
          </GlassCard>
        )}
      </div>
    </MainLayout>
  )
}
