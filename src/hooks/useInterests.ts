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
      const data = await api.get<{ interests: Interest[] }>('/members/interests')
      return data.interests
    },
  })
}

// Fetch member's selected interests
export function useMemberInterests(userId: string | undefined) {
  return useQuery({
    queryKey: ['member-interests', userId],
    queryFn: async () => {
      const data = await api.get<{ interest_ids: string[] }>('/members/interests/my')
      return data.interest_ids
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
    },
  })
}
