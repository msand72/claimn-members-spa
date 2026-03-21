import { useQuery } from '@tanstack/react-query'
import { api } from '../client'

export type SearchType = 'members' | 'experts' | 'protocols' | 'programs' | 'feed_posts'

export interface SearchResult {
  id: string
  [key: string]: unknown
}

export interface SearchResponse {
  data: SearchResult[]
  pagination: {
    total: number
    limit: number
    offset: number
    processing_time_ms?: number
  }
  query: string
  type?: string
}

export const searchKeys = {
  all: ['search'] as const,
  query: (q: string, type?: string, limit?: number) =>
    [...searchKeys.all, q, type, limit] as const,
}

/**
 * Search across Meilisearch indexes via the backend.
 * GET /api/v2/members/search?q=...&type=...&limit=...
 */
export function useSearch(
  query: string,
  options?: {
    type?: SearchType | string
    limit?: number
    enabled?: boolean
  }
) {
  const { type, limit = 20, enabled = true } = options ?? {}

  return useQuery({
    queryKey: searchKeys.query(query, type, limit),
    queryFn: async () => {
      const params: Record<string, string | number> = { q: query, limit }
      if (type) params.type = type
      return api.get<SearchResponse>('/members/search', params)
    },
    enabled: enabled && query.length >= 2,
    staleTime: 30_000,
  })
}
