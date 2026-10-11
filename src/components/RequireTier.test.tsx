import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'

/**
 * The gate that actually guards paid content.
 *
 * PremiumProtected wraps RequireTier over 11 routes in App.tsx — protocols,
 * goals, KPIs, coaching — and until now it had no tests at all. Four tests for
 * the OLD gate sat in ProtectedRoute.test.tsx asserting behaviour deleted in
 * 33a6445 (2026-03-20), in a file that hung and therefore never ran. So this
 * component read as covered twice over and was covered neither time.
 *
 * ⚠ What that cost: #275. `TIER_LEVELS[tier]` returns undefined for a tier the
 * frontend does not know, and `undefined >= n` is FALSE FOR EVERY n INCLUDING
 * ZERO — so one unrecognised word from the backend failed every check, not just
 * the premium ones, and a paying member was shown a wall telling them to buy
 * what they had already bought. No error, no log, no 403. `tierRank` now floors
 * an unknown tier at 0 and says so on the console; the last test here is that
 * regression, pinned.
 */

const mockUseAuth = vi.fn()
const mockUseSubscription = vi.fn()

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

/* Only the hook is mocked — meetsTierRequirement and tierRank are the real
   implementations, because the ranking IS the behaviour under test. Mocking
   those would have let #275 through. */
vi.mock('../lib/api/hooks/useSubscription', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api/hooks/useSubscription')>()
  return { ...actual, useSubscription: () => mockUseSubscription() }
})

import { RequireTier } from './RequireTier'

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname + location.search}</div>
}

function renderGate(ui: React.ReactElement, { initialEntries = ['/protocols'] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <LocationProbe />
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/" element={<div>Dashboard Home</div>} />
        <Route path="*" element={ui} />
      </Routes>
    </MemoryRouter>
  )
}

const locationNow = () => screen.getByTestId('location').textContent
const PAID = <div>Paid Content</div>

describe('RequireTier', () => {
  beforeEach(() => {
    mockUseAuth.mockReset()
    mockUseSubscription.mockReset()
    mockUseAuth.mockReturnValue({ user: { id: '1' }, userType: 'member' })
    mockUseSubscription.mockReturnValue({ data: { tier: 'coaching' }, isLoading: false })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends an anonymous visitor to login with the return path', () => {
    mockUseAuth.mockReturnValue({ user: null, userType: null })

    renderGate(<RequireTier minTier="coaching">{PAID}</RequireTier>, {
      initialEntries: ['/protocols?pillar=connection'],
    })

    expect(screen.queryByText('Paid Content')).not.toBeInTheDocument()
    expect(locationNow()).toBe('/login?redirect=%2Fprotocols%3Fpillar%3Dconnection')
  })

  it('shows a spinner while the subscription is still loading', () => {
    mockUseSubscription.mockReturnValue({ data: null, isLoading: true })

    const { container } = renderGate(<RequireTier minTier="coaching">{PAID}</RequireTier>)

    // Critical that this is a spinner and NOT the upgrade wall: rendering the
    // wall before the answer arrives shows a paying member a sales page.
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    expect(screen.queryByText('Paid Content')).not.toBeInTheDocument()
    expect(screen.queryByText('Premium Feature')).not.toBeInTheDocument()
  })

  it('lets a member at the required tier through', () => {
    mockUseSubscription.mockReturnValue({ data: { tier: 'coaching' }, isLoading: false })

    renderGate(<RequireTier minTier="coaching">{PAID}</RequireTier>)

    expect(screen.getByText('Paid Content')).toBeInTheDocument()
  })

  it('lets a member ABOVE the required tier through', () => {
    mockUseSubscription.mockReturnValue({ data: { tier: 'programs' }, isLoading: false })

    renderGate(<RequireTier minTier="coaching">{PAID}</RequireTier>)

    expect(screen.getByText('Paid Content')).toBeInTheDocument()
  })

  it('treats membership and brotherhood as the same rank', () => {
    // Both sit at level 1; they are two words for one tier, and a member on
    // either must get identical access.
    for (const tier of ['brotherhood', 'membership'] as const) {
      mockUseSubscription.mockReturnValue({ data: { tier }, isLoading: false })
      const { unmount } = renderGate(<RequireTier minTier="brotherhood">{PAID}</RequireTier>)
      expect(screen.getByText('Paid Content')).toBeInTheDocument()
      unmount()
    }
  })

  it('shows the upgrade wall to a member below the required tier', () => {
    mockUseSubscription.mockReturnValue({ data: { tier: 'brotherhood' }, isLoading: false })

    renderGate(<RequireTier minTier="coaching">{PAID}</RequireTier>)

    expect(screen.queryByText('Paid Content')).not.toBeInTheDocument()
    expect(screen.getByText('Premium Feature')).toBeInTheDocument()
    // The wall must name both tiers — what is needed and what they hold —
    // or it reads as a dead end rather than a next step.
    expect(screen.getByText('Coaching')).toBeInTheDocument()
    expect(screen.getByText('Brotherhood')).toBeInTheDocument()
  })

  it('names the FREE plan for a member with no subscription at all', () => {
    mockUseSubscription.mockReturnValue({ data: { tier: 'none' }, isLoading: false })

    renderGate(<RequireTier minTier="coaching">{PAID}</RequireTier>)

    expect(screen.getByText('Premium Feature')).toBeInTheDocument()
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('redirects instead of walling when fallback is "redirect"', () => {
    mockUseSubscription.mockReturnValue({ data: { tier: 'none' }, isLoading: false })

    renderGate(
      <RequireTier minTier="coaching" fallback="redirect">{PAID}</RequireTier>
    )

    expect(screen.queryByText('Paid Content')).not.toBeInTheDocument()
    expect(screen.queryByText('Premium Feature')).not.toBeInTheDocument()
    expect(locationNow()).toBe('/')
  })

  it('lets an admin and a superadmin past the gate regardless of tier', () => {
    for (const userType of ['admin', 'superadmin'] as const) {
      mockUseAuth.mockReturnValue({ user: { id: '1' }, userType })
      mockUseSubscription.mockReturnValue({ data: { tier: 'none' }, isLoading: false })
      const { unmount } = renderGate(<RequireTier minTier="programs">{PAID}</RequireTier>)
      expect(screen.getByText('Paid Content')).toBeInTheDocument()
      unmount()
    }
  })

  it('treats a missing subscription object as no tier, not as access', () => {
    // `subscription?.tier || 'none'` — the query can resolve undefined.
    mockUseSubscription.mockReturnValue({ data: undefined, isLoading: false })

    renderGate(<RequireTier minTier="coaching">{PAID}</RequireTier>)

    expect(screen.queryByText('Paid Content')).not.toBeInTheDocument()
    expect(screen.getByText('Premium Feature')).toBeInTheDocument()
  })

  it('#275 — an unknown tier withholds premium but does NOT break free access', () => {
    // The regression, pinned at the level a member experiences it. Before the
    // fix, `undefined >= n` was false for every n, so an unrecognised word from
    // the backend failed EVERY check — including minTier="none", which is what
    // turned a vocabulary mismatch into a paying member staring at a sales page
    // on routes that should never have been gated.
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockUseSubscription.mockReturnValue({
      data: { tier: 'platinum' as never },
      isLoading: false,
    })

    const { unmount } = renderGate(<RequireTier minTier="none">{PAID}</RequireTier>)
    expect(screen.getByText('Paid Content')).toBeInTheDocument()
    unmount()

    // ...and premium stays withheld, because entitlement genuinely cannot be
    // verified. Floor-at-zero must not become fail-open.
    renderGate(<RequireTier minTier="coaching">{PAID}</RequireTier>)
    expect(screen.queryByText('Paid Content')).not.toBeInTheDocument()
    expect(screen.getByText('Premium Feature')).toBeInTheDocument()

    // And it must SAY so. A silent floor is how #275 stayed invisible.
    expect(errors).toHaveBeenCalled()
    expect(errors.mock.calls.flat().join(' ')).toContain('platinum')
  })
})
