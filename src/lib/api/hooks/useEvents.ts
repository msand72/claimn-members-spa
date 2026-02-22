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

/** Helper: optimistically toggle is_registered + registered_count in all cached event lists/details */
function optimisticToggleRegistration(
  queryClient: ReturnType<typeof useQueryClient>,
  eventId: string,
  registering: boolean,
) {
  // Update every event-list query in cache
  queryClient.setQueriesData<PaginatedResponse<ClaimnEvent>>(
    { queryKey: eventKeys.all },
    (old) => {
      if (!old?.data) return old
      return {
        ...old,
        data: old.data.map((ev) =>
          ev.id === eventId
            ? {
                ...ev,
                is_registered: registering,
                registered_count: ev.registered_count + (registering ? 1 : -1),
              }
            : ev,
        ),
      }
    },
  )
  // Update single-event detail cache if present
  queryClient.setQueryData<ClaimnEvent>(eventKeys.detail(eventId), (old) => {
    if (!old) return old
    return {
      ...old,
      is_registered: registering,
      registered_count: old.registered_count + (registering ? 1 : -1),
    }
  })
}

export function useRegisterForEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (eventId: string) =>
      api.post<{ success: boolean }>(`/members/events/${eventId}/register`),
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.all })
      const previousDetail = queryClient.getQueryData<ClaimnEvent>(eventKeys.detail(eventId))
      optimisticToggleRegistration(queryClient, eventId, true)
      return { previousDetail }
    },
    onError: (_err, eventId, context) => {
      // Rollback: toggle back
      optimisticToggleRegistration(queryClient, eventId, false)
      if (context?.previousDetail) {
        queryClient.setQueryData(eventKeys.detail(eventId), context.previousDetail)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all })
    },
  })
}

export function useUnregisterFromEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (eventId: string) =>
      api.delete<{ success: boolean }>(`/members/events/${eventId}/register`),
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({ queryKey: eventKeys.all })
      const previousDetail = queryClient.getQueryData<ClaimnEvent>(eventKeys.detail(eventId))
      optimisticToggleRegistration(queryClient, eventId, false)
      return { previousDetail }
    },
    onError: (_err, eventId, context) => {
      optimisticToggleRegistration(queryClient, eventId, true)
      if (context?.previousDetail) {
        queryClient.setQueryData(eventKeys.detail(eventId), context.previousDetail)
      }
    },
    onSettled: () => {
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
    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey: goSessionKeys.all })
      await queryClient.cancelQueries({ queryKey: eventKeys.all })
      optimisticToggleRegistration(queryClient, sessionId, true)
      // Also update go-session detail cache
      const previousGoDetail = queryClient.getQueryData<ClaimnEvent>(goSessionKeys.detail(sessionId))
      if (previousGoDetail) {
        queryClient.setQueryData<ClaimnEvent>(goSessionKeys.detail(sessionId), {
          ...previousGoDetail,
          is_registered: true,
          registered_count: previousGoDetail.registered_count + 1,
        })
      }
      return { previousGoDetail }
    },
    onError: (_err, sessionId, context) => {
      optimisticToggleRegistration(queryClient, sessionId, false)
      if (context?.previousGoDetail) {
        queryClient.setQueryData(goSessionKeys.detail(sessionId), context.previousGoDetail)
      }
    },
    onSettled: () => {
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
