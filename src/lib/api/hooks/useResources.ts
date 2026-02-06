import { useQuery } from '@tanstack/react-query'
import { api, safeArray, type PaginationParams } from '../client'
import type { Resource, CoachingResource } from '../types'

// Query keys
export const resourceKeys = {
  all: ['resources'] as const,
  list: (params?: ResourcesParams) => [...resourceKeys.all, 'list', params] as const,
  coaching: (params?: ResourcesParams) => [...resourceKeys.all, 'coaching', params] as const,
  detail: (id: string) => [...resourceKeys.all, 'detail', id] as const,
}

// Extended params for resources
export interface ResourcesParams extends PaginationParams {
  category?: string
  type?: string
  search?: string
  is_featured?: boolean
}

// =====================================================
// Resource Hooks
// =====================================================

// Get all resources
export function useResources(params?: ResourcesParams) {
  return useQuery({
    queryKey: resourceKeys.list(params),
    queryFn: async () => {
      const res = await api.get<Resource[] | { data: Resource[] }>('/members/resources', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
        category: params?.category,
        type: params?.type,
        search: params?.search,
        is_featured: params?.is_featured,
      })
      return safeArray<Resource>(res)
    },
  })
}

// Get single resource
export function useResource(id: string) {
  return useQuery({
    queryKey: resourceKeys.detail(id),
    queryFn: () => api.get<Resource>(`/members/resources/${id}`),
    enabled: !!id,
  })
}

// Get coaching-specific resources
export function useCoachingResources(params?: ResourcesParams) {
  return useQuery({
    queryKey: resourceKeys.coaching(params),
    queryFn: async () => {
      const res = await api.get<CoachingResource[] | { data: CoachingResource[] }>('/members/coaching/resources', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
        category: params?.category,
        type: params?.type,
        search: params?.search,
        is_featured: params?.is_featured,
      })
      return safeArray<CoachingResource>(res)
    },
  })
}
