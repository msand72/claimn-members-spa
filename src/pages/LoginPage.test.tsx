/**
 * LoginPage integration tests — form submission, error handling, redirect.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '../contexts/ThemeContext'

const mockSignIn = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    signIn: mockSignIn,
    signOut: vi.fn(),
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await import('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const { LoginPage } = await import('./LoginPage')

function renderLogin(initialEntries = ['/login']) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <ThemeProvider>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={initialEntries}>
          <LoginPage />
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders branding and form fields', () => {
    renderLogin()
    expect(screen.getByText("CLAIM'N")).toBeInTheDocument()
    expect(screen.getByText('Members Portal')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows forgot password and back links', () => {
    renderLogin()
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument()
    expect(screen.getByText(/back to claimn\.co/i)).toBeInTheDocument()
  })

  it('calls signIn with email and password on submit', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('navigates to / on successful login', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email'), 'a@b.com')
    await user.type(screen.getByLabelText('Password'), 'pass')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('navigates to redirect param on success', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    renderLogin(['/login?redirect=/goals'])

    await user.type(screen.getByLabelText('Email'), 'a@b.com')
    await user.type(screen.getByLabelText('Password'), 'pass')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/goals')
  })

  /* ⚠ THE PAGE NEVER SHOWS THE RAW BACKEND STRING, AND THAT IS DELIBERATE.
   *
   * This test asserted that 'Invalid credentials' appeared on screen and had
   * been failing ever since LoginPage started routing errors through
   * mapAuthError. The mapping exists because non-technical cohort members
   * tried to PASTE raw GoTrue strings as passwords on 2026-05-07; the copy is
   * Swedish because the cohort is. So the assertion was testing for the exact
   * thing the product decided to stop doing.
   *
   * The fixture was also unreal: 'Invalid credentials' is not a string GoTrue
   * sends. The real one is 'Invalid login credentials', with code
   * 'invalid_credentials' — which is why the test fell through to the generic
   * fallback rather than the bad-password copy it was reaching for.
   */
  it('shows the bad-password copy on a rejected login, not the raw backend string', async () => {
    mockSignIn.mockResolvedValue({
      error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
    })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email'), 'a@b.com')
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(
      await screen.findByText('Fel e-post eller lösenord. Glömt ditt lösenord? Klicka på länken nedan.')
    ).toBeInTheDocument()
    // The raw string must not reach the screen — that is the whole point.
    expect(screen.queryByText(/Invalid login credentials/)).not.toBeInTheDocument()
  })

  it('falls back to the generic message for an error it does not recognise', async () => {
    // The safety net: an unmapped error must still say something useful and
    // still must not leak the raw string.
    mockSignIn.mockResolvedValue({ error: { message: 'kaboom from some new backend path' } })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email'), 'a@b.com')
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(
      await screen.findByText('Något gick fel. Kontakta support@claimn.co om problemet kvarstår.')
    ).toBeInTheDocument()
    expect(screen.queryByText(/kaboom/)).not.toBeInTheDocument()
  })

  it('shows the session-expired copy when the token is already dead', async () => {
    mockSignIn.mockResolvedValue({ error: { code: 'jwt_expired', message: 'JWT expired' } })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email'), 'a@b.com')
    await user.type(screen.getByLabelText('Password'), 'pass')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Din session har gått ut. Logga in igen.')).toBeInTheDocument()
  })

  it('disables button while loading', async () => {
    // Make signIn never resolve to keep loading state
    mockSignIn.mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email'), 'a@b.com')
    await user.type(screen.getByLabelText('Password'), 'pass')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
  })
})
