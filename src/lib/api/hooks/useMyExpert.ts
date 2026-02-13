import { useQuery } from '@tanstack/react-query'
import { api, is404Error } from '../client'
import type { MyExpertData } from '../types'

export type { MyExpertData }

export const myExpertKeys = {
  all: ['my-expert'] as const,
  data: () => [...myExpertKeys.all, 'data'] as const,
}

export function useMyExpert() {
  return useQuery({
    queryKey: myExpertKeys.data(),
    queryFn: () => api.get<MyExpertData>('/members/my-expert'),
    // Don't retry on 404 — means no expert assigned
    retry: (failureCount, error) => !is404Error(error) && failureCount < 1,
  })
}
