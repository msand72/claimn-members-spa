import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type PaginatedResponse, type PaginationParams } from '../client'
import type {
  ActionItem,
  CreateActionItemRequest,
  UpdateActionItemRequest,
} from '../types'

// Query keys
export const actionItemKeys = {
  all: ['action-items'] as const,
  list: (params?: ActionItemsParams) => [...actionItemKeys.all, 'list', params] as const,
  detail: (id: string) => [...actionItemKeys.all, 'detail', id] as const,
}

// Extended params for action items
export interface ActionItemsParams extends PaginationParams {
  status?: 'pending' | 'completed' | 'cancelled'
  priority?: 'high' | 'medium' | 'low'
  goal_id?: string
}

// Get all action items
export function useActionItems(params?: ActionItemsParams) {
  return useQuery({
    queryKey: actionItemKeys.list(params),
    queryFn: () =>
      api.get<PaginatedResponse<ActionItem>>('/members/action-items', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
        status: params?.status,
        priority: params?.priority,
        goal_id: params?.goal_id,
      }),
  })
}

// Get single action item
export function useActionItem(id: string) {
  return useQuery({
    queryKey: actionItemKeys.detail(id),
    queryFn: () => api.get<ActionItem>(`/members/action-items/${id}`),
    enabled: !!id,
  })
}

// Create action item
export function useCreateActionItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateActionItemRequest) =>
      api.post<ActionItem>('/members/action-items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actionItemKeys.all })
    },
  })
}

// Update action item
export function useUpdateActionItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateActionItemRequest }) =>
      api.put<ActionItem>(`/members/action-items/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: actionItemKeys.all })
      queryClient.invalidateQueries({ queryKey: actionItemKeys.detail(id) })
    },
  })
}

// Delete action item
export function useDeleteActionItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/members/action-items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actionItemKeys.all })
    },
  })
}

// Toggle action item completion (convenience hook)
export function useToggleActionItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      api.put<ActionItem>(`/members/action-items/${id}`, {
        status: completed ? 'completed' : 'pending',
      }),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: actionItemKeys.all })
      const previous = queryClient.getQueriesData({ queryKey: actionItemKeys.all })
      queryClient.setQueriesData<PaginatedResponse<ActionItem>>({ queryKey: actionItemKeys.list() }, (old) => {
        if (!old?.data) return old
        return { ...old, data: old.data.map((item) => item.id === id ? { ...item, status: completed ? 'completed' : 'pending' } : item) }
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: actionItemKeys.all })
      queryClient.invalidateQueries({ queryKey: actionItemKeys.detail(id) })
    },
  })
}
