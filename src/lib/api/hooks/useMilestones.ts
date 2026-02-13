import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import type { Milestone } from '../types'

export type { Milestone }

interface MilestonesResponse {
  milestones: Milestone[]
}

interface UpdateMilestoneStatusRequest {
  status: Milestone['status']
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
