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
import { useAccountabilityGroup, useLeaveAccountabilityGroup, useCreateCheckIn } from '../lib/api/hooks'
import {
  Users,
  MessageCircle,
  Calendar,
  Target,
  CheckCircle2,
  Send,
  ArrowRight,
  Loader2,
  Info,
  LogOut,
} from 'lucide-react'

export function AccountabilityPage() {
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [checkInMessage, setCheckInMessage] = useState('')
  const [checkInNotice, setCheckInNotice] = useState<string | null>(null)

  const { data: group, isLoading, error } = useAccountabilityGroup()
  const leaveGroup = useLeaveAccountabilityGroup()
  const createCheckIn = useCreateCheckIn()

  const handleSubmitCheckIn = async () => {
    if (!group || !checkInMessage.trim()) return
    try {
      await createCheckIn.mutateAsync({
        groupId: group.id,
        data: { progress_update: checkInMessage.trim() },
      })
      setShowCheckInModal(false)
      setCheckInMessage('')
      setCheckInNotice('Check-in shared with your group!')
      setTimeout(() => setCheckInNotice(null), 5000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit check-in'
      setCheckInNotice(msg)
      setTimeout(() => setCheckInNotice(null), 5000)
    }
  }

  const handleLeaveGroup = () => {
    if (!group) return
    if (!window.confirm('Are you sure you want to leave this accountability group?')) return
    leaveGroup.mutate(group.id)
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

  // Treat an empty/invalid group as "no group"
  const hasValidGroup = group && typeof group === 'object' && 'name' in group && group.name

  if (error || !hasValidGroup) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">Accountability</h1>
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

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">Accountability</h1>
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
                    {group.group_type}
                  </GlassBadge>
                  {group.is_active && (
                    <GlassBadge variant="default" className="text-xs">
                      Active
                    </GlassBadge>
                  )}
                </div>
                <p className="text-xs text-kalkvit/50 mt-1">
                  Joined {new Date(group.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <GlassButton
              variant="ghost"
              onClick={handleLeaveGroup}
              disabled={leaveGroup.isPending}
              className="text-kalkvit/50 hover:text-tegelrod"
            >
              <LogOut className="w-4 h-4" />
              Leave Group
            </GlassButton>
          </div>
        </GlassCard>

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
              disabled={!checkInMessage.trim() || createCheckIn.isPending}
            >
              {createCheckIn.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Share
                </>
              )}
            </GlassButton>
          </GlassModalFooter>
        </GlassModal>
      </div>
    </MainLayout>
  )
}

export default AccountabilityPage;
