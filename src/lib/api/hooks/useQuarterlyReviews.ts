import { useQuery } from '@tanstack/react-query'
import { api } from '../client'
import type { QuarterlyReviewsResponse } from '../types'

export type { QuarterlyReview, QuarterlyReviewsResponse } from '../types'

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
