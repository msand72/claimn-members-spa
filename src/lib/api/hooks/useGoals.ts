import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type PaginatedResponse, type PaginationParams } from '../client'
import type {
  Goal,
  CreateGoalRequest,
  UpdateGoalRequest,
  KPI,
  KPILog,
  LogKPIRequest,
} from '../types'

// Query keys
export const goalKeys = {
  all: ['goals'] as const,
  list: (params?: PaginationParams & { status?: string; pillar_id?: string }) =>
    [...goalKeys.all, 'list', params] as const,
  detail: (id: string) => [...goalKeys.all, 'detail', id] as const,
  kpis: (goalId: string) => [...goalKeys.all, 'kpis', goalId] as const,
}

export const kpiKeys = {
  all: ['kpis'] as const,
  list: (params?: PaginationParams) => [...kpiKeys.all, 'list', params] as const,
  detail: (id: string) => [...kpiKeys.all, 'detail', id] as const,
  logs: (kpiId: string, params?: PaginationParams) =>
    [...kpiKeys.all, 'logs', kpiId, params] as const,
}

// =====================================================
// Goals Hooks
// =====================================================

// Get all goals (with optional filters)
export function useGoals(params?: PaginationParams & { status?: string; pillar_id?: string }) {
  return useQuery({
    queryKey: goalKeys.list(params),
    queryFn: () =>
      api.get<PaginatedResponse<Goal>>('/members/goals', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
        status: params?.status,
        pillar_id: params?.pillar_id,
      }),
  })
}

// Get single goal by ID
export function useGoal(id: string) {
  return useQuery({
    queryKey: goalKeys.detail(id),
    queryFn: () => api.get<Goal>(`/members/goals/${id}`),
    enabled: !!id,
  })
}

// Create a new goal
export function useCreateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateGoalRequest) =>
      api.post<Goal>('/members/goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all })
    },
  })
}

// Update a goal
export function useUpdateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGoalRequest }) =>
      api.put<Goal>(`/members/goals/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: goalKeys.list() })
    },
  })
}

// Delete a goal
export function useDeleteGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/members/goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all })
    },
  })
}

// =====================================================
// KPIs Hooks
// =====================================================

// Get all KPIs for the current user
export function useKPIs(params?: PaginationParams) {
  return useQuery({
    queryKey: kpiKeys.list(params),
    queryFn: () =>
      api.get<PaginatedResponse<KPI>>('/members/kpis', {
        page: params?.page,
        limit: params?.limit,
        sort: params?.sort,
      }),
  })
}

// Get KPIs for a specific goal
export function useGoalKPIs(goalId: string) {
  return useQuery({
    queryKey: goalKeys.kpis(goalId),
    queryFn: () => api.get<KPI[]>(`/members/goals/${goalId}/kpis`),
    enabled: !!goalId,
  })
}

// Get single KPI by ID
export function useKPI(id: string) {
  return useQuery({
    queryKey: kpiKeys.detail(id),
    queryFn: () => api.get<KPI>(`/members/kpis/${id}`),
    enabled: !!id,
  })
}

// Get KPI logs
export function useKPILogs(kpiId: string, params?: PaginationParams) {
  return useQuery({
    queryKey: kpiKeys.logs(kpiId, params),
    queryFn: () =>
      api.get<PaginatedResponse<KPILog>>(`/members/kpis/${kpiId}/logs`, {
        page: params?.page,
        limit: params?.limit,
      }),
    enabled: !!kpiId,
  })
}

// Create a KPI for a goal
export function useCreateKPI() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      goalId,
      data,
    }: {
      goalId: string
      data: Omit<KPI, 'id' | 'goal_id' | 'current_value' | 'created_at' | 'updated_at'>
    }) => api.post<KPI>(`/members/goals/${goalId}/kpis`, {
      kpi_name: data.name,
      kpi_type: data.type,
      target_value: data.target_value,
      unit: data.unit,
      tracking_frequency: data.frequency,
    }),
    onSuccess: (_, { goalId }) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.kpis(goalId) })
      queryClient.invalidateQueries({ queryKey: goalKeys.detail(goalId) })
      queryClient.invalidateQueries({ queryKey: kpiKeys.all })
    },
  })
}

// Log a KPI value
export function useLogKPI() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ kpiId, data }: { kpiId: string; data: LogKPIRequest }) =>
      api.post<KPILog>(`/members/kpis/${kpiId}/logs`, data),
    onSuccess: (_, { kpiId }) => {
      queryClient.invalidateQueries({ queryKey: kpiKeys.detail(kpiId) })
      queryClient.invalidateQueries({ queryKey: kpiKeys.logs(kpiId) })
      queryClient.invalidateQueries({ queryKey: kpiKeys.all })
      queryClient.invalidateQueries({ queryKey: goalKeys.all })
    },
  })
}

// Delete a KPI
export function useDeleteKPI() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/members/kpis/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kpiKeys.all })
      queryClient.invalidateQueries({ queryKey: goalKeys.all })
    },
  })
}
