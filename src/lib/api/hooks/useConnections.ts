import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type PaginatedResponse, type PaginationParams } from '../client'
import type { Connection, CreateConnectionRequest } from '../types'

// Query keys
export const connectionKeys = {
  all: ['connections'] as const,
  list: (params?: PaginationParams & { status?: string }) =>
    [...connectionKeys.all, 'list', params] as const,
  pending: () => [...connectionKeys.all, 'pending'] as const,
}

// Get connections
export function useConnections(params?: PaginationParams & { status?: string }) {
  return useQuery({
    queryKey: connectionKeys.list(params),
    queryFn: () =>
      api.get<PaginatedResponse<Connection>>('/members/connections', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
        status: params?.status,
      }),
  })
}

// Get pending connection requests
export function usePendingConnections() {
  return useQuery({
    queryKey: connectionKeys.pending(),
    queryFn: () =>
      api.get<PaginatedResponse<Connection>>('/members/connections', {
        status: 'pending',
      }),
  })
}

// Send connection request
export function useSendConnectionRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateConnectionRequest) => {
      console.log('[useSendConnectionRequest] payload:', JSON.stringify(data))
      return api.post<Connection>('/members/connections', data)
    },
    onError: (error) => {
      console.error('[useSendConnectionRequest] error:', error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: connectionKeys.all })
    },
  })
}

// Accept connection request
export function useAcceptConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (connectionId: string) =>
      api.put<Connection>(`/members/connections/${connectionId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: connectionKeys.all })
    },
  })
}

// Reject connection request
export function useRejectConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (connectionId: string) =>
      api.put<Connection>(`/members/connections/${connectionId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: connectionKeys.all })
    },
  })
}

// Remove connection
export function useRemoveConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (connectionId: string) =>
      api.delete(`/members/connections/${connectionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: connectionKeys.all })
    },
  })
}
