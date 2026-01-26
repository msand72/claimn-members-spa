import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassStatsCard, GlassAvatar } from '../components/ui'
import { Heart, MessageCircle, Users, User, Newspaper, Calendar, ArrowRight } from 'lucide-react'

export function DashboardPage() {
  const { user } = useAuth()

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Welcome Card */}
        <GlassCard variant="elevated" className="mb-8">
          <div className="bg-gradient-to-br from-charcoal to-jordbrun rounded-2xl p-8">
            <div className="flex items-center gap-6">
              <GlassAvatar initials={initials} size="xl" className="w-24 h-24 text-4xl" />
              <div>
                <h1 className="font-display text-3xl font-bold text-kalkvit mb-1">
                  Welcome back, {displayName}
                </h1>
                <p className="font-serif text-lg italic text-kalkvit/80">
                  Brotherhood Member • Glass UI Dashboard
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GlassStatsCard
            icon={Heart}
            label="Total Posts"
            value="142"
            trend="+8"
            trendLabel="this week"
          />
          <GlassStatsCard
            icon={MessageCircle}
            label="Messages"
            value="23"
            trend="+3"
            trendLabel="unread"
          />
          <GlassStatsCard
            icon={Users}
            label="Connections"
            value="67"
            trend="+5"
            trendLabel="new"
          />
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard>
            <h3 className="font-display text-xl font-semibold text-kalkvit mb-4">
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <Link to="/feed">
                <GlassButton variant="primary">
                  <Newspaper className="w-4 h-4" />
                  Create Post
                </GlassButton>
              </Link>
              <Link to="/profile">
                <GlassButton variant="secondary">
                  <User className="w-4 h-4" />
                  View Profile
                </GlassButton>
              </Link>
              <Link to="/messages">
                <GlassButton variant="secondary">
                  <MessageCircle className="w-4 h-4" />
                  Messages
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
              <h3 className="font-display text-xl font-semibold text-kalkvit">
                Recent Activity
              </h3>
              <Link to="/feed" className="text-koppar text-sm hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { text: 'John liked your post', time: '2m ago' },
                { text: 'New connection request from Sarah', time: '1h ago' },
                { text: '30-Day Protocol completed', time: '2h ago' },
                { text: 'Expert session reminder tomorrow', time: '5h ago' },
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
