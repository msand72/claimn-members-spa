import { useQuery } from '@tanstack/react-query'
import { api, is404Error } from '../client'

export interface MyExpertData {
  expert: {
    id: string
    name: string
    bio: string
    avatar_url: string
    specializations: string
  }
  next_session: {
    id: string
    session_date: string
    status: string
  } | null
}

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
