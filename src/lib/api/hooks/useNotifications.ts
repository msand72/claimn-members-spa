import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import type { Notification, NotificationsResponse, NotificationsParams } from '../types'

export type { Notification, NotificationsResponse, NotificationsParams }

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params?: NotificationsParams) => [...notificationKeys.all, 'list', params] as const,
}

export function useNotifications(params?: NotificationsParams) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () =>
      api.get<NotificationsResponse>('/members/notifications', {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        read: params?.read,
      }),
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) =>
      api.post<{ success: boolean }>(`/members/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      api.post<{ success: boolean }>('/members/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
