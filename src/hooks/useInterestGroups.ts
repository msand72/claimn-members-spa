import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api/client'

export interface InterestGroup {
  id: string
  interest_id: string
  name: string
  description: string | null
  member_count: number
  post_count: number
  interest: {
    id: string
    name: string
    slug: string
    icon: string | null
  }
}

// Fetch all interest groups the current user has joined
export function useMyInterestGroups(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-interest-groups', userId],
    queryFn: async () => {
      const res = await api.get<{ groups?: InterestGroup[]; data?: InterestGroup[] }>('/members/interest-groups/my')
      const list = res?.groups ?? (res as unknown as { data?: InterestGroup[] })?.data
      return Array.isArray(list) ? list : []
    },
    enabled: !!userId,
  })
}

// Fetch all available interest groups
export function useAllInterestGroups() {
  return useQuery({
    queryKey: ['all-interest-groups'],
    queryFn: async () => {
      const res = await api.get<{ groups?: InterestGroup[]; data?: InterestGroup[] }>('/members/interest-groups')
      const list = res?.groups ?? (res as unknown as { data?: InterestGroup[] })?.data
      return Array.isArray(list) ? list : []
    },
  })
}

// Join an interest group
export function useJoinInterestGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (groupId: string) => {
      await api.post(`/members/interest-groups/${groupId}/join`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-interest-groups'] })
      queryClient.invalidateQueries({ queryKey: ['all-interest-groups'] })
    },
  })
}

// Leave an interest group
export function useLeaveInterestGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (groupId: string) => {
      await api.post(`/members/interest-groups/${groupId}/leave`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-interest-groups'] })
      queryClient.invalidateQueries({ queryKey: ['all-interest-groups'] })
    },
  })
}
