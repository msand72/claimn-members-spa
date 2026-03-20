import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { PageErrorBoundary } from '../components/PageErrorBoundary'
import {
  GlassCard,
  GlassAvatar,
  GlassBadge,
  GlassButton,
  GlassStatsCard,
  GlassModal,
  GlassTextarea,
} from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import {
  useCurrentProfile,
  useExperts,
  useFeed,
  useConversations,
  useMyEvents,
  useCoachingSessions,
  useEnrolledPrograms,
  usePrograms,
  useDashboardStats,
  useGoals,
  useMyActiveProtocols,
  useFeaturedProtocols,
  useMyExpert,
  useCoachRequest,
  useSubmitCoachRequest,
  safeArray,
  type FeedPost,
  type Expert,
  type Conversation,
  type CoachingSession,
  type UserProgram,
  type Program,
  type Goal,
  type ActiveProtocol,
  type ProtocolTemplate,
} from '../lib/api'
import type { ClaimnEvent } from '../lib/api/hooks/useEvents'
import { PILLARS } from '../lib/constants'
import type { PillarId } from '../lib/constants'
import { HubHeroArt } from '../components/ui/HubHeroArt'
import { GoalTargetVisual, StreakBarsVisual, DunbarClusterVisual, CalendarHeatmapVisual } from '../components/ui/StatCardVisuals'
import { PillarIcon } from '../components/icons'
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  StopIcon,
  ArrowRightIcon,
  SparklesIcon,
  AcademicCapIcon,
  ViewfinderCircleIcon,
  FireIcon,
  ChartBarIcon,
  TrophyIcon,
  StarIcon,
  VideoCameraIcon,
  UserCircleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline'

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
      <HubHeroArt className="absolute right-0 top-0 bottom-0 opacity-70 text-kalkvit pointer-events-none hidden sm:block" />
      <div className="relative flex items-center gap-4 sm:gap-6">
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
        label="Active Goals"
        value={isLoading ? '...' : String(stats?.goals_active ?? goalsCount)}
        visual={<GoalTargetVisual className="w-full text-kalkvit" />}
      />
      <GlassStatsCard
        label="Streak"
        value={isLoading ? '...' : String(stats?.current_streak ?? 0)}
        trendLabel="days"
        visual={<StreakBarsVisual className="w-full text-kalkvit" />}
      />
      <GlassStatsCard
        label="Connections"
        value={isLoading ? '...' : String(stats?.connections_count ?? 0)}
        trendLabel="network"
        visual={<DunbarClusterVisual className="w-full text-kalkvit" />}
      />
      <GlassStatsCard
        label="Days Active"
        value={isLoading ? '...' : String(stats?.days_since_joined ?? 0)}
        trendLabel="journey"
        visual={<CalendarHeatmapVisual className="w-full text-kalkvit" />}
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
          <SparklesIcon className="w-5 h-5 text-koppar" />
          Expert Spotlight
        </h2>
        <Link to="/experts" className="text-sm text-koppar hover:text-koppar/80 transition-colors flex items-center gap-1">
          View all <ArrowRightIcon className="w-3.5 h-3.5" />
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
          <ViewfinderCircleIcon className="w-5 h-5 text-koppar" />
          Active Goals
        </h2>
        <Link to="/goals" className="text-sm text-koppar hover:text-koppar/80 transition-colors flex items-center gap-1">
          View all <ArrowRightIcon className="w-3.5 h-3.5" />
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
          <ViewfinderCircleIcon className="w-10 h-10 text-kalkvit/15 mx-auto mb-2" />
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
  const { data, isLoading } = useMyActiveProtocols({ status: 'active' })
  const protocols: ActiveProtocol[] = safeArray<ActiveProtocol>(data)

  if (!isLoading && protocols.length === 0) return null

  return (
    <GlassCard variant="base">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-kalkvit flex items-center gap-2">
          <FireIcon className="w-5 h-5 text-koppar" />
          Active Protocols
        </h2>
        <Link to="/protocols" className="text-sm text-koppar hover:text-koppar/80 transition-colors flex items-center gap-1">
          View all <ArrowRightIcon className="w-3.5 h-3.5" />
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

// ── FeaturedProtocols ────────────────────────────────

function FeaturedProtocols() {
  const { data, isLoading } = useFeaturedProtocols(4)
  const protocols: ProtocolTemplate[] = data ?? []

  if (!isLoading && protocols.length === 0) return null

  return (
    <GlassCard variant="base">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-kalkvit flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-koppar" />
          Featured Protocols
        </h2>
        <Link to="/protocols" className="text-sm text-koppar hover:text-koppar/80 transition-colors flex items-center gap-1">
          Browse all <ArrowRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2 p-3 rounded-xl bg-white/[0.03]">
              <Skeleton className="w-24 h-3" />
              <Skeleton className="w-full h-3.5" />
              <Skeleton className="w-3/4 h-3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {protocols.map((p) => {
            const pillarId = (p.pillar || 'identity') as PillarId
            const pillar = PILLARS[pillarId]
            return (
              <Link
                key={p.slug}
                to={`/protocols/${p.slug}`}
                className="group p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors relative overflow-hidden"
              >
                <PillarIcon pillar={pillarId} size={80} className="absolute top-2 right-2 opacity-[0.10] rotate-12 pointer-events-none" />
                <div className="flex items-center gap-2 mb-1">
                  <GlassBadge variant="koppar" className="text-[10px]">
                    {pillar?.name || p.pillar}
                  </GlassBadge>
                </div>
                <h4 className="text-sm font-medium text-kalkvit group-hover:text-koppar transition-colors line-clamp-1">
                  {p.name || p.title}
                </h4>
                {p.headline_stat && (
                  <p className="text-xs text-koppar/80 mt-0.5">{p.headline_stat}</p>
                )}
                <p className="text-xs text-kalkvit/50 mt-1 line-clamp-2">{p.description}</p>
              </Link>
            )
          })}
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
          View all <ArrowRightIcon className="w-3.5 h-3.5" />
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
                      <HeartIcon className="w-3 h-3" /> {post.likes_count}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-kalkvit/40">
                      <ChatBubbleLeftIcon className="w-3 h-3" /> {post.comments_count}
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
          <ChatBubbleLeftIcon className="w-4 h-4 text-koppar" />
          Messages
        </h2>
        <Link to="/messages" className="text-sm text-koppar hover:text-koppar/80 transition-colors flex items-center gap-1">
          View all <ArrowRightIcon className="w-3.5 h-3.5" />
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
          <CalendarIcon className="w-4 h-4 text-koppar" />
          Upcoming
        </h2>
        <Link to="/events" className="text-sm text-koppar hover:text-koppar/80 transition-colors flex items-center gap-1">
          View all <ArrowRightIcon className="w-3.5 h-3.5" />
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
                  <CalendarIcon className="w-4 h-4 text-koppar" />
                ) : (
                  <StopIcon className="w-4 h-4 text-koppar" />
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
          <AcademicCapIcon className="w-4 h-4 text-koppar" />
          My Programs
        </h2>
        <Link to="/programs" className="text-sm text-koppar hover:text-koppar/80 transition-colors flex items-center gap-1">
          View all <ArrowRightIcon className="w-3.5 h-3.5" />
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

// ── ActivePrograms (enrolled programs list) ──────────

function ActivePrograms() {
  const { data, isLoading } = useEnrolledPrograms({ limit: 10 })
  const { data: programsData } = usePrograms({ limit: 50 })
  const enrollments: UserProgram[] = safeArray<UserProgram>(data)
  const active = enrollments.filter((up) => up.status === 'enrolled' || up.status === 'active')

  // Build lookup map: program_id → Program
  const programMap = useMemo(() => {
    const map = new Map<string, Program>()
    const list = (programsData as { data?: Program[] })?.data ?? []
    for (const p of list) map.set(p.id, p)
    return map
  }, [programsData])

  if (isLoading) {
    return (
      <GlassCard variant="base">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-semibold text-kalkvit flex items-center gap-2">
            <AcademicCapIcon className="w-4 h-4 text-koppar" />
            Active Programs
          </h2>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="w-20 h-3" />
                <Skeleton className="w-40 h-3.5" />
                <Skeleton className="w-full h-1.5" />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    )
  }

  if (active.length === 0) return null

  return (
    <GlassCard variant="base">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-base font-semibold text-kalkvit flex items-center gap-2">
          <AcademicCapIcon className="w-4 h-4 text-koppar" />
          Active Programs
        </h2>
        <Link to="/programs" className="text-sm text-koppar hover:text-koppar/80 transition-colors flex items-center gap-1">
          View all <ArrowRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="space-y-3">
        {active.map((up) => {
          const prog = programMap.get(up.program_id)
          return (
          <Link key={up.id} to={`/programs/${up.program_id}`} className="block group">
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.04] transition-colors">
              <div className="w-9 h-9 rounded-lg bg-koppar/20 flex items-center justify-center shrink-0">
                <AcademicCapIcon className="w-4.5 h-4.5 text-koppar" />
              </div>

              <div className="flex-1 min-w-0">
                {prog?.category && (
                  <div className="flex items-center gap-2 mb-0.5">
                    <GlassBadge variant="koppar" className="text-[10px]">
                      {prog.category}
                    </GlassBadge>
                  </div>
                )}
                <h3 className="font-display text-sm font-bold text-kalkvit truncate">
                  {prog?.title || up.program?.title || up.program?.name || 'Program'}
                </h3>
                <div className="mt-1.5">
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-koppar to-koppar/70 transition-all"
                      style={{ width: `${Math.min(up.progress, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-kalkvit/40 mt-0.5 block">
                    {up.progress}% complete
                  </span>
                </div>
              </div>

              <ArrowRightIcon className="w-4 h-4 text-koppar/60 shrink-0" />
            </div>
          </Link>
          )
        })}
      </div>
    </GlassCard>
  )
}

// ── MyCoachCard ─────────────────────────────────────

function MyCoachCard() {
  const { data, isLoading } = useMyExpert()
  const { data: coachRequest } = useCoachRequest()
  const submitRequest = useSubmitCoachRequest()
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestGoals, setRequestGoals] = useState('')
  const [requestNotes, setRequestNotes] = useState('')
  const expert = data?.expert

  const handleSubmitRequest = () => {
    if (!requestGoals.trim()) return
    submitRequest.mutate(
      {
        preferred_specialties: [],
        goals: requestGoals.split('\n').map((g) => g.trim()).filter(Boolean),
        availability_preferences: '',
        notes: requestNotes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setShowRequestModal(false)
          setRequestGoals('')
          setRequestNotes('')
        },
      },
    )
  }

  if (isLoading) {
    return (
      <GlassCard variant="accent">
        <div className="flex items-center gap-4 animate-pulse">
          <Skeleton className="w-14 h-14 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-20 h-3" />
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-24 h-3" />
          </div>
        </div>
      </GlassCard>
    )
  }

  if (!expert) {
    // Pending request state
    if (coachRequest?.status === 'pending') {
      return (
        <GlassCard variant="base">
          <div className="text-center py-4">
            <ArrowPathIcon className="w-10 h-10 text-koppar mx-auto mb-2 animate-spin" />
            <p className="text-kalkvit text-sm font-medium mb-1">Finding your coach</p>
            <p className="text-kalkvit/50 text-xs">
              We&apos;re matching you with the perfect coach based on your goals.
            </p>
          </div>
        </GlassCard>
      )
    }

    return (
      <>
        <GlassCard variant="base">
          <div className="text-center py-4">
            <UserCircleIcon className="w-10 h-10 text-kalkvit/15 mx-auto mb-2" />
            <p className="text-kalkvit/50 text-sm mb-3">No coach assigned yet</p>
            <div className="flex flex-col gap-2">
              <GlassButton
                variant="primary"
                className="px-4 py-2 text-xs w-full"
                onClick={() => setShowRequestModal(true)}
              >
                <PaperAirplaneIcon className="w-3.5 h-3.5" />
                Request a Coach
              </GlassButton>
              <Link to="/experts">
                <GlassButton variant="secondary" className="px-4 py-2 text-xs w-full">
                  Browse Experts
                </GlassButton>
              </Link>
            </div>
          </div>
        </GlassCard>

        <GlassModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          title="Request a Coach"
          description="Tell us about your goals and we'll match you with the right coach."
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-kalkvit mb-1">
                What are your goals?
              </label>
              <GlassTextarea
                value={requestGoals}
                onChange={(e) => setRequestGoals(e.target.value)}
                placeholder="Enter each goal on a new line, e.g.:&#10;Improve leadership skills&#10;Better work-life balance&#10;Career transition"
                rows={4}
              />
              <p className="text-xs text-kalkvit/40 mt-1">One goal per line</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-kalkvit mb-1">
                Anything else we should know? <span className="text-kalkvit/40">(optional)</span>
              </label>
              <GlassTextarea
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                placeholder="Preferred schedule, coaching style, specific challenges..."
                rows={3}
              />
            </div>

            {submitRequest.isError && (
              <p className="text-xs text-tegelrod text-center">
                {(submitRequest.error as any)?.error?.code === 'ALREADY_PENDING'
                  ? 'You already have a pending coach request.'
                  : (submitRequest.error as any)?.error?.message || 'Failed to submit request. Please try again.'}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <GlassButton
                variant="secondary"
                className="flex-1"
                onClick={() => setShowRequestModal(false)}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                className="flex-1"
                onClick={handleSubmitRequest}
                disabled={!requestGoals.trim() || submitRequest.isPending}
              >
                {submitRequest.isPending ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircleIcon className="w-4 h-4" />
                )}
                {submitRequest.isPending ? 'Submitting...' : 'Submit Request'}
              </GlassButton>
            </div>
          </div>
        </GlassModal>
      </>
    )
  }

  const nextSession = data?.next_session

  return (
    <GlassCard variant="accent" className="relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-base font-semibold text-kalkvit flex items-center gap-2">
          <StarIcon className="w-4 h-4 text-koppar" />
          My Coach
        </h2>
        <Link to={`/experts/${expert.id}`} className="text-xs text-koppar hover:text-koppar/80 transition-colors">
          View profile
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <GlassAvatar
          src={expert.avatar_url ?? undefined}
          initials={getInitials(expert.display_name)}
          size="lg"
          className="ring-2 ring-koppar/30"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base font-bold text-kalkvit truncate">
            {expert.display_name}
          </h3>
          {expert.specialty && (
            <p className="text-xs text-koppar truncate">{expert.specialty}</p>
          )}
          {(expert.rating != null && expert.rating > 0) && (
            <div className="flex items-center gap-1 mt-0.5">
              <StarIcon className="w-3 h-3 text-koppar fill-koppar" />
              <span className="text-xs text-kalkvit/60">
                {expert.rating.toFixed(1)}
                {expert.reviews_count ? ` (${expert.reviews_count})` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Next session */}
      {nextSession && (
        <Link
          to="/coaching/sessions"
          className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
        >
          <CalendarIcon className="w-4 h-4 text-koppar shrink-0" />
          <span className="text-xs text-kalkvit/70 truncate">
            Next session: {formatEventDate(nextSession.session_date)}
          </span>
        </Link>
      )}

      {/* Quick actions */}
      <div className="mt-3 flex gap-2">
        <Link to={`/messages?user=${expert.id}`} className="flex-1">
          <GlassButton variant="secondary" className="w-full text-xs py-2">
            <ChatBubbleLeftIcon className="w-3.5 h-3.5" />
            Message
          </GlassButton>
        </Link>
        <Link to={`/book-session?expert=${expert.id}`} className="flex-1">
          <GlassButton variant="primary" className="w-full text-xs py-2">
            <VideoCameraIcon className="w-3.5 h-3.5" />
            Book Session
          </GlassButton>
        </Link>
      </div>
    </GlassCard>
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
            <PageErrorBoundary section="ActivePrograms">
              <ActivePrograms />
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
            <PageErrorBoundary section="FeaturedProtocols">
              <FeaturedProtocols />
            </PageErrorBoundary>
            <PageErrorBoundary section="RecentFeedPosts">
              <RecentFeedPosts />
            </PageErrorBoundary>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <PageErrorBoundary section="MyCoach">
              <MyCoachCard />
            </PageErrorBoundary>
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
