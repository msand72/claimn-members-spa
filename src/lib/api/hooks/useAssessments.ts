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
    queryFn: async () => {
      console.log('[DEBUG useAssessmentQuestions] Fetching for assessmentId:', assessmentId)
      try {
        const result = await api.get<AssessmentQuestion[]>(`/members/assessments/${assessmentId}/questions`)
        console.log('[DEBUG useAssessmentQuestions] Response type:', typeof result, 'isArray:', Array.isArray(result), 'length:', Array.isArray(result) ? result.length : 'N/A')
        console.log('[DEBUG useAssessmentQuestions] Raw response shape:', JSON.stringify(result, null, 2)?.slice(0, 2000))
        if (Array.isArray(result) && result.length > 0) {
          const sections = result.map((q: any) => q.section).filter(Boolean)
          const pillars = result.map((q: any) => q.pillar).filter(Boolean)
          console.log('[DEBUG useAssessmentQuestions] Sections:', [...new Set(sections)], 'Pillars:', [...new Set(pillars)])
        }
        return result
      } catch (error: any) {
        console.error('[DEBUG useAssessmentQuestions] FAILED:', error?.status, error?.error?.message || error?.message)
        throw error
      }
    },
    enabled: !!assessmentId,
  })
}

// Get assessment results
export function useAssessmentResults(assessmentId: string) {
  return useQuery({
    queryKey: assessmentKeys.results(assessmentId),
    queryFn: async () => {
      console.log('[DEBUG useAssessmentResults] Fetching for assessmentId:', assessmentId)
      try {
        const result = await api.get<AssessmentResult>(`/members/assessments/${assessmentId}/results`)
        console.log('[DEBUG useAssessmentResults] Response:', JSON.stringify(result, null, 2)?.slice(0, 2000))
        return result
      } catch (error: any) {
        console.error('[DEBUG useAssessmentResults] FAILED:', error?.status, error?.error?.message || error?.message)
        throw error
      }
    },
    enabled: !!assessmentId,
  })
}

// Get latest assessment result (for showing on dashboard, etc.)
export function useLatestAssessmentResult() {
  return useQuery({
    queryKey: assessmentKeys.latestResult(),
    queryFn: async () => {
      console.log('[DEBUG useLatestAssessmentResult] Fetching /members/assessments/results/latest')
      try {
        const result = await api.get<AssessmentResult>('/members/assessments/results/latest')
        console.log('[DEBUG useLatestAssessmentResult] Response keys:', result ? Object.keys(result) : 'null')
        console.log('[DEBUG useLatestAssessmentResult] pillar_scores:', JSON.stringify((result as any)?.pillar_scores))
        console.log('[DEBUG useLatestAssessmentResult] archetypes:', JSON.stringify((result as any)?.archetypes))
        console.log('[DEBUG useLatestAssessmentResult] overall_score:', (result as any)?.overall_score)
        console.log('[DEBUG useLatestAssessmentResult] insights:', JSON.stringify((result as any)?.insights)?.slice(0, 1000))
        console.log('[DEBUG useLatestAssessmentResult] Full response:', JSON.stringify(result, null, 2)?.slice(0, 3000))
        return result
      } catch (error: any) {
        console.error('[DEBUG useLatestAssessmentResult] FAILED:', error?.status, error?.error?.message || error?.message)
        throw error
      }
    },
  })
}

// Submit assessment answers
export function useSubmitAssessment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      assessmentId,
      data,
    }: {
      assessmentId: string
      data: SubmitAssessmentRequest
    }) => {
      console.log('[DEBUG useSubmitAssessment] Submitting to:', `/members/assessments/${assessmentId}/submit`)
      console.log('[DEBUG useSubmitAssessment] Answer count:', Object.keys(data.answers).length)
      console.log('[DEBUG useSubmitAssessment] Answers:', JSON.stringify(data.answers)?.slice(0, 1000))
      try {
        const result = await api.post<AssessmentResult>(`/members/assessments/${assessmentId}/submit`, data)
        console.log('[DEBUG useSubmitAssessment] Success response:', JSON.stringify(result, null, 2)?.slice(0, 2000))
        return result
      } catch (error: any) {
        console.error('[DEBUG useSubmitAssessment] FAILED:', error?.status, error?.error?.message || error?.message)
        console.error('[DEBUG useSubmitAssessment] Full error:', JSON.stringify(error, null, 2)?.slice(0, 1000))
        throw error
      }
    },
    onSuccess: (_, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.all })
      queryClient.invalidateQueries({ queryKey: assessmentKeys.results(assessmentId) })
      queryClient.invalidateQueries({ queryKey: assessmentKeys.latestResult() })
    },
  })
}
