import { useQuery } from '@tanstack/react-query'
import { api } from '../client'
import type { PillarId } from '../../constants'

export interface AccountabilityMember {
  id: string
  name: string
  avatar: string | null
  archetype: string
  pillar_focus: PillarId[]
  current_streak: number
  goals_completed: number
  last_active: string
}

export interface AccountabilityGroup {
  id: string
  name: string
  type: 'trio' | 'pair' | 'squad'
  program_name: string | null
  facilitator: {
    id: string
    name: string
    avatar: string | null
  } | null
  members: AccountabilityMember[]
  next_meeting: string | null
  meeting_frequency: string
  created_at: string
}

export const accountabilityKeys = {
  all: ['accountability'] as const,
  group: () => [...accountabilityKeys.all, 'group'] as const,
  members: () => [...accountabilityKeys.all, 'members'] as const,
}

export function useAccountabilityGroup() {
  return useQuery({
    queryKey: accountabilityKeys.group(),
    queryFn: async () => {
      const res = await api.get<AccountabilityGroup | { data: AccountabilityGroup }>('/members/accountability/my')
      // Unwrap { data: ... } wrapper if present
      const group = (res && typeof res === 'object' && 'data' in res && (res as Record<string, unknown>).data && typeof (res as Record<string, unknown>).data === 'object')
        ? (res as { data: AccountabilityGroup }).data
        : res as AccountabilityGroup
      return group
    },
  })
}

export function useAccountabilityMembers() {
  return useQuery({
    queryKey: accountabilityKeys.members(),
    queryFn: async () => {
      const res = await api.get<{ members: AccountabilityMember[] } | { data: { members: AccountabilityMember[] } }>('/members/accountability/my/members')
      // Unwrap { data: ... } wrapper if present
      const payload = (res && typeof res === 'object' && 'data' in res && (res as Record<string, unknown>).data && typeof (res as Record<string, unknown>).data === 'object')
        ? (res as { data: { members: AccountabilityMember[] } }).data
        : res as { members: AccountabilityMember[] }
      return Array.isArray(payload.members) ? payload.members : []
    },
  })
}
