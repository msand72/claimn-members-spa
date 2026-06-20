import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete<{ deleted: boolean }>('/members/account'),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}
