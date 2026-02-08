import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, safeArray } from '../client'

// ---------------------------------------------------------------------------
// Types matching actual backend response (accountability_groups table)
// ---------------------------------------------------------------------------

export interface AccountabilityGroup {
  id: string
  name: string
  group_type: 'trio' | 'pair'
  is_active: boolean
  program_id: string | null
  created_at: string
}

// Member data from accountability_group_members + profile enrichment
// Note: the member-facing GET endpoints do NOT currently return member details.
// This type is kept for future use when the backend enriches group responses.
export interface AccountabilityMember {
  id: string
  member_id: string
  display_name: string
  avatar_url: string | null
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const accountabilityKeys = {
  all: ['accountability'] as const,
  myGroups: () => [...accountabilityKeys.all, 'my-groups'] as const,
  allGroups: () => [...accountabilityKeys.all, 'all-groups'] as const,
  group: (id: string) => [...accountabilityKeys.all, 'group', id] as const,
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get the current user's accountability groups
 * GET /members/accountability/my → array of groups
 */
export function useMyAccountabilityGroups() {
  return useQuery({
    queryKey: accountabilityKeys.myGroups(),
    queryFn: async () => {
      const res = await api.get<AccountabilityGroup[] | { data: AccountabilityGroup[] }>('/members/accountability/my')
      return safeArray<AccountabilityGroup>(res)
    },
  })
}

/**
 * Convenience hook: get the user's first active accountability group.
 * Returns null if the user has no groups.
 * This maintains backward compatibility with the AccountabilityPage.
 */
export function useAccountabilityGroup() {
  return useQuery({
    queryKey: accountabilityKeys.myGroups(),
    queryFn: async () => {
      const res = await api.get<AccountabilityGroup[] | { data: AccountabilityGroup[] }>('/members/accountability/my')
      const groups = safeArray<AccountabilityGroup>(res)
      return groups.find(g => g.is_active) ?? groups[0] ?? null
    },
  })
}

/**
 * Browse all available accountability groups
 * GET /members/accountability → paginated list
 */
export function useAllAccountabilityGroups() {
  return useQuery({
    queryKey: accountabilityKeys.allGroups(),
    queryFn: async () => {
      const res = await api.get<AccountabilityGroup[] | { data: AccountabilityGroup[] }>('/members/accountability')
      return safeArray<AccountabilityGroup>(res)
    },
  })
}

/**
 * Get a single accountability group by ID
 * GET /members/accountability/{id}
 */
export function useAccountabilityGroupDetail(id: string) {
  return useQuery({
    queryKey: accountabilityKeys.group(id),
    queryFn: async () => {
      const res = await api.get<AccountabilityGroup | { data: AccountabilityGroup }>(`/members/accountability/${id}`)
      if (res && typeof res === 'object' && 'data' in res && res.data) {
        return res.data as AccountabilityGroup
      }
      return res as AccountabilityGroup
    },
    enabled: !!id,
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Join an accountability group
 * POST /members/accountability/{id}/join
 */
export function useJoinAccountabilityGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (groupId: string) =>
      api.post<{ success: boolean }>(`/members/accountability/${groupId}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountabilityKeys.all })
    },
  })
}

/**
 * Leave an accountability group
 * DELETE /members/accountability/{id}/leave
 */
export function useLeaveAccountabilityGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (groupId: string) =>
      api.delete<{ success: boolean }>(`/members/accountability/${groupId}/leave`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountabilityKeys.all })
    },
  })
}

// ---------------------------------------------------------------------------
// Check-ins
// ---------------------------------------------------------------------------

export interface CheckInRequest {
  progress_update?: string
  challenges?: string
  support_needed?: string
  commitments_for_next?: string
  week_rating?: number
}

export interface CheckIn {
  id: string
  group_id: string
  member_id: string
  check_in_date: string
  progress_update: string | null
  challenges: string | null
  support_needed: string | null
  commitments_for_next: string | null
  week_rating: number | null
  created_at: string
}

/**
 * Submit a check-in to an accountability group
 * POST /members/accountability/groups/{id}/check-ins
 */
export function useCreateCheckIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: CheckInRequest }) =>
      api.post<CheckIn>(`/members/accountability/groups/${groupId}/check-ins`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountabilityKeys.all })
    },
  })
}
