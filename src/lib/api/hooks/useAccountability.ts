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
    queryFn: () => api.get<AccountabilityGroup>('/members/accountability/group'),
  })
}

export function useAccountabilityMembers() {
  return useQuery({
    queryKey: accountabilityKeys.members(),
    queryFn: async () => {
      const data = await api.get<{ members: AccountabilityMember[] }>('/members/accountability/group/members')
      return data.members ?? []
    },
  })
}
