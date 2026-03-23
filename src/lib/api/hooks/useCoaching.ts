import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type PaginatedResponse } from '../client'

// ── Types ────────────────────────────────────────────

export interface CoachingPreferences {
  ai_coaching_enabled: boolean
  tone: 'supportive' | 'direct' | 'motivational'
  frequency: 'daily' | 'weekly' | 'manual-only'
  preferred_check_in_time: string
  pillars_focus: string[]
  daily_insight_enabled: boolean
  weekly_review_enabled: boolean
  plan_suggestions_enabled: boolean
}

export interface CoachingInsight {
  id: string
  agent_type: string
  insight_type: string
  title: string
  body: string
  pillar: string | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
  action_url: string | null
  related_entity_id: string | null
  related_entity_type: string | null
  read_at: string | null
  dismissed_at: string | null
  created_at: string
}

// ── Query Keys ───────────────────────────────────────

export interface CoachingConversation {
  id: string
  last_message: string
  last_message_at: string
  message_count: number
  created_at: string
}

export interface CoachingMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface CoachingPlanItem {
  id: string
  plan_id: string
  pillar: string
  title: string
  description: string | null
  item_type: 'protocol' | 'goal' | 'kpi' | 'action' | 'habit' | 'reflection'
  frequency: string
  day_of_week: number[]
  priority: number
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'deferred'
  completed_at: string | null
  sort_order: number
  source_id: string | null
  source_type: string | null
  created_at: string
}

export interface CoachingPlan {
  id: string
  title: string
  summary: string | null
  focus_pillar: string | null
  status: 'draft' | 'active' | 'archived'
  version: number
  generated_at: string
  accepted_at: string | null
  items: CoachingPlanItem[]
}

export const coachingKeys = {
  all: ['coaching'] as const,
  preferences: () => [...coachingKeys.all, 'preferences'] as const,
  insights: (filters?: Record<string, unknown>) => [...coachingKeys.all, 'insights', filters] as const,
  insightsLatest: () => [...coachingKeys.all, 'insights', 'latest'] as const,
  unreadCount: () => [...coachingKeys.all, 'insights', 'unread-count'] as const,
  plan: () => [...coachingKeys.all, 'plan'] as const,
  conversations: () => [...coachingKeys.all, 'chat', 'conversations'] as const,
  messages: (conversationId: string) => [...coachingKeys.all, 'chat', 'messages', conversationId] as const,
}

// ── Preferences ──────────────────────────────────────

export function useCoachingPreferences() {
  return useQuery({
    queryKey: coachingKeys.preferences(),
    queryFn: () => api.get<CoachingPreferences>('/members/coaching/ai/preferences'),
    staleTime: 5 * 60 * 1000,
    retry: (count, error: any) => {
      if (error?.status >= 400 && error?.status < 500) return false
      return count < 1
    },
  })
}

export function useUpdateCoachingPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<CoachingPreferences>) =>
      api.put<CoachingPreferences>('/members/coaching/ai/preferences', data),
    onSuccess: (data) => {
      queryClient.setQueryData(coachingKeys.preferences(), data)
    },
  })
}

// ── Insights ─────────────────────────────────────────

export function useCoachingInsightsLatest() {
  return useQuery({
    queryKey: coachingKeys.insightsLatest(),
    queryFn: () => api.get<CoachingInsight[]>('/members/coaching/ai/insights/latest'),
    staleTime: 30 * 1000,
    retry: false,
  })
}

export function useCoachingUnreadCount() {
  return useQuery({
    queryKey: coachingKeys.unreadCount(),
    queryFn: () => api.get<{ count: number }>('/members/coaching/ai/insights/unread-count'),
    staleTime: 60 * 1000,
    retry: false,
  })
}

export interface CoachingInsightsParams {
  page?: number
  limit?: number
  type?: string
  pillar?: string
  unread?: boolean
}

export function useCoachingInsights(params?: CoachingInsightsParams) {
  return useQuery({
    queryKey: coachingKeys.insights(params as Record<string, unknown>),
    queryFn: () =>
      api.get<PaginatedResponse<CoachingInsight>>('/members/coaching/ai/insights', {
        page: params?.page,
        limit: params?.limit || 20,
        type: params?.type,
        pillar: params?.pillar,
        unread: params?.unread,
      }),
    staleTime: 30 * 1000,
    retry: false,
  })
}

export function useReadInsight() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (insightId: string) =>
      api.post(`/members/coaching/ai/insights/${insightId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.insightsLatest() })
      queryClient.invalidateQueries({ queryKey: coachingKeys.unreadCount() })
      queryClient.invalidateQueries({ queryKey: coachingKeys.insights() })
    },
  })
}

export function useDismissInsight() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (insightId: string) =>
      api.post(`/members/coaching/ai/insights/${insightId}/dismiss`),
    onMutate: async (insightId) => {
      await queryClient.cancelQueries({ queryKey: coachingKeys.insightsLatest() })
      const previous = queryClient.getQueryData<CoachingInsight[]>(coachingKeys.insightsLatest())
      queryClient.setQueryData<CoachingInsight[]>(coachingKeys.insightsLatest(), (old) =>
        (old ?? []).filter((i) => i.id !== insightId)
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(coachingKeys.insightsLatest(), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.insightsLatest() })
      queryClient.invalidateQueries({ queryKey: coachingKeys.unreadCount() })
      queryClient.invalidateQueries({ queryKey: coachingKeys.insights() })
    },
  })
}

// ── Plan ─────────────────────────────────────────────

export function useCoachingPlan() {
  return useQuery({
    queryKey: coachingKeys.plan(),
    queryFn: () => api.get<{ plan: CoachingPlan | null }>('/members/coaching/ai/plan'),
    staleTime: 60 * 1000,
    retry: false,
  })
}

export function useGeneratePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post<{ plan: CoachingPlan }>('/members/coaching/ai/plan/generate'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.plan() })
    },
  })
}

export function useAcceptPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.put('/members/coaching/ai/plan/accept'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.plan() })
    },
  })
}

export function useUpdatePlanItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: 'completed' | 'skipped' | 'deferred' }) =>
      api.put(`/members/coaching/ai/plan/items/${itemId}`, { status }),
    onMutate: async ({ itemId, status }) => {
      await queryClient.cancelQueries({ queryKey: coachingKeys.plan() })
      const previous = queryClient.getQueryData<{ plan: CoachingPlan | null }>(coachingKeys.plan())
      queryClient.setQueryData<{ plan: CoachingPlan | null }>(coachingKeys.plan(), (old) => {
        if (!old?.plan) return old
        return {
          ...old,
          plan: {
            ...old.plan,
            items: old.plan.items.map((item) =>
              item.id === itemId
                ? { ...item, status, completed_at: status === 'completed' ? new Date().toISOString() : null }
                : item
            ),
          },
        }
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(coachingKeys.plan(), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.plan() })
    },
  })
}

export function useArchivePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.delete('/members/coaching/ai/plan'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.plan() })
    },
  })
}

// ── Chat ─────────────────────────────────────────────

export function useCoachingConversations() {
  return useQuery({
    queryKey: coachingKeys.conversations(),
    queryFn: () => api.get<CoachingConversation[]>('/members/coaching/ai/chat/conversations'),
    staleTime: 30 * 1000,
    retry: false,
  })
}

export function useCoachingMessages(conversationId: string) {
  return useQuery({
    queryKey: coachingKeys.messages(conversationId),
    queryFn: () =>
      api.get<PaginatedResponse<CoachingMessage>>(`/members/coaching/ai/chat/conversations/${conversationId}`, {
        limit: 50,
      }),
    enabled: !!conversationId,
    staleTime: 10 * 1000,
    retry: false,
  })
}

export function useSendCoachingMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { conversation_id?: string; content: string }) =>
      api.post<CoachingMessage>('/members/coaching/ai/chat/messages', data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: coachingKeys.conversations() })
      const convId = response?.conversation_id || variables.conversation_id
      if (convId) {
        queryClient.invalidateQueries({ queryKey: coachingKeys.messages(convId) })
      }
    },
  })
}
