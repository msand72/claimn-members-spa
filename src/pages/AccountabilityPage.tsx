import { useState } from 'react'
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
} from 'lucide-react'
import { cn } from '../lib/utils'

interface AccountabilityMember {
  id: string
  name: string
  avatar: string | null
  archetype: string
  pillarFocus: PillarId[]
  currentStreak: number
  goalsCompleted: number
  lastActive: string
}

interface AccountabilityGroup {
  id: string
  name: string
  type: 'trio' | 'pair' | 'squad'
  programName: string | null
  facilitator: {
    id: string
    name: string
    avatar: string | null
  } | null
  members: AccountabilityMember[]
  nextMeeting: string | null
  meetingFrequency: string
  createdAt: string
}

interface CheckIn {
  id: string
  memberId: string
  memberName: string
  content: string
  createdAt: string
  reactions: { emoji: string; count: number }[]
}

// Mock accountability group data
const mockGroup: AccountabilityGroup = {
  id: 'ag1',
  name: 'Morning Warriors',
  type: 'trio',
  programName: 'The Forge - 6 Month Track',
  facilitator: {
    id: 'fac1',
    name: 'Anna Bergman',
    avatar: null,
  },
  members: [
    {
      id: 'm1',
      name: 'Johan Eriksson',
      avatar: null,
      archetype: 'The Achiever',
      pillarFocus: ['physical', 'mission'],
      currentStreak: 14,
      goalsCompleted: 3,
      lastActive: '2026-01-27',
    },
    {
      id: 'm2',
      name: 'Marcus Lindqvist',
      avatar: null,
      archetype: 'The Optimizer',
      pillarFocus: ['emotional', 'identity'],
      currentStreak: 21,
      goalsCompleted: 5,
      lastActive: '2026-01-27',
    },
    {
      id: 'me',
      name: 'You',
      avatar: null,
      archetype: 'The Philosopher',
      pillarFocus: ['identity', 'connection'],
      currentStreak: 12,
      goalsCompleted: 2,
      lastActive: '2026-01-27',
    },
  ],
  nextMeeting: '2026-01-30T08:00:00',
  meetingFrequency: 'Weekly on Thursdays',
  createdAt: '2026-01-10',
}

// Mock check-ins
const mockCheckIns: CheckIn[] = [
  {
    id: 'c1',
    memberId: 'm1',
    memberName: 'Johan Eriksson',
    content: 'Hit my sleep target for 7 days straight! The wind-down routine is really working. Feeling more energized during workouts.',
    createdAt: '2026-01-27T07:30:00',
    reactions: [{ emoji: '🔥', count: 2 }, { emoji: '💪', count: 1 }],
  },
  {
    id: 'c2',
    memberId: 'm2',
    memberName: 'Marcus Lindqvist',
    content: 'Struggled with meditation this week - only 3 out of 7 days. Going to try shorter sessions (5 min) to build consistency.',
    createdAt: '2026-01-26T18:45:00',
    reactions: [{ emoji: '🙏', count: 2 }],
  },
  {
    id: 'c3',
    memberId: 'me',
    memberName: 'You',
    content: 'Completed my values mapping exercise! Feeling clearer about what matters. Will share insights at our next call.',
    createdAt: '2026-01-25T20:00:00',
    reactions: [{ emoji: '⭐', count: 2 }, { emoji: '🎯', count: 1 }],
  },
]

function MemberCard({ member, isCurrentUser }: { member: AccountabilityMember; isCurrentUser: boolean }) {
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
            {member.pillarFocus.map((pillarId) => (
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
            <span className="font-semibold">{member.currentStreak}</span>
          </div>
          <p className="text-xs text-kalkvit/50">Streak</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-skogsgron">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-semibold">{member.goalsCompleted}</span>
          </div>
          <p className="text-xs text-kalkvit/50">Goals</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-koppar">
            <Clock className="w-4 h-4" />
            <span className="font-semibold text-sm">Today</span>
          </div>
          <p className="text-xs text-kalkvit/50">Active</p>
        </div>
      </div>
    </GlassCard>
  )
}

function CheckInCard({ checkIn, isOwn }: { checkIn: CheckIn; isOwn: boolean }) {
  return (
    <GlassCard variant="base" className={cn(isOwn && 'border-koppar/20')}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-koppar/20 flex items-center justify-center text-koppar text-sm font-semibold">
          {checkIn.memberName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-kalkvit text-sm">
              {isOwn ? 'You' : checkIn.memberName}
            </span>
            <span className="text-xs text-kalkvit/40">
              {new Date(checkIn.createdAt).toLocaleDateString()} at{' '}
              {new Date(checkIn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-sm text-kalkvit/80">{checkIn.content}</p>
          {checkIn.reactions.length > 0 && (
            <div className="flex gap-2 mt-2">
              {checkIn.reactions.map((reaction, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.06] text-xs"
                >
                  {reaction.emoji} {reaction.count}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  )
}

export function AccountabilityPage() {
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [checkInMessage, setCheckInMessage] = useState('')

  const group = mockGroup
  const currentUserId = 'me'

  const handleSubmitCheckIn = () => {
    console.log('Submitting check-in:', checkInMessage)
    setShowCheckInModal(false)
    setCheckInMessage('')
  }

  // Calculate group stats
  const totalGoals = group.members.reduce((sum, m) => sum + m.goalsCompleted, 0)
  const avgStreak = Math.round(group.members.reduce((sum, m) => sum + m.currentStreak, 0) / group.members.length)
  const daysUntilMeeting = group.nextMeeting
    ? Math.ceil((new Date(group.nextMeeting).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
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
                {group.programName && (
                  <p className="text-sm text-kalkvit/60">{group.programName}</p>
                )}
                {group.facilitator && (
                  <p className="text-xs text-kalkvit/50 mt-1">
                    Facilitator: {group.facilitator.name}
                  </p>
                )}
              </div>
            </div>
            {group.nextMeeting && (
              <div className="text-right">
                <p className="text-xs text-kalkvit/50 mb-1">Next Meeting</p>
                <p className="font-medium text-kalkvit">
                  {new Date(group.nextMeeting).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm text-kalkvit/60">
                  {new Date(group.nextMeeting).toLocaleTimeString([], {
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
            <p className="font-display text-2xl font-bold text-kalkvit">{group.members.length}</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Members */}
          <div className="lg:col-span-1">
            <h3 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-koppar" />
              Your Partners
            </h3>
            <div className="space-y-4">
              {group.members.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isCurrentUser={member.id === currentUserId}
                />
              ))}
            </div>
          </div>

          {/* Check-ins Feed */}
          <div className="lg:col-span-2">
            <h3 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-koppar" />
              Recent Check-ins
            </h3>
            <div className="space-y-4">
              {mockCheckIns.map((checkIn) => (
                <CheckInCard
                  key={checkIn.id}
                  checkIn={checkIn}
                  isOwn={checkIn.memberId === currentUserId}
                />
              ))}
            </div>

            {/* Quick Check-in */}
            <GlassCard variant="base" className="mt-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-koppar/20 flex items-center justify-center text-koppar text-sm font-semibold">
                  Y
                </div>
                <button
                  onClick={() => setShowCheckInModal(true)}
                  className="flex-1 text-left px-4 py-2 rounded-xl bg-white/[0.04] text-kalkvit/50 hover:bg-white/[0.08] transition-colors"
                >
                  Share your progress or challenges...
                </button>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Group Guidelines */}
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
                '🎯 Goal progress: ',
                '💪 Win this week: ',
                '🤔 Struggling with: ',
                '🙏 Need support on: ',
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
