import { useState } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassInput, GlassBadge } from '../components/ui'
import { Search, Users, Calendar, Lock, Globe, ArrowRight } from 'lucide-react'
import { cn } from '../lib/utils'

interface Circle {
  id: number
  name: string
  description: string
  members: number
  category: string
  isPrivate: boolean
  isMember: boolean
  nextMeeting?: string
  image?: string
}

const mockCircles: Circle[] = [
  {
    id: 1,
    name: 'Morning Warriors',
    description: 'Early risers committed to winning the morning. 5AM club members pushing each other to start strong.',
    members: 48,
    category: 'Habits',
    isPrivate: false,
    isMember: true,
    nextMeeting: 'Tomorrow, 5:00 AM',
  },
  {
    id: 2,
    name: 'Entrepreneur Network',
    description: 'Founders and business owners sharing strategies, challenges, and wins in their entrepreneurial journey.',
    members: 124,
    category: 'Business',
    isPrivate: false,
    isMember: true,
    nextMeeting: 'Friday, 7:00 PM',
  },
  {
    id: 3,
    name: 'Fitness Protocol',
    description: 'Members following the 12-week transformation protocol. Weekly check-ins and accountability partners.',
    members: 67,
    category: 'Fitness',
    isPrivate: false,
    isMember: false,
  },
  {
    id: 4,
    name: 'Leadership Mastermind',
    description: 'Advanced leadership discussions and peer coaching for experienced leaders and executives.',
    members: 24,
    category: 'Leadership',
    isPrivate: true,
    isMember: false,
  },
  {
    id: 5,
    name: 'Mindset Mastery',
    description: 'Deep work on mental frameworks, stoic philosophy, and developing an unshakeable mindset.',
    members: 89,
    category: 'Mindset',
    isPrivate: false,
    isMember: true,
    nextMeeting: 'Sunday, 10:00 AM',
  },
  {
    id: 6,
    name: 'Wealth Building',
    description: 'Financial education, investment strategies, and building long-term wealth together.',
    members: 156,
    category: 'Finance',
    isPrivate: false,
    isMember: false,
  },
]

const categories = ['All', 'My Circles', 'Habits', 'Business', 'Fitness', 'Mindset', 'Finance']

function CircleCard({ circle }: { circle: Circle }) {
  return (
    <GlassCard variant="base" className="group cursor-pointer hover:border-koppar/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <GlassBadge variant={circle.isPrivate ? 'warning' : 'default'}>
            {circle.isPrivate ? <Lock className="w-3 h-3 mr-1" /> : <Globe className="w-3 h-3 mr-1" />}
            {circle.isPrivate ? 'Private' : 'Open'}
          </GlassBadge>
          <GlassBadge variant="koppar">{circle.category}</GlassBadge>
        </div>
        {circle.isMember && (
          <GlassBadge variant="success">Member</GlassBadge>
        )}
      </div>

      <h3 className="font-display text-xl font-semibold text-kalkvit mb-2 group-hover:text-koppar transition-colors">
        {circle.name}
      </h3>
      <p className="text-sm text-kalkvit/60 mb-4 line-clamp-2">{circle.description}</p>

      <div className="flex items-center gap-4 text-sm text-kalkvit/50 mb-4">
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {circle.members} members
        </span>
        {circle.nextMeeting && (
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {circle.nextMeeting}
          </span>
        )}
      </div>

      <GlassButton
        variant={circle.isMember ? 'secondary' : 'primary'}
        className="w-full"
      >
        {circle.isMember ? (
          <>Enter Circle <ArrowRight className="w-4 h-4" /></>
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

  const filteredCircles = mockCircles.filter((circle) => {
    const matchesSearch = circle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      circle.description.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeCategory === 'All') return matchesSearch
    if (activeCategory === 'My Circles') return matchesSearch && circle.isMember
    return matchesSearch && circle.category === activeCategory
  })

  const myCirclesCount = mockCircles.filter(c => c.isMember).length

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

        {/* Circles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCircles.map((circle) => (
            <CircleCard key={circle.id} circle={circle} />
          ))}
        </div>

        {filteredCircles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-kalkvit/60">No circles found matching your criteria.</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
