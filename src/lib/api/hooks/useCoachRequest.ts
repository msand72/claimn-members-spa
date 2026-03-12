import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, is404Error } from '../client'
import { myExpertKeys } from './useMyExpert'
import type { ExpertMatchRequest, ExpertMatchRequestResponse } from '../types'

export const coachRequestKeys = {
  all: ['coach-request'] as const,
  status: () => [...coachRequestKeys.all, 'status'] as const,
}

/** Check if the member has a pending coach match request */
export function useCoachRequest() {
  return useQuery({
    queryKey: coachRequestKeys.status(),
    queryFn: async () => {
      try {
        return await api.get<ExpertMatchRequestResponse>('/members/expert-match-request')
      } catch (err) {
        if (is404Error(err)) return null
        throw err
      }
    },
  })
}

/** Submit a new coach match request */
export function useSubmitCoachRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ExpertMatchRequest) =>
      api.post<ExpertMatchRequestResponse>('/members/expert-match-request', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachRequestKeys.all })
      queryClient.invalidateQueries({ queryKey: myExpertKeys.all })
    },
  })
}
