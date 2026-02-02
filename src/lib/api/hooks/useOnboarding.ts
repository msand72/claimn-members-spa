import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'

export type OnboardingStep = 'welcome' | 'profile' | 'assessment' | 'results' | 'challenge' | 'path' | 'complete'

export type PrimaryChallenge = 'identity' | 'vitality' | 'connection' | 'emotional' | 'mission'

export interface OnboardingState {
  step: OnboardingStep
  completed_at: string | null
  primary_challenge: PrimaryChallenge | null
  recommended_protocol_id: string | null
  recommended_circle_id: string | null
}

export const onboardingKeys = {
  all: ['onboarding'] as const,
  state: () => [...onboardingKeys.all, 'state'] as const,
}

export function useOnboardingState() {
  return useQuery({
    queryKey: onboardingKeys.state(),
    queryFn: () => api.get<OnboardingState>('/members/onboarding'),
    // Don't retry on 404 — means onboarding not started yet
    retry: (failureCount, error) => {
      if (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 404) {
        return false
      }
      return failureCount < 1
    },
  })
}

export function useUpdateOnboarding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { current_step?: string; primary_challenge?: string }) =>
      api.put<{ success: boolean }>('/members/onboarding', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.state() })
    },
  })
}
