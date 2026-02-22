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
}

export interface CheckoutRequest {
  price_id: string
  tier?: string
  product?: string
  max_members?: number
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
