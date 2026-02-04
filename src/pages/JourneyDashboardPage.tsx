import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassStatsCard, GlassAvatar, GlassBadge } from '../components/ui'
import {
  useCurrentProfile,
  useDashboardStats,
  useGoals,
  useKPIs,
  useActiveProtocols,
  useEnrolledPrograms,
  useFeed,
  useLatestAssessmentResult,
} from '../lib/api/hooks'
import { PILLARS } from '../lib/constants'
import type { Goal, KPI } from '../lib/api/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts'
import {
  Target,
  Flame,
  Trophy,
  Clock,
  Compass,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Users,
  MessageCircle,
  Newspaper,
  Calendar,
  BookOpen,
  BarChart3,
  TrendingUp,
} from 'lucide-react'

export function JourneyDashboardPage() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const { user } = useAuth()
  const { data: profile, isLoading: profileLoading, isError: profileError } = useCurrentProfile()
  const { data: stats, isLoading: statsLoading, isError: statsError } = useDashboardStats()
  const { data: goalsData } = useGoals({ status: 'active', limit: 5 })
  const { data: kpisData } = useKPIs({ limit: 10 })
  const { data: protocolsData } = useActiveProtocols({ status: 'active' })
  const { data: enrolledData } = useEnrolledPrograms({ limit: 5 })
  const { data: feedData } = useFeed({ limit: 3 })
  const { data: assessmentResult } = useLatestAssessmentResult()

  const goals: Goal[] = Array.isArray(goalsData?.data) ? goalsData.data : []
  const kpis: KPI[] = Array.isArray(kpisData?.data) ? kpisData.data : []
  const protocols = Array.isArray(protocolsData) ? protocolsData : []
  const enrolledPrograms = Array.isArray(enrolledData?.data) ? enrolledData.data : []
  const recentPosts = Array.isArray(feedData?.data) ? feedData.data : []

  const displayName =
    profile?.display_name || user?.display_name || user?.email?.split('@')[0] || 'Member'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const createdAt = (user as Record<string, unknown>)?.created_at
    ? new Date((user as Record<string, unknown>).created_at as string)
    : new Date()
  const daysSinceJoining = Math.floor(
    (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  )

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

  // Build goal progress chart data
  // Compute progress from KPIs if the raw progress field is 0/null
  const goalChartData = goals.slice(0, 5).map((g) => {
    const title = g.title ?? 'Goal'
    let progress = g.progress ?? 0
    // If progress is 0 but goal has KPIs, derive progress from KPI completion
    if (progress === 0 && g.kpis && g.kpis.length > 0) {
      const kpiProgress = g.kpis.reduce((sum, k) => {
        const target = k.target_value || 1
        const pct = Math.min((k.current_value ?? 0) / target * 100, 100)
        return sum + pct
      }, 0)
      progress = Math.round(kpiProgress / g.kpis.length)
    }
    return {
      name: title.length > 12 ? title.slice(0, 12) + '...' : title,
      progress,
    }
  })
  const hasGoalProgress = goalChartData.some((g) => g.progress > 0)

  // Build KPI chart data (current vs target)
  const kpiChartData = kpis.slice(0, 6).map((k) => {
    const name = k.name ?? 'KPI'
    return {
      name: name.length > 10 ? name.slice(0, 10) + '...' : name,
      current: k.current_value ?? 0,
      target: k.target_value ?? 100,
    }
  })

  // Build pillar radar data from assessment pillar scores
  const pillarScores = assessmentResult?.pillar_scores as Record<string, { raw?: number; percentage?: number }> | undefined
  const radarData = Object.entries(PILLARS).map(([id, pillar]) => ({
    pillar: (pillar.name ?? '').split(' ')[0] || id,
    score: pillarScores?.[id]?.percentage ?? (pillarScores?.[id]?.raw ? Math.round((pillarScores[id].raw! / 7) * 100) : 0),
  }))
  const hasRadarData = radarData.some((d) => d.score > 0)

  // Theme-aware chart colors
  const tickColor = isLight ? '#1C1C1E' : '#F5F0E8'
  const gridColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
  const chartTooltipStyle = {
    backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(30, 30, 30, 0.95)',
    border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: isLight ? '#1C1C1E' : '#F5F0E8',
    fontSize: '12px',
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* ============================================= */}
        {/* 1. Welcome Hero */}
        {/* ============================================= */}
        <GlassCard variant="elevated" className="mb-8">
          <div className="bg-gradient-to-br from-charcoal to-jordbrun rounded-2xl p-4 md:p-8">
            <div className="flex items-start gap-4 md:gap-6">
              <GlassAvatar
                initials={initials}
                size="xl"
                className="w-16 h-16 md:w-24 md:h-24 text-2xl md:text-4xl hidden sm:flex"
              />
              <div className="flex-1">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-kalkvit mb-1">
                  Welcome back, {displayName}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {profile?.archetype && (
                    <GlassBadge variant="koppar">{profile.archetype}</GlassBadge>
                  )}
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

        {/* ============================================= */}
        {/* 2. Stats Overview */}
        {/* ============================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <GlassStatsCard
            icon={Target}
            label="Active Goals"
            value={statsLoading ? '...' : String(stats?.goals_active ?? goals.length)}
            trend={stats?.goals_completed ? `+${stats.goals_completed}` : undefined}
            trendLabel="completed"
          />
          <GlassStatsCard
            icon={Flame}
            label="Current Streak"
            value={statsLoading ? '...' : String(stats?.current_streak ?? 0)}
            trend={undefined}
            trendLabel="days"
          />
          <GlassStatsCard
            icon={BarChart3}
            label="Tracking"
            value={statsLoading ? '...' : String(kpis.length)}
            trend={undefined}
            trendLabel="KPIs"
          />
          <GlassStatsCard
            icon={Trophy}
            label="Days Active"
            value={statsLoading ? '...' : String(stats?.days_since_joined ?? daysSinceJoining)}
            trend={undefined}
            trendLabel="journey"
          />
        </div>

        {/* ============================================= */}
        {/* 3. Stats Dashboard — Goals & KPIs Graphs */}
        {/* ============================================= */}
        {(goalChartData.length > 0 || kpiChartData.length > 0 || hasRadarData) && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold text-kalkvit flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-koppar" />
                Stats Dashboard
              </h2>
              <Link
                to="/kpis"
                className="text-koppar text-sm hover:underline flex items-center gap-1"
              >
                All KPIs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Goal Progress Bar Chart */}
              {goalChartData.length > 0 && (
                <GlassCard className="col-span-1">
                  <h4 className="text-sm font-medium text-kalkvit/60 mb-3">Goal Progress</h4>
                  {hasGoalProgress ? (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart data={goalChartData} layout="vertical" margin={{ left: 0, right: 16 }}>
                          <XAxis type="number" domain={[0, 100]} tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="name" tick={{ fill: tickColor, fontSize: 11 }} width={80} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`${v}%`, 'Progress']} />
                          <Bar dataKey="progress" fill="#B87333" radius={[0, 4, 4, 0]} barSize={16} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center">
                      <Target className="w-8 h-8 text-kalkvit/15 mb-2" />
                      <p className="text-kalkvit/40 text-xs text-center">
                        {goals.length} goal{goals.length !== 1 ? 's' : ''} created
                      </p>
                      <p className="text-kalkvit/25 text-xs text-center mt-0.5">
                        Log KPIs to see progress
                      </p>
                    </div>
                  )}
                </GlassCard>
              )}

              {/* KPI Current vs Target */}
              {kpiChartData.length > 0 && (
                <GlassCard className="col-span-1">
                  <h4 className="text-sm font-medium text-kalkvit/60 mb-3">KPI Tracking</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={kpiChartData} margin={{ left: 0, right: 8 }}>
                        <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Bar dataKey="current" fill="#B87333" radius={[4, 4, 0, 0]} barSize={12} name="Current" />
                        <Bar dataKey="target" fill={isLight ? 'rgba(184, 115, 51, 0.2)' : 'rgba(184, 115, 51, 0.25)'} radius={[4, 4, 0, 0]} barSize={12} name="Target" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              )}

              {/* Pillar Scores Radar */}
              <GlassCard className="col-span-1">
                <h4 className="text-sm font-medium text-kalkvit/60 mb-3">Pillar Scores</h4>
                {hasRadarData ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                        <PolarGrid stroke={gridColor} />
                        <PolarAngleAxis dataKey="pillar" tick={{ fill: tickColor, fontSize: 10 }} />
                        <Radar
                          dataKey="score"
                          stroke="#B87333"
                          fill="#B87333"
                          fillOpacity={0.25}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center">
                    <Compass className="w-8 h-8 text-kalkvit/15 mb-2" />
                    <p className="text-kalkvit/40 text-xs text-center">
                      No pillar scores yet
                    </p>
                    <p className="text-kalkvit/25 text-xs text-center mt-0.5">
                      Complete the assessment to see your pillar profile
                    </p>
                  </div>
                )}
              </GlassCard>
            </div>
          </div>
        )}

        {/* ============================================= */}
        {/* 4. My Plan — Goals + Action Summary */}
        {/* ============================================= */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-kalkvit flex items-center gap-2">
              <Target className="w-5 h-5 text-koppar" />
              My Plan
            </h2>
            <Link
              to="/goals"
              className="text-koppar text-sm hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {goals.length === 0 ? (
            <GlassCard>
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-kalkvit/20 mx-auto mb-3" />
                <p className="text-kalkvit/50 text-sm">No active goals yet</p>
                <p className="text-kalkvit/30 text-xs mt-1 mb-4">
                  Set goals to start tracking your transformation
                </p>
                <Link to="/goals">
                  <GlassButton variant="primary">
                    <Target className="w-4 h-4" />
                    Set Goals
                  </GlassButton>
                </Link>
              </div>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => {
                const pillar =
                  goal.pillar_id && goal.pillar_id in PILLARS
                    ? PILLARS[goal.pillar_id as keyof typeof PILLARS]
                    : null
                return (
                  <Link key={goal.id} to={`/goals/${goal.id}`} className="block">
                    <GlassCard className="hover:border-koppar/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-kalkvit font-medium text-sm truncate">
                              {goal.title}
                            </span>
                            {pillar && (
                              <GlassBadge variant="default">
                                {pillar.name.split(' ')[0]}
                              </GlassBadge>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-koppar rounded-full transition-all"
                                style={{ width: `${goal.progress ?? 0}%` }}
                              />
                            </div>
                            <span className="text-koppar text-xs font-semibold whitespace-nowrap">
                              {goal.progress ?? 0}%
                            </span>
                          </div>
                          {goal.kpis && goal.kpis.length > 0 && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <BarChart3 className="w-3 h-3 text-kalkvit/40" />
                              <span className="text-kalkvit/40 text-xs">
                                {goal.kpis.length} KPI{goal.kpis.length !== 1 ? 's' : ''} tracked
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* ============================================= */}
        {/* 5. Active Protocols */}
        {/* ============================================= */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-kalkvit flex items-center gap-2">
              <Flame className="w-5 h-5 text-koppar" />
              Active Protocols
            </h2>
            <Link
              to="/protocols"
              className="text-koppar text-sm hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {protocols.length === 0 ? (
            <GlassCard>
              <div className="text-center py-6">
                <Flame className="w-12 h-12 text-kalkvit/20 mx-auto mb-3" />
                <p className="text-kalkvit/50 text-sm">No active protocols</p>
                <p className="text-kalkvit/30 text-xs mt-1 mb-4">
                  Start a protocol to build daily habits
                </p>
                <Link to="/protocols">
                  <GlassButton variant="secondary">
                    <Flame className="w-4 h-4" />
                    Browse Protocols
                  </GlassButton>
                </Link>
              </div>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {protocols.map((p) => (
                <Link key={p.id} to={`/protocols/${p.protocol_slug}`}>
                  <GlassCard className="hover:border-koppar/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-kalkvit font-medium text-sm">{p.protocol_name}</span>
                      <GlassBadge variant={p.status === 'active' ? 'koppar' : 'default'}>
                        {p.status}
                      </GlassBadge>
                    </div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-koppar rounded-full transition-all"
                          style={{ width: `${p.progress_percentage ?? 0}%` }}
                        />
                      </div>
                      <span className="text-koppar text-xs font-semibold">
                        {p.progress_percentage ?? 0}%
                      </span>
                    </div>
                    <p className="text-kalkvit/40 text-xs">
                      Week {p.current_week} &middot; Started{' '}
                      {new Date(p.started_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </GlassCard>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ============================================= */}
        {/* 6. Programs + Community (two-column) */}
        {/* ============================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Enrolled Programs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold text-kalkvit flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-koppar" />
                Programs
              </h2>
              <Link
                to="/programs"
                className="text-koppar text-sm hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {enrolledPrograms.length === 0 ? (
              <GlassCard>
                <div className="text-center py-6">
                  <BookOpen className="w-12 h-12 text-kalkvit/20 mx-auto mb-3" />
                  <p className="text-kalkvit/50 text-sm">No enrolled programs</p>
                  <p className="text-kalkvit/30 text-xs mt-1 mb-4">
                    Explore structured learning paths
                  </p>
                  <Link to="/programs">
                    <GlassButton variant="secondary">
                      <BookOpen className="w-4 h-4" />
                      Browse Programs
                    </GlassButton>
                  </Link>
                </div>
              </GlassCard>
            ) : (
              <div className="space-y-3">
                {enrolledPrograms.map((ep) => (
                  <GlassCard key={ep.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-kalkvit font-medium text-sm truncate">
                        {ep.program?.name ?? 'Program'}
                      </span>
                      <GlassBadge variant={ep.status === 'enrolled' ? 'koppar' : 'default'}>
                        {ep.status}
                      </GlassBadge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-koppar rounded-full transition-all"
                          style={{ width: `${ep.progress ?? 0}%` }}
                        />
                      </div>
                      <span className="text-koppar text-xs font-semibold">
                        {ep.progress ?? 0}%
                      </span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>

          {/* Community Overview */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold text-kalkvit flex items-center gap-2">
                <Users className="w-5 h-5 text-koppar" />
                Community
              </h2>
              <Link
                to="/feed"
                className="text-koppar text-sm hover:underline flex items-center gap-1"
              >
                View feed <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Community stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <GlassCard className="text-center py-3">
                <Users className="w-5 h-5 text-koppar mx-auto mb-1" />
                <div className="font-display text-xl font-bold text-kalkvit">
                  {statsLoading ? '...' : (stats?.connections_count ?? 0)}
                </div>
                <div className="text-kalkvit/50 text-xs">Connections</div>
              </GlassCard>
              <GlassCard className="text-center py-3">
                <Newspaper className="w-5 h-5 text-koppar mx-auto mb-1" />
                <div className="font-display text-xl font-bold text-kalkvit">
                  {statsLoading ? '...' : (stats?.posts_count ?? 0)}
                </div>
                <div className="text-kalkvit/50 text-xs">Posts</div>
              </GlassCard>
              <GlassCard className="text-center py-3">
                <MessageCircle className="w-5 h-5 text-koppar mx-auto mb-1" />
                <div className="font-display text-xl font-bold text-kalkvit">
                  {statsLoading ? '...' : (stats?.unread_messages ?? 0)}
                </div>
                <div className="text-kalkvit/50 text-xs">Unread</div>
              </GlassCard>
            </div>

            {/* Recent activity */}
            {recentPosts.length > 0 ? (
              <GlassCard>
                <h4 className="text-sm font-medium text-kalkvit/60 mb-3">Recent Activity</h4>
                <div className="space-y-2">
                  {recentPosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center gap-3 p-2 bg-white/[0.02] rounded-lg"
                    >
                      <div className="w-2 h-2 bg-koppar rounded-full flex-shrink-0" />
                      <span className="text-kalkvit/70 text-xs line-clamp-1 flex-1">
                        <span className="text-kalkvit/90 font-medium">
                          {post.author?.display_name ?? 'Member'}
                        </span>
                        : {post.content}
                      </span>
                      <span className="text-kalkvit/30 text-xs whitespace-nowrap">
                        {new Date(post.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            ) : (
              <GlassCard>
                <div className="text-center py-4">
                  <Newspaper className="w-8 h-8 text-kalkvit/20 mx-auto mb-2" />
                  <p className="text-kalkvit/50 text-xs">No recent activity</p>
                </div>
              </GlassCard>
            )}
          </div>
        </div>

        {/* ============================================= */}
        {/* 7. Quick Actions */}
        {/* ============================================= */}
        <GlassCard className="mb-8">
          <h3 className="font-display text-lg font-semibold text-kalkvit mb-4">Quick Actions</h3>
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
            <Link to="/programs">
              <GlassButton variant="secondary">
                <BookOpen className="w-4 h-4" />
                Programs
              </GlassButton>
            </Link>
          </div>
        </GlassCard>
      </div>
    </MainLayout>
  )
}

export default JourneyDashboardPage
