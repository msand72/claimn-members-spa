import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, safeArray } from '../client'

export interface JournalEntry {
  id: string
  user_id: string
  entry_type: string
  content: string
  mood?: string
  pillar?: string
  created_at: string
  updated_at?: string
}

export interface JournalEntriesParams {
  page?: number
  limit?: number
}

interface JournalEntriesResponse {
  data: JournalEntry[]
  pagination?: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export const journalKeys = {
  all: ['journal'] as const,
  list: (params?: JournalEntriesParams) => [...journalKeys.all, 'list', params] as const,
  entry: (id: string) => [...journalKeys.all, 'entry', id] as const,
}

// GET /members/journal - List journal entries
export function useJournalEntries(params?: JournalEntriesParams) {
  return useQuery({
    queryKey: journalKeys.list(params),
    queryFn: async () => {
      const response = await api.get<JournalEntriesResponse>(
        '/members/journal',
        params as Record<string, string | number | boolean | undefined>
      )
      return {
        data: safeArray<JournalEntry>(response),
        pagination: (response as JournalEntriesResponse).pagination,
      }
    },
  })
}

// GET /members/journal/:id - Get single entry
export function useJournalEntry(id: string) {
  return useQuery({
    queryKey: journalKeys.entry(id),
    queryFn: () => api.get<JournalEntry>(`/members/journal/${id}`),
    enabled: !!id,
  })
}

// POST /members/journal - Create journal entry
export function useCreateJournalEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      entry_type: string
      content: string
      mood?: string
      pillar?: string
    }) => api.post<{ id: string }>('/members/journal', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.all })
    },
  })
}

// PUT /members/journal/:id - Update journal entry
export function useUpdateJournalEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: {
      id: string
      entry_type?: string
      content?: string
      mood?: string
      pillar?: string
    }) => api.put<{ success: boolean }>(`/members/journal/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: journalKeys.all })
      queryClient.invalidateQueries({ queryKey: journalKeys.entry(variables.id) })
    },
  })
}

// DELETE /members/journal/:id - Delete journal entry
export function useDeleteJournalEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete<{ success: boolean }>(`/members/journal/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.all })
    },
  })
}
