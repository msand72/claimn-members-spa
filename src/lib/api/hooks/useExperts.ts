import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, safeArray, is404Error, type PaginatedResponse, type PaginationParams } from '../client'
import type {
  Expert,
  ExpertTestimonial,
  ExpertAvailabilityRaw,
  AvailableSlotsResponse,
  CoachingSession,
  SessionNote,
  SessionReview,
  BookSessionRequest,
  SubmitReviewRequest,
  UpdateSessionNoteRequest,
} from '../types'

// Query keys
export const expertKeys = {
  all: ['experts'] as const,
  list: (params?: ExpertsParams) => [...expertKeys.all, 'list', params] as const,
  detail: (id: string) => [...expertKeys.all, 'detail', id] as const,
  testimonials: (id: string) => [...expertKeys.all, 'testimonials', id] as const,
  availability: (id: string) => [...expertKeys.all, 'availability', id] as const,
  availableSlots: (id: string, date: string, duration: number) =>
    [...expertKeys.all, 'available-slots', id, date, duration] as const,
}

export const coachingKeys = {
  all: ['coaching'] as const,
  sessions: (params?: SessionsParams) => [...coachingKeys.all, 'sessions', params] as const,
  session: (id: string) => [...coachingKeys.all, 'session', id] as const,
  notes: (sessionId: string) => [...coachingKeys.all, 'notes', sessionId] as const,
  review: (sessionId: string) => [...coachingKeys.all, 'review', sessionId] as const,
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

// Get expert testimonials (backend returns paginated response)
export function useExpertTestimonials(expertId: string) {
  return useQuery({
    queryKey: expertKeys.testimonials(expertId),
    queryFn: async () => {
      const res = await api.get<ExpertTestimonial[] | { data: ExpertTestimonial[] }>(
        `/members/experts/${expertId}/testimonials`,
      )
      return safeArray<ExpertTestimonial>(res)
    },
    enabled: !!expertId,
  })
}

/** Strip seconds from "HH:MM:SS" → "HH:MM" */
function fmtTime(t: string) {
  const parts = t.split(':')
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : t
}

// Get expert availability (backend returns flat rows per day)
export function useExpertAvailability(expertId: string) {
  return useQuery({
    queryKey: expertKeys.availability(expertId),
    queryFn: async () => {
      const raw = await api.get<ExpertAvailabilityRaw[]>(
        `/members/experts/${expertId}/availability`,
      )
      const rows = Array.isArray(raw) ? raw : []
      return rows
        .filter((r) => r.is_active)
        .map((r) => ({
          id: r.id,
          day: r.day_of_week || '',
          time: `${fmtTime(r.start_time)} – ${fmtTime(r.end_time)}`,
          startTime: fmtTime(r.start_time),
          endTime: fmtTime(r.end_time),
        }))
    },
    enabled: !!expertId,
  })
}

// Get available slots for a specific date (server-computed, conflict-free)
// Falls back gracefully — returns null if endpoint doesn't exist yet (404)
export function useAvailableSlots(expertId: string, date: string, duration: number = 60) {
  return useQuery({
    queryKey: expertKeys.availableSlots(expertId, date, duration),
    queryFn: async () => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
        return await api.get<AvailableSlotsResponse>(
          `/members/experts/${expertId}/available-slots`,
          { date, duration, timezone: tz },
        )
      } catch (err) {
        // 404 = endpoint not deployed yet → return null so UI falls back to client-side slots
        if (is404Error(err)) return null
        throw err
      }
    },
    enabled: !!expertId && !!date,
    retry: (failureCount, error) => !is404Error(error) && failureCount < 1,
    staleTime: 2 * 60 * 1000, // 2 minutes — slots can change as others book
  })
}

// =====================================================
// Coaching Session Hooks
// =====================================================

/**
 * Single source of truth for the member-side coaching/coach session endpoint.
 *
 * The backend's WS2 work consolidates `coaching_sessions` + `expert_sessions`
 * into a unified `coach_sessions` table over the next 4–6 weeks. When that
 * cutover lands, the path here changes to e.g. `/members/coach-sessions` and
 * every hook in this file follows automatically. Old path will alias for
 * one release cycle. Don't reference this string anywhere else in the app —
 * always go through the hooks below.
 */
const COACHING_SESSIONS_BASE = '/members/coaching/sessions'

// Get all coaching sessions
// Polls every 60s to pick up status changes (reschedule responses, cancellations)
export function useCoachingSessions(params?: SessionsParams) {
  return useQuery({
    queryKey: coachingKeys.sessions(params),
    queryFn: () =>
      api.get<PaginatedResponse<CoachingSession>>(COACHING_SESSIONS_BASE, {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
        status: params?.status,
      }),
    refetchInterval: 60_000,
  })
}

// Get single coaching session
export function useCoachingSession(id: string) {
  return useQuery({
    queryKey: coachingKeys.session(id),
    queryFn: () => api.get<CoachingSession>(`${COACHING_SESSIONS_BASE}/${id}`),
    enabled: !!id,
  })
}

// Book a coaching session
export function useBookSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BookSessionRequest) =>
      api.post<CoachingSession>(COACHING_SESSIONS_BASE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.all })
    },
  })
}

// Cancel a coaching session via dedicated cancel endpoint
export function useCancelSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, reason }: { sessionId: string; reason?: string }) =>
      api.patch<CoachingSession>(`${COACHING_SESSIONS_BASE}/${sessionId}/cancel`, {
        reason: reason || 'Cancelled by member',
      }),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.all })
      queryClient.invalidateQueries({ queryKey: coachingKeys.session(sessionId) })
    },
  })
}

// Reschedule a coaching session
export function useRescheduleSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, data }: {
      sessionId: string
      data: { proposed_datetime: string; reason?: string }
    }) => api.patch<CoachingSession>(`${COACHING_SESSIONS_BASE}/${sessionId}/reschedule`, data),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.all })
      queryClient.invalidateQueries({ queryKey: coachingKeys.session(sessionId) })
    },
  })
}

// In-place schedule / reschedule for pre-allocated (program quota) sessions.
//
// Hits POST /members/coaching/sessions/{id}/schedule which UPDATEs the
// existing row rather than inserting a new one — preserves program quota
// counts and preserves the Teams meeting URL across reschedules.
//
// Allowed transitions (server-enforced):
//   awaiting_schedule  → scheduled (initial book — provisions Teams meeting)
//   scheduled          → scheduled (reschedule — moves Teams meeting, same joinUrl)
//   reschedule_requested → scheduled (accept coach's proposed time)
//
// Returns 400 INVALID_STATUS for cancelled/completed/no_show/rejected,
// 409 SLOT_UNAVAILABLE on overlap, 404 if not owned by member.
//
// meeting_url may be null in the immediate response — Teams meeting is
// provisioned async. Refetch ~2-3s later to surface the joinUrl.
export function useScheduleCoachingSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, data }: {
      sessionId: string
      data: { session_date: string; duration_minutes?: number }
    }) => api.post<CoachingSession>(`${COACHING_SESSIONS_BASE}/${sessionId}/schedule`, data),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.all })
      queryClient.invalidateQueries({ queryKey: coachingKeys.session(sessionId) })
      // Refetch ~2.5s later so the Teams meeting_url has time to provision
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: coachingKeys.session(sessionId) })
      }, 2500)
    },
  })
}

// =====================================================
// Session Notes Hooks
// =====================================================

// Get session notes (returns null if no notes exist yet)
export function useSessionNotes(sessionId: string) {
  return useQuery({
    queryKey: coachingKeys.notes(sessionId),
    queryFn: async () => {
      try {
        return await api.get<SessionNote>(`${COACHING_SESSIONS_BASE}/${sessionId}/notes`)
      } catch (err) {
        // 404 means notes haven't been created yet — not an error
        if (is404Error(err)) return null
        throw err
      }
    },
    enabled: !!sessionId,
    retry: (failureCount, error) => !is404Error(error) && failureCount < 1,
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
    }) => api.put<SessionNote>(`${COACHING_SESSIONS_BASE}/${sessionId}/notes`, data),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.notes(sessionId) })
    },
  })
}

// =====================================================
// Session Review Hooks
// =====================================================

// Get member's review for a session (returns null if not reviewed yet)
export function useSessionReview(sessionId: string) {
  return useQuery({
    queryKey: coachingKeys.review(sessionId),
    queryFn: async () => {
      try {
        return await api.get<SessionReview>(`${COACHING_SESSIONS_BASE}/${sessionId}/review`)
      } catch (err) {
        if (is404Error(err)) return null
        throw err
      }
    },
    enabled: !!sessionId,
    retry: (failureCount, error) => !is404Error(error) && failureCount < 1,
  })
}

// Submit a review for a completed session
export function useSubmitReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: SubmitReviewRequest }) =>
      api.post<SessionReview>(`${COACHING_SESSIONS_BASE}/${sessionId}/review`, data),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.review(sessionId) })
      queryClient.invalidateQueries({ queryKey: coachingKeys.all })
    },
  })
}
