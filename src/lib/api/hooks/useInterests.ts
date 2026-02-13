import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import type { InterestGroup } from '../types'

export type { InterestGroup }

export interface Interest {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  sort_order: number
}

export const interestKeys = {
  all: ['interests'] as const,
  list: () => [...interestKeys.all, 'list'] as const,
  my: () => [...interestKeys.all, 'my'] as const,
  groups: () => [...interestKeys.all, 'groups'] as const,
  myGroups: () => [...interestKeys.all, 'myGroups'] as const,
  group: (id: string) => [...interestKeys.all, 'group', id] as const,
}

// GET /members/interests - List all available interests
export function useInterests() {
  return useQuery({
    queryKey: interestKeys.list(),
    queryFn: () => api.get<Interest[]>('/members/interests'),
    staleTime: 1000 * 60 * 10, // 10 minutes - interests don't change often
  })
}

// GET /members/interests/my - Get user's selected interests
export function useMyInterests() {
  return useQuery({
    queryKey: interestKeys.my(),
    queryFn: () => api.get<Interest[]>('/members/interests/my'),
  })
}

// PUT /members/interests - Update user's interests
export function useUpdateMyInterests() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (interestIds: string[]) =>
      api.put<{ success: boolean }>('/members/interests', { interest_ids: interestIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interestKeys.my() })
    },
  })
}

// GET /members/interest-groups - List all interest groups
export function useInterestGroups() {
  return useQuery({
    queryKey: interestKeys.groups(),
    queryFn: () => api.get<InterestGroup[]>('/members/interest-groups'),
  })
}

// GET /members/interest-groups/my - Get user's joined groups
export function useMyInterestGroups() {
  return useQuery({
    queryKey: interestKeys.myGroups(),
    queryFn: () => api.get<InterestGroup[]>('/members/interest-groups/my'),
  })
}

// GET /members/interest-groups/:id - Get single interest group
export function useInterestGroup(id: string) {
  return useQuery({
    queryKey: interestKeys.group(id),
    queryFn: () => api.get<InterestGroup>(`/members/interest-groups/${id}`),
    enabled: !!id,
  })
}

// POST /members/interest-groups/:id/join - Join an interest group
export function useJoinInterestGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (groupId: string) =>
      api.post<{ success: boolean }>(`/members/interest-groups/${groupId}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interestKeys.groups() })
      queryClient.invalidateQueries({ queryKey: interestKeys.myGroups() })
    },
  })
}

// DELETE /members/interest-groups/:id/leave - Leave an interest group
export function useLeaveInterestGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (groupId: string) =>
      api.delete<{ success: boolean }>(`/members/interest-groups/${groupId}/leave`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interestKeys.groups() })
      queryClient.invalidateQueries({ queryKey: interestKeys.myGroups() })
    },
  })
}
