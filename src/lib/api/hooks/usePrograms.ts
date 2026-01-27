import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type PaginatedResponse, type PaginationParams } from '../client'
import type {
  Program,
  UserProgram,
  Sprint,
  PeerReview,
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
  reviews: (params?: ReviewsParams) => [...programKeys.all, 'reviews', params] as const,
  review: (id: string) => [...programKeys.all, 'review', id] as const,
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
