import { useQuery } from '@tanstack/react-query'
import { api } from '../client'
import type { SubscriptionTier, SubscriptionInfo } from '../types'

export type { SubscriptionTier, SubscriptionInfo }


export const subscriptionKeys = {
  all: ['subscription'] as const,
  info: () => [...subscriptionKeys.all, 'info'] as const,
}

/**
 * Fetch the current user's subscription info.
 * Returns tier, status, and billing details.
 */
const FALLBACK_SUB: SubscriptionInfo = {
  tier: 'none',
  status: 'inactive',
  current_period_start: '',
  current_period_end: '',
  cancel_at_period_end: false,
}

export function useSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.info(),
    queryFn: async () => {
      try {
        const response = await api.get<Record<string, unknown>>('/members/billing')
        // Backend wraps in { data: { subscription: {...}, plan: {...} } }
        const root = (response as any)?.data ?? response
        const sub = root?.subscription
        if (sub && typeof sub === 'object' && 'tier' in sub) {
          const rawTier = String((sub as any).tier || 'none')
          // Backend returns "free" for no subscription; normalize to "none"
          const tier = (rawTier === 'free' ? 'none' : rawTier) as SubscriptionTier
          return {
            tier,
            status: String((sub as any).status || 'inactive'),
            current_period_start: String((sub as any).current_period_start || ''),
            current_period_end: String((sub as any).current_period_end || ''),
            cancel_at_period_end: Boolean((sub as any).cancel_at_period_end),
          } as SubscriptionInfo
        }
        if (import.meta.env.DEV) {
          console.warn('[useSubscription] Unexpected billing response:', response)
        }
        return FALLBACK_SUB
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[useSubscription] Billing fetch failed:', err)
        }
        return FALLBACK_SUB
      }
    },
    retry: 1,
    refetchOnWindowFocus: true,
    staleTime: 60_000, // consider fresh for 1 minute
  })
}

/**
 * Helper to check if a tier has access to premium features.
 * Premium = coaching tier or above.
 */
export function hasPremiumAccess(tier: SubscriptionTier): boolean {
  return tier === 'coaching' || tier === 'programs'
}

/**
 * Tier hierarchy for comparison.
 * Higher number = higher tier.
 */
const TIER_LEVELS: Record<SubscriptionTier, number> = {
  none: 0,
  brotherhood: 1,
  coaching: 2,
  programs: 3,
}

/**
 * Check if userTier meets the minimum required tier.
 */
export function meetsTierRequirement(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return TIER_LEVELS[userTier] >= TIER_LEVELS[requiredTier]
}
