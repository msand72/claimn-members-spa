import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassStatsCard, GlassAvatar, GlassBadge } from '../components/ui'
import { useMemberProfile } from '../hooks/useProfile'
import { useDashboardStats } from '../lib/api'
import { PILLARS } from '../lib/constants'
import {
  Heart,
  MessageCircle,
  Users,
  User,
  Newspaper,
  Calendar,
  ArrowRight,
  Target,
  Flame,
  CheckSquare,
  Trophy,
  Clock,
  Compass,
} from 'lucide-react'

export function DashboardPage() {
  const { user } = useAuth()
  const { data: profile, isLoading: profileLoading, error: profileError } = useMemberProfile(user?.id)
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats()

  // Debug logging
  useEffect(() => {
    console.log('[DashboardPage] Component mounted')
    console.log('[DashboardPage] User:', user?.id, user?.email)
  }, [user])

  useEffect(() => {
    console.log('[DashboardPage] Profile state:', { loading: profileLoading, error: profileError, data: profile })
  }, [profile, profileLoading, profileError])

  useEffect(() => {
    console.log('[DashboardPage] Stats state:', { loading: statsLoading, error: statsError, data: stats })
  }, [stats, statsLoading, statsError])

  const displayName =
    profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Calculate days since joining
  const createdAt = user?.created_at ? new Date(user.created_at) : new Date()
  const daysSinceJoining = Math.floor(
    (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Get pillar focus info (use first pillar from array)
  const primaryPillarId = profile?.pillar_focus?.[0]
  const pillarFocus = primaryPillarId ? PILLARS[primaryPillarId] : null

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Welcome Card */}
        <GlassCard variant="elevated" className="mb-8">
          <div className="bg-gradient-to-br from-charcoal to-jordbrun rounded-2xl p-8">
            <div className="flex items-start gap-6">
              <GlassAvatar initials={initials} size="xl" className="w-24 h-24 text-4xl" />
              <div className="flex-1">
                <h1 className="font-display text-3xl font-bold text-kalkvit mb-1">
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
            value={statsLoading ? '...' : String(stats?.goals_active ?? 0)}
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
            <div className="space-y-3">
              <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.08]">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-koppar" />
                  <span className="text-kalkvit font-medium">Next Brotherhood Call</span>
                </div>
                <p className="text-kalkvit/60 text-sm ml-8">No upcoming calls scheduled</p>
              </div>
              <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.08]">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-5 h-5 text-koppar" />
                  <span className="text-kalkvit font-medium">Next Expert Session</span>
                </div>
                <p className="text-kalkvit/60 text-sm ml-8">No sessions scheduled</p>
              </div>
            </div>
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
            <div className="text-center py-8">
              <CheckSquare className="w-12 h-12 text-kalkvit/20 mx-auto mb-3" />
              <p className="text-kalkvit/50 text-sm">No action items yet</p>
              <p className="text-kalkvit/30 text-xs mt-1">
                Action items from sessions and goals will appear here
              </p>
            </div>
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
            <div className="space-y-3">
              {[
                { text: 'Welcome to CLAIM\'N Brotherhood!', time: 'Just now' },
                { text: 'Complete your profile to get started', time: 'Suggested' },
                { text: 'Explore protocols to begin your journey', time: 'Suggested' },
              ].map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-koppar rounded-full" />
                    <span className="text-kalkvit/80 text-sm">{activity.text}</span>
                  </div>
                  <span className="text-kalkvit/40 text-xs">{activity.time}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </MainLayout>
  )
}
