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
  priority: 'low' | 'medium' | 'high'
}

export interface JourneyTask {
  id: string
  title: string
  type: 'action_item' | 'protocol_step' | 'kpi_log'
  due: string
  completed: boolean
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

export interface JourneyData {
  current_focus_pillar: string | null
  active_protocol: JourneyProtocol | null
  todays_tasks: JourneyTask[]
  upcoming_sessions: JourneySession[]
  milestones: JourneyMilestone[]
  smart_prompts: SmartPrompt[]
  weekly_stats: {
    tasks_completed: number
    tasks_total: number
    kpi_logs: number
    streak_days: number
  }
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
      api.put<{ current_focus_pillar: string }>('/members/journey/focus', { pillar }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journeyKeys.data() })
    },
  })
}
