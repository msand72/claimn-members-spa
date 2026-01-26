import { useState } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassInput, GlassBadge, GlassAvatar } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useMyInterestGroups, useAllInterestGroups } from '../hooks/useInterestGroups'
import {
  Search,
  Users,
  MessageSquare,
  Heart,
  ChevronRight,
  Plus,
} from 'lucide-react'
import { cn } from '../lib/utils'

interface GroupMember {
  id: string
  initials: string
  name: string
}

// Mock additional data for interest groups
const mockGroupData: Record<string, { recentPosts: number; topMembers: GroupMember[] }> = {
  '1': {
    recentPosts: 12,
    topMembers: [
      { id: '1', initials: 'JD', name: 'John Davidson' },
      { id: '2', initials: 'MC', name: 'Michael Chen' },
      { id: '3', initials: 'AJ', name: 'Alex Johnson' },
    ],
  },
  '2': {
    recentPosts: 8,
    topMembers: [
      { id: '4', initials: 'SW', name: 'Sarah Williams' },
      { id: '5', initials: 'DM', name: 'David Miller' },
    ],
  },
}

export function InterestGroupsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'my-groups' | 'discover'>('my-groups')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: myGroups = [], isLoading: myGroupsLoading } = useMyInterestGroups(user?.id)
  const { data: allGroups = [], isLoading: allGroupsLoading } = useAllInterestGroups()

  // Filter groups based on search
  const filteredMyGroups = myGroups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const myGroupIds = myGroups.map((g) => g.id)
  const discoverGroups = allGroups.filter(
    (g) =>
      !myGroupIds.includes(g.id) && g.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isLoading = activeTab === 'my-groups' ? myGroupsLoading : allGroupsLoading

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Interest Groups</h1>
            <p className="text-kalkvit/60">Connect with members who share your interests</p>
          </div>
          <GlassCard variant="accent" leftBorder={false} className="px-6 py-3 text-center">
            <p className="text-sm text-kalkvit/60">My Groups</p>
            <p className="font-display text-2xl font-bold text-kalkvit">{myGroups.length}</p>
          </GlassCard>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('my-groups')}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              activeTab === 'my-groups'
                ? 'bg-koppar text-kalkvit'
                : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1]'
            )}
          >
            My Groups ({myGroups.length})
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              activeTab === 'discover'
                ? 'bg-koppar text-kalkvit'
                : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1]'
            )}
          >
            Discover
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kalkvit/40" />
          <GlassInput
            placeholder="Search interest groups..."
            className="pl-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-koppar border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-kalkvit/60">Loading groups...</p>
          </div>
        )}

        {/* My Groups Tab */}
        {!isLoading && activeTab === 'my-groups' && (
          <>
            {filteredMyGroups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMyGroups.map((group) => {
                  const extraData = mockGroupData[group.id] || {
                    recentPosts: Math.floor(Math.random() * 20) + 1,
                    topMembers: [],
                  }

                  return (
                    <GlassCard key={group.id} variant="base" className="hover:border-koppar/30 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-kalkvit">{group.name}</h3>
                          {group.interest && (
                            <GlassBadge variant="koppar" className="text-xs mt-1">
                              {group.interest.name}
                            </GlassBadge>
                          )}
                        </div>
                        <GlassBadge variant="success" className="text-xs">
                          <Users className="w-3 h-3" />
                          Joined
                        </GlassBadge>
                      </div>

                      {group.description && (
                        <p className="text-sm text-kalkvit/60 mb-4 line-clamp-2">
                          {group.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-kalkvit/50 mb-4">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {group.member_count} members
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {extraData.recentPosts} posts
                        </span>
                      </div>

                      {/* Top Members */}
                      {extraData.topMembers.length > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex -space-x-2">
                            {extraData.topMembers.slice(0, 3).map((member) => (
                              <GlassAvatar
                                key={member.id}
                                initials={member.initials}
                                size="sm"
                                className="ring-2 ring-charcoal"
                              />
                            ))}
                          </div>
                          <span className="text-xs text-kalkvit/50">
                            {extraData.topMembers.map((m) => m.name.split(' ')[0]).join(', ')}
                          </span>
                        </div>
                      )}

                      <GlassButton variant="secondary" className="w-full">
                        View Group
                        <ChevronRight className="w-4 h-4" />
                      </GlassButton>
                    </GlassCard>
                  )
                })}
              </div>
            ) : (
              <GlassCard variant="base" className="text-center py-12">
                <Heart className="w-12 h-12 text-kalkvit/20 mx-auto mb-4" />
                <h3 className="font-medium text-kalkvit mb-2">
                  {searchQuery ? 'No groups match your search' : 'No groups joined yet'}
                </h3>
                <p className="text-kalkvit/50 text-sm mb-4">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Select interests in your profile to join groups automatically'}
                </p>
                <GlassButton variant="primary" onClick={() => setActiveTab('discover')}>
                  Discover Groups
                </GlassButton>
              </GlassCard>
            )}
          </>
        )}

        {/* Discover Tab */}
        {!isLoading && activeTab === 'discover' && (
          <>
            {discoverGroups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {discoverGroups.map((group) => (
                  <GlassCard key={group.id} variant="base" className="hover:border-koppar/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-kalkvit">{group.name}</h3>
                        {group.interest && (
                          <GlassBadge variant="koppar" className="text-xs mt-1">
                            {group.interest.name}
                          </GlassBadge>
                        )}
                      </div>
                    </div>

                    {group.description && (
                      <p className="text-sm text-kalkvit/60 mb-4 line-clamp-2">
                        {group.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-kalkvit/50 mb-4">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {group.member_count} members
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {group.post_count} posts
                      </span>
                    </div>

                    <GlassButton variant="primary" className="w-full">
                      <Plus className="w-4 h-4" />
                      Join Group
                    </GlassButton>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <GlassCard variant="base" className="text-center py-12">
                <Users className="w-12 h-12 text-kalkvit/20 mx-auto mb-4" />
                <h3 className="font-medium text-kalkvit mb-2">
                  {searchQuery ? 'No groups match your search' : 'All caught up!'}
                </h3>
                <p className="text-kalkvit/50 text-sm">
                  {searchQuery
                    ? 'Try a different search term'
                    : "You've joined all available interest groups"}
                </p>
              </GlassCard>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}
