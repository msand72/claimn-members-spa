import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassAvatar } from '../components/ui'
import { useQuarterlyReviews, safeArray, type QuarterlyReview } from '../lib/api'
import { ClipboardList, Star, Loader2, TrendingUp, AlertTriangle } from 'lucide-react'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatReviewDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-koppar fill-koppar' : 'text-kalkvit/20'}`}
        />
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: QuarterlyReview }) {
  return (
    <GlassCard variant="base" className="mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <GlassAvatar
            src={review.coach?.avatar_url ?? undefined}
            initials={review.coach ? getInitials(review.coach.name) : '?'}
            size="md"
          />
          <div>
            <p className="text-sm font-medium text-kalkvit">
              {review.coach?.name || 'Your Coach'}
            </p>
            <p className="text-xs text-kalkvit/40">
              {formatReviewDate(review.review_date)}
              {review.quarter && ` \u00B7 ${review.quarter}`}
            </p>
          </div>
        </div>
        {review.overall_rating != null && <RatingStars rating={review.overall_rating} />}
      </div>

      {review.summary && (
        <div className="mb-4">
          <p className="text-sm text-kalkvit/70 leading-relaxed">{review.summary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {review.strengths?.length > 0 && (
          <div className="p-3 rounded-lg bg-skogsgron/10">
            <p className="text-xs font-semibold text-skogsgron mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Strengths
            </p>
            <ul className="space-y-1">
              {review.strengths.map((s, i) => (
                <li key={i} className="text-sm text-kalkvit/60">{s}</li>
              ))}
            </ul>
          </div>
        )}

        {review.areas_for_improvement?.length > 0 && (
          <div className="p-3 rounded-lg bg-koppar/10">
            <p className="text-xs font-semibold text-koppar mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Areas for Improvement
            </p>
            <ul className="space-y-1">
              {review.areas_for_improvement.map((a, i) => (
                <li key={i} className="text-sm text-kalkvit/60">{a}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {review.goals_progress_notes && (
        <div className="mt-4 p-3 rounded-lg bg-white/[0.04]">
          <p className="text-xs font-semibold text-kalkvit/60 mb-1">Goals Progress</p>
          <p className="text-sm text-kalkvit/70">{review.goals_progress_notes}</p>
        </div>
      )}

      {review.recommendations && (
        <div className="mt-4 p-3 rounded-lg bg-white/[0.04]">
          <p className="text-xs font-semibold text-kalkvit/60 mb-1">Recommendations</p>
          <p className="text-sm text-kalkvit/70">{review.recommendations}</p>
        </div>
      )}
    </GlassCard>
  )
}

export function QuarterlyReviewsPage() {
  const { data, isLoading, isError } = useQuarterlyReviews()
  const reviews: QuarterlyReview[] = safeArray<QuarterlyReview>(data)

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-kalkvit mb-1">
            Quarterly Reviews
          </h1>
          <p className="text-kalkvit/60 text-sm">
            Review history from your coaching sessions
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-koppar" />
          </div>
        ) : isError || reviews.length === 0 ? (
          <GlassCard variant="base">
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-kalkvit/15 mx-auto mb-3" />
              <p className="text-kalkvit/50 text-sm mb-1">No quarterly reviews yet</p>
              <p className="text-kalkvit/30 text-xs">
                Reviews will appear here after your coach completes your first quarterly review.
              </p>
            </div>
          </GlassCard>
        ) : (
          reviews.map((review) => <ReviewCard key={review.id} review={review} />)
        )}
      </div>
    </MainLayout>
  )
}

export default QuarterlyReviewsPage
