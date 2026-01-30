import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../client'

export const billingKeys = {
  all: ['billing'] as const,
  checkout: () => [...billingKeys.all, 'checkout'] as const,
  verify: (sessionId: string) => [...billingKeys.all, 'verify', sessionId] as const,
}

interface CheckoutRequest {
  item_type?: string
  item_slug?: string
  plan_tier?: string
}

interface CheckoutResponse {
  checkout_url: string
  session_id: string
}

interface VerifyResponse {
  success: boolean
  plan_name?: string
  billing_cycle?: string
  amount_paid?: number
  currency?: string
  next_billing_date?: string
  email?: string
  item_type?: string
  item_name?: string
}

export function useCheckout() {
  return useMutation({
    mutationFn: (data: CheckoutRequest) =>
      api.post<CheckoutResponse>('/members/billing/checkout', data),
  })
}

export function useVerifyCheckout(sessionId: string) {
  return useQuery({
    queryKey: billingKeys.verify(sessionId),
    queryFn: () =>
      api.post<VerifyResponse>('/members/billing/checkout/verify', {
        session_id: sessionId,
      }),
    enabled: !!sessionId,
    retry: false,
  })
}
