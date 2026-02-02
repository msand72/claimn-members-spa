import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type PaginatedResponse } from '../client'

export interface CommunityQuestion {
  id: string
  question: string
  context_type: string
  context_id: string
  author_name: string
  author_avatar: string
  created_at: string
  answer_count: number
  is_answered: boolean
  is_expert_question: boolean
}

export interface CommunityQuestionsParams {
  context_type?: string
  context_id?: string
  is_answered?: boolean
  page?: number
  limit?: number
}

export const communityQuestionKeys = {
  all: ['community-questions'] as const,
  list: (params?: CommunityQuestionsParams) => [...communityQuestionKeys.all, 'list', params] as const,
  detail: (id: string) => [...communityQuestionKeys.all, 'detail', id] as const,
}

export function useCommunityQuestions(params?: CommunityQuestionsParams) {
  return useQuery({
    queryKey: communityQuestionKeys.list(params),
    queryFn: () =>
      api.get<PaginatedResponse<CommunityQuestion>>('/members/community/questions', {
        context_type: params?.context_type,
        context_id: params?.context_id,
        is_answered: params?.is_answered,
        page: params?.page,
        limit: params?.limit,
      }),
  })
}

export function useQuestionDetail(id: string) {
  return useQuery({
    queryKey: communityQuestionKeys.detail(id),
    queryFn: () => api.get<CommunityQuestion>(`/members/community/questions/${id}`),
    enabled: !!id,
  })
}

export function useAskQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      question: string
      context_type?: string
      context_id?: string
      is_expert_question?: boolean
    }) =>
      api.post<CommunityQuestion>('/members/community/questions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityQuestionKeys.all })
    },
  })
}
