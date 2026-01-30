import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassStatsCard, GlassAvatar, GlassBadge } from '../components/ui'
import {
  useCurrentProfile,
  useDashboardStats,
  useActionItems,
  useCoachingSessions,
  useFeed,
} from '../lib/api/hooks'
import { PILLARS } from '../lib/constants'
import {
  Heart,
  MessageCircle,
  Users,
  Newspaper,
  Calendar,
  ArrowRight,
  Target,
  Flame,
  CheckSquare,
  Trophy,
  Clock,
  Compass,
  Loader2,
  AlertTriangle,
} from 'lucide-react'

export function DashboardPage() {
  const { user } = useAuth()
  const { data: profile, isLoading: profileLoading, isError: profileError } = useCurrentProfile()
  const { data: stats, isLoading: statsLoading, isError: statsError } = useDashboardStats()
  const { data: actionItemsData, isLoading: actionItemsLoading } = useActionItems({
    status: 'pending',
    limit: 5,
  })
  const { data: sessionsData, isLoading: sessionsLoading } = useCoachingSessions({
    status: 'scheduled',
    limit: 3,
  })
  const { data: feedData, isLoading: feedLoading } = useFeed({ limit: 3 })

  const actionItems = Array.isArray(actionItemsData?.data) ? actionItemsData.data : []
  const upcomingSessions = Array.isArray(sessionsData?.data) ? sessionsData.data : []
  const recentPosts = Array.isArray(feedData?.data) ? feedData.data : []

  const displayName =
    profile?.display_name || user?.display_name || user?.email?.split('@')[0] || 'Member'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Calculate days since joining
  const createdAt = (user as Record<string, unknown>)?.created_at ? new Date((user as Record<string, unknown>).created_at as string) : new Date()
  const daysSinceJoining = Math.floor(
    (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Get pillar focus info (use first pillar from array)
  const primaryPillarId = profile?.pillar_focus?.[0] as keyof typeof PILLARS | undefined
  const pillarFocus = primaryPillarId && primaryPillarId in PILLARS ? PILLARS[primaryPillarId] : null

  const isInitialLoading = profileLoading && statsLoading

  if (isInitialLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-koppar" />
        </div>
      </MainLayout>
    )
  }

  if (profileError && statsError) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <AlertTriangle className="w-8 h-8 text-tegelrod" />
          <p className="text-kalkvit/70">Failed to load dashboard data.</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Welcome Card */}
        <GlassCard variant="elevated" className="mb-8">
          <div className="bg-gradient-to-br from-charcoal to-jordbrun rounded-2xl p-4 md:p-8">
            <div className="flex items-start gap-4 md:gap-6">
              <GlassAvatar initials={initials} size="xl" className="w-16 h-16 md:w-24 md:h-24 text-2xl md:text-4xl hidden sm:flex" />
              <div className="flex-1">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-kalkvit mb-1">
                  Welcome back, {displayName}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {profile?.archetype && (
                    <GlassBadge variant="koppar">{profile.archetype}</GlassBadge>
                  )}
                  <span className="text-kalkvit/60 text-sm">Brotherhood Member</span>
                  <span className="text-kalkvit/40">•</span>
                  <span className="text-kalkvit/60 text-sm flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Day {daysSinceJoining} of your journey
                  </span>
                </div>
                {pillarFocus && (
                  <div className="mt-3 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-koppar" />
                    <span className="text-kalkvit/70 text-sm">
                      Focus: <span className="text-koppar">{pillarFocus.name}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Stats Grid - Core metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <GlassStatsCard
            icon={Target}
            label="Active Goals"
            value={statsLoading ? '...' : String(stats?.goals_active ?? 0)}
            trend={stats?.goals_completed ? `+${stats.goals_completed}` : '--'}
            trendLabel="completed"
          />
          <GlassStatsCard
            icon={Flame}
            label="Current Streak"
            value={statsLoading ? '...' : String(stats?.current_streak ?? 0)}
            trend="--"
            trendLabel="days"
          />
          <GlassStatsCard
            icon={CheckSquare}
            label="Action Items"
            value={actionItemsLoading ? '...' : String(actionItemsData?.pagination?.total ?? actionItems.length)}
            trend="--"
            trendLabel="pending"
          />
          <GlassStatsCard
            icon={Trophy}
            label="Days Active"
            value={statsLoading ? '...' : String(stats?.days_since_joined ?? daysSinceJoining)}
            trend="--"
            trendLabel="journey"
          />
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GlassStatsCard
            icon={Heart}
            label="Total Posts"
            value={statsLoading ? '...' : String(stats?.posts_count ?? 0)}
            trend="--"
            trendLabel="shared"
          />
          <GlassStatsCard
            icon={MessageCircle}
            label="Messages"
            value={statsLoading ? '...' : String(stats?.unread_messages ?? 0)}
            trend={stats?.unread_messages ? `${stats.unread_messages}` : '--'}
            trendLabel="unread"
          />
          <GlassStatsCard
            icon={Users}
            label="Connections"
            value={statsLoading ? '...' : String(stats?.connections_count ?? 0)}
            trend="--"
            trendLabel="network"
          />
        </div>

        {/* Quick Actions & Upcoming */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <GlassCard>
            <h3 className="font-display text-xl font-semibold text-kalkvit mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link to="/goals">
                <GlassButton variant="primary">
                  <Target className="w-4 h-4" />
                  Set Goals
                </GlassButton>
              </Link>
              <Link to="/protocols">
                <GlassButton variant="secondary">
                  <Flame className="w-4 h-4" />
                  Protocols
                </GlassButton>
              </Link>
              <Link to="/feed">
                <GlassButton variant="secondary">
                  <Newspaper className="w-4 h-4" />
                  Feed
                </GlassButton>
              </Link>
              <Link to="/book-session">
                <GlassButton variant="secondary">
                  <Calendar className="w-4 h-4" />
                  Book Session
                </GlassButton>
              </Link>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-semibold text-kalkvit">Upcoming</h3>
              <Link
                to="/expert-sessions"
                className="text-koppar text-sm hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {sessionsLoading ? (
              <div className="text-center py-8">
                <p className="text-kalkvit/50 text-sm">Loading sessions...</p>
              </div>
            ) : upcomingSessions.length === 0 ? (
              <div className="space-y-3">
                <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.08]">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-koppar" />
                    <span className="text-kalkvit font-medium">No Upcoming Sessions</span>
                  </div>
                  <p className="text-kalkvit/50 text-sm ml-8">
                    Book a coaching session to get started
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <Link
                    key={session.id}
                    to="/expert-sessions"
                    className="block p-4 bg-white/[0.03] rounded-xl border border-white/[0.08] hover:border-koppar/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-koppar" />
                      <span className="text-kalkvit font-medium">{session.title}</span>
                    </div>
                    <p className="text-kalkvit/60 text-sm ml-8">
                      {new Date(session.scheduled_at).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' '}&middot; {session.duration} min
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Recent Activity & Action Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-semibold text-kalkvit">Action Items</h3>
              <Link
                to="/action-items"
                className="text-koppar text-sm hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {actionItemsLoading ? (
              <div className="text-center py-8">
                <p className="text-kalkvit/50 text-sm">Loading action items...</p>
              </div>
            ) : actionItems.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="w-12 h-12 text-kalkvit/20 mx-auto mb-3" />
                <p className="text-kalkvit/50 text-sm">No action items yet</p>
                <p className="text-kalkvit/30 text-xs mt-1">
                  Action items from sessions and goals will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {actionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          item.priority === 'high'
                            ? 'bg-tegelrod'
                            : item.priority === 'medium'
                              ? 'bg-koppar'
                              : 'bg-kalkvit/40'
                        }`}
                      />
                      <span className="text-kalkvit/80 text-sm">{item.title}</span>
                    </div>
                    {item.due_date && (
                      <span className="text-kalkvit/40 text-xs">
                        {new Date(item.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-semibold text-kalkvit">Recent Activity</h3>
              <Link
                to="/feed"
                className="text-koppar text-sm hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {feedLoading ? (
              <div className="text-center py-8">
                <p className="text-kalkvit/50 text-sm">Loading activity...</p>
              </div>
            ) : recentPosts.length === 0 ? (
              <div className="text-center py-8">
                <Newspaper className="w-12 h-12 text-kalkvit/20 mx-auto mb-3" />
                <p className="text-kalkvit/50 text-sm">No recent activity</p>
                <p className="text-kalkvit/30 text-xs mt-1">
                  Posts and updates from the community will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-koppar rounded-full" />
                      <span className="text-kalkvit/80 text-sm line-clamp-1">
                        {post.author?.display_name ?? 'Member'}: {post.content}
                      </span>
                    </div>
                    <span className="text-kalkvit/40 text-xs whitespace-nowrap ml-2">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </MainLayout>
  )
}

export default DashboardPage;
