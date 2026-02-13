import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, is404Error } from '../client'
import type { OnboardingState } from '../types'

export type { OnboardingStep, PrimaryChallenge, OnboardingState } from '../types'

export const onboardingKeys = {
  all: ['onboarding'] as const,
  state: () => [...onboardingKeys.all, 'state'] as const,
}

export function useOnboardingState() {
  return useQuery({
    queryKey: onboardingKeys.state(),
    queryFn: () => api.get<OnboardingState>('/members/onboarding'),
    // Don't retry on 404 — means onboarding not started yet
    retry: (failureCount, error) => !is404Error(error) && failureCount < 1,
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
