import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Archetype, PillarId } from '../lib/constants'

export interface MemberProfile {
  user_id: string
  display_name: string | null
  bio: string | null
  archetype: Archetype | null
  pillar_focus: PillarId[] | null
  city: string | null
  country: string | null
  links: Record<string, string> | null
  visibility: Record<string, string> | null
  avatar_url: string | null
  whatsapp_number: string | null
  created_at: string
  updated_at: string
}

// Fetch member profile from member_profiles table
export function useMemberProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['member-profile', userId],
    queryFn: async () => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('member_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        // If member doesn't exist yet, return null (will be created on first save)
        if (error.code === 'PGRST116') return null
        throw error
      }

      return data as MemberProfile
    },
    enabled: !!userId,
  })
}

export interface UpdateProfileData {
  display_name?: string | null
  whatsapp_number?: string | null
  city?: string | null
  country?: string | null
  bio?: string | null
  archetype?: Archetype | null
  pillar_focus?: PillarId[] | null
  links?: Record<string, string> | null
  visibility?: Record<string, string> | null
  avatar_url?: string | null
}

// Update member profile
export function useUpdateMemberProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string
      data: UpdateProfileData
    }) => {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
      }

      // Try to update first
      const { data: existing, error: selectError } = await supabase
        .from('member_profiles')
        .select('user_id')
        .eq('user_id', userId)
        .single()

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError
      }

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('member_profiles')
          .update(updateData)
          .eq('user_id', userId)

        if (error) throw error
      } else {
        // Insert new record
        const { error } = await supabase.from('member_profiles').insert({
          user_id: userId,
          ...updateData,
          created_at: new Date().toISOString(),
        })

        if (error) throw error
      }
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['member-profile', userId] })
    },
  })
}
