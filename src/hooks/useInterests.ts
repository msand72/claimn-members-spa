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

// Extract string IDs from a mixed array (could be plain strings or objects with id/interest_id)
function extractIds(arr: unknown[]): string[] {
  return arr.map((item) => {
    if (typeof item === 'string') return item
    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>
      return String(obj.interest_id ?? obj.id ?? '')
    }
    return ''
  }).filter(Boolean)
}

// Fetch member's selected interests
export function useMemberInterests(userId: string | undefined) {
  return useQuery({
    queryKey: ['member-interests', userId],
    queryFn: async () => {
      const raw = await api.get<unknown>('/members/interests/my')
      // Handle: bare array [...], { interest_ids: [...] }, { data: [...] }, { interests: [...] }
      let items: unknown[]
      if (Array.isArray(raw)) {
        items = raw
      } else {
        const obj = raw as Record<string, unknown>
        const found = obj?.interest_ids ?? obj?.interests ?? obj?.data
        items = Array.isArray(found) ? found : []
      }
      return extractIds(items)
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
      // Ensure we only send plain string UUIDs
      const cleanIds = interestIds.filter((id) => typeof id === 'string' && id.length > 0)
      await api.put('/members/interests', { interest_ids: cleanIds })
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
