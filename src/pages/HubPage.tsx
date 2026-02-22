import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { PageErrorBoundary } from '../components/PageErrorBoundary'
import {
  GlassCard,
  GlassAvatar,
  GlassBadge,
  GlassButton,
  GlassStatsCard,
} from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import {
  useCurrentProfile,
  useExperts,
  useFeed,
  useConversations,
  useMyEvents,
  useEvents,
  useCoachingSessions,
  useEnrolledPrograms,
  useDashboardStats,
  useGoals,
  useActiveProtocols,
  safeArray,
  type FeedPost,
  type Expert,
  type Conversation,
  type CoachingSession,
  type UserProgram,
  type Goal,
  type ActiveProtocol,
} from '../lib/api'
import type { ClaimnEvent } from '../lib/api/hooks/useEvents'
import {
  Heart,
  MessageCircle,
  Calendar,
  CircleDot,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Target,
  Flame,
  BarChart3,
  Trophy,
  Clock,
  Users,
  Zap,
} from 'lucide-react'

// ── Helpers ──────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((d.getTime() - now.getTime()) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

// ── Skeleton helpers ─────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />
}

// ── WelcomeBanner ────────────────────────────────────

function WelcomeBanner() {
  const { user } = useAuth()
  const { data: profile } = useCurrentProfile()

  const displayName = profile?.display_name || user?.display_name || user?.email?.split('@')[0] || 'Member'

  return (
    <GlassCard variant="accent" className="relative overflow-hidden">
      <div className="flex items-center gap-4 sm:gap-6">
        <GlassAvatar
          src={profile?.avatar_url ?? undefined}
          initials={getInitials(displayName)}
          size="xl"
        />
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-kalkvit truncate">
            {getGreeting()}, {displayName.split(' ')[0]}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            {profile?.archetype && (
              <GlassBadge variant="koppar">{profile.archetype}</GlassBadge>
            )}
            <span className="text-kalkvit/60 text-sm">Welcome to The Hub</span>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

// ── StatsRow ─────────────────────────────────────────

function StatsRow() {
  const { data: stats, isLoading } = useDashboardStats()
  const { data: goalsData } = useGoals({ status: 'active', limit: 1 })

  const goalsCount = safeArray<Goal>(goalsData).length

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <GlassStatsCard
        icon={Target}
        label="Active Goals"
        value={isLoading ? '...' : String(stats?.goals_active ?? goalsCount)}
      />
      <GlassStatsCard
        icon={Flame}
        label="Streak"
        value={isLoading ? '...' : String(stats?.current_streak ?? 0)}
        trendLabel="days"
      />
      <GlassStatsCard
        icon={BarChart3}
        label="Connections"
        value={isLoading ? '...' : String(stats?.connections_count ?? 0)}
        trendLabel="network"
      />
      <GlassStatsCard
        icon={Trophy}
        label="Days Active"
        value={isLoading ? '...' : String(stats?.days_since_joined ?? 0)}
        trendLabel="journey"
      />
    </div>
  )
}

// ── ExpertSpotlight ──────────────────────────────────

function ExpertSpotlight() {
  const { data, isLoading } = useExperts({ is_top_rated: true, limit: 6 })
  const experts: Expert[] = safeArray(data)

  if (!isLoading && experts.length === 0) return null

  return (
    <GlassCard variant="base">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-kalkvit flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-koppar" />
          Expert Spotlight
        </h2>
        <Link to="/experts" className="text-sm text-koppar hover:text-koppar/80 transition-colors flex items-center gap-1">
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-20">
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="w-16 h-3" />
                <Skeleton className="w-12 h-2.5" />
              </div>
            ))
          : experts.map((expert) => (
              <Link
                key={expert.id}
                to={`/experts/${expert.id}`}
                className="flex flex-col items-center gap-2 shrink-0 w-20 group"
              >
                <GlassAvatar
                  src={expert.avatar_url ?? undefined}
                  initials={getInitials(expert.name)}
                  size="lg"
                  className="ring-2 ring-koppar/30 group-hover:ring-koppar/60 transition-all"
                />
                <span className="text-xs font-medium text-kalkvit text-center truncate w-full">
                  {expert.name.split(' ')[0]}
                </span>
                <span className="text-[10px] text-kalkvit/50 text-center truncate w-full">
                  {expert.specialties?.[0] || expert.title}
                </span>
              </Link>
            ))}
      </div>
    </GlassCard>
  )
}

// ── ActiveGoals ──────────────────────────────────────

function ActiveGoals() {
  const { data, isLoading } = useGoals({ status: 'active', limit: 3 })
  const goals: Goal[] = safeArray<Goal>(data)

  return (
    <GlassCard variant="base">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-kalkvit flex items-center gap-2">
          <Target className="w-5 h-5 text-koppar" />
          Active Goals
        </h2>
        <Link to="/goals" className="text-sm text-koppar hover:text-koppar/80 transition-colors flex items-center gap-1">
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="w-40 h-3.5" />
              <Skeleton className="w-full h-2" />
            </div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-6">
          <Target className="w-10 h-10 text-kalkvit/15 mx-auto mb-2" />
          <p className="text-kalkvit/50 text-sm mb-3">No active goals yet</p>
          <Link to="/goals">
            <GlassButton variant="secondary" className="px-4 py-2 text-xs">Set Goals</GlassButton>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <Link key={goal.id} to={`/goals/${goal.id}`} className="block group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-kalkvit truncate">{goal.title}</span>
                <span className="text-koppar text-xs font-semibold whitespace-nowrap ml-2">
                  {goal.progress ?? 0}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-koppar transition-all"
                  style={{ width: `${goal.progress ?? 0}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </GlassCard>
  )
}

// ── ActiveProtocolsList ──────────────────────────────

function ActiveProtocolsList() {
  const { data, isLoading } = useActiveProtocols({ status: 'active' })
  const protocols: ActiveProtocol[] = safeArray<ActiveProtocol>(data)

  if (!isLoading && protocols.length === 0) return null

  return (
    <GlassCard variant="base">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-kalkvit flex items-center gap-2">
          <Flame className="w-5 h-5 text-koppar" />
          Active Protocols
        </h2>
        <Link to="/protocols" className="text-sm text-koppar hover:text-koppar/80 transition-colors flex items-center gap-1">
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="w-36 h-3.5" />
              <Skeleton className="w-full h-2" />
              <Skeleton className="w-24 h-2.5" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {protocols.slice(0, 3).map((p) => (
            <Link key={p.id} to={`/protocols/${p.protocol_slug}`} className="block group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-kalkvit truncate">{p.protocol_name}</span>
                <span className="text-koppar text-xs font-semibold whitespace-nowrap ml-2">
                  {p.progress_percentage ?? 0}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-koppar transition-all"
                  style={{ width: `${p.progress_percentage ?? 0}%` }}
                />
              </div>
              <span className="text-[10px] text-kalkvit/40 mt-0.5 block">
                Week {p.current_week}
              </span>
            </Link>
          ))}
        </div>
      )}
    </GlassCard>
  )
}

// ── RecentFeedPosts ──────────────────────────────────

function RecentFeedPosts() {
  const { data, isLoading } = useFeed({ limit: 3 })
  const posts: FeedPost[] = safeArray<FeedPost>(data)

  return (
    <GlassCard variant="base">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-kalkvit">Recent Posts</h2>
        <Link to="/feed" className="text-sm text-koppar hover:text-koppar/80 transition-colors flex items-center gap-1">
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-32 h-3.5" />
                <Skeleton className="w-full h-3" />
                <Skeleton className="w-3/4 h-3" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-kalkvit/50 text-sm mb-3">No posts yet</p>
          <Link to="/feed">
            <GlassButton variant="secondary" className="px-4 py-2 text-xs">Go to Feed</GlassButton>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const authorName = post.author?.display_name || 'Member'
            return (
              <Link key={post.id} to="/feed" className="flex gap-3 group">
                <GlassAvatar
                  src={post.author?.avatar_url ?? undefined}
                  initials={getInitials(authorName)}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-kalkvit">{authorName}</span>
                    <span className="text-xs text-kalkvit/40">{formatTimeAgo(post.created_at)}</span>
                  </div>
                  <p className="text-sm text-kalkvit/70 line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-kalkvit/40">
                      <Heart className="w-3 h-3" /> {post.likes_count}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-kalkvit/40">
                      <MessageCircle className="w-3 h-3" /> {post.comments_count}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}

// ── UnreadMessages (sidebar) ─────────────────────────

function UnreadMessages() {
  const { data, isLoading } = useConversations({ limit: 4 })
  const conversations: Conversation[] = safeArray<Conversation>(data)

  return (
    <GlassCard variant="base">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-base font-semibold text-kalkvit flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-koppar" />
          Messages
        </h2>
        <Link to="/messages" className="text-sm text-koppar hover:text-koppar/80 transition-colors flex items-center gap-1">
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="w-24 h-3" />
                <Skeleton className="w-full h-2.5" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <p className="text-kalkvit/40 text-sm text-center py-4">No messages yet</p>
      ) : (
        <div className="space-y-3">
          {conversations.slice(0, 4).map((convo) => (
            <Link
              key={convo.id}
              to={`/messages?user=${convo.participant_id || convo.participant?.user_id || ''}`}
              className="flex items-center gap-3 group"
            >
              <GlassAvatar
                src={convo.participant?.avatar_url ?? undefined}
                initials={getInitials(convo.participant?.display_name || '?')}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-kalkvit truncate">
                    {convo.participant?.display_name || 'Member'}
                  </span>
                  {convo.unread_count > 0 && (
                    <GlassBadge variant="koppar" className="text-[10px] px-1.5 py-0">
                      {convo.unread_count}
                    </GlassBadge>
                  )}
                </div>
                <p className="text-xs text-kalkvit/50 truncate">
                  {(typeof convo.last_message === 'object' ? convo.last_message?.content : convo.last_message) || 'No messages'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </GlassCard>
  )
}

// ── UpcomingSection (sidebar) ────────────────────────

function UpcomingSection() {
  const { data: eventsData, isLoading: eventsLoading } = useMyEvents()
  const { data: sessionsData, isLoading: sessionsLoading } = useCoachingSessions({ limit: 5 })

  const isLoading = eventsLoading || sessionsLoading

  const events: ClaimnEvent[] = safeArray<ClaimnEvent>(eventsData)
  const sessions: CoachingSession[] = safeArray<CoachingSession>(sessionsData)

  type UpcomingItem = { kind: 'event' | 'session'; date: string; title: string; subtitle: string; avatarUrl?: string }

  const now = new Date()
  const upcoming: UpcomingItem[] = [
    ...events
      .filter((e) => new Date(e.scheduled_date) >= now)
      .map((e): UpcomingItem => ({
        kind: 'event',
        date: e.scheduled_date,
        title: e.title,
        subtitle: `${e.duration_minutes}min`,
        avatarUrl: e.facilitator?.avatar_url ?? undefined,
      })),
    ...sessions
      .filter((s) => s.status === 'scheduled' && new Date(s.scheduled_at) >= now)
      .map((s): UpcomingItem => ({
        kind: 'session',
        date: s.scheduled_at,
        title: s.title || 'Coaching Session',
        subtitle: s.expert?.name || 'Expert',
        avatarUrl: s.expert?.avatar_url ?? undefined,
      })),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)

  return (
    <GlassCard variant="base">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-base font-semibold text-kalkvit flex items-center gap-2">
          <Calendar className="w-4 h-4 text-koppar" />
          Upcoming
        </h2>
        <Link to="/events" className="text-sm text-koppar hover:text-koppar/80 transition-colors flex items-center gap-1">
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="w-28 h-3" />
                <Skeleton className="w-20 h-2.5" />
              </div>
            </div>
          ))}
        </div>
      ) : upcoming.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-kalkvit/40 text-sm mb-3">Nothing scheduled</p>
          <Link to="/book-session">
            <GlassButton variant="secondary" className="px-4 py-2 text-xs">Book a Session</GlassButton>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((item) => (
            <Link
              key={`${item.kind}-${item.date}-${item.title}`}
              to={item.kind === 'event' ? '/events' : '/coaching/sessions'}
              className="flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-koppar/10 flex items-center justify-center shrink-0">
                {item.kind === 'event' ? (
                  <Calendar className="w-4 h-4 text-koppar" />
                ) : (
                  <CircleDot className="w-4 h-4 text-koppar" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-kalkvit truncate block">
                  {item.title}
                </span>
                <span className="text-xs text-kalkvit/50">
                  {formatEventDate(item.date)} · {item.subtitle}
                </span>
              </div>
              {item.avatarUrl && (
                <GlassAvatar src={item.avatarUrl} size="sm" initials="?" />
              )}
            </Link>
          ))}
        </div>
      )}
    </GlassCard>
  )
}

// ── MyPrograms (sidebar) ─────────────────────────────

function MyPrograms() {
  const { data, isLoading } = useEnrolledPrograms({ limit: 3 })
  const programs: UserProgram[] = safeArray<UserProgram>(data)

  return (
    <GlassCard variant="base">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-base font-semibold text-kalkvit flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-koppar" />
          My Programs
        </h2>
        <Link to="/programs" className="text-sm text-koppar hover:text-koppar/80 transition-colors flex items-center gap-1">
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="w-32 h-3" />
              <Skeleton className="w-full h-2" />
            </div>
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-kalkvit/40 text-sm mb-3">No programs yet</p>
          <Link to="/programs">
            <GlassButton variant="secondary" className="px-4 py-2 text-xs">Browse Programs</GlassButton>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.slice(0, 3).map((up) => (
            <Link key={up.id} to="/programs" className="block group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-kalkvit truncate">
                  {up.program?.name || 'Program'}
                </span>
                <GlassBadge
                  variant={up.status === 'completed' ? 'success' : up.status === 'paused' ? 'default' : 'koppar'}
                  className="text-[10px]"
                >
                  {up.status}
                </GlassBadge>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-koppar to-koppar/70 transition-all"
                  style={{ width: `${Math.min(up.progress, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-kalkvit/40 mt-0.5 block">{up.progress}% complete</span>
            </Link>
          ))}
        </div>
      )}
    </GlassCard>
  )
}

// ── NextGoSession (full-width CTA) ───────────────────

function NextGoSession() {
  const { data, isLoading } = useEvents({ type: 'go_session', status: 'upcoming', limit: 1 })
  const { data: enrolledData } = useEnrolledPrograms({ limit: 10 })

  const sessions: ClaimnEvent[] = Array.isArray(data?.data) ? data.data : safeArray<ClaimnEvent>(data)
  const next = sessions[0]

  if (isLoading || !next) return null

  // Find GO program ID for linking
  const enrolled: UserProgram[] = safeArray<UserProgram>(enrolledData)
  const goEnrollment = enrolled.find(
    (ep) => ep.program?.slug === 'go-sessions-s1' || ep.program?.tier === 'go_sessions'
  )
  const goProgramLink = goEnrollment
    ? `/programs/${goEnrollment.program_id}`
    : `/events/${next.id}`

  const date = new Date(next.scheduled_date)
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const spotsLeft = next.spots_remaining ?? (next.capacity - next.registered_count)
  const hasEarlyBird = next.is_early_bird_active && next.early_bird_price_cents != null

  return (
    <Link to={goProgramLink} className="block">
      <div className="glass-accent rounded-2xl px-4 py-3 md:px-5 md:py-4 hover:border-koppar/40 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-koppar/20 flex items-center justify-center shrink-0">
            <Zap className="w-4.5 h-4.5 text-koppar" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <GlassBadge variant="koppar" className="text-[10px]">GO Session</GlassBadge>
              {hasEarlyBird && (
                <GlassBadge variant="success" className="text-[10px]">Early Bird</GlassBadge>
              )}
            </div>
            <h3 className="font-display text-sm font-bold text-kalkvit truncate">
              {next.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-kalkvit/60">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {dateStr}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeStr}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {spotsLeft > 0 ? `${spotsLeft} spots` : 'Full'}
              </span>
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-koppar/60 shrink-0" />
        </div>
      </div>
    </Link>
  )
}

// ── HubPage (main) ───────────────────────────────────

export function HubPage() {
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Welcome Banner — full width */}
        <PageErrorBoundary section="WelcomeBanner">
          <WelcomeBanner />
        </PageErrorBoundary>

        {/* Stats row — full width */}
        <PageErrorBoundary section="StatsRow">
          <StatsRow />
        </PageErrorBoundary>

        {/* 2-column grid: main (2/3) + sidebar (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            <PageErrorBoundary section="NextGoSession">
              <NextGoSession />
            </PageErrorBoundary>
            <PageErrorBoundary section="ExpertSpotlight">
              <ExpertSpotlight />
            </PageErrorBoundary>
            <PageErrorBoundary section="ActiveGoals">
              <ActiveGoals />
            </PageErrorBoundary>
            <PageErrorBoundary section="ActiveProtocols">
              <ActiveProtocolsList />
            </PageErrorBoundary>
            <PageErrorBoundary section="RecentFeedPosts">
              <RecentFeedPosts />
            </PageErrorBoundary>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <PageErrorBoundary section="UnreadMessages">
              <UnreadMessages />
            </PageErrorBoundary>
            <PageErrorBoundary section="UpcomingSection">
              <UpcomingSection />
            </PageErrorBoundary>
            <PageErrorBoundary section="MyPrograms">
              <MyPrograms />
            </PageErrorBoundary>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default HubPage
