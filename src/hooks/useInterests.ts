import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

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
      const { data, error } = await supabase
        .from('interests')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data as Interest[]
    },
  })
}

// Fetch member's selected interests
export function useMemberInterests(userId: string | undefined) {
  return useQuery({
    queryKey: ['member-interests', userId],
    queryFn: async () => {
      if (!userId) return []

      const { data, error } = await supabase
        .from('member_interests')
        .select('interest_id')
        .eq('user_id', userId)

      if (error) throw error
      return data.map((item) => item.interest_id) as string[]
    },
    enabled: !!userId,
  })
}

// Update member's interests
export function useUpdateMemberInterests() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      interestIds,
    }: {
      userId: string
      interestIds: string[]
    }) => {
      // Delete existing interests
      const { error: deleteError } = await supabase
        .from('member_interests')
        .delete()
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      // Insert new interests
      if (interestIds.length > 0) {
        const { error: insertError } = await supabase.from('member_interests').insert(
          interestIds.map((interestId) => ({
            user_id: userId,
            interest_id: interestId,
          }))
        )

        if (insertError) throw insertError
      }
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['member-interests', userId] })
    },
  })
}
