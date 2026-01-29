import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import type { PillarId } from '../../constants'
import type { MilestoneStatus } from '../../constants'

export interface Milestone {
  id: string
  title: string
  description: string
  pillar: PillarId
  target_date: string
  status: MilestoneStatus
  created_by: {
    id: string
    name: string
    role: 'expert' | 'facilitator'
  }
  progress_notes: string | null
  created_at: string
  updated_at: string
}

interface MilestonesResponse {
  milestones: Milestone[]
}

interface UpdateMilestoneStatusRequest {
  status: MilestoneStatus
  progress_notes?: string
}

export const milestoneKeys = {
  all: ['milestones'] as const,
  list: () => [...milestoneKeys.all, 'list'] as const,
}

export function useMilestones() {
  return useQuery({
    queryKey: milestoneKeys.list(),
    queryFn: async () => {
      const data = await api.get<MilestonesResponse>('/members/milestones')
      return data.milestones ?? []
    },
  })
}

export function useUpdateMilestoneStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateMilestoneStatusRequest & { id: string }) =>
      api.put(`/members/milestones/${id}/status`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.all })
    },
  })
}
