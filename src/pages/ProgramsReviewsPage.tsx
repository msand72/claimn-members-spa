import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassTextarea, GlassAvatar, GlassBadge } from '../components/ui'
import { ArrowLeft, Star, MessageCircle, ThumbsUp, Clock, CheckCircle, Send } from 'lucide-react'
import { cn } from '../lib/utils'

interface PeerReview {
  id: number
  type: 'given' | 'received' | 'pending'
  peer: {
    name: string
    initials: string
  }
  program: string
  assignment: string
  dueDate?: string
  completedDate?: string
  rating?: number
  feedback?: string
  strengths?: string[]
  improvements?: string[]
}

const mockReviews: PeerReview[] = [
  {
    id: 1,
    type: 'pending',
    peer: { name: 'Alex Johnson', initials: 'AJ' },
    program: 'Leadership Accelerator',
    assignment: 'Week 3: Delegation Framework',
    dueDate: 'Jan 28, 2026',
  },
  {
    id: 2,
    type: 'pending',
    peer: { name: 'Maria Garcia', initials: 'MG' },
    program: 'Deep Work Protocol',
    assignment: 'Module 5: Focus Blocks',
    dueDate: 'Jan 30, 2026',
  },
  {
    id: 3,
    type: 'received',
    peer: { name: 'James Smith', initials: 'JS' },
    program: 'Morning Mastery Protocol',
    assignment: 'Week 2: Morning Stack',
    completedDate: 'Jan 20, 2026',
    rating: 5,
    feedback: 'Excellent execution of the morning routine. Your consistency is impressive and your reflection showed deep understanding of why each habit matters.',
    strengths: ['Consistency', 'Self-awareness', 'Detail-oriented'],
    improvements: ['Consider adding a mindfulness component'],
  },
  {
    id: 4,
    type: 'given',
    peer: { name: 'Emma Wilson', initials: 'EW' },
    program: 'Leadership Accelerator',
    assignment: 'Week 2: Communication Framework',
    completedDate: 'Jan 18, 2026',
    rating: 4,
    feedback: 'Good progress on implementing active listening techniques. The examples you provided were practical and showed real application.',
  },
  {
    id: 5,
    type: 'received',
    peer: { name: 'Daniel Brown', initials: 'DB' },
    program: 'Peak Performance System',
    assignment: 'Module 4: Energy Management',
    completedDate: 'Jan 15, 2026',
    rating: 4,
    feedback: 'Solid understanding of energy cycles. Your tracking system is well-designed. Consider experimenting with different recovery techniques.',
    strengths: ['Analytical approach', 'Good tracking habits'],
    improvements: ['Try different recovery methods', 'Add more flexibility'],
  },
]

function PendingReviewCard({ review }: { review: PeerReview }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')

  return (
    <GlassCard variant="base" className="mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <GlassAvatar initials={review.peer.initials} size="md" />
          <div>
            <h3 className="font-semibold text-kalkvit">{review.peer.name}</h3>
            <p className="text-xs text-koppar">{review.program}</p>
          </div>
        </div>
        <GlassBadge variant="warning" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Due {review.dueDate}
        </GlassBadge>
      </div>

      <p className="text-sm text-kalkvit/70 mb-4">{review.assignment}</p>

      {!isExpanded ? (
        <GlassButton variant="primary" onClick={() => setIsExpanded(true)}>
          Write Review
        </GlassButton>
      ) : (
        <div className="space-y-4 pt-4 border-t border-white/10">
          {/* Rating */}
          <div>
            <label className="block text-sm text-kalkvit/60 mb-2">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star
                    className={cn(
                      'w-6 h-6 transition-colors',
                      star <= rating
                        ? 'text-brand-amber fill-brand-amber'
                        : 'text-kalkvit/20 hover:text-brand-amber/50'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-sm text-kalkvit/60 mb-2">Feedback</label>
            <GlassTextarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share constructive feedback..."
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <GlassButton variant="primary" disabled={!rating || !feedback.trim()}>
              <Send className="w-4 h-4" />
              Submit Review
            </GlassButton>
            <GlassButton variant="ghost" onClick={() => setIsExpanded(false)}>
              Cancel
            </GlassButton>
          </div>
        </div>
      )}
    </GlassCard>
  )
}

function CompletedReviewCard({ review }: { review: PeerReview }) {
  const [showFull, setShowFull] = useState(false)

  return (
    <GlassCard variant="base" className="mb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <GlassAvatar initials={review.peer.initials} size="md" />
          <div>
            <h3 className="font-semibold text-kalkvit">{review.peer.name}</h3>
            <p className="text-xs text-koppar">{review.program}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {review.rating && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-4 h-4',
                    i < review.rating! ? 'text-brand-amber fill-brand-amber' : 'text-kalkvit/20'
                  )}
                />
              ))}
            </div>
          )}
          <GlassBadge variant={review.type === 'received' ? 'success' : 'default'}>
            {review.type === 'received' ? 'Received' : 'Given'}
          </GlassBadge>
        </div>
      </div>

      <p className="text-sm text-kalkvit/50 mb-2">{review.assignment}</p>
      <p className="text-xs text-kalkvit/40 mb-3">{review.completedDate}</p>

      {review.feedback && (
        <p className={cn('text-sm text-kalkvit/70', !showFull && 'line-clamp-2')}>
          {review.feedback}
        </p>
      )}

      {review.strengths && review.strengths.length > 0 && showFull && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-skogsgron mb-2 flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" />
            Strengths
          </p>
          <div className="flex flex-wrap gap-2">
            {review.strengths.map((s, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-lg bg-skogsgron/20 text-skogsgron">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {review.improvements && review.improvements.length > 0 && showFull && (
        <div className="mt-3">
          <p className="text-xs text-koppar mb-2 flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            Areas for Improvement
          </p>
          <div className="flex flex-wrap gap-2">
            {review.improvements.map((imp, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-lg bg-koppar/20 text-koppar">
                {imp}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowFull(!showFull)}
        className="mt-3 text-sm text-koppar hover:text-koppar/80 transition-colors"
      >
        {showFull ? 'Show less' : 'Show more'}
      </button>
    </GlassCard>
  )
}

export function ProgramsReviewsPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'received' | 'given'>('all')

  const filteredReviews = mockReviews.filter((review) => {
    if (filter === 'all') return true
    return review.type === filter
  })

  const pendingReviews = filteredReviews.filter((r) => r.type === 'pending')
  const completedReviews = filteredReviews.filter((r) => r.type !== 'pending')

  const pendingCount = mockReviews.filter((r) => r.type === 'pending').length
  const receivedCount = mockReviews.filter((r) => r.type === 'received').length
  const givenCount = mockReviews.filter((r) => r.type === 'given').length

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          to="/programs"
          className="inline-flex items-center gap-2 text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Programs
        </Link>

        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Peer Reviews</h1>
          <p className="text-kalkvit/60">
            Give and receive feedback from your program peers
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <GlassCard variant="base" className="text-center">
            <p className="text-3xl font-display font-bold text-koppar">{pendingCount}</p>
            <p className="text-sm text-kalkvit/60">Pending</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center">
            <p className="text-3xl font-display font-bold text-skogsgron">{receivedCount}</p>
            <p className="text-sm text-kalkvit/60">Received</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center">
            <p className="text-3xl font-display font-bold text-kalkvit">{givenCount}</p>
            <p className="text-sm text-kalkvit/60">Given</p>
          </GlassCard>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'received', 'given'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize',
                filter === f
                  ? 'bg-koppar text-kalkvit'
                  : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1] hover:text-kalkvit'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Pending Reviews */}
        {pendingReviews.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-koppar" />
              Pending Reviews ({pendingReviews.length})
            </h2>
            {pendingReviews.map((review) => (
              <PendingReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}

        {/* Completed Reviews */}
        {completedReviews.length > 0 && (
          <div>
            <h2 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-skogsgron" />
              Completed Reviews ({completedReviews.length})
            </h2>
            {completedReviews.map((review) => (
              <CompletedReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}

        {filteredReviews.length === 0 && (
          <GlassCard variant="base" className="text-center py-12">
            <p className="text-kalkvit/60">No reviews found.</p>
          </GlassCard>
        )}
      </div>
    </MainLayout>
  )
}
