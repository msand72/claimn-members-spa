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
export function useConversations(params?: PaginationParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: messageKeys.conversations(params),
    queryFn: () =>
      api.get<PaginatedResponse<Conversation>>('/members/messages/conversations', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
      }),
    enabled: options?.enabled ?? true,
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
  })
}

// Send message
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SendMessageRequest) => {
      // Backend requires a non-empty body; use content or fallback for image-only messages
      const messageBody = data.content?.trim() || (data.image_url ? '[Image]' : '')
      const payload = {
        recipient_id: data.recipient_id,
        addressee_id: data.recipient_id, // Backend may use 'addressee_id' like connections
        body: messageBody, // Backend expects 'body', not 'content'
        content: messageBody, // Send both in case backend uses either
        ...(data.image_url ? { image_url: data.image_url } : {}),
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

// Delete message
export function useDeleteMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (messageId: string) =>
      api.delete(`/members/messages/${messageId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}
