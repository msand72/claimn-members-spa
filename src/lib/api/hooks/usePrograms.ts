import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type PaginatedResponse, type PaginationParams } from '../client'
import type {
  Program,
  UserProgram,
  Sprint,
  SprintGoal,
  MemberSprintProgress,
  PeerReview,
  ProgramAssessment,
  ProgramAssessmentResult,
  SubmitProgramAssessmentRequest,
  EnrollProgramRequest,
  JoinSprintRequest,
  SubmitReviewRequest,
} from '../types'

// Query keys
export const programKeys = {
  all: ['programs'] as const,
  list: (params?: ProgramsParams) => [...programKeys.all, 'list', params] as const,
  detail: (id: string) => [...programKeys.all, 'detail', id] as const,
  enrolled: (params?: PaginationParams) => [...programKeys.all, 'enrolled', params] as const,
  sprints: (programId?: string, params?: SprintsParams) =>
    [...programKeys.all, 'sprints', programId, params] as const,
  sprint: (id: string) => [...programKeys.all, 'sprint', id] as const,
  sprintGoals: (sprintId: string) => [...programKeys.all, 'sprintGoals', sprintId] as const,
  sprintProgress: (sprintId: string) => [...programKeys.all, 'sprintProgress', sprintId] as const,
  reviews: (params?: ReviewsParams) => [...programKeys.all, 'reviews', params] as const,
  review: (id: string) => [...programKeys.all, 'review', id] as const,
  assessments: (programId: string) => [...programKeys.all, 'assessments', programId] as const,
  assessment: (id: string) => [...programKeys.all, 'assessment', id] as const,
  assessmentResults: (programId: string) => [...programKeys.all, 'assessmentResults', programId] as const,
}

// Extended params for programs
export interface ProgramsParams extends PaginationParams {
  category?: string
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
  search?: string
}

// Extended params for sprints
export interface SprintsParams extends PaginationParams {
  status?: 'upcoming' | 'active' | 'completed'
}

// Extended params for reviews
export interface ReviewsParams extends PaginationParams {
  type?: 'given' | 'received' | 'pending'
  program_id?: string
}

// =====================================================
// Program Hooks
// =====================================================

// Get all programs
export function usePrograms(params?: ProgramsParams) {
  return useQuery({
    queryKey: programKeys.list(params),
    queryFn: () =>
      api.get<PaginatedResponse<Program>>('/members/programs', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
        category: params?.category,
        difficulty: params?.difficulty,
        search: params?.search,
      }),
  })
}

// Get single program
export function useProgram(id: string) {
  return useQuery({
    queryKey: programKeys.detail(id),
    queryFn: () => api.get<Program>(`/members/programs/${id}`),
    enabled: !!id,
  })
}

// Get user's enrolled programs
export function useEnrolledPrograms(params?: PaginationParams) {
  return useQuery({
    queryKey: programKeys.enrolled(params),
    queryFn: () =>
      api.get<PaginatedResponse<UserProgram>>('/members/programs/enrolled', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
      }),
  })
}

// Enroll in a program
export function useEnrollProgram() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: EnrollProgramRequest) =>
      api.post<UserProgram>('/members/programs/enroll', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programKeys.all })
    },
  })
}

// Update program progress
export function useUpdateProgramProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      programId,
      progress,
    }: {
      programId: string
      progress: number
    }) =>
      api.put<UserProgram>(`/members/programs/${programId}/progress`, { progress }),
    onSuccess: (_, { programId }) => {
      queryClient.invalidateQueries({ queryKey: programKeys.all })
      queryClient.invalidateQueries({ queryKey: programKeys.detail(programId) })
    },
  })
}

// =====================================================
// Sprint Hooks
// =====================================================

// Get sprints (optionally filtered by program)
export function useSprints(programId?: string, params?: SprintsParams) {
  return useQuery({
    queryKey: programKeys.sprints(programId, params),
    queryFn: () => {
      const endpoint = programId
        ? `/members/programs/${programId}/sprints`
        : '/members/programs/sprints'
      return api.get<PaginatedResponse<Sprint>>(endpoint, {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
        status: params?.status,
      })
    },
  })
}

// Get single sprint
export function useSprint(id: string) {
  return useQuery({
    queryKey: programKeys.sprint(id),
    queryFn: () => api.get<Sprint>(`/members/programs/sprints/${id}`),
    enabled: !!id,
  })
}

// Join a sprint
export function useJoinSprint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: JoinSprintRequest) =>
      api.post<Sprint>('/members/programs/sprints/join', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programKeys.all })
    },
  })
}

// Get goals for a sprint
export function useSprintGoals(sprintId: string) {
  return useQuery({
    queryKey: programKeys.sprintGoals(sprintId),
    queryFn: () =>
      api.get<PaginatedResponse<SprintGoal>>(`/members/programs/sprints/${sprintId}/goals`),
    enabled: !!sprintId,
  })
}

// Get user's progress for a sprint
export function useSprintProgress(sprintId: string) {
  return useQuery({
    queryKey: programKeys.sprintProgress(sprintId),
    queryFn: () =>
      api.get<MemberSprintProgress>(`/members/programs/sprints/${sprintId}/progress`),
    enabled: !!sprintId,
  })
}

// Update sprint progress
export function useUpdateSprintProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sprintId,
      data,
    }: {
      sprintId: string
      data: { status?: string; progress_percentage?: number; notes?: string }
    }) =>
      api.put<MemberSprintProgress>(`/members/programs/sprints/${sprintId}/progress`, data),
    onSuccess: (_, { sprintId }) => {
      queryClient.invalidateQueries({ queryKey: programKeys.sprintProgress(sprintId) })
      queryClient.invalidateQueries({ queryKey: programKeys.sprints() })
    },
  })
}

// Mark a sprint goal as complete
export function useCompleteSprintGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sprintId, goalId }: { sprintId: string; goalId: string }) =>
      api.put<MemberSprintProgress>(
        `/members/programs/sprints/${sprintId}/goals/${goalId}/complete`,
        {}
      ),
    onSuccess: (_, { sprintId }) => {
      queryClient.invalidateQueries({ queryKey: programKeys.sprintProgress(sprintId) })
      queryClient.invalidateQueries({ queryKey: programKeys.sprintGoals(sprintId) })
      queryClient.invalidateQueries({ queryKey: programKeys.sprints() })
    },
  })
}

// =====================================================
// Program Assessment Hooks
// =====================================================

// Get assessments for a program
export function useProgramAssessments(programId: string) {
  return useQuery({
    queryKey: programKeys.assessments(programId),
    queryFn: () =>
      api.get<PaginatedResponse<ProgramAssessment>>(`/members/programs/${programId}/assessments`),
    enabled: !!programId,
  })
}

// Get single assessment with questions
export function useProgramAssessment(id: string) {
  return useQuery({
    queryKey: programKeys.assessment(id),
    queryFn: () => api.get<ProgramAssessment>(`/members/programs/assessments/${id}`),
    enabled: !!id,
  })
}

// Submit assessment answers
export function useSubmitProgramAssessment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      assessmentId,
      data,
    }: {
      assessmentId: string
      programId: string
      data: SubmitProgramAssessmentRequest
    }) =>
      api.post<ProgramAssessmentResult>(
        `/members/programs/assessments/${assessmentId}/submit`,
        data
      ),
    onSuccess: (_, { programId }) => {
      queryClient.invalidateQueries({ queryKey: programKeys.assessments(programId) })
      queryClient.invalidateQueries({ queryKey: programKeys.assessmentResults(programId) })
      queryClient.invalidateQueries({ queryKey: programKeys.all })
    },
  })
}

// Get assessment results for a program
export function useProgramAssessmentResults(programId: string) {
  return useQuery({
    queryKey: programKeys.assessmentResults(programId),
    queryFn: () =>
      api.get<PaginatedResponse<ProgramAssessmentResult>>(
        `/members/programs/${programId}/assessment-results`
      ),
    enabled: !!programId,
  })
}

// =====================================================
// Peer Review Hooks
// =====================================================

// Get peer reviews
export function usePeerReviews(params?: ReviewsParams) {
  return useQuery({
    queryKey: programKeys.reviews(params),
    queryFn: () =>
      api.get<PaginatedResponse<PeerReview>>('/members/programs/reviews', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
        type: params?.type,
        program_id: params?.program_id,
      }),
  })
}

// Get single peer review
export function usePeerReview(id: string) {
  return useQuery({
    queryKey: programKeys.review(id),
    queryFn: () => api.get<PeerReview>(`/members/programs/reviews/${id}`),
    enabled: !!id,
  })
}

// Submit a peer review
export function useSubmitPeerReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ reviewId, data }: { reviewId: string; data: SubmitReviewRequest }) =>
      api.put<PeerReview>(`/members/programs/reviews/${reviewId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programKeys.reviews() })
    },
  })
}
