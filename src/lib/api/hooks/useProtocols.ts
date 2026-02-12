import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, safeArray, unwrapData, is404Error, type PaginationParams } from '../client'
import type {
  ActiveProtocol,
  StartProtocolRequest,
  UpdateProtocolProgressRequest,
} from '../types'

// Protocol template from library (read-only)
export interface ProtocolTemplate {
  slug: string
  title: string
  pillar: string
  category?: string
  description: string
  headline_stat?: string
  subtitle?: string
  duration_weeks?: number
  is_featured?: boolean
  keywords?: string[]
  stats?: ProtocolStat[]
  scientific_foundation?: string
  scientific_citations?: string[]
  protocol_sections?: ProtocolSection[]
  implementation_steps?: ImplementationStep[]
  implementation_guides?: ImplementationGuide[]
  // Fields from DB that were previously unused in frontend
  tracking_methods?: TrackingMethod[]
  success_metrics?: SuccessMetric[]
  emergency_protocols?: EmergencyProtocol[]
  related_protocol_slugs?: string[]
  prerequisite_protocol_slugs?: string[]
  hero_image_url?: string
  hero_background_style?: string
  created_at?: string
  updated_at?: string
  // Computed/legacy fields for backwards compatibility
  name?: string // alias for title
  stat?: string // alias for headline_stat
  timeline?: string // computed from duration_weeks
  weeks?: ProtocolWeek[] // legacy structure
}

// JSONB array types - structure inferred from Go handler; no seed data exists yet
export interface TrackingMethod {
  title: string
  description?: string
  frequency?: string
}

export interface SuccessMetric {
  title: string
  target?: string
  description?: string
}

export interface EmergencyProtocol {
  title: string
  description?: string
  steps?: string[]
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

export interface ProtocolSection {
  id: string
  title: string
  icon?: string
  items: string[]
}

export interface ImplementationStep {
  step: number
  title: string
  description: string
}

export interface ImplementationGuide {
  id: string
  title: string
  description: string
  details?: string[]
}

export interface ProtocolStat {
  label?: string
  value?: string
  description?: string
  // DB seed format uses these keys
  stat?: string
  title?: string
  desc?: string
}

// Protocols grouped by pillar response
export interface ProtocolsByPillar {
  identity: ProtocolTemplate[]
  emotional: ProtocolTemplate[]
  physical: ProtocolTemplate[]
  connection: ProtocolTemplate[]
  mission: ProtocolTemplate[]
}

// Weekly progress log request
export interface LogProtocolProgressRequest {
  week: number
  notes?: string
  metrics?: Record<string, number>
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
}

// Extended params for active protocols
export interface ActiveProtocolsParams extends PaginationParams {
  status?: 'active' | 'paused' | 'completed' | 'abandoned'
}

// =====================================================
// NEW HOOKS per requirements
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
 * Get protocols grouped by pillar
 * GET /api/v2/members/protocols/library/pillars
 */
export function useProtocolsByPillar() {
  return useQuery({
    queryKey: protocolKeys.pillars(),
    queryFn: async () => {
      const res = await api.get<ProtocolsByPillar | { data: ProtocolsByPillar }>('/members/protocols/library/pillars')
      return unwrapData<ProtocolsByPillar>(res)!
    },
  })
}

/**
 * Get featured protocols
 * GET /api/v2/members/protocols/library/featured
 */
export function useFeaturedProtocols() {
  return useQuery({
    queryKey: protocolKeys.featured(),
    queryFn: async () => {
      const res = await api.get<ProtocolTemplate[] | { data: ProtocolTemplate[] }>('/members/protocols/library/featured')
      return safeArray<ProtocolTemplate>(res)
    },
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

// =====================================================
// LEGACY HOOKS (kept for backward compatibility)
// =====================================================

// Get user's active protocols (legacy - alias to useMyActiveProtocols)
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

// Get protocol library (available protocols) - alias to useProtocols
export function useProtocolLibrary() {
  return useQuery({
    queryKey: protocolKeys.library(),
    queryFn: async () => {
      const res = await api.get<ProtocolTemplate[] | { data: ProtocolTemplate[] }>('/members/protocols/library')
      return safeArray<ProtocolTemplate>(res)
    },
  })
}

// Get single protocol template from library - alias to useProtocol
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
        // Query active protocols and filter by slug
        const res = await api.get<ActiveProtocol[] | { data: ActiveProtocol[] }>('/members/protocols/active')
        const protocols = safeArray<ActiveProtocol>(res)
        return protocols.find(p => p.protocol_slug === slug) || null
      } catch (err) {
        // 404 means user hasn't started this protocol — not a real error
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
