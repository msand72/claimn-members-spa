import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type PaginatedResponse } from '../client'
import type { ClaimnEvent, SessionPulse, SubmitPulseRequest } from '../types'

export type { ClaimnEvent }

export interface EventsParams {
  type?: 'brotherhood_call' | 'go_session'
  status?: 'upcoming' | 'past'
  page?: number
  limit?: number
}

export const eventKeys = {
  all: ['events'] as const,
  list: (params?: EventsParams) => [...eventKeys.all, 'list', params] as const,
  detail: (id: string) => [...eventKeys.all, 'detail', id] as const,
  myEvents: () => [...eventKeys.all, 'my-events'] as const,
}

export function useEvents(params?: EventsParams) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () =>
      api.get<PaginatedResponse<ClaimnEvent>>('/members/events', {
        type: params?.type,
        status: params?.status,
        page: params?.page,
        limit: params?.limit,
      }),
  })
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => api.get<ClaimnEvent>(`/members/events/${id}`),
    enabled: !!id,
  })
}

export function useMyEvents() {
  return useQuery({
    queryKey: eventKeys.myEvents(),
    queryFn: () => api.get<PaginatedResponse<ClaimnEvent>>('/members/events/my-events'),
  })
}

export function useRegisterForEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (eventId: string) =>
      api.post<{ success: boolean }>(`/members/events/${eventId}/register`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all })
    },
  })
}

export function useUnregisterFromEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (eventId: string) =>
      api.delete<{ success: boolean }>(`/members/events/${eventId}/register`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all })
    },
  })
}

// =====================================================
// GO Sessions Member Endpoints
// =====================================================

export const goSessionKeys = {
  all: ['go-sessions'] as const,
  list: (params?: { page?: number; page_size?: number }) =>
    [...goSessionKeys.all, 'list', params] as const,
  detail: (id: string) => [...goSessionKeys.all, 'detail', id] as const,
}

export function useGoSessions(params?: { page?: number; page_size?: number }) {
  return useQuery({
    queryKey: goSessionKeys.list(params),
    queryFn: () =>
      api.get<PaginatedResponse<ClaimnEvent>>('/members/events/go-sessions', {
        page: params?.page,
        page_size: params?.page_size,
      }),
  })
}

export function useGoSession(id: string) {
  return useQuery({
    queryKey: goSessionKeys.detail(id),
    queryFn: () => api.get<ClaimnEvent>(`/members/events/go-sessions/${id}`),
    enabled: !!id,
  })
}

export function useRegisterForGoSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) =>
      api.post<{ success: boolean }>(`/members/events/go-sessions/${sessionId}/register`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goSessionKeys.all })
      queryClient.invalidateQueries({ queryKey: eventKeys.all })
    },
  })
}

// Session Pulse (GO Sessions vitality check-in)
export const pulseKeys = {
  detail: (eventId: string) => [...eventKeys.all, 'pulse', eventId] as const,
}

export function useSessionPulse(eventId: string) {
  return useQuery({
    queryKey: pulseKeys.detail(eventId),
    queryFn: () => api.get<SessionPulse>(`/members/go-sessions/${eventId}/pulse`),
    enabled: !!eventId,
    retry: false,
  })
}

export function useSubmitSessionPulse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: SubmitPulseRequest }) =>
      api.post<{ success: boolean }>(`/members/go-sessions/${eventId}/pulse`, data),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: pulseKeys.detail(eventId) })
    },
  })
}
