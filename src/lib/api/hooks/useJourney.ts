import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'

export interface JourneyMilestone {
  type: string
  label: string
  completed_at: string | null
}

export interface SmartPrompt {
  type: string
  message: string
  action_url: string
}

export interface JourneyProtocol {
  id: string
  title: string
  slug: string
  progress_pct: number
  current_step: number
  total_steps: number
  assigned_by_expert: boolean
}

export interface JourneySession {
  id: string
  expert_name: string
  start_time: string
  type: string
}

export interface JourneyFocus {
  current_pillar: string | null
  changed_at: string | null
}

export interface JourneyOnboarding {
  current_step: string
}

export interface JourneyData {
  focus: JourneyFocus
  active_protocols: JourneyProtocol[]
  upcoming_sessions: JourneySession[]
  goals: unknown[]
  kpi_streaks: unknown[]
  milestones: JourneyMilestone[]
  onboarding: JourneyOnboarding
  smart_prompts: SmartPrompt[]
}

export const journeyKeys = {
  all: ['journey'] as const,
  data: () => [...journeyKeys.all, 'data'] as const,
}

export function useJourney() {
  return useQuery({
    queryKey: journeyKeys.data(),
    queryFn: () => api.get<JourneyData>('/members/journey'),
    staleTime: 1000 * 60 * 2, // 2 minutes — journey data changes frequently
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
