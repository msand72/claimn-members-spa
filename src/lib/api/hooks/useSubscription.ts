import { useQuery } from '@tanstack/react-query'
import { api } from '../client'
import type { SubscriptionTier, SubscriptionInfo } from '../types'

export type { SubscriptionTier, SubscriptionInfo }

interface BillingResponse {
  subscription: SubscriptionInfo
}

export const subscriptionKeys = {
  all: ['subscription'] as const,
  info: () => [...subscriptionKeys.all, 'info'] as const,
}

/**
 * Fetch the current user's subscription info.
 * Returns tier, status, and billing details.
 */
export function useSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.info(),
    queryFn: async () => {
      try {
        const response = await api.get<BillingResponse>('/members/billing')
        return response.subscription
      } catch {
        // If billing endpoint fails, return a default "none" subscription
        return {
          tier: 'none' as SubscriptionTier,
          status: 'inactive',
          current_period_start: '',
          current_period_end: '',
          cancel_at_period_end: false,
        }
      }
    },
    // Uses QueryClient global default (STALE_TIME.DEFAULT = 5 min)
    retry: 1,
  })
}

/**
 * Helper to check if a tier has access to premium features.
 * Premium = coaching or programs tier.
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
