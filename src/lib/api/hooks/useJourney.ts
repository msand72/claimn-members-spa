import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import { STALE_TIME } from '../../constants'
import type { JourneyData } from '../types'

export type {
  JourneyData,
  JourneyMilestone,
  SmartPrompt,
  JourneyProtocol,
  JourneySession,
  JourneyFocus,
} from '../types'

export const journeyKeys = {
  all: ['journey'] as const,
  data: () => [...journeyKeys.all, 'data'] as const,
}

export function useJourney() {
  return useQuery({
    queryKey: journeyKeys.data(),
    queryFn: () => api.get<JourneyData>('/members/journey'),
    staleTime: STALE_TIME.FREQUENT,
  })
}

export function useUpdateJourneyFocus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (pillar: string) =>
      api.put<{ success: boolean }>('/members/journey/focus', { current_pillar: pillar }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journeyKeys.data() })
    },
  })
}
