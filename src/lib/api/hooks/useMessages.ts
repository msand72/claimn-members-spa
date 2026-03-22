import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, is404Error, type PaginatedResponse, type PaginationParams } from '../client'
import type { Conversation, Message, SendMessageRequest } from '../types'

// Query keys
export const messageKeys = {
  all: ['messages'] as const,
  conversations: (params?: PaginationParams) =>
    [...messageKeys.all, 'conversations', params] as const,
  conversation: (id: string) => [...messageKeys.all, 'conversation', id] as const,
  messages: (conversationId: string, params?: PaginationParams) =>
    [...messageKeys.all, 'messages', conversationId, params] as const,
}

// Get conversations
// Poll every 15s when enabled to provide near-real-time message updates
export function useConversations(params?: PaginationParams, options?: { enabled?: boolean; polling?: boolean }) {
  return useQuery({
    queryKey: messageKeys.conversations(params),
    queryFn: () =>
      api.get<PaginatedResponse<Conversation>>('/members/messages/conversations', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
      }),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.polling ? 15_000 : undefined,
  })
}

// Get messages in a conversation
// The backend may return empty conversation_id in the conversations list,
// so conversationId here might be an other_user_id fallback.
// We try the conversation endpoint first; if it 404s we try a user-based lookup.
export function useConversationMessages(
  conversationId: string,
  params?: PaginationParams
) {
  return useQuery({
    queryKey: messageKeys.messages(conversationId, params),
    queryFn: async () => {
      try {
        return await api.get<PaginatedResponse<Message>>(
          `/members/messages/conversations/${conversationId}`,
          {
            page: params?.page,
            limit: params?.limit,
            sort: params?.sort || 'created_at:desc',
          }
        )
      } catch (error: unknown) {
        // If 404, the conversationId might actually be a user ID (backend returns empty conversation_id).
        // Try fetching with user-based query parameter instead.
        if (is404Error(error)) {
          try {
            return await api.get<PaginatedResponse<Message>>(
              `/members/messages`,
              {
                user_id: conversationId,
                page: params?.page,
                limit: params?.limit,
                sort: params?.sort || 'created_at:desc',
              }
            )
          } catch {
            throw error // throw original error
          }
        }
        throw error
      }
    },
    enabled: !!conversationId,
    retry: false, // Don't auto-retry since we handle 404 manually
    refetchInterval: conversationId ? 10_000 : undefined, // Poll every 10s for new messages
  })
}

// Send message
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SendMessageRequest) => {
      const messageBody = data.content?.trim() || (data.image_url ? '[Image]' : '')
      const payload: Record<string, string> = {
        recipient_id: data.recipient_id,
        body: messageBody,
      }
      if (data.image_url) {
        payload.image_url = data.image_url
      }
      return api.post<Message>('/members/messages', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}

// Mark message as read
export function useMarkMessageRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (messageId: string) =>
      api.put(`/members/messages/${messageId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}

// Mark conversation as read
export function useMarkConversationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversationId: string) =>
      api.put(`/members/messages/conversations/${conversationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}

// Edit message — optimistic (messages use 'body' not 'content')
export function useEditMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ messageId, body }: { messageId: string; body: string }) =>
      api.put(`/members/messages/${messageId}`, { body }),
    onMutate: async ({ messageId, body }) => {
      await queryClient.cancelQueries({ queryKey: messageKeys.all })
      const previous = queryClient.getQueriesData({ queryKey: messageKeys.all })
      queryClient.setQueriesData<PaginatedResponse<Message>>(
        { queryKey: messageKeys.all },
        (old) => {
          if (!old?.data) return old
          return { ...old, data: old.data.map((m) => m.id === messageId ? { ...m, body, content: body } : m) }
        },
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}

// Delete message — optimistic
export function useDeleteMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (messageId: string) =>
      api.delete(`/members/messages/${messageId}`),
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: messageKeys.all })
      const previous = queryClient.getQueriesData({ queryKey: messageKeys.all })
      // Remove message from all conversation caches
      queryClient.setQueriesData<PaginatedResponse<Message>>(
        { queryKey: messageKeys.all },
        (old) => {
          if (!old?.data) return old
          return { ...old, data: old.data.filter((m) => m.id !== messageId) }
        },
      )
      return { previous }
    },
    onError: (_err, _messageId, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}

// Report message
export function useReportMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ messageId, data }: { messageId: string; data: { reason: string; details?: string } }) =>
      api.post(`/members/messages/${messageId}/report`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}
