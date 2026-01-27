import { useQuery } from '@tanstack/react-query'
import { api } from '../client'
import type { DashboardData, DashboardStats } from '../types'

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  data: () => [...dashboardKeys.all, 'data'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
}

// Get dashboard data
export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.data(),
    queryFn: () => api.get<DashboardData>('/members/dashboard'),
  })
}

// Get stats only
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => api.get<DashboardStats>('/members/stats'),
  })
}
