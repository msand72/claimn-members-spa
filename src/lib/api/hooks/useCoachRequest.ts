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
    mutationFn: async (data: ExpertMatchRequest) => {
      try {
        return await api.post<ExpertMatchRequestResponse>('/members/expert-match-request', data)
      } catch (err: any) {
        // 409 ALREADY_PENDING — user already has an in-flight match request.
        // Cache invalidation below refetches the existing pending request.
        // Backend audit sweep 2026-05-05 (commit 9932170).
        if (err?.status === 409 && err?.error?.code === 'ALREADY_PENDING') {
          return null as unknown as ExpertMatchRequestResponse
        }
        throw err
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachRequestKeys.all })
      queryClient.invalidateQueries({ queryKey: myExpertKeys.all })
    },
  })
}
