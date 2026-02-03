import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type PaginatedResponse, type PaginationParams } from '../client'
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
export function useConversations(params?: PaginationParams) {
  return useQuery({
    queryKey: messageKeys.conversations(params),
    queryFn: () =>
      api.get<PaginatedResponse<Conversation>>('/members/messages/conversations', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
      }),
  })
}

// Get messages in a conversation
export function useConversationMessages(
  conversationId: string,
  params?: PaginationParams
) {
  return useQuery({
    queryKey: messageKeys.messages(conversationId, params),
    queryFn: () =>
      api.get<PaginatedResponse<Message>>(
        `/members/messages/conversations/${conversationId}`,
        {
          page: params?.page,
          limit: params?.limit,
          sort: params?.sort || 'created_at:desc',
        }
      ),
    enabled: !!conversationId,
  })
}

// Send message
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SendMessageRequest) =>
      api.post<Message>('/members/messages', {
        recipient_id: data.recipient_id,
        addressee_id: data.recipient_id, // Backend may use 'addressee_id' like connections
        body: data.content, // Backend expects 'body', not 'content'
        content: data.content, // Send both in case backend uses either
        ...(data.image_url ? { image_url: data.image_url } : {}),
      }),
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
