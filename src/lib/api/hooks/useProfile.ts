import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import type { MemberProfile, UpdateProfileRequest } from '../types'

// Query keys
export const profileKeys = {
  all: ['profile'] as const,
  current: () => [...profileKeys.all, 'current'] as const,
}

// Get current user's profile
export function useCurrentProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: profileKeys.current(),
    queryFn: () => api.get<MemberProfile>('/members/profile'),
    enabled: options?.enabled ?? true,
  })
}

// Update profile
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) =>
      api.put<MemberProfile>('/members/profile', data),
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.current(), data)
    },
  })
}

// Upload avatar
export function useUploadAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) =>
      api.uploadFile('/members/profile/avatar', file, 'avatar'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.current() })
    },
  })
}
