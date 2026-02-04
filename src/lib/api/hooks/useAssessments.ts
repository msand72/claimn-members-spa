import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type PaginatedResponse, type PaginationParams } from '../client'
import type {
  Assessment,
  AssessmentQuestion,
  AssessmentResult,
  SubmitAssessmentRequest,
  AssessmentContentMap,
} from '../types'

// Query keys
export const assessmentKeys = {
  all: ['assessments'] as const,
  list: (params?: PaginationParams) => [...assessmentKeys.all, 'list', params] as const,
  detail: (id: string) => [...assessmentKeys.all, 'detail', id] as const,
  questions: (id: string) => [...assessmentKeys.all, 'questions', id] as const,
  results: (id: string) => [...assessmentKeys.all, 'results', id] as const,
  latestResult: () => [...assessmentKeys.all, 'latest-result'] as const,
  content: () => [...assessmentKeys.all, 'content'] as const,
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
// Handles both new format { questions: [...] } and legacy flat array
export function useAssessmentQuestions(assessmentId: string) {
  return useQuery({
    queryKey: assessmentKeys.questions(assessmentId),
    queryFn: async () => {
      const result = await api.get<AssessmentQuestion[] | { questions: AssessmentQuestion[] }>(
        `/members/assessments/${assessmentId}/questions`
      )
      // Handle both wrapped { questions: [...] } and flat [...] response shapes
      const questions = Array.isArray(result)
        ? result
        : (result as { questions: AssessmentQuestion[] }).questions ?? []
      return questions
    },
    enabled: !!assessmentId,
  })
}

// Get assessment results by assessment ID
export function useAssessmentResults(assessmentId: string) {
  return useQuery({
    queryKey: assessmentKeys.results(assessmentId),
    queryFn: async () => {
      const result = await api.get<AssessmentResult>(
        `/members/assessments/${assessmentId}/results`
      )
      return normalizeAssessmentResult(result)
    },
    enabled: !!assessmentId && assessmentId !== 'undefined',
  })
}

// Get latest assessment result (for dashboard, onboarding, etc.)
export function useLatestAssessmentResult() {
  return useQuery({
    queryKey: assessmentKeys.latestResult(),
    queryFn: async () => {
      const result = await api.get<AssessmentResult | AssessmentResult[]>(
        '/members/assessments/results/latest'
      )
      console.log('[useLatestAssessmentResult] Raw response:', JSON.stringify(result, null, 2))
      // Handle both single object and array (take first) responses
      const single = Array.isArray(result) ? result[0] : result
      if (!single) {
        console.log('[useLatestAssessmentResult] No result found')
        return undefined
      }
      const normalized = normalizeAssessmentResult(single)
      console.log('[useLatestAssessmentResult] Normalized:', JSON.stringify(normalized, null, 2))
      return normalized
    },
  })
}

// Get assessment content map (for rendering full report text from content table)
export function useAssessmentContent() {
  return useQuery({
    queryKey: assessmentKeys.content(),
    queryFn: async () => {
      const result = await api.get<AssessmentContentMap>('/members/assessments/content')
      return result
    },
    staleTime: 1000 * 60 * 60, // Content rarely changes — cache for 1 hour
  })
}

// Submit assessment answers (structured format for server-side scoring)
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
      console.log('[useSubmitAssessment] Submitting to', `/members/assessments/${assessmentId}/submit`, 'data:', JSON.stringify(data))
      const response = await api.post<{ success: boolean; results: AssessmentResult } | AssessmentResult>(
        `/members/assessments/${assessmentId}/submit`,
        data
      )
      console.log('[useSubmitAssessment] Raw response:', JSON.stringify(response, null, 2))

      // Handle both { success, results } wrapper and flat result
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (response as any).results ?? response
      console.log('[useSubmitAssessment] Extracted result:', JSON.stringify(result, null, 2))
      const normalized = normalizeAssessmentResult(result as AssessmentResult)
      console.log('[useSubmitAssessment] Normalized result:', JSON.stringify(normalized, null, 2))
      return normalized
    },
    onSuccess: (_, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.all })
      queryClient.invalidateQueries({ queryKey: assessmentKeys.results(assessmentId) })
      queryClient.invalidateQueries({ queryKey: assessmentKeys.latestResult() })
    },
  })
}

// =====================================================
// Helpers
// =====================================================

/**
 * Normalize an AssessmentResult to handle both old and new API response shapes
 * during the migration period. Once the backend is fully updated, the legacy
 * branch can be removed.
 */
function normalizeAssessmentResult(result: AssessmentResult): AssessmentResult {
  if (!result) return result

  // If result already has new-format fields, return as-is
  if (result.primary_archetype && result.pillar_scores) {
    return result
  }

  // Legacy format compatibility: map old fields to new structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const legacy = result as any

  if (legacy.archetypes && !result.primary_archetype) {
    // Old format had archetypes as ["The Achiever", "The Optimizer"]
    const primaryDisplay = legacy.archetypes[0] ?? ''
    const secondaryDisplay = legacy.archetypes[1] ?? null
    result.primary_archetype = primaryDisplay.replace('The ', '').toLowerCase()
    result.secondary_archetype = secondaryDisplay
      ? secondaryDisplay.replace('The ', '').toLowerCase()
      : null
  }

  return result
}
