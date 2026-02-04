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
      // Handle both single object and array (take first) responses
      const single = Array.isArray(result) ? result[0] : result
      // Backend returns empty {} when no results found
      if (!single || (typeof single === 'object' && !single.id && !single.primary_archetype && !single.assessment_id)) {
        return undefined
      }
      return normalizeAssessmentResult(single)
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
      const response = await api.post<{ success: boolean; results: AssessmentResult } | AssessmentResult>(
        `/members/assessments/${assessmentId}/submit`,
        data
      )

      // Handle both { success, results } wrapper and flat result
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (response as any).results ?? response
      return normalizeAssessmentResult(result as AssessmentResult)
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
 * Normalize an AssessmentResult to handle multiple API response shapes:
 * 1. Snake_case (from GET endpoints / DB) — primary_archetype, pillar_scores
 * 2. CamelCase (from POST submit response) — primary, pillarScores, resultId
 * 3. Legacy (old format) — archetypes array
 */
function normalizeAssessmentResult(result: AssessmentResult): AssessmentResult {
  if (!result) return result

  // If result already has new-format snake_case fields, return as-is
  if (result.primary_archetype && result.pillar_scores) {
    return result
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = result as any

  // Handle camelCase submit response: { resultId, primary, pillarScores, ... }
  if (raw.primary || raw.resultId || raw.pillarScores) {
    result.id = raw.resultId ?? raw.id ?? result.id
    result.assessment_id = raw.assessmentId ?? raw.assessment_id ?? result.assessment_id
    result.primary_archetype = raw.primary ?? raw.primary_archetype ?? result.primary_archetype
    result.secondary_archetype = raw.secondary ?? raw.secondary_archetype ?? result.secondary_archetype ?? null
    result.archetype_scores = raw.archetypeScores ?? raw.archetype_scores ?? result.archetype_scores
    result.pillar_scores = raw.pillarScores ?? raw.pillar_scores ?? result.pillar_scores
    result.consistency_score = raw.consistencyScore ?? raw.consistency_score ?? result.consistency_score ?? 0
    result.micro_insights = raw.microInsights ?? raw.micro_insights ?? result.micro_insights ?? []
    result.integration_insights = raw.integrationInsights ?? raw.integration_insights ?? result.integration_insights ?? []
    return result
  }

  // Legacy format compatibility: map old archetypes array to new structure
  if (raw.archetypes && !result.primary_archetype) {
    const primaryDisplay = raw.archetypes[0] ?? ''
    const secondaryDisplay = raw.archetypes[1] ?? null
    result.primary_archetype = primaryDisplay.replace('The ', '').toLowerCase()
    result.secondary_archetype = secondaryDisplay
      ? secondaryDisplay.replace('The ', '').toLowerCase()
      : null
  }

  return result
}
