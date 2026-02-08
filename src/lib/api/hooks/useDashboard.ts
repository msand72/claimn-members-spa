import { useQuery } from '@tanstack/react-query'
import { api, safeArray } from '../client'
import type { Achievement, DashboardData, DashboardStats } from '../types'

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  data: () => [...dashboardKeys.all, 'data'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  achievements: () => [...dashboardKeys.all, 'achievements'] as const,
}

// Get dashboard data
export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.data(),
    queryFn: () => api.get<DashboardData>('/members/dashboard'),
  })
}

// Get stats from the dashboard endpoint (which returns the full DashboardStats shape)
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const res = await api.get<DashboardStats>('/members/dashboard')
      // Normalise field name differences between backend and frontend
      if (res && typeof res === 'object') {
        if (!('unread_messages' in res) && 'messages_unread' in res) {
          (res as DashboardStats).unread_messages = (res as DashboardStats).messages_unread
        }
      }
      return res
    },
  })
}

// Get member achievements
// GET /members/achievements
export function useAchievements() {
  return useQuery({
    queryKey: dashboardKeys.achievements(),
    queryFn: async () => {
      const res = await api.get<Achievement[] | { data: Achievement[] }>('/members/achievements')
      return safeArray<Achievement>(res)
    },
  })
}
