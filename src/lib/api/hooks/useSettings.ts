import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'

// ── Assessment Sharing Consent ──────────────────────

interface AssessmentSharingResponse {
  consent: boolean
  description?: string
}

interface UpdateAssessmentSharingResponse {
  success: boolean
  consent: boolean
  message?: string
}

export const settingsKeys = {
  all: ['settings'] as const,
  assessmentSharing: () => [...settingsKeys.all, 'assessment-sharing'] as const,
}

export function useAssessmentSharing() {
  return useQuery({
    queryKey: settingsKeys.assessmentSharing(),
    queryFn: () => api.get<AssessmentSharingResponse>('/members/settings/assessment-sharing'),
  })
}

export function useUpdateAssessmentSharing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (consent: boolean) =>
      api.put<UpdateAssessmentSharingResponse>('/members/settings/assessment-sharing', { consent }),
    onSuccess: (_data, consent) => {
      // Optimistically update the cache
      queryClient.setQueryData(settingsKeys.assessmentSharing(), { consent })
    },
  })
}
