import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type PaginatedResponse, type PaginationParams } from '../client'
import type {
  Assessment,
  AssessmentQuestion,
  AssessmentResult,
  SubmitAssessmentRequest,
} from '../types'

// Query keys
export const assessmentKeys = {
  all: ['assessments'] as const,
  list: (params?: PaginationParams) => [...assessmentKeys.all, 'list', params] as const,
  detail: (id: string) => [...assessmentKeys.all, 'detail', id] as const,
  questions: (id: string) => [...assessmentKeys.all, 'questions', id] as const,
  results: (id: string) => [...assessmentKeys.all, 'results', id] as const,
  latestResult: () => [...assessmentKeys.all, 'latest-result'] as const,
}

// =====================================================
// Assessment Hooks
// =====================================================

// Get all assessments
export function useAssessments(params?: PaginationParams) {
  return useQuery({
    queryKey: assessmentKeys.list(params),
    queryFn: () =>
      api.get<PaginatedResponse<Assessment>>('/members/assessments', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
      }),
  })
}

// Get single assessment
export function useAssessment(id: string) {
  return useQuery({
    queryKey: assessmentKeys.detail(id),
    queryFn: () => api.get<Assessment>(`/members/assessments/${id}`),
    enabled: !!id,
  })
}

// Get assessment questions
export function useAssessmentQuestions(assessmentId: string) {
  return useQuery({
    queryKey: assessmentKeys.questions(assessmentId),
    queryFn: () =>
      api.get<AssessmentQuestion[]>(`/members/assessments/${assessmentId}/questions`),
    enabled: !!assessmentId,
  })
}

// Get assessment results
export function useAssessmentResults(assessmentId: string) {
  return useQuery({
    queryKey: assessmentKeys.results(assessmentId),
    queryFn: () => api.get<AssessmentResult>(`/members/assessments/${assessmentId}/results`),
    enabled: !!assessmentId,
  })
}

// Get latest assessment result (for showing on dashboard, etc.)
export function useLatestAssessmentResult() {
  return useQuery({
    queryKey: assessmentKeys.latestResult(),
    queryFn: () => api.get<AssessmentResult>('/members/assessments/results/latest'),
  })
}

// Submit assessment answers
export function useSubmitAssessment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      assessmentId,
      data,
    }: {
      assessmentId: string
      data: SubmitAssessmentRequest
    }) => api.post<AssessmentResult>(`/members/assessments/${assessmentId}/submit`, data),
    onSuccess: (_, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.all })
      queryClient.invalidateQueries({ queryKey: assessmentKeys.results(assessmentId) })
      queryClient.invalidateQueries({ queryKey: assessmentKeys.latestResult() })
    },
  })
}
