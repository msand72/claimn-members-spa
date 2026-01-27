import { useQuery } from '@tanstack/react-query'
import { api, type PaginatedResponse, type PaginationParams } from '../client'
import type { NetworkMember, NetworkFilters } from '../types'

// Query keys
export const networkKeys = {
  all: ['network'] as const,
  list: (filters?: NetworkFilters & PaginationParams) => [...networkKeys.all, 'list', filters] as const,
  suggestions: () => [...networkKeys.all, 'suggestions'] as const,
}

// Get network members with filters and pagination
export function useNetwork(filters?: NetworkFilters & PaginationParams) {
  return useQuery({
    queryKey: networkKeys.list(filters),
    queryFn: () =>
      api.get<PaginatedResponse<NetworkMember>>('/members/network', {
        page: filters?.page,
        limit: filters?.limit,
        sort: filters?.sort,
        search: filters?.search,
        archetype: filters?.archetype,
        pillar: filters?.pillar,
        city: filters?.city,
        country: filters?.country,
      }),
  })
}

// Get connection suggestions
export function useNetworkSuggestions(limit = 5) {
  return useQuery({
    queryKey: networkKeys.suggestions(),
    queryFn: () =>
      api.get<NetworkMember[]>('/members/network/suggestions', { limit }),
  })
}
