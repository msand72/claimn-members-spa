import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../client'

export interface Invoice {
  id: string
  amount: number
  currency: string
  status: string
  invoice_url: string
  created_at: string
}

export const billingKeys = {
  all: ['billing'] as const,
  checkout: () => [...billingKeys.all, 'checkout'] as const,
  verify: (sessionId: string) => [...billingKeys.all, 'verify', sessionId] as const,
  invoices: () => [...billingKeys.all, 'invoices'] as const,
  plans: () => [...billingKeys.all, 'plans'] as const,
}

// --- Plans API types (returned by GET /members/billing/plans) ---

export interface PlanPrice {
  price_id: string
  amount: number
  amount_cents: number
  currency: string
  interval: string
}

export interface PlanInfo {
  tier: string
  name: string
  description: string
  monthly: PlanPrice | null
  annual: PlanPrice | null
  features: string[]
}

export interface ExpertSessionPriceInfo {
  duration: number
  price_id: string
  amount: number
  amount_cents: number
  currency: string
  label: string
}

export interface PlansResponse {
  plans: PlanInfo[]
  expert_sessions: ExpertSessionPriceInfo[]
}

export interface CheckoutRequest {
  price_id: string
  tier?: string
  product?: string
  mode?: 'subscription' | 'payment'
  max_members?: number
  expert_id?: string
  protocol_slug?: string
  success_url?: string
  cancel_url?: string
}

interface CheckoutResponse {
  url: string
}

export interface VerifyResponse {
  status: string
  payment_status: string
  customer_email?: string
  subscription_id?: string
  customer_id?: string
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

export interface PaymentMethod {
  type: string
  last4: string
  brand: string
  exp_month: number
  exp_year: number
}

export interface BillingInfo {
  subscription: {
    tier: string
    status: string
    current_period_start: string
    current_period_end: string
    cancel_at_period_end: boolean
    amount?: number
    currency?: string
    interval?: string
    features?: string[]
  }
  payment_method?: PaymentMethod
}

/**
 * Fetch full billing info (subscription + payment method).
 * Unlike useSubscription, this does NOT swallow errors —
 * use it on the Billing page where errors must be visible.
 */
export function useBillingInfo() {
  return useQuery({
    queryKey: [...billingKeys.all, 'info'] as const,
    queryFn: () => api.get<BillingInfo>('/members/billing'),
  })
}

export function useInvoices() {
  return useQuery({
    queryKey: billingKeys.invoices(),
    queryFn: async () => {
      const data = await api.get<{ invoices?: Invoice[]; data?: Invoice[] }>(
        '/members/billing/invoices',
      )
      const list = data?.invoices ?? data?.data
      return Array.isArray(list) ? list : []
    },
  })
}

export function useBillingPortal() {
  return useMutation({
    mutationFn: () =>
      api.post<{ url: string }>('/members/billing/portal'),
  })
}

/**
 * Fetch available membership plans and expert session prices from the backend.
 * Prices are fetched from Stripe via the API — the frontend never hardcodes amounts.
 */
export function usePlans() {
  return useQuery({
    queryKey: billingKeys.plans(),
    queryFn: () => api.get<PlansResponse>('/members/billing/plans'),
    staleTime: 60 * 60 * 1000, // 1 hour — prices rarely change
  })
}
