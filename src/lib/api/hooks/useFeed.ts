import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { api, safeArray, type PaginatedResponse, type PaginationParams } from '../client'
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
export function useFeed(params?: PaginationParams & { interest_group_id?: string }, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: feedKeys.list(params),
    queryFn: () =>
      api.get<PaginatedResponse<FeedPost>>('/members/feed', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
        interest_group_id: params?.interest_group_id,
      }),
    enabled: options?.enabled ?? true,
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
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.pagination
      return pagination?.has_next && pagination?.page ? pagination.page + 1 : undefined
    },
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
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.all })
      const previous = queryClient.getQueriesData({ queryKey: feedKeys.all })
      queryClient.setQueriesData<PaginatedResponse<FeedPost>>({ queryKey: feedKeys.list() }, (old) => {
        if (!old?.data) return old
        return { ...old, data: old.data.map((p) => p.id === postId ? { ...p, is_liked: true, likes_count: (p.likes_count ?? 0) + 1 } : p) }
      })
      return { previous }
    },
    onError: (_err, _postId, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => {
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
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.all })
      const previous = queryClient.getQueriesData({ queryKey: feedKeys.all })
      queryClient.setQueriesData<PaginatedResponse<FeedPost>>({ queryKey: feedKeys.list() }, (old) => {
        if (!old?.data) return old
        return { ...old, data: old.data.map((p) => p.id === postId ? { ...p, is_liked: false, likes_count: Math.max((p.likes_count ?? 1) - 1, 0) } : p) }
      })
      return { previous }
    },
    onError: (_err, _postId, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all })
    },
  })
}

// Get comments
export function usePostComments(postId: string) {
  return useQuery({
    queryKey: feedKeys.comments(postId),
    queryFn: async () => {
      const res = await api.get<FeedComment[] | { data: FeedComment[] }>(`/members/feed/${postId}/comments`)
      return safeArray<FeedComment>(res)
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
