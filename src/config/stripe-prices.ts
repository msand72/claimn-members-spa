export const MEMBERSHIP_PRICES = {
  brotherhood: {
    monthly: { priceId: import.meta.env.VITE_STRIPE_PRICE_BROTHERHOOD_MONTHLY ?? '', amount: 19, label: 'The Brotherhood' },
    annual:  { priceId: import.meta.env.VITE_STRIPE_PRICE_BROTHERHOOD_ANNUAL ?? '', amount: 180, label: 'The Brotherhood' },
  },
  coaching: {
    monthly: { priceId: import.meta.env.VITE_STRIPE_PRICE_COACHING_MONTHLY ?? '', amount: 390, label: 'Expert Guidance' },
    annual:  { priceId: import.meta.env.VITE_STRIPE_PRICE_COACHING_ANNUAL ?? '', amount: 3480, label: 'Expert Guidance' },
  },
  programs: {
    monthly: { priceId: import.meta.env.VITE_STRIPE_PRICE_PROGRAMS_MONTHLY ?? '', amount: 1490, label: 'The Forge' },
    annual:  { priceId: import.meta.env.VITE_STRIPE_PRICE_PROGRAMS_ANNUAL ?? '', amount: 14125, label: 'The Forge' },
  },
} as const

export const EXPERT_SESSION_PRICES = {
  45: { priceId: import.meta.env.VITE_STRIPE_PRICE_EXPERT_45 ?? '', amount: 129, label: '45 min' },
  60: { priceId: import.meta.env.VITE_STRIPE_PRICE_EXPERT_60 ?? '', amount: 179, label: '60 min' },
  90: { priceId: import.meta.env.VITE_STRIPE_PRICE_EXPERT_90 ?? '', amount: 229, label: '90 min' },
} as const

export type MembershipTier = keyof typeof MEMBERSHIP_PRICES
export type BillingInterval = 'monthly' | 'annual'
export type ExpertSessionDuration = keyof typeof EXPERT_SESSION_PRICES
