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
      const data = await api.get<{ interests?: Interest[]; data?: Interest[] }>('/members/interests')
      // Handle both { interests: [...] } and { data: [...] } response shapes
      const list = data?.interests ?? (data as unknown as { data?: Interest[] })?.data
      return Array.isArray(list) ? list : []
    },
  })
}

// Fetch member's selected interests
export function useMemberInterests(userId: string | undefined) {
  return useQuery({
    queryKey: ['member-interests', userId],
    queryFn: async () => {
      const data = await api.get<{ interest_ids?: string[]; data?: string[] }>('/members/interests/my')
      // Handle both { interest_ids: [...] } and { data: [...] } response shapes
      const ids = data?.interest_ids ?? (data as unknown as { data?: string[] })?.data
      return Array.isArray(ids) ? ids : []
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
