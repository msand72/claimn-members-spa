import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import {
  GlassCard,
  GlassButton,
  GlassBadge,
  GlassModal,
  GlassModalFooter,
  GlassTextarea,
} from '../components/ui'
import { PILLARS } from '../lib/constants'
import type { PillarId } from '../lib/constants'
import { useAccountabilityGroup } from '../lib/api/hooks'
import type { AccountabilityMember as ApiAccountabilityMember } from '../lib/api/hooks'
import { useAuth } from '../contexts/AuthContext'
import {
  Users,
  User,
  MessageCircle,
  Calendar,
  Trophy,
  Target,
  CheckCircle2,
  Clock,
  Send,
  Flame,
  ArrowRight,
  Loader2,
  Info,
} from 'lucide-react'
import { cn } from '../lib/utils'

function MemberCard({ member, isCurrentUser }: { member: ApiAccountabilityMember; isCurrentUser: boolean }) {
  return (
    <GlassCard
      variant={isCurrentUser ? 'accent' : 'base'}
      className={cn('relative', isCurrentUser && 'border-koppar/30')}
    >
      {isCurrentUser && (
        <GlassBadge variant="koppar" className="absolute -top-2 -right-2 text-xs">
          You
        </GlassBadge>
      )}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-koppar/20 flex items-center justify-center text-koppar font-semibold">
          {member.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-kalkvit truncate">{member.name}</h3>
          <p className="text-sm text-kalkvit/50">{member.archetype}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {member.pillar_focus.map((pillarId: PillarId) => (
              <GlassBadge key={pillarId} variant="default" className="text-xs">
                {PILLARS[pillarId].name.split(' ')[0]}
              </GlassBadge>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-tegelrod">
            <Flame className="w-4 h-4" />
            <span className="font-semibold">{member.current_streak}</span>
          </div>
          <p className="text-xs text-kalkvit/50">Streak</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-skogsgron">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-semibold">{member.goals_completed}</span>
          </div>
          <p className="text-xs text-kalkvit/50">Goals</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-koppar">
            <Clock className="w-4 h-4" />
            <span className="font-semibold text-sm">
              {new Date(member.last_active).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <p className="text-xs text-kalkvit/50">Active</p>
        </div>
      </div>
    </GlassCard>
  )
}

export function AccountabilityPage() {
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [checkInMessage, setCheckInMessage] = useState('')
  const [checkInNotice, setCheckInNotice] = useState<string | null>(null)

  const { user } = useAuth()
  const { data: group, isLoading, error } = useAccountabilityGroup()
  const currentUserId = user?.id ?? ''

  const handleSubmitCheckIn = () => {
    // Check-in API endpoints not yet implemented
    // When available: POST /members/accountability/groups/:id/check-ins
    setShowCheckInModal(false)
    setCheckInMessage('')
    setCheckInNotice('Check-in feature coming soon. Your message was not sent.')
    setTimeout(() => setCheckInNotice(null), 5000)
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-koppar animate-spin" />
        </div>
      </MainLayout>
    )
  }

  if (error || !group) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Accountability</h1>
              <p className="text-kalkvit/60">Stay connected with your accountability partners</p>
            </div>
          </div>

          <GlassCard variant="elevated" className="text-center py-16">
            <Users className="w-16 h-16 text-koppar mx-auto mb-6" />
            <h2 className="font-display text-2xl font-bold text-kalkvit mb-3">
              No Accountability Group Yet
            </h2>
            <p className="text-kalkvit/60 max-w-md mx-auto mb-6">
              Connect with like-minded members in accountability trios or pairs. Support each other,
              share progress, and stay motivated on your transformation journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/programs">
                <GlassButton variant="primary">
                  <Users className="w-4 h-4" />
                  Join a Program
                  <ArrowRight className="w-4 h-4" />
                </GlassButton>
              </Link>
              <Link to="/circles">
                <GlassButton variant="secondary">
                  <MessageCircle className="w-4 h-4" />
                  Explore Circles
                </GlassButton>
              </Link>
            </div>
          </GlassCard>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <GlassCard variant="base">
              <div className="w-12 h-12 rounded-xl bg-koppar/20 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-koppar" />
              </div>
              <h3 className="font-semibold text-kalkvit mb-2">Small Groups</h3>
              <p className="text-sm text-kalkvit/60">
                Trios and pairs provide intimate support where every member matters. Build deep connections with your partners.
              </p>
            </GlassCard>
            <GlassCard variant="base">
              <div className="w-12 h-12 rounded-xl bg-koppar/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-koppar" />
              </div>
              <h3 className="font-semibold text-kalkvit mb-2">Regular Check-ins</h3>
              <p className="text-sm text-kalkvit/60">
                Share your wins, challenges, and progress with partners who understand your journey.
              </p>
            </GlassCard>
            <GlassCard variant="base">
              <div className="w-12 h-12 rounded-xl bg-koppar/20 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-koppar" />
              </div>
              <h3 className="font-semibold text-kalkvit mb-2">Weekly Meetings</h3>
              <p className="text-sm text-kalkvit/60">
                Scheduled calls keep everyone aligned and accountable. Never lose momentum on your goals.
              </p>
            </GlassCard>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Calculate group stats
  const members = Array.isArray(group.members) ? group.members : []
  const totalGoals = members.reduce((sum, m) => sum + m.goals_completed, 0)
  const avgStreak = members.length > 0
    ? Math.round(members.reduce((sum, m) => sum + m.current_streak, 0) / members.length)
    : 0
  const daysUntilMeeting = group.next_meeting
    ? Math.ceil((new Date(group.next_meeting).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Accountability</h1>
            <p className="text-kalkvit/60">Stay connected with your accountability partners</p>
          </div>
          <GlassButton variant="primary" onClick={() => setShowCheckInModal(true)}>
            <Send className="w-4 h-4" />
            Share Check-in
          </GlassButton>
        </div>

        {/* Check-in notice banner */}
        {checkInNotice && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-koppar/10 border border-koppar/20 px-4 py-3 text-sm text-koppar">
            <Info className="w-4 h-4 flex-shrink-0" />
            {checkInNotice}
          </div>
        )}

        {/* Group Header */}
        <GlassCard variant="elevated" className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-koppar/20 flex items-center justify-center">
                <Users className="w-7 h-7 text-koppar" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-xl font-bold text-kalkvit">{group.name}</h2>
                  <GlassBadge variant="koppar" className="text-xs capitalize">
                    {group.type}
                  </GlassBadge>
                </div>
                {group.program_name && (
                  <p className="text-sm text-kalkvit/60">{group.program_name}</p>
                )}
                {group.facilitator && (
                  <p className="text-xs text-kalkvit/50 mt-1">
                    Facilitator: {group.facilitator.name}
                  </p>
                )}
              </div>
            </div>
            {group.next_meeting && (
              <div className="text-right">
                <p className="text-xs text-kalkvit/50 mb-1">Next Meeting</p>
                <p className="font-medium text-kalkvit">
                  {new Date(group.next_meeting).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm text-kalkvit/60">
                  {new Date(group.next_meeting).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <GlassCard variant="base" className="text-center py-4">
            <Users className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">{members.length}</p>
            <p className="text-xs text-kalkvit/50">Members</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <Trophy className="w-6 h-6 text-skogsgron mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">{totalGoals}</p>
            <p className="text-xs text-kalkvit/50">Goals Completed</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <Flame className="w-6 h-6 text-tegelrod mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">{avgStreak}</p>
            <p className="text-xs text-kalkvit/50">Avg Streak</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center py-4">
            <Calendar className="w-6 h-6 text-koppar mx-auto mb-2" />
            <p className="font-display text-2xl font-bold text-kalkvit">
              {daysUntilMeeting !== null ? daysUntilMeeting : '—'}
            </p>
            <p className="text-xs text-kalkvit/50">Days Until Meet</p>
          </GlassCard>
        </div>

        {/* Members */}
        <div>
          <h3 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-koppar" />
            Your Partners
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isCurrentUser={member.id === currentUserId}
              />
            ))}
          </div>
        </div>

        {/* Accountability Guidelines */}
        <GlassCard variant="accent" className="mt-8">
          <h3 className="font-semibold text-kalkvit mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-koppar" />
            Accountability Guidelines
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-kalkvit/70">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-skogsgron mt-0.5 flex-shrink-0" />
              Check in at least 2x per week with progress updates
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-skogsgron mt-0.5 flex-shrink-0" />
              Celebrate wins and support struggles without judgment
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-skogsgron mt-0.5 flex-shrink-0" />
              Attend weekly calls or send async updates if unavailable
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-skogsgron mt-0.5 flex-shrink-0" />
              Keep each other accountable with respect and honesty
            </li>
          </ul>
        </GlassCard>

        {/* Check-in Modal */}
        <GlassModal
          isOpen={showCheckInModal}
          onClose={() => setShowCheckInModal(false)}
          title="Share Check-in"
        >
          <div className="space-y-4">
            <p className="text-sm text-kalkvit/60">
              Share your progress, wins, or challenges with your accountability partners.
            </p>
            <GlassTextarea
              label="Your Update"
              placeholder="What's happening with your goals this week?"
              value={checkInMessage}
              onChange={(e) => setCheckInMessage(e.target.value)}
              rows={4}
            />
            <div className="flex flex-wrap gap-2">
              <p className="text-xs text-kalkvit/50 w-full mb-1">Quick prompts:</p>
              {[
                'Goal progress: ',
                'Win this week: ',
                'Struggling with: ',
                'Need support on: ',
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setCheckInMessage(prompt)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-xs text-kalkvit/70 hover:bg-white/[0.1] transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
          <GlassModalFooter>
            <GlassButton variant="ghost" onClick={() => setShowCheckInModal(false)}>
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={handleSubmitCheckIn}
              disabled={!checkInMessage.trim()}
            >
              <Send className="w-4 h-4" />
              Share
            </GlassButton>
          </GlassModalFooter>
        </GlassModal>
      </div>
    </MainLayout>
  )
}
