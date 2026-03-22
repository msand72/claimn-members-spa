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

// Helper: update all feed list caches (matches any params variant)
function updateFeedPosts(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (posts: FeedPost[]) => FeedPost[],
) {
  queryClient.setQueriesData<PaginatedResponse<FeedPost>>(
    { queryKey: feedKeys.all },
    (old) => {
      if (!old?.data) return old
      return { ...old, data: updater(old.data) }
    },
  )
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

// Create post — optimistically prepend to feed
export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePostRequest & { _optimistic?: { authorName: string; authorAvatar?: string; userId: string } }) => {
      const { _optimistic, ...payload } = data
      void _optimistic // used only in onMutate
      return api.post<FeedPost>('/members/feed', payload)
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.all })
      const previous = queryClient.getQueriesData({ queryKey: feedKeys.all })

      if (data._optimistic) {
        const tempPost: FeedPost = {
          id: `temp-${Date.now()}`,
          user_id: data._optimistic.userId,
          content: data.content,
          image_url: data.image_url || null,
          interest_group_id: data.interest_group_id || null,
          likes_count: 0,
          comments_count: 0,
          is_liked: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author_name: data._optimistic.authorName,
          author_avatar: data._optimistic.authorAvatar,
        }
        updateFeedPosts(queryClient, (posts) => [tempPost, ...posts])
      }

      return { previous }
    },
    onError: (_err, _data, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all })
    },
  })
}

// Delete post — optimistically remove from feed
export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (postId: string) => api.delete(`/members/feed/${postId}`),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.all })
      const previous = queryClient.getQueriesData({ queryKey: feedKeys.all })
      updateFeedPosts(queryClient, (posts) => posts.filter((p) => p.id !== postId))
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

// Edit post — optimistic
export function useEditPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      api.put(`/members/feed/${postId}`, { content }),
    onMutate: async ({ postId, content }) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.all })
      const previous = queryClient.getQueriesData({ queryKey: feedKeys.all })
      updateFeedPosts(queryClient, (posts) =>
        posts.map((p) => p.id === postId ? { ...p, content, updated_at: new Date().toISOString() } : p)
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all })
    },
  })
}

// Edit comment — optimistic
export function useEditComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, commentId, content }: { postId: string; commentId: string; content: string }) =>
      api.put(`/members/feed/${postId}/comments/${commentId}`, { content }),
    onMutate: async ({ postId, commentId, content }) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.comments(postId) })
      const previousComments = queryClient.getQueryData<FeedComment[]>(feedKeys.comments(postId))
      queryClient.setQueryData<FeedComment[]>(feedKeys.comments(postId), (old) =>
        (old ?? []).map((c) => c.id === commentId ? { ...c, content } : c)
      )
      return { previousComments }
    },
    onError: (_err, { postId }, context) => {
      if (context?.previousComments !== undefined) {
        queryClient.setQueryData(feedKeys.comments(postId), context.previousComments)
      }
    },
    onSettled: (_, __, { postId }) => {
      queryClient.invalidateQueries({ queryKey: feedKeys.comments(postId) })
    },
  })
}

// Like post — optimistic
export function useLikePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (postId: string) =>
      api.post(`/members/feed/${postId}/like`),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.all })
      const previous = queryClient.getQueriesData({ queryKey: feedKeys.all })
      updateFeedPosts(queryClient, (posts) =>
        posts.map((p) => p.id === postId ? { ...p, is_liked: true, likes_count: (p.likes_count ?? 0) + 1 } : p)
      )
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

// Unlike post — optimistic
export function useUnlikePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (postId: string) =>
      api.delete(`/members/feed/${postId}/like`),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.all })
      const previous = queryClient.getQueriesData({ queryKey: feedKeys.all })
      updateFeedPosts(queryClient, (posts) =>
        posts.map((p) => p.id === postId ? { ...p, is_liked: false, likes_count: Math.max((p.likes_count ?? 1) - 1, 0) } : p)
      )
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

// Add comment — optimistic
export function useAddComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, data, _optimistic }: { postId: string; data: CreateCommentRequest; _optimistic?: { authorName: string; userId: string } }) => {
      void _optimistic
      return api.post<FeedComment>(`/members/feed/${postId}/comments`, data)
    },
    onMutate: async ({ postId, data, _optimistic }) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.comments(postId) })
      await queryClient.cancelQueries({ queryKey: feedKeys.all })

      const previousComments = queryClient.getQueryData<FeedComment[]>(feedKeys.comments(postId))
      const previousFeed = queryClient.getQueriesData({ queryKey: feedKeys.all })

      // Optimistically add comment
      if (_optimistic) {
        const tempComment: FeedComment = {
          id: `temp-${Date.now()}`,
          post_id: postId,
          user_id: _optimistic.userId,
          content: data.content,
          created_at: new Date().toISOString(),
          author_name: _optimistic.authorName,
        }
        queryClient.setQueryData<FeedComment[]>(feedKeys.comments(postId), (old) =>
          [...(old ?? []), tempComment]
        )
      }

      // Optimistically increment comments_count
      updateFeedPosts(queryClient, (posts) =>
        posts.map((p) => p.id === postId ? { ...p, comments_count: (p.comments_count ?? 0) + 1 } : p)
      )

      return { previousComments, previousFeed }
    },
    onError: (_err, { postId }, context) => {
      if (context?.previousComments !== undefined) {
        queryClient.setQueryData(feedKeys.comments(postId), context.previousComments)
      }
      context?.previousFeed?.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: (_, __, { postId }) => {
      queryClient.invalidateQueries({ queryKey: feedKeys.comments(postId) })
      queryClient.invalidateQueries({ queryKey: feedKeys.all })
    },
  })
}

// Report post
export function useReportPost() {
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: { reason: string; details?: string } }) =>
      api.post(`/members/feed/${postId}/report`, data),
  })
}

// Delete comment — optimistic
export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) =>
      api.delete(`/members/feed/${postId}/comments/${commentId}`),
    onMutate: async ({ postId, commentId }) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.comments(postId) })
      await queryClient.cancelQueries({ queryKey: feedKeys.all })

      const previousComments = queryClient.getQueryData<FeedComment[]>(feedKeys.comments(postId))
      const previousFeed = queryClient.getQueriesData({ queryKey: feedKeys.all })

      // Optimistically remove comment
      queryClient.setQueryData<FeedComment[]>(feedKeys.comments(postId), (old) =>
        (old ?? []).filter((c) => c.id !== commentId)
      )

      // Optimistically decrement comments_count
      updateFeedPosts(queryClient, (posts) =>
        posts.map((p) => p.id === postId ? { ...p, comments_count: Math.max((p.comments_count ?? 1) - 1, 0) } : p)
      )

      return { previousComments, previousFeed }
    },
    onError: (_err, { postId }, context) => {
      if (context?.previousComments !== undefined) {
        queryClient.setQueryData(feedKeys.comments(postId), context.previousComments)
      }
      context?.previousFeed?.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: (_, __, { postId }) => {
      queryClient.invalidateQueries({ queryKey: feedKeys.comments(postId) })
      queryClient.invalidateQueries({ queryKey: feedKeys.all })
    },
  })
}
