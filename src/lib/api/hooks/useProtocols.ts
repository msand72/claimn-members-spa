import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, safeArray, unwrapData, is404Error, type PaginationParams } from '../client'
import type {
  ActiveProtocol,
  StartProtocolRequest,
  UpdateProtocolProgressRequest,
  ProtocolTemplate,
  LogProtocolProgressRequest,
  ProtocolFullProgress,
  GeneratePlanRequest,
  GeneratePlanResponse,
  StartWithPlanRequest,
  StartWithPlanResponse,
} from '../types'

// Re-export types from types.ts for barrel compatibility
export type {
  ProtocolTemplate,
  ProtocolsByPillar,
  LogProtocolProgressRequest,
  TrackingMethod,
  SuccessMetric,
  EmergencyProtocol,
  ProtocolWeek,
  ProtocolTask,
  ProtocolSection,
  ImplementationStep,
  ImplementationGuide,
  ProtocolStat,
  ProtocolFullProgress,
  GeneratePlanRequest,
  GeneratePlanResponse,
  StartWithPlanRequest,
  StartWithPlanResponse,
} from '../types'

// Extended params for active protocols
export interface ActiveProtocolsParams extends PaginationParams {
  status?: 'active' | 'paused' | 'completed' | 'abandoned'
}

// Query keys
export const protocolKeys = {
  all: ['protocols'] as const,
  list: (pillar?: string) => [...protocolKeys.all, 'list', pillar] as const,
  detail: (slug: string) => [...protocolKeys.all, 'detail', slug] as const,
  pillars: () => [...protocolKeys.all, 'pillars'] as const,
  featured: () => [...protocolKeys.all, 'featured'] as const,
  active: (params?: PaginationParams) => [...protocolKeys.all, 'active', params] as const,
  activeDetail: (id: string) => [...protocolKeys.all, 'active-detail', id] as const,
  library: () => [...protocolKeys.all, 'library'] as const,
  fullProgress: (slug: string) => [...protocolKeys.all, 'full-progress', slug] as const,
}

// =====================================================
// HOOKS
// =====================================================

/**
 * List protocols with optional pillar filter
 * GET /api/v2/members/protocols/library
 */
export function useProtocols(pillar?: string) {
  return useQuery({
    queryKey: protocolKeys.list(pillar),
    queryFn: async () => {
      const params = pillar && pillar !== 'all' ? { pillar } : undefined
      const res = await api.get<ProtocolTemplate[] | { data: ProtocolTemplate[] }>('/members/protocols/library', params)
      return safeArray<ProtocolTemplate>(res)
    },
  })
}

/**
 * Get single protocol by slug
 * GET /api/v2/members/protocols/library/{slug}
 */
export function useProtocol(slug: string) {
  return useQuery({
    queryKey: protocolKeys.detail(slug),
    queryFn: async () => {
      const res = await api.get<ProtocolTemplate | { data: ProtocolTemplate }>(`/members/protocols/library/${slug}`)
      return unwrapData<ProtocolTemplate>(res)!
    },
    enabled: !!slug,
  })
}

/**
 * Get member's active protocols
 * GET /api/v2/members/protocols/active
 */
export function useMyActiveProtocols(params?: ActiveProtocolsParams) {
  return useQuery({
    queryKey: protocolKeys.active(params),
    queryFn: async () => {
      const res = await api.get<ActiveProtocol[] | { data: ActiveProtocol[] }>('/members/protocols/active', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
        status: params?.status,
      })
      return safeArray<ActiveProtocol>(res)
    },
  })
}

/**
 * Log weekly progress on a protocol
 * POST /api/v2/members/protocols/{id}/progress
 */
export function useLogProtocolProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      protocolId,
      data,
    }: {
      protocolId: string
      data: LogProtocolProgressRequest
    }) => api.post<ActiveProtocol>(`/members/protocols/${protocolId}/progress`, data),
    onSuccess: (_, { protocolId }) => {
      queryClient.invalidateQueries({ queryKey: protocolKeys.all })
      queryClient.invalidateQueries({ queryKey: protocolKeys.activeDetail(protocolId) })
    },
  })
}

/**
 * Get full progress for an active protocol by slug
 * GET /api/v2/members/protocols/{slug}/full-progress
 */
export function useProtocolFullProgress(slug: string) {
  return useQuery({
    queryKey: protocolKeys.fullProgress(slug),
    queryFn: async () => {
      const res = await api.get<ProtocolFullProgress | { data: ProtocolFullProgress }>(
        `/members/protocols/${slug}/full-progress`,
      )
      return unwrapData<ProtocolFullProgress>(res)!
    },
    enabled: !!slug,
    retry: (failureCount, error) => !is404Error(error) && failureCount < 3,
  })
}

/**
 * Generate a plan from a protocol template (server-side)
 * POST /api/v2/members/protocols/{slug}/generate-plan
 */
export function useGenerateProtocolPlan() {
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data?: GeneratePlanRequest }) =>
      api.post<GeneratePlanResponse>(`/members/protocols/${slug}/generate-plan`, data || {}),
  })
}

/**
 * Start a protocol with a full plan (goal + action items + KPIs) in one call
 * POST /api/v2/members/protocols/{slug}/start-with-plan
 */
export function useStartProtocolWithPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: StartWithPlanRequest }) =>
      api.post<StartWithPlanResponse>(`/members/protocols/${slug}/start-with-plan`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: protocolKeys.all })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['kpis'] })
    },
  })
}

/**
 * Get featured protocols from the library
 * Uses GET /api/v2/members/protocols/library and filters by is_featured
 */
export function useFeaturedProtocols(limit = 4) {
  return useQuery({
    queryKey: protocolKeys.featured(),
    queryFn: async () => {
      const res = await api.get<ProtocolTemplate[] | { data: ProtocolTemplate[] }>('/members/protocols/library')
      return safeArray<ProtocolTemplate>(res)
        .filter((p) => p.is_featured)
        .slice(0, limit)
    },
  })
}

// =====================================================
// LEGACY HOOKS — use the hooks above for new code
// =====================================================

/**
 * @deprecated Use `useMyActiveProtocols` instead.
 */
export function useActiveProtocols(params?: ActiveProtocolsParams) {
  return useQuery({
    queryKey: protocolKeys.active(params),
    queryFn: async () => {
      const res = await api.get<ActiveProtocol[] | { data: ActiveProtocol[] }>('/members/protocols/active', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
        status: params?.status,
      })
      return safeArray<ActiveProtocol>(res)
    },
  })
}

/**
 * @deprecated Use `useProtocols` instead.
 */
export function useProtocolLibrary() {
  return useQuery({
    queryKey: protocolKeys.library(),
    queryFn: async () => {
      const res = await api.get<ProtocolTemplate[] | { data: ProtocolTemplate[] }>('/members/protocols/library')
      return safeArray<ProtocolTemplate>(res)
    },
  })
}

/**
 * @deprecated Use `useProtocol` instead.
 */
export function useProtocolTemplate(slug: string) {
  return useQuery({
    queryKey: protocolKeys.detail(slug),
    queryFn: async () => {
      const res = await api.get<ProtocolTemplate | { data: ProtocolTemplate }>(`/members/protocols/library/${slug}`)
      return unwrapData<ProtocolTemplate>(res)!
    },
    enabled: !!slug && slug !== 'library',
  })
}

/**
 * Get user's active protocol by slug — uses direct backend endpoint
 * GET /api/v2/members/protocols/active/{slug}
 */
export function useActiveProtocolBySlug(slug: string) {
  return useQuery({
    queryKey: [...protocolKeys.all, 'active-by-slug', slug] as const,
    queryFn: async () => {
      try {
        const res = await api.get<ActiveProtocol | { data: ActiveProtocol }>(
          `/members/protocols/active/${slug}`,
        )
        return unwrapData<ActiveProtocol>(res) || null
      } catch (err) {
        if (is404Error(err)) return null
        throw err
      }
    },
    enabled: !!slug,
    retry: (failureCount, error) => !is404Error(error) && failureCount < 3,
  })
}

/**
 * Start a protocol
 * POST /api/v2/members/protocols/{slug}/start
 */
export function useStartProtocol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StartProtocolRequest) =>
      api.post<ActiveProtocol>(`/members/protocols/${data.protocol_slug}/start`, {
        protocol_name: data.protocol_name,
        pillar: data.pillar,
        duration_weeks: data.duration_weeks,
      }),
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
