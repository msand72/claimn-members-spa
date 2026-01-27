import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type PaginatedResponse, type PaginationParams } from '../client'
import type {
  Expert,
  ExpertTestimonial,
  ExpertAvailabilitySlot,
  CoachingSession,
  SessionNote,
  BookSessionRequest,
  UpdateSessionNoteRequest,
} from '../types'

// Query keys
export const expertKeys = {
  all: ['experts'] as const,
  list: (params?: ExpertsParams) => [...expertKeys.all, 'list', params] as const,
  detail: (id: string) => [...expertKeys.all, 'detail', id] as const,
  testimonials: (id: string) => [...expertKeys.all, 'testimonials', id] as const,
  availability: (id: string) => [...expertKeys.all, 'availability', id] as const,
}

export const coachingKeys = {
  all: ['coaching'] as const,
  sessions: (params?: SessionsParams) => [...coachingKeys.all, 'sessions', params] as const,
  session: (id: string) => [...coachingKeys.all, 'session', id] as const,
  notes: (sessionId: string) => [...coachingKeys.all, 'notes', sessionId] as const,
}

// Extended params for experts
export interface ExpertsParams extends PaginationParams {
  specialty?: string
  search?: string
  is_top_rated?: boolean
}

// Extended params for sessions
export interface SessionsParams extends PaginationParams {
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
}

// =====================================================
// Expert Hooks
// =====================================================

// Get all experts
export function useExperts(params?: ExpertsParams) {
  return useQuery({
    queryKey: expertKeys.list(params),
    queryFn: () =>
      api.get<PaginatedResponse<Expert>>('/members/experts', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
        specialty: params?.specialty,
        search: params?.search,
        is_top_rated: params?.is_top_rated,
      }),
  })
}

// Get single expert
export function useExpert(id: string) {
  return useQuery({
    queryKey: expertKeys.detail(id),
    queryFn: () => api.get<Expert>(`/members/experts/${id}`),
    enabled: !!id,
  })
}

// Get expert testimonials
export function useExpertTestimonials(expertId: string) {
  return useQuery({
    queryKey: expertKeys.testimonials(expertId),
    queryFn: () => api.get<ExpertTestimonial[]>(`/members/experts/${expertId}/testimonials`),
    enabled: !!expertId,
  })
}

// Get expert availability
export function useExpertAvailability(expertId: string) {
  return useQuery({
    queryKey: expertKeys.availability(expertId),
    queryFn: () => api.get<ExpertAvailabilitySlot[]>(`/members/experts/${expertId}/availability`),
    enabled: !!expertId,
  })
}

// =====================================================
// Coaching Session Hooks
// =====================================================

// Get all coaching sessions
export function useCoachingSessions(params?: SessionsParams) {
  return useQuery({
    queryKey: coachingKeys.sessions(params),
    queryFn: () =>
      api.get<PaginatedResponse<CoachingSession>>('/members/coaching/sessions', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
        status: params?.status,
      }),
  })
}

// Get single coaching session
export function useCoachingSession(id: string) {
  return useQuery({
    queryKey: coachingKeys.session(id),
    queryFn: () => api.get<CoachingSession>(`/members/coaching/sessions/${id}`),
    enabled: !!id,
  })
}

// Book a coaching session
export function useBookSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BookSessionRequest) =>
      api.post<CoachingSession>('/members/coaching/sessions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.all })
    },
  })
}

// Cancel a coaching session
export function useCancelSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) =>
      api.put<CoachingSession>(`/members/coaching/sessions/${sessionId}`, {
        status: 'cancelled',
      }),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.all })
      queryClient.invalidateQueries({ queryKey: coachingKeys.session(sessionId) })
    },
  })
}

// =====================================================
// Session Notes Hooks
// =====================================================

// Get session notes
export function useSessionNotes(sessionId: string) {
  return useQuery({
    queryKey: coachingKeys.notes(sessionId),
    queryFn: () => api.get<SessionNote>(`/members/coaching/sessions/${sessionId}/notes`),
    enabled: !!sessionId,
  })
}

// Update session notes
export function useUpdateSessionNotes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: string
      data: UpdateSessionNoteRequest
    }) => api.put<SessionNote>(`/members/coaching/sessions/${sessionId}/notes`, data),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.notes(sessionId) })
    },
  })
}
