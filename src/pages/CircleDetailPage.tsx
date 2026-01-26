import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassTextarea, GlassAvatar, GlassBadge } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import {
  Users,
  Calendar,
  MessageCircle,
  Settings,
  ArrowLeft,
  Heart,
  Send,
  Bell,
  BellOff,
  UserPlus,
  Clock,
} from 'lucide-react'

interface CircleMember {
  id: number
  name: string
  initials: string
  role: string
  isAdmin: boolean
}

interface CirclePost {
  id: number
  author: {
    name: string
    initials: string
  }
  content: string
  timestamp: string
  likes: number
  comments: number
  isLiked: boolean
}

interface CircleEvent {
  id: number
  title: string
  date: string
  time: string
  attendees: number
}

// Mock data for a single circle
const mockCircle = {
  id: 1,
  name: 'Morning Warriors',
  description: 'Early risers committed to winning the morning. We believe that how you start your day determines how you live your life. Join us for daily accountability, weekly challenges, and monthly workshops on optimizing your morning routine.',
  members: 48,
  category: 'Habits',
  isPrivate: false,
  isMember: true,
  nextMeeting: 'Tomorrow, 5:00 AM',
  createdAt: 'January 2024',
  rules: [
    'Wake up by 5:30 AM every day',
    'Post your morning routine completion',
    'Support and encourage fellow members',
    'No negativity or excuses',
  ],
}

const mockMembers: CircleMember[] = [
  { id: 1, name: 'Michael Chen', initials: 'MC', role: 'Founder', isAdmin: true },
  { id: 2, name: 'Sarah Williams', initials: 'SW', role: 'Moderator', isAdmin: true },
  { id: 3, name: 'John Davidson', initials: 'JD', role: 'Member', isAdmin: false },
  { id: 4, name: 'Emily Davis', initials: 'ED', role: 'Member', isAdmin: false },
  { id: 5, name: 'David Miller', initials: 'DM', role: 'Member', isAdmin: false },
]

const mockPosts: CirclePost[] = [
  {
    id: 1,
    author: { name: 'John Davidson', initials: 'JD' },
    content: '5:00 AM wake-up complete! Started with 10 minutes of meditation, then hit the gym. Energy levels are through the roof today.',
    timestamp: '2 hours ago',
    likes: 12,
    comments: 4,
    isLiked: false,
  },
  {
    id: 2,
    author: { name: 'Sarah Williams', initials: 'SW' },
    content: 'Week 4 challenge: Add cold shower to your morning routine. Who\'s in? Drop a 🧊 in the comments if you\'re committing!',
    timestamp: '5 hours ago',
    likes: 24,
    comments: 18,
    isLiked: true,
  },
]

const mockEvents: CircleEvent[] = [
  { id: 1, title: 'Weekly Accountability Call', date: 'Tomorrow', time: '5:00 AM', attendees: 32 },
  { id: 2, title: 'Morning Routine Workshop', date: 'Saturday', time: '9:00 AM', attendees: 45 },
]

function PostCard({ post }: { post: CirclePost }) {
  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [likes, setLikes] = useState(post.likes)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikes(isLiked ? likes - 1 : likes + 1)
  }

  return (
    <GlassCard variant="base" className="mb-4">
      <div className="flex gap-4">
        <GlassAvatar initials={post.author.initials} size="md" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-kalkvit">{post.author.name}</span>
            <span className="text-xs text-kalkvit/40">{post.timestamp}</span>
          </div>
          <p className="text-kalkvit/80 mb-4">{post.content}</p>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 text-sm ${isLiked ? 'text-tegelrod' : 'text-kalkvit/50 hover:text-kalkvit'}`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              {likes}
            </button>
            <button className="flex items-center gap-1 text-sm text-kalkvit/50 hover:text-kalkvit">
              <MessageCircle className="w-4 h-4" />
              {post.comments}
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

export function CircleDetailPage() {
  const { id: _circleId } = useParams() // Circle ID for future API calls
  const { user } = useAuth()
  const [postContent, setPostContent] = useState('')
  const [notifications, setNotifications] = useState(true)
  const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'events'>('feed')

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  const handlePost = () => {
    if (postContent.trim()) {
      console.log('Creating post:', postContent)
      setPostContent('')
    }
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link to="/circles" className="inline-flex items-center gap-2 text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Circles
        </Link>

        {/* Circle Header */}
        <GlassCard variant="elevated" className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-2xl font-bold text-kalkvit">{mockCircle.name}</h1>
                <GlassBadge variant="koppar">{mockCircle.category}</GlassBadge>
                {mockCircle.isMember && <GlassBadge variant="success">Member</GlassBadge>}
              </div>
              <p className="text-kalkvit/60 mb-4">{mockCircle.description}</p>
              <div className="flex items-center gap-4 text-sm text-kalkvit/50">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {mockCircle.members} members
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Next: {mockCircle.nextMeeting}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Since {mockCircle.createdAt}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <GlassButton
                variant="ghost"
                onClick={() => setNotifications(!notifications)}
                className="p-2"
              >
                {notifications ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </GlassButton>
              <GlassButton variant="ghost" className="p-2">
                <Settings className="w-5 h-5" />
              </GlassButton>
              {!mockCircle.isMember && (
                <GlassButton variant="primary">
                  <UserPlus className="w-4 h-4" />
                  Join Circle
                </GlassButton>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-t border-white/10 pt-4 -mb-6 -mx-6 px-6">
            {(['feed', 'members', 'events'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-2 text-sm font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? 'text-koppar border-b-2 border-koppar'
                    : 'text-kalkvit/60 hover:text-kalkvit'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Tab Content */}
        {activeTab === 'feed' && (
          <div>
            {/* Create Post */}
            {mockCircle.isMember && (
              <GlassCard variant="base" className="mb-6">
                <div className="flex gap-4">
                  <GlassAvatar initials={initials} size="md" />
                  <div className="flex-1">
                    <GlassTextarea
                      placeholder="Share an update with the circle..."
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      className="mb-3"
                    />
                    <div className="flex justify-end">
                      <GlassButton variant="primary" onClick={handlePost} disabled={!postContent.trim()}>
                        <Send className="w-4 h-4" />
                        Post
                      </GlassButton>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Posts */}
            {mockPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {activeTab === 'members' && (
          <GlassCard variant="base">
            <h3 className="font-semibold text-kalkvit mb-4">Members ({mockMembers.length})</h3>
            <div className="space-y-3">
              {mockMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                  <div className="flex items-center gap-3">
                    <GlassAvatar initials={member.initials} size="md" />
                    <div>
                      <p className="font-medium text-kalkvit">{member.name}</p>
                      <p className="text-xs text-kalkvit/50">{member.role}</p>
                    </div>
                  </div>
                  {member.isAdmin && <GlassBadge variant="koppar">Admin</GlassBadge>}
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            {mockEvents.map((event) => (
              <GlassCard key={event.id} variant="base">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-kalkvit mb-1">{event.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-kalkvit/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {event.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {event.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {event.attendees} attending
                      </span>
                    </div>
                  </div>
                  <GlassButton variant="secondary">RSVP</GlassButton>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Circle Rules */}
        <GlassCard variant="base" className="mt-6">
          <h3 className="font-semibold text-kalkvit mb-4">Circle Rules</h3>
          <ul className="space-y-2">
            {mockCircle.rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-2 text-kalkvit/70">
                <span className="text-koppar">•</span>
                {rule}
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </MainLayout>
  )
}
