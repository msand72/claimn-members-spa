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
  membership: 1,
  coaching: 2,
  programs: 3,
}

/**
 * Resolve a tier to its rank, failing LOUDLY on a word we do not know.
 *
 * THIS IS THE HALF THAT MATTERS MORE THAN ADDING 'membership'. The bare index
 * `TIER_LEVELS[tier]` yields `undefined` for an unrecognised tier, and
 * `undefined >= n` is FALSE FOR EVERY n INCLUDING 0 — so one unknown word made
 * meetsTierRequirement fail EVERY check, not only the premium ones, and a paying
 * member was shown a wall telling them to buy what they had already bought.
 * No error, no log, no 403: the comparison quietly answered "no".
 *
 * TypeScript cannot prevent it. The value arrives from the API at runtime and the
 * union is only a compile-time promise about our own code.
 *
 * So an unknown tier is treated as rank 0 — the access an authenticated
 * non-subscriber has — and REPORTED. Free content keeps working, premium stays
 * withheld because entitlement genuinely cannot be verified, and the console names
 * the word we did not understand instead of leaving a silent wall.
 */
function tierRank(tier: SubscriptionTier): number {
  const rank = TIER_LEVELS[tier]
  if (rank === undefined) {
    console.error(
      `[useSubscription] unknown subscription tier ${JSON.stringify(tier)} — treating it as no ` +
      `subscription. This is a VOCABULARY MISMATCH with the backend, not a customer problem: ` +
      `add it to SubscriptionTier and TIER_LEVELS. Known tiers: ${Object.keys(TIER_LEVELS).join(', ')}.`
    )
    return 0
  }
  return rank
}

/**
 * Check if userTier meets the minimum required tier.
 */
export function meetsTierRequirement(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return tierRank(userTier) >= tierRank(requiredTier)
}
