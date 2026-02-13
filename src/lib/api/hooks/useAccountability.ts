import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, safeArray, unwrapData } from '../client'
import type { AccountabilityGroup, CheckIn, CheckInRequest } from '../types'

export type { AccountabilityGroup, AccountabilityMember, CheckInRequest, CheckIn } from '../types'

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
 * GET /members/accountability/my
 */
export function useMyAccountabilityGroups(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: accountabilityKeys.myGroups(),
    queryFn: async () => {
      const res = await api.get<AccountabilityGroup[] | { data: AccountabilityGroup[] }>('/members/accountability/my')
      return safeArray<AccountabilityGroup>(res)
    },
    enabled: options?.enabled ?? true,
  })
}

/**
 * Convenience hook: get the user's first active accountability group.
 * Returns null if the user has no groups.
 */
export function useAccountabilityGroup(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: accountabilityKeys.myGroups(),
    queryFn: async () => {
      const res = await api.get<AccountabilityGroup[] | { data: AccountabilityGroup[] }>('/members/accountability/my')
      const groups = safeArray<AccountabilityGroup>(res)
      return groups.find(g => g.is_active) ?? groups[0] ?? null
    },
    enabled: options?.enabled ?? true,
  })
}

/**
 * Browse all available accountability groups
 * GET /members/accountability
 */
export function useAllAccountabilityGroups(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: accountabilityKeys.allGroups(),
    queryFn: async () => {
      const res = await api.get<AccountabilityGroup[] | { data: AccountabilityGroup[] }>('/members/accountability')
      return safeArray<AccountabilityGroup>(res)
    },
    enabled: options?.enabled ?? true,
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
      return unwrapData<AccountabilityGroup>(res)!
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
