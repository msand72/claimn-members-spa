import { useAuth } from '../contexts/AuthContext'
import {
  GlassCard,
  GlassButton,
  GlassStatsCard,
  BackgroundPattern,
} from '../components/ui'
import { Heart, MessageCircle, Users, LogOut, Settings, User } from 'lucide-react'

export function DashboardPage() {
  const { user, signOut } = useAuth()

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Member'

  return (
    <div className="min-h-screen bg-glass-dark text-kalkvit">
      <BackgroundPattern />

      {/* Header */}
      <header className="sticky top-0 z-50 glass-base border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-display text-2xl font-bold">CLAIM'N</div>
          <div className="flex items-center gap-4">
            <GlassButton variant="ghost" icon={Settings}>
              Settings
            </GlassButton>
            <GlassButton variant="secondary" icon={LogOut} onClick={signOut}>
              Sign Out
            </GlassButton>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Card */}
        <GlassCard variant="elevated" className="mb-8">
          <div className="bg-gradient-to-br from-charcoal to-jordbrun rounded-2xl p-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-koppar flex items-center justify-center text-4xl font-bold text-kalkvit">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold mb-1">
                  Welcome back, {firstName}
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard>
            <h3 className="font-display text-xl font-semibold mb-4">
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <GlassButton variant="primary">Create Post</GlassButton>
              <GlassButton variant="secondary" icon={User}>
                View Profile
              </GlassButton>
              <GlassButton variant="secondary" icon={MessageCircle}>
                Messages
              </GlassButton>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="font-display text-xl font-semibold mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {['John liked your post', 'New connection request', 'Protocol completed'].map(
                (activity, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl"
                  >
                    <div className="w-2 h-2 bg-koppar rounded-full" />
                    <span className="text-kalkvit/80">{activity}</span>
                  </div>
                )
              )}
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  )
}
