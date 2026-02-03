import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type PaginationParams } from '../client'
import type {
  ActiveProtocol,
  StartProtocolRequest,
  UpdateProtocolProgressRequest,
} from '../types'

// Protocol template from library (read-only)
export interface ProtocolTemplate {
  slug: string
  name: string
  pillar: string
  description: string
  timeline: string
  stat: string
  weeks: ProtocolWeek[]
}

export interface ProtocolWeek {
  week: number
  title: string
  description: string
  tasks: ProtocolTask[]
}

export interface ProtocolTask {
  id: string
  title: string
}

// Query keys
export const protocolKeys = {
  all: ['protocols'] as const,
  active: (params?: PaginationParams) => [...protocolKeys.all, 'active', params] as const,
  library: () => [...protocolKeys.all, 'library'] as const,
  detail: (slug: string) => [...protocolKeys.all, 'detail', slug] as const,
  activeDetail: (id: string) => [...protocolKeys.all, 'active-detail', id] as const,
}

// Extended params for active protocols
export interface ActiveProtocolsParams extends PaginationParams {
  status?: 'active' | 'paused' | 'completed' | 'abandoned'
}

// Get user's active protocols
export function useActiveProtocols(params?: ActiveProtocolsParams) {
  return useQuery({
    queryKey: protocolKeys.active(params),
    queryFn: async () => {
      const res = await api.get<any>('/members/protocols', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
        status: params?.status,
      })
      // Normalize: API may return { data: [...] } or bare array
      const data: ActiveProtocol[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []
      return data
    },
  })
}

// Get protocol library (available protocols)
export function useProtocolLibrary() {
  return useQuery({
    queryKey: protocolKeys.library(),
    queryFn: async () => {
      const res = await api.get<any>('/members/protocols/library')
      if (Array.isArray(res)) return res as ProtocolTemplate[]
      if (res && Array.isArray(res.data)) return res.data as ProtocolTemplate[]
      return [] as ProtocolTemplate[]
    },
  })
}

// Get single protocol template from library
export function useProtocolTemplate(slug: string) {
  return useQuery({
    queryKey: protocolKeys.detail(slug),
    queryFn: () => api.get<ProtocolTemplate>(`/members/protocols/library/${slug}`),
    enabled: !!slug && slug !== 'library',
  })
}

// Get user's active protocol by ID
export function useActiveProtocol(id: string) {
  return useQuery({
    queryKey: protocolKeys.activeDetail(id),
    queryFn: () => api.get<ActiveProtocol>(`/members/protocols/${id}`),
    enabled: !!id,
  })
}

// Get user's active protocol by slug
export function useActiveProtocolBySlug(slug: string) {
  return useQuery({
    queryKey: [...protocolKeys.all, 'active-by-slug', slug] as const,
    queryFn: async () => {
      try {
        return await api.get<ActiveProtocol>(`/members/protocols/active/${slug}`)
      } catch (err: any) {
        // 404 means user hasn't started this protocol — not a real error
        if (err?.status === 404) return null
        throw err
      }
    },
    enabled: !!slug,
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false
      return failureCount < 3
    },
  })
}

// Start a protocol
export function useStartProtocol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StartProtocolRequest) =>
      api.post<ActiveProtocol>('/members/protocols', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: protocolKeys.all })
    },
  })
}

// Update protocol progress (mark task complete/incomplete)
export function useUpdateProtocolProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      protocolId,
      data,
    }: {
      protocolId: string
      data: UpdateProtocolProgressRequest
    }) => api.put<ActiveProtocol>(`/members/protocols/${protocolId}/progress`, data),
    onSuccess: (_, { protocolId }) => {
      queryClient.invalidateQueries({ queryKey: protocolKeys.all })
      queryClient.invalidateQueries({ queryKey: protocolKeys.activeDetail(protocolId) })
    },
  })
}

// Pause protocol
export function usePauseProtocol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (protocolId: string) =>
      api.put<ActiveProtocol>(`/members/protocols/${protocolId}`, { status: 'paused' }),
    onSuccess: (_, protocolId) => {
      queryClient.invalidateQueries({ queryKey: protocolKeys.all })
      queryClient.invalidateQueries({ queryKey: protocolKeys.activeDetail(protocolId) })
    },
  })
}

// Resume protocol
export function useResumeProtocol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (protocolId: string) =>
      api.put<ActiveProtocol>(`/members/protocols/${protocolId}`, { status: 'active' }),
    onSuccess: (_, protocolId) => {
      queryClient.invalidateQueries({ queryKey: protocolKeys.all })
      queryClient.invalidateQueries({ queryKey: protocolKeys.activeDetail(protocolId) })
    },
  })
}

// Abandon protocol
export function useAbandonProtocol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (protocolId: string) =>
      api.put<ActiveProtocol>(`/members/protocols/${protocolId}`, { status: 'abandoned' }),
    onSuccess: (_, protocolId) => {
      queryClient.invalidateQueries({ queryKey: protocolKeys.all })
      queryClient.invalidateQueries({ queryKey: protocolKeys.activeDetail(protocolId) })
    },
  })
}
