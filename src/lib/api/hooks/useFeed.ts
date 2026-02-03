import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { api, type PaginatedResponse, type PaginationParams } from '../client'
import type { FeedPost, CreatePostRequest, FeedComment, CreateCommentRequest } from '../types'

// Query keys
export const feedKeys = {
  all: ['feed'] as const,
  list: (params?: PaginationParams & { interest_group_id?: string }) =>
    [...feedKeys.all, 'list', params] as const,
  post: (id: string) => [...feedKeys.all, 'post', id] as const,
  comments: (postId: string) => [...feedKeys.all, 'comments', postId] as const,
}

// Get feed posts with pagination
export function useFeed(params?: PaginationParams & { interest_group_id?: string }) {
  return useQuery({
    queryKey: feedKeys.list(params),
    queryFn: () =>
      api.get<PaginatedResponse<FeedPost>>('/members/feed', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
        interest_group_id: params?.interest_group_id,
      }),
  })
}

// Infinite scroll feed
export function useInfiniteFeed(params?: { interest_group_id?: string; limit?: number }) {
  return useInfiniteQuery({
    queryKey: feedKeys.list(params),
    queryFn: ({ pageParam = 1 }) =>
      api.get<PaginatedResponse<FeedPost>>('/members/feed', {
        page: pageParam,
        limit: params?.limit || 20,
        interest_group_id: params?.interest_group_id,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_next ? lastPage.pagination.page + 1 : undefined,
  })
}

// Create post
export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePostRequest) =>
      api.post<FeedPost>('/members/feed', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all })
    },
  })
}

// Delete post
export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (postId: string) => api.delete(`/members/feed/${postId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all })
    },
  })
}

// Like post
export function useLikePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (postId: string) =>
      api.post(`/members/feed/${postId}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all })
    },
  })
}

// Unlike post
export function useUnlikePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (postId: string) =>
      api.delete(`/members/feed/${postId}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all })
    },
  })
}

// Get comments
export function usePostComments(postId: string) {
  return useQuery({
    queryKey: feedKeys.comments(postId),
    queryFn: async () => {
      const res = await api.get<any>(`/members/feed/${postId}/comments`)
      // Backend may return bare array or { data: [...] } wrapper
      if (Array.isArray(res)) return res as FeedComment[]
      if (res && Array.isArray(res.data)) return res.data as FeedComment[]
      return [] as FeedComment[]
    },
    enabled: !!postId,
  })
}

// Add comment
export function useAddComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: CreateCommentRequest }) =>
      api.post<FeedComment>(`/members/feed/${postId}/comments`, data),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: feedKeys.comments(postId) })
      queryClient.invalidateQueries({ queryKey: feedKeys.all })
    },
  })
}

// Delete comment
export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) =>
      api.delete(`/members/feed/${postId}/comments/${commentId}`),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: feedKeys.comments(postId) })
      queryClient.invalidateQueries({ queryKey: feedKeys.all })
    },
  })
}
