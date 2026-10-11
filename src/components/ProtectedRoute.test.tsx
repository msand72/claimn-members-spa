import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * ⚠ THIS FILE USED TO HANG FOREVER, AND THE SUITE COULD NOT TELL YOU SO.
 *
 * It rendered <ProtectedRoute> as a bare child of <MemoryRouter> with no
 * <Routes> underneath. So when the guard answered "no user" with
 *
 *     <Navigate to={`/login?redirect=${encodeURIComponent(path + search)}`} />
 *
 * the new location had nowhere to land EXCEPT ProtectedRoute itself, which
 * promptly redirected again — this time encoding the already-encoded redirect
 * into a new one. The target string grew on every pass, so React Router saw a
 * genuinely new destination each time and never settled. An infinite render
 * loop, inside React's render phase, which is why `--testTimeout` could not
 * interrupt it: vitest killed the worker (exit 144) long before a timeout fired.
 *
 * The cost was not one test. Vitest reports a file that never finishes as
 * neither pass nor fail — it simply never appears — so `Test Files 24 passed`
 * looked clean while eleven tests in this file had not run since March. That is
 * the same shape as claimn-web's `0 test` collection failure: silence reads as
 * success. Check the FILE count, not only the test count.
 *
 * The fix is a real route tree. A redirect now lands on a route that is not
 * this component, which is also what happens in App.tsx — and it lets the
 * no-user test finally assert the return path its name has always promised.
 *
 * Found 2026-10-11 while fixing protocol rendering; the hang predates that work
 * and reproduces on a clean checkout.
 */

const mockUseAuth = vi.fn()
const mockUseOnboardingState = vi.fn()

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('../lib/api/hooks/useOnboarding', () => ({
  useOnboardingState: () => mockUseOnboardingState(),
}))

/* ⚠ NO useSubscription MOCK, AND NO SUBSCRIPTION TESTS.
 *
 * ac1769b (2026-03-19) added a blanket subscription gate to ProtectedRoute and
 * four tests for it. 33a6445 (2026-03-20) removed the gate again — "redirecting
 * every user without an active paid subscription to the upgrade page, even for
 * hub, community, and other basic routes" — and touched ONE file, the component.
 * The four tests stayed here for seven months, asserting behaviour that had been
 * deliberately deleted, and were never seen to fail because the file never ran.
 *
 * Tier gating lives in RequireTier (wrapped as PremiumProtected over 11 routes).
 * Its tests are in RequireTier.test.tsx, which is where that intent belongs.
 */

import { ProtectedRoute } from './ProtectedRoute'

/** Reports the router's current location so a redirect can be asserted. */
function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname + location.search}</div>
}

function renderWithRouter(
  ui: React.ReactElement,
  { initialEntries = ['/dashboard'] } = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <LocationProbe />
        <Routes>
          {/* The two redirect targets ProtectedRoute can name. Without these,
              a redirect re-enters the guard and loops — see the note above. */}
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/" element={<div>Dashboard Home</div>} />
          <Route path="*" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const locationNow = () => screen.getByTestId('location').textContent

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockUseAuth.mockReset()
    mockUseOnboardingState.mockReset()
  })

  it('shows loading spinner while auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true })
    mockUseOnboardingState.mockReturnValue({ data: null, isLoading: true })

    const { container } = renderWithRouter(
      <ProtectedRoute><div>Secret Content</div></ProtectedRoute>
    )

    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument()
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('shows loading spinner while onboarding state is loading', () => {
    mockUseAuth.mockReturnValue({ user: { id: '1' }, loading: false })
    mockUseOnboardingState.mockReturnValue({ data: null, isLoading: true })

    const { container } = renderWithRouter(
      <ProtectedRoute><div>Secret Content</div></ProtectedRoute>
    )

    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument()
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('redirects to login with return path when no user', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false })
    mockUseOnboardingState.mockReturnValue({ data: null, isLoading: false })

    renderWithRouter(
      <ProtectedRoute><div>Secret Content</div></ProtectedRoute>,
      { initialEntries: ['/goals?filter=active'] }
    )

    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument()
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    // The exact target, asserted for the first time. It also pins the loop
    // shut: a redirect that re-entered the guard would nest its own encoded
    // query here (%2Flogin%3Fredirect%3D...) instead of naming /goals once.
    expect(locationNow()).toBe('/login?redirect=%2Fgoals%3Ffilter%3Dactive')
  })

  it('renders children when user is authenticated and onboarding complete', () => {
    mockUseAuth.mockReturnValue({ user: { id: '1' }, loading: false })
    mockUseOnboardingState.mockReturnValue({
      data: { step: 'complete', completed_at: '2026-01-01' },
      isLoading: false,
    })

    renderWithRouter(
      <ProtectedRoute><div>Secret Content</div></ProtectedRoute>
    )

    expect(screen.getByText('Secret Content')).toBeInTheDocument()
    expect(locationNow()).toBe('/dashboard')
  })

  it('renders children for non-onboarding routes even without completed_at', () => {
    mockUseAuth.mockReturnValue({ user: { id: '1' }, loading: false })
    mockUseOnboardingState.mockReturnValue({
      data: { step: 'welcome' },
      isLoading: false,
    })

    renderWithRouter(
      <ProtectedRoute><div>Dashboard</div></ProtectedRoute>,
      { initialEntries: ['/dashboard'] }
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('redirects away from onboarding pages when onboarding is complete', () => {
    mockUseAuth.mockReturnValue({ user: { id: '1' }, loading: false })
    mockUseOnboardingState.mockReturnValue({
      data: { step: 'complete', completed_at: '2026-01-01' },
      isLoading: false,
    })

    renderWithRouter(
      <ProtectedRoute><div>Onboarding Form</div></ProtectedRoute>,
      { initialEntries: ['/onboarding/welcome'] }
    )

    expect(screen.queryByText('Onboarding Form')).not.toBeInTheDocument()
    expect(screen.getByText('Dashboard Home')).toBeInTheDocument()
    expect(locationNow()).toBe('/')
  })

  it('lets an unfinished onboarding user stay on an onboarding page', () => {
    // The complement of the test above, and the reason the redirect is gated on
    // `onboardingComplete`: a man part-way through onboarding must not be thrown
    // out of it.
    mockUseAuth.mockReturnValue({ user: { id: '1' }, loading: false })
    mockUseOnboardingState.mockReturnValue({
      data: { step: 'welcome' },
      isLoading: false,
    })

    renderWithRouter(
      <ProtectedRoute><div>Onboarding Form</div></ProtectedRoute>,
      { initialEntries: ['/onboarding/welcome'] }
    )

    expect(screen.getByText('Onboarding Form')).toBeInTheDocument()
    expect(locationNow()).toBe('/onboarding/welcome')
  })

  it('treats completed_at alone as complete, without step === complete', () => {
    // `onboarding?.step === 'complete' || !!onboarding?.completed_at` — the
    // second arm, which no test covered.
    mockUseAuth.mockReturnValue({ user: { id: '1' }, loading: false })
    mockUseOnboardingState.mockReturnValue({
      data: { step: 'goals', completed_at: '2026-01-01' },
      isLoading: false,
    })

    renderWithRouter(
      <ProtectedRoute><div>Onboarding Form</div></ProtectedRoute>,
      { initialEntries: ['/onboarding/goals'] }
    )

    expect(screen.queryByText('Onboarding Form')).not.toBeInTheDocument()
    expect(locationNow()).toBe('/')
  })

  it('sends a user with no path or query to login with an encoded root', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false })
    mockUseOnboardingState.mockReturnValue({ data: null, isLoading: false })

    renderWithRouter(
      <ProtectedRoute><div>Secret Content</div></ProtectedRoute>,
      { initialEntries: ['/hub'] }
    )

    expect(locationNow()).toBe('/login?redirect=%2Fhub')
  })

  it('decides on auth before onboarding — a dead session goes to login, not a spinner', () => {
    // efa8967: with a dead token the onboarding query can only 401, and waiting
    // on it parked the user on a spinner forever instead of at login. So the
    // no-user verdict must come FIRST, even while onboarding still loads.
    mockUseAuth.mockReturnValue({ user: null, loading: false })
    mockUseOnboardingState.mockReturnValue({ data: null, isLoading: true })

    const { container } = renderWithRouter(
      <ProtectedRoute><div>Secret Content</div></ProtectedRoute>,
      { initialEntries: ['/goals'] }
    )

    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument()
    expect(locationNow()).toBe('/login?redirect=%2Fgoals')
  })
})
