import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type PaginatedResponse } from '../client'

export interface ClaimnEvent {
  id: string
  type: 'brotherhood_call' | 'go_session'
  title: string
  description: string
  start_time: string
  duration_minutes: number
  capacity: number
  registered_count: number
  is_registered: boolean
  tier_required: string
  facilitator: {
    name: string
    avatar_url: string
  }
}

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
