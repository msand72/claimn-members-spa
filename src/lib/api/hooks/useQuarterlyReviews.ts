import { useQuery } from '@tanstack/react-query'
import { api } from '../client'

export interface QuarterlyReview {
  id: string
  coach_id: string
  member_id: string
  review_date: string
  quarter: string
  summary: string
  strengths: string[]
  areas_for_improvement: string[]
  goals_progress_notes: string
  recommendations: string
  overall_rating: number | null
  coach?: {
    id: string
    name: string
    avatar_url: string | null
  }
  created_at: string
}

export interface QuarterlyReviewsResponse {
  data: QuarterlyReview[]
  pagination?: {
    page: number
    limit: number
    total: number
  }
}

export const quarterlyReviewKeys = {
  all: ['quarterly-reviews'] as const,
  list: () => [...quarterlyReviewKeys.all, 'list'] as const,
}

export function useQuarterlyReviews() {
  return useQuery({
    queryKey: quarterlyReviewKeys.list(),
    queryFn: () => api.get<QuarterlyReviewsResponse>('/members/coaching/quarterly-reviews'),
  })
}
