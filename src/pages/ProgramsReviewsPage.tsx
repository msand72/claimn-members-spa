import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassTextarea, GlassAvatar, GlassBadge } from '../components/ui'
import { usePeerReviews, useSubmitPeerReview } from '../lib/api/hooks'
import type { PeerReview } from '../lib/api/types'
import {
  ArrowLeft,
  Star,
  MessageCircle,
  ThumbsUp,
  Clock,
  CheckCircle,
  Send,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '../lib/utils'

function PendingReviewCard({
  review,
  onSubmit,
  isSubmitting,
}: {
  review: PeerReview
  onSubmit: (reviewId: string, rating: number, feedback: string) => void
  isSubmitting: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')

  const peerInitials = review.peer
    ? review.peer.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'PR'

  const handleSubmit = () => {
    if (rating && feedback.trim()) {
      onSubmit(review.id, rating, feedback)
    }
  }

  return (
    <GlassCard variant="base" className="mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {review.peer?.avatar_url ? (
            <img
              src={review.peer.avatar_url}
              alt={review.peer.name}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <GlassAvatar initials={peerInitials} size="md" />
          )}
          <div>
            <h3 className="font-semibold text-kalkvit">{review.peer?.name || 'Peer'}</h3>
            <p className="text-xs text-koppar">{review.program?.name || 'Program'}</p>
          </div>
        </div>
        <GlassBadge variant="warning" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Due {review.due_date ? new Date(review.due_date).toLocaleDateString() : 'Soon'}
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
                <button key={star} onClick={() => setRating(star)} className="p-1">
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
            <GlassButton
              variant="primary"
              disabled={!rating || !feedback.trim() || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Review
                </>
              )}
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

  const peerInitials = review.peer
    ? review.peer.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'PR'

  return (
    <GlassCard variant="base" className="mb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {review.peer?.avatar_url ? (
            <img
              src={review.peer.avatar_url}
              alt={review.peer.name}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <GlassAvatar initials={peerInitials} size="md" />
          )}
          <div>
            <h3 className="font-semibold text-kalkvit">{review.peer?.name || 'Peer'}</h3>
            <p className="text-xs text-koppar">{review.program?.name || 'Program'}</p>
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
      <p className="text-xs text-kalkvit/40 mb-3">
        {review.completed_date ? new Date(review.completed_date).toLocaleDateString() : ''}
      </p>

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
  const [submittingReviewId, setSubmittingReviewId] = useState<string | null>(null)

  const {
    data: reviewsData,
    isLoading,
    error,
  } = usePeerReviews({
    type: filter !== 'all' ? filter : undefined,
  })

  const submitMutation = useSubmitPeerReview()

  const reviews = Array.isArray(reviewsData?.data) ? reviewsData.data : []

  const handleSubmit = async (reviewId: string, rating: number, feedback: string) => {
    setSubmittingReviewId(reviewId)
    try {
      await submitMutation.mutateAsync({
        reviewId,
        data: { rating, feedback },
      })
    } finally {
      setSubmittingReviewId(null)
    }
  }

  const pendingReviews = reviews.filter((r) => r.type === 'pending')
  const completedReviews = reviews.filter((r) => r.type !== 'pending')

  const pendingCount = reviews.filter((r) => r.type === 'pending').length
  const receivedCount = reviews.filter((r) => r.type === 'received').length
  const givenCount = reviews.filter((r) => r.type === 'given').length

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <GlassCard variant="base" className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-tegelrod mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">Failed to load reviews</h3>
            <p className="text-kalkvit/50 text-sm">
              Please try refreshing the page or check your connection.
            </p>
          </GlassCard>
        </div>
      </MainLayout>
    )
  }

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
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">Peer Reviews</h1>
          <p className="text-kalkvit/60">Give and receive feedback from your program peers</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <GlassCard variant="base" className="text-center">
            <p className="text-2xl sm:text-3xl font-display font-bold text-koppar">
              {isLoading ? '-' : pendingCount}
            </p>
            <p className="text-sm text-kalkvit/60">Pending</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center">
            <p className="text-2xl sm:text-3xl font-display font-bold text-skogsgron">
              {isLoading ? '-' : receivedCount}
            </p>
            <p className="text-sm text-kalkvit/60">Received</p>
          </GlassCard>
          <GlassCard variant="base" className="text-center">
            <p className="text-2xl sm:text-3xl font-display font-bold text-kalkvit">
              {isLoading ? '-' : givenCount}
            </p>
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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-koppar animate-spin" />
          </div>
        ) : (
          <>
            {/* Pending Reviews */}
            {pendingReviews.length > 0 && (
              <div className="mb-8">
                <h2 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-koppar" />
                  Pending Reviews ({pendingReviews.length})
                </h2>
                {pendingReviews.map((review) => (
                  <PendingReviewCard
                    key={review.id}
                    review={review}
                    onSubmit={handleSubmit}
                    isSubmitting={submittingReviewId === review.id}
                  />
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

            {reviews.length === 0 && (
              <GlassCard variant="base" className="text-center py-12">
                <p className="text-kalkvit/60">No reviews found.</p>
              </GlassCard>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}

export default ProgramsReviewsPage;
