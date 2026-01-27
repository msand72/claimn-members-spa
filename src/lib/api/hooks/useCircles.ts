import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type PaginatedResponse, type PaginationParams } from '../client'
import type { Circle, CircleMember, CirclePost } from '../types'

// Query keys
export const circleKeys = {
  all: ['circles'] as const,
  list: (params?: PaginationParams) => [...circleKeys.all, 'list', params] as const,
  myCircles: () => [...circleKeys.all, 'my'] as const,
  detail: (id: string) => [...circleKeys.all, 'detail', id] as const,
  members: (id: string, params?: PaginationParams) =>
    [...circleKeys.all, 'members', id, params] as const,
  posts: (id: string, params?: PaginationParams) =>
    [...circleKeys.all, 'posts', id, params] as const,
}

// Get all circles
export function useCircles(params?: PaginationParams) {
  return useQuery({
    queryKey: circleKeys.list(params),
    queryFn: () =>
      api.get<PaginatedResponse<Circle>>('/members/circles', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
      }),
  })
}

// Get user's circles
export function useMyCircles() {
  return useQuery({
    queryKey: circleKeys.myCircles(),
    queryFn: () =>
      api.get<Circle[]>('/members/circles/my'),
  })
}

// Get circle detail
export function useCircle(id: string) {
  return useQuery({
    queryKey: circleKeys.detail(id),
    queryFn: () => api.get<Circle>(`/members/circles/${id}`),
    enabled: !!id,
  })
}

// Get circle members
export function useCircleMembers(circleId: string, params?: PaginationParams) {
  return useQuery({
    queryKey: circleKeys.members(circleId, params),
    queryFn: () =>
      api.get<PaginatedResponse<CircleMember>>(`/members/circles/${circleId}/members`, {
        page: params?.page,
        limit: params?.limit,
      }),
    enabled: !!circleId,
  })
}

// Get circle posts
export function useCirclePosts(circleId: string, params?: PaginationParams) {
  return useQuery({
    queryKey: circleKeys.posts(circleId, params),
    queryFn: () =>
      api.get<PaginatedResponse<CirclePost>>(`/members/circles/${circleId}/posts`, {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
      }),
    enabled: !!circleId,
  })
}

// Join circle
export function useJoinCircle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (circleId: string) =>
      api.post(`/members/circles/${circleId}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: circleKeys.all })
    },
  })
}

// Leave circle
export function useLeaveCircle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (circleId: string) =>
      api.delete(`/members/circles/${circleId}/leave`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: circleKeys.all })
    },
  })
}

// Create circle post
export function useCreateCirclePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      circleId,
      content,
      image_url,
    }: {
      circleId: string
      content: string
      image_url?: string
    }) =>
      api.post<CirclePost>(`/members/circles/${circleId}/posts`, {
        content,
        image_url,
      }),
    onSuccess: (_, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: circleKeys.posts(circleId) })
    },
  })
}
