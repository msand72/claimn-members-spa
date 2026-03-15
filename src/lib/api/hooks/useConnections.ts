import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type PaginatedResponse, type PaginationParams } from '../client'
import type { Connection, CreateConnectionRequest } from '../types'
import { networkKeys } from './useNetwork'

// Query keys
export const connectionKeys = {
  all: ['connections'] as const,
  list: (params?: PaginationParams & { status?: string }) =>
    [...connectionKeys.all, 'list', params] as const,
  pending: () => [...connectionKeys.all, 'pending'] as const,
}

// Get connections
export function useConnections(params?: PaginationParams & { status?: string }, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: connectionKeys.list(params),
    queryFn: () =>
      api.get<PaginatedResponse<Connection>>('/members/connections', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
        status: params?.status,
      }),
    enabled: options?.enabled ?? true,
  })
}

// Get pending connection requests
export function usePendingConnections(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: connectionKeys.pending(),
    queryFn: () =>
      api.get<PaginatedResponse<Connection>>('/members/connections', {
        status: 'pending',
      }),
    enabled: options?.enabled ?? true,
  })
}

// Send connection request
export function useSendConnectionRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateConnectionRequest) => {
      try {
        return await api.post<Connection>('/members/connections', data)
      } catch (err: any) {
        // 409 = connection already exists — treat as success
        if (err?.status === 409) return {} as Connection
        throw err
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: connectionKeys.all })
      queryClient.invalidateQueries({ queryKey: networkKeys.all })
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
      queryClient.invalidateQueries({ queryKey: networkKeys.all })
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
      queryClient.invalidateQueries({ queryKey: networkKeys.all })
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
      queryClient.invalidateQueries({ queryKey: networkKeys.all })
    },
  })
}
