import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type PaginatedResponse, type PaginationParams } from '../client'
import { STALE_TIME } from '../../constants'
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
  resultById: (id: string) => [...assessmentKeys.all, 'result-by-id', id] as const,
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
      if (Array.isArray(result)) return result
      const wrapped = result as { questions?: unknown }
      return Array.isArray(wrapped?.questions) ? wrapped.questions as AssessmentQuestion[] : []
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

// Get a specific assessment result by its ID
export function useAssessmentResultById(resultId: string) {
  return useQuery({
    queryKey: assessmentKeys.resultById(resultId),
    queryFn: async () => {
      const result = await api.get<AssessmentResult>(
        `/members/assessments/results/${resultId}`
      )
      return normalizeAssessmentResult(result)
    },
    enabled: !!resultId,
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
    staleTime: STALE_TIME.STATIC,
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
 * Normalize an AssessmentResult from the backend to a consistent snake_case shape.
 *
 * The backend returns three different response formats depending on the endpoint:
 *
 * **Format 1 — Snake_case (GET endpoints / stored results):**
 * `{ primary_archetype, pillar_scores, archetype_scores, ... }` → returned as-is.
 *
 * **Format 2 — CamelCase (POST /submit response):**
 * `{ resultId, primary, pillarScores, archetypeScores, ... }` → mapped to snake_case.
 *
 * **Format 3 — Legacy array (old results):**
 * `{ archetypes: ["The Achiever", "The Optimizer"] }` → maps first two entries to
 * primary/secondary archetype with "The " prefix stripped and lowercased.
 *
 * TODO: Once the backend standardizes all responses to snake_case (Format 1), this
 * function can be replaced with a simple identity return.
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
  if (Array.isArray(raw.archetypes) && raw.archetypes.length > 0 && !result.primary_archetype) {
    const primaryDisplay = String(raw.archetypes[0] ?? '')
    const secondaryDisplay = raw.archetypes[1] ? String(raw.archetypes[1]) : null
    result.primary_archetype = primaryDisplay.replace('The ', '').toLowerCase()
    result.secondary_archetype = secondaryDisplay
      ? secondaryDisplay.replace('The ', '').toLowerCase()
      : null
  }

  return result
}
