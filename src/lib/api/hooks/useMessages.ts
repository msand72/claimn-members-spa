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
    queryFn: async () => {
      console.log('[DEBUG useConversations] Fetching conversations with params:', JSON.stringify(params))
      const result = await api.get<PaginatedResponse<Conversation>>('/members/messages/conversations', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
      })
      console.log('[DEBUG useConversations] Raw response:', JSON.stringify(result, null, 2).slice(0, 3000))
      return result
    },
  })
}

// Get messages in a conversation
// The backend may return empty conversation_id in the conversations list,
// so conversationId here might be an other_user_id fallback.
// We try the conversation endpoint first; if it 404s we could try a user-based lookup.
export function useConversationMessages(
  conversationId: string,
  params?: PaginationParams
) {
  return useQuery({
    queryKey: messageKeys.messages(conversationId, params),
    queryFn: async () => {
      console.log('[DEBUG useConversationMessages] Fetching messages for conversationId:', conversationId)
      try {
        const result = await api.get<PaginatedResponse<Message>>(
          `/members/messages/conversations/${conversationId}`,
          {
            page: params?.page,
            limit: params?.limit,
            sort: params?.sort || 'created_at:desc',
          }
        )
        console.log('[DEBUG useConversationMessages] Response:', JSON.stringify(result, null, 2).slice(0, 3000))
        return result
      } catch (error: unknown) {
        const err = error as { status?: number; message?: string }
        console.log('[DEBUG useConversationMessages] Error fetching by conversationId:', err?.status, err?.message)
        // If 404, the conversationId might actually be a user ID (backend returns empty conversation_id).
        // Try fetching with user-based query parameter instead.
        if (err?.status === 404) {
          console.log('[DEBUG useConversationMessages] Retrying with user_id query param, userId:', conversationId)
          try {
            const fallbackResult = await api.get<PaginatedResponse<Message>>(
              `/members/messages`,
              {
                user_id: conversationId,
                page: params?.page,
                limit: params?.limit,
                sort: params?.sort || 'created_at:desc',
              }
            )
            console.log('[DEBUG useConversationMessages] Fallback response:', JSON.stringify(fallbackResult, null, 2).slice(0, 3000))
            return fallbackResult
          } catch (fallbackError: unknown) {
            const fbErr = fallbackError as { status?: number; message?: string }
            console.log('[DEBUG useConversationMessages] Fallback also failed:', fbErr?.status, fbErr?.message)
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
      const payload = {
        recipient_id: data.recipient_id,
        addressee_id: data.recipient_id, // Backend may use 'addressee_id' like connections
        body: data.content, // Backend expects 'body', not 'content'
        content: data.content, // Send both in case backend uses either
        ...(data.image_url ? { image_url: data.image_url } : {}),
      }
      console.log('[DEBUG useSendMessage] Sending message:', JSON.stringify(payload))
      return api.post<Message>('/members/messages', payload)
    },
    onSuccess: (data) => {
      console.log('[DEBUG useSendMessage] Send success, response:', JSON.stringify(data, null, 2).slice(0, 2000))
      queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
    onError: (error: unknown) => {
      const err = error as { status?: number; message?: string }
      console.log('[DEBUG useSendMessage] Send error:', err?.status, err?.message, JSON.stringify(error, null, 2).slice(0, 1000))
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
