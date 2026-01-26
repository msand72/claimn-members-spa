import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

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
      if (!userId) return []

      // Get member's interests first
      const { data: memberInterests, error: interestError } = await supabase
        .from('member_interests')
        .select('interest_id')
        .eq('user_id', userId)

      if (interestError) throw interestError
      if (!memberInterests?.length) return []

      const interestIds = memberInterests.map((mi) => mi.interest_id)

      // Get interest groups for those interests
      const { data: groups, error: groupError } = await supabase
        .from('interest_groups')
        .select(`
          id,
          interest_id,
          name,
          description,
          member_count,
          post_count,
          interest:interests!interest_id (
            id,
            name,
            slug,
            icon
          )
        `)
        .in('interest_id', interestIds)
        .order('name')

      if (groupError) throw groupError
      return (groups || []) as InterestGroup[]
    },
    enabled: !!userId,
  })
}

// Fetch all available interest groups
export function useAllInterestGroups() {
  return useQuery({
    queryKey: ['all-interest-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interest_groups')
        .select(`
          id,
          interest_id,
          name,
          description,
          member_count,
          post_count,
          interest:interests!interest_id (
            id,
            name,
            slug,
            icon
          )
        `)
        .order('name')

      if (error) throw error
      return (data || []) as InterestGroup[]
    },
  })
}
