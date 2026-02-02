import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api/client'

export interface Interest {
  id: string
  name: string
  slug: string
  icon: string | null
  description: string | null
  sort_order: number
}

// Fetch all available interests
export function useInterests() {
  return useQuery({
    queryKey: ['interests'],
    queryFn: async () => {
      const raw = await api.get<unknown>('/members/interests')
      // Handle: bare array [...], { interests: [...] }, or { data: [...] }
      if (Array.isArray(raw)) return raw as Interest[]
      const obj = raw as Record<string, unknown>
      const list = obj?.interests ?? obj?.data
      return Array.isArray(list) ? (list as Interest[]) : []
    },
  })
}

// Fetch member's selected interests
export function useMemberInterests(userId: string | undefined) {
  return useQuery({
    queryKey: ['member-interests', userId],
    queryFn: async () => {
      const raw = await api.get<unknown>('/members/interests/my')
      // Handle: bare array [...], { interest_ids: [...] }, or { data: [...] }
      if (Array.isArray(raw)) return raw as string[]
      const obj = raw as Record<string, unknown>
      const ids = obj?.interest_ids ?? obj?.data
      return Array.isArray(ids) ? (ids as string[]) : []
    },
    enabled: !!userId,
  })
}

// Update member's interests
export function useUpdateMemberInterests() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      interestIds,
    }: {
      userId: string
      interestIds: string[]
    }) => {
      await api.put('/members/interests', { interest_ids: interestIds })
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['member-interests', userId] })
      // Interest changes may auto-join/leave interest groups on the backend,
      // so refresh group queries so the feed tabs update immediately
      queryClient.invalidateQueries({ queryKey: ['my-interest-groups'] })
      queryClient.invalidateQueries({ queryKey: ['all-interest-groups'] })
    },
  })
}
