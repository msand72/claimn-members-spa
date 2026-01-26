import { useState } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import {
  GlassCard,
  GlassButton,
  GlassTextarea,
  GlassAvatar,
  GlassBadge,
  GlassTabs,
  GlassDropdown,
} from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useMyInterestGroups } from '../hooks/useInterestGroups'
import { Heart, MessageCircle, Share2, MoreHorizontal, Image, Send, Users } from 'lucide-react'

interface Post {
  id: number
  author: {
    name: string
    initials: string
    role: string
  }
  content: string
  timestamp: string
  likes: number
  comments: number
  isLiked: boolean
  badge?: string
  interestGroup?: {
    id: string
    name: string
  }
}

const mockPosts: Post[] = [
  {
    id: 1,
    author: { name: 'John Davidson', initials: 'JD', role: 'Brotherhood Member' },
    content:
      'Just completed my first 30-day protocol! The consistency has been transformative. Feeling stronger both mentally and physically. Thanks to everyone in this community for the support!',
    timestamp: '2 hours ago',
    likes: 24,
    comments: 8,
    isLiked: false,
    badge: 'Achievement',
    interestGroup: { id: '1', name: 'Biohacking & Performance' },
  },
  {
    id: 2,
    author: { name: 'Michael Chen', initials: 'MC', role: 'Expert Coach' },
    content:
      'Quick tip for the morning routine: Start with 5 minutes of breathwork before anything else. It sets the tone for the entire day and helps you stay grounded when challenges arise.',
    timestamp: '5 hours ago',
    likes: 42,
    comments: 15,
    isLiked: true,
    badge: 'Expert Tip',
  },
  {
    id: 3,
    author: { name: 'Sarah Williams', initials: 'SW', role: 'Brotherhood Member' },
    content:
      "Had an amazing coaching session today. Sometimes you need an outside perspective to see what's holding you back. Grateful for this community and the experts who guide us.",
    timestamp: '8 hours ago',
    likes: 18,
    comments: 4,
    isLiked: false,
    interestGroup: { id: '2', name: 'Leadership & Career' },
  },
  {
    id: 4,
    author: { name: 'David Miller', initials: 'DM', role: 'Brotherhood Member' },
    content:
      'Week 3 of the fitness protocol complete. Down 8 lbs and energy levels are through the roof. The accountability from the Circle has been game-changing.',
    timestamp: '1 day ago',
    likes: 56,
    comments: 12,
    isLiked: true,
    badge: 'Progress Update',
    interestGroup: { id: '3', name: 'Strength & Combat Sports' },
  },
  {
    id: 5,
    author: { name: 'Alex Thompson', initials: 'AT', role: 'Brotherhood Member' },
    content:
      'Just finished reading "The Obstacle Is the Way" - incredible insights on stoic philosophy and how to turn adversity into advantage. Anyone else into philosophy and self-development books?',
    timestamp: '1 day ago',
    likes: 32,
    comments: 18,
    isLiked: false,
    interestGroup: { id: '4', name: 'Reading & Philosophy' },
  },
]

function PostCard({ post }: { post: Post }) {
  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [likes, setLikes] = useState(post.likes)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikes(isLiked ? likes - 1 : likes + 1)
  }

  return (
    <GlassCard variant="base" className="mb-4">
      <div className="flex gap-4">
        <GlassAvatar initials={post.author.initials} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-kalkvit">{post.author.name}</span>
                {post.badge && <GlassBadge variant="koppar">{post.badge}</GlassBadge>}
              </div>
              <div className="flex items-center gap-2 text-sm text-kalkvit/50 flex-wrap">
                <span>{post.author.role}</span>
                <span>•</span>
                <span>{post.timestamp}</span>
                {post.interestGroup && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-koppar">
                      <Users className="w-3 h-3" />
                      {post.interestGroup.name}
                    </span>
                  </>
                )}
              </div>
            </div>
            <button className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-kalkvit/50 hover:text-kalkvit">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          <p className="text-kalkvit/80 leading-relaxed mb-4">{post.content}</p>

          <div className="flex items-center gap-6 pt-4 border-t border-white/10">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isLiked ? 'text-tegelrod' : 'text-kalkvit/60 hover:text-kalkvit'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              {likes}
            </button>
            <button className="flex items-center gap-2 text-sm font-medium text-kalkvit/60 hover:text-kalkvit transition-colors">
              <MessageCircle className="w-5 h-5" />
              {post.comments}
            </button>
            <button className="flex items-center gap-2 text-sm font-medium text-kalkvit/60 hover:text-kalkvit transition-colors">
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

export function FeedPage() {
  const { user } = useAuth()
  const [postContent, setPostContent] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')

  const { data: myGroups = [] } = useMyInterestGroups(user?.id)

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handlePost = () => {
    if (postContent.trim()) {
      // TODO: Implement post creation via API
      console.log('Creating post:', { content: postContent, groupId: selectedGroupId })
      setPostContent('')
      setSelectedGroupId('')
    }
  }

  // Filter posts based on active tab
  const filteredPosts =
    activeTab === 'all'
      ? mockPosts
      : activeTab === 'my-groups'
        ? mockPosts.filter((p) => p.interestGroup) // In real app, filter by user's groups
        : mockPosts.filter((p) => p.interestGroup?.id === activeTab)

  // Create tab options
  const tabs = [
    { value: 'all', label: 'All Posts' },
    { value: 'my-groups', label: 'My Groups' },
    ...myGroups.slice(0, 4).map((g) => ({
      value: g.id,
      label: g.name,
    })),
  ]

  // Create group dropdown options for posting
  const groupOptions = [
    { value: '', label: 'Post to General Feed' },
    ...myGroups.map((g) => ({
      value: g.id,
      label: g.name,
    })),
  ]

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Community Feed</h1>
          <p className="text-kalkvit/60">Share updates and connect with the brotherhood</p>
        </div>

        {/* Feed Tabs */}
        <div className="mb-6 overflow-x-auto">
          <GlassTabs
            tabs={tabs}
            value={activeTab}
            onChange={setActiveTab}
            className="min-w-max"
          />
        </div>

        {/* Create Post */}
        <GlassCard variant="elevated" className="mb-6">
          <div className="flex gap-4">
            <GlassAvatar initials={initials} size="lg" />
            <div className="flex-1">
              <GlassTextarea
                placeholder="Share something with the community..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="mb-4 min-h-[100px]"
              />
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-kalkvit/50 hover:text-kalkvit">
                    <Image className="w-5 h-5" />
                  </button>
                  {myGroups.length > 0 && (
                    <GlassDropdown
                      items={groupOptions}
                      value={selectedGroupId}
                      onChange={setSelectedGroupId}
                      placeholder="Select group"
                      className="min-w-[180px]"
                    />
                  )}
                </div>
                <GlassButton variant="primary" onClick={handlePost} disabled={!postContent.trim()}>
                  <Send className="w-4 h-4" />
                  Post
                </GlassButton>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* My Interest Groups Summary */}
        {myGroups.length > 0 && activeTab === 'all' && (
          <GlassCard variant="base" className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-kalkvit">My Interest Groups</h3>
              <span className="text-sm text-kalkvit/50">{myGroups.length} groups</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {myGroups.slice(0, 6).map((group) => (
                <button
                  key={group.id}
                  onClick={() => setActiveTab(group.id)}
                  className="px-3 py-1.5 rounded-lg bg-koppar/10 text-koppar text-sm hover:bg-koppar/20 transition-colors flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  {group.name}
                </button>
              ))}
              {myGroups.length > 6 && (
                <span className="px-3 py-1.5 text-kalkvit/50 text-sm">
                  +{myGroups.length - 6} more
                </span>
              )}
            </div>
          </GlassCard>
        )}

        {/* Empty state for filtered view */}
        {filteredPosts.length === 0 && (
          <GlassCard variant="base" className="text-center py-12">
            <Users className="w-12 h-12 text-kalkvit/20 mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">No posts yet</h3>
            <p className="text-kalkvit/50 text-sm mb-4">
              Be the first to share something in this group!
            </p>
            <GlassButton variant="secondary" onClick={() => setActiveTab('all')}>
              View All Posts
            </GlassButton>
          </GlassCard>
        )}

        {/* Feed Posts */}
        <div>
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </MainLayout>
  )
}
