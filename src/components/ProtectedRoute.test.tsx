import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock the auth context, onboarding hook, and subscription hook before imports
const mockUseAuth = vi.fn()
const mockUseOnboardingState = vi.fn()
const mockUseSubscription = vi.fn()

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('../lib/api/hooks/useOnboarding', () => ({
  useOnboardingState: () => mockUseOnboardingState(),
}))

vi.mock('../lib/api/hooks/useSubscription', () => ({
  useSubscription: () => mockUseSubscription(),
}))

import { ProtectedRoute } from './ProtectedRoute'

function renderWithRouter(
  ui: React.ReactElement,
  { initialEntries = ['/dashboard'] } = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockUseAuth.mockReset()
    mockUseOnboardingState.mockReset()
    mockUseSubscription.mockReset()
    // Default: active subscription so existing tests pass
    mockUseSubscription.mockReturnValue({
      data: { tier: 'brotherhood', status: 'active' },
      isLoading: false,
    })
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

  it('shows loading spinner while subscription is loading', () => {
    mockUseAuth.mockReturnValue({ user: { id: '1' }, loading: false })
    mockUseOnboardingState.mockReturnValue({ data: { step: 'welcome' }, isLoading: false })
    mockUseSubscription.mockReturnValue({ data: null, isLoading: true })

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

    // Content should not be rendered
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument()
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

    // Should NOT render the onboarding content (redirected to /)
    expect(screen.queryByText('Onboarding Form')).not.toBeInTheDocument()
  })

  it('redirects to /shop/upgrade when user has no subscription', () => {
    mockUseAuth.mockReturnValue({ user: { id: '1' }, loading: false })
    mockUseOnboardingState.mockReturnValue({ data: { step: 'welcome' }, isLoading: false })
    mockUseSubscription.mockReturnValue({
      data: { tier: 'none', status: 'inactive' },
      isLoading: false,
    })

    renderWithRouter(
      <ProtectedRoute><div>Dashboard</div></ProtectedRoute>,
      { initialEntries: ['/dashboard'] }
    )

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('allows access to /shop/upgrade without subscription', () => {
    mockUseAuth.mockReturnValue({ user: { id: '1' }, loading: false })
    mockUseOnboardingState.mockReturnValue({ data: { step: 'welcome' }, isLoading: false })
    mockUseSubscription.mockReturnValue({
      data: { tier: 'none', status: 'inactive' },
      isLoading: false,
    })

    renderWithRouter(
      <ProtectedRoute><div>Upgrade Page</div></ProtectedRoute>,
      { initialEntries: ['/shop/upgrade'] }
    )

    expect(screen.getByText('Upgrade Page')).toBeInTheDocument()
  })

  it('blocks users with past_due subscription', () => {
    mockUseAuth.mockReturnValue({ user: { id: '1' }, loading: false })
    mockUseOnboardingState.mockReturnValue({ data: { step: 'welcome' }, isLoading: false })
    mockUseSubscription.mockReturnValue({
      data: { tier: 'brotherhood', status: 'past_due' },
      isLoading: false,
    })

    renderWithRouter(
      <ProtectedRoute><div>Dashboard</div></ProtectedRoute>,
      { initialEntries: ['/dashboard'] }
    )

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })
})
