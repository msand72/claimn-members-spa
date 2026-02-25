import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type PaginatedResponse } from '../client'
import type { ClaimnEvent } from '../types'

export type { ClaimnEvent }

export interface EventsParams {
  type?: 'brotherhood_call' | 'session'
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
// Sessions Member Endpoints
// =====================================================

export const sessionKeys = {
  all: ['sessions'] as const,
  list: (params?: { page?: number; page_size?: number }) =>
    [...sessionKeys.all, 'list', params] as const,
  detail: (id: string) => [...sessionKeys.all, 'detail', id] as const,
}

export function useSessions(params?: { page?: number; page_size?: number }) {
  return useQuery({
    queryKey: sessionKeys.list(params),
    queryFn: () =>
      api.get<PaginatedResponse<ClaimnEvent>>('/members/events/sessions', {
        page: params?.page,
        page_size: params?.page_size,
      }),
  })
}

export function useSession(id: string) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: () => api.get<ClaimnEvent>(`/members/events/sessions/${id}`),
    enabled: !!id,
  })
}

export function useRegisterForSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) =>
      api.post<{ success: boolean }>(`/members/events/sessions/${sessionId}/register`),
    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey: sessionKeys.all })
      await queryClient.cancelQueries({ queryKey: eventKeys.all })
      optimisticToggleRegistration(queryClient, sessionId, true)
      // Also update session detail cache
      const previousDetail = queryClient.getQueryData<ClaimnEvent>(sessionKeys.detail(sessionId))
      if (previousDetail) {
        queryClient.setQueryData<ClaimnEvent>(sessionKeys.detail(sessionId), {
          ...previousDetail,
          is_registered: true,
          registered_count: previousDetail.registered_count + 1,
        })
      }
      return { previousDetail }
    },
    onError: (_err, sessionId, context) => {
      optimisticToggleRegistration(queryClient, sessionId, false)
      if (context?.previousDetail) {
        queryClient.setQueryData(sessionKeys.detail(sessionId), context.previousDetail)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all })
      queryClient.invalidateQueries({ queryKey: eventKeys.all })
    },
  })
}

