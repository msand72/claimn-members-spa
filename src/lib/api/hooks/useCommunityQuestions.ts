import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type PaginatedResponse } from '../client'
import type { FeedPost } from '../types'

/**
 * Community questions are feed posts with `is_expert_question: true`.
 * The backend has no dedicated `/members/community/questions` endpoint.
 * We use `GET /members/feed?is_expert_question=true` to list them
 * and `POST /members/feed` with `{ content, is_expert_question: true }` to create them.
 */

export interface CommunityQuestion extends FeedPost {
  is_expert_question: boolean
}

export interface CommunityQuestionsParams {
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
      api.get<PaginatedResponse<CommunityQuestion>>('/members/feed', {
        is_expert_question: true,
        page: params?.page,
        limit: params?.limit,
      }),
  })
}

export function useQuestionDetail(id: string) {
  return useQuery({
    queryKey: communityQuestionKeys.detail(id),
    queryFn: () => api.get<CommunityQuestion>(`/members/feed/${id}`),
    enabled: !!id,
  })
}

export function useAskQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      content: string
    }) =>
      api.post<CommunityQuestion>('/members/feed', {
        content: data.content,
        is_expert_question: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityQuestionKeys.all })
    },
  })
}
