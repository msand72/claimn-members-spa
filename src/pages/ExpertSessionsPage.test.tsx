/**
 * ExpertSessionsPage integration tests — session list, filtering, reschedule modal.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '../contexts/ThemeContext'
import { http, HttpResponse } from 'msw'
import { server } from '../test/mocks/server'

const API = 'http://localhost:3001/api/v2'

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', display_name: 'Test User', email: 'test@test.com' },
    session: { access_token: 'tok' },
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}))

vi.mock('../lib/auth', () => ({
  getAccessToken: vi.fn(() => 'test-token'),
  getApiBaseUrl: vi.fn(() => 'http://localhost:3001'),
  clearTokens: vi.fn(),
}))

// Mock MainLayout to avoid sidebar provider dependencies
vi.mock('../components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const { ExpertSessionsPage } = await import('./ExpertSessionsPage')

const upcomingSession = {
  id: 'ses-1',
  expert_id: 'exp-1',
  scheduled_at: new Date(Date.now() + 86400000).toISOString(),
  duration: 60,
  status: 'scheduled',
  session_type: 'coaching',
  meeting_url: 'https://meet.example.com/123',
  has_notes: false,
  progress: 0,
  expert: { id: 'exp-1', name: 'Dr. Smith', title: 'Life Coach', avatar_url: null },
}

const completedSession = {
  id: 'ses-2',
  expert_id: 'exp-2',
  scheduled_at: new Date(Date.now() - 86400000).toISOString(),
  duration: 45,
  status: 'completed',
  session_type: 'coaching',
  meeting_url: null,
  has_notes: false,
  progress: 80,
  expert: { id: 'exp-2', name: 'Jane Doe', title: 'Mindset Coach', avatar_url: null },
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <ThemeProvider>
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ExpertSessionsPage />
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  )
}

describe('ExpertSessionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.use(
      http.get(`${API}/members/coaching/sessions`, () =>
        HttpResponse.json({
          data: [upcomingSession, completedSession],
          pagination: { page: 1, limit: 20, total: 2, total_pages: 1, has_next: false, has_prev: false },
        })
      ),
    )
  })

  it('renders page title and book button', async () => {
    renderPage()
    expect(await screen.findByText('My Sessions')).toBeInTheDocument()
    expect(screen.getByText('Book New Session')).toBeInTheDocument()
  })

  it('shows session cards with expert names', async () => {
    renderPage()
    expect(await screen.findByText('Dr. Smith')).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  })

  it('displays stats cards', async () => {
    renderPage()
    await screen.findByText('Dr. Smith')
    // "Upcoming" and "Completed" appear in both stats labels and session badges
    expect(screen.getAllByText('Upcoming').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Avg Rating Given')).toBeInTheDocument()
  })

  it('shows filter buttons', async () => {
    renderPage()
    await screen.findByText('Dr. Smith')
    expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^upcoming$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^completed$/i })).toBeInTheDocument()
  })

  it('shows Join Call button for upcoming sessions', async () => {
    renderPage()
    expect(await screen.findByText('Join Call')).toBeInTheDocument()
  })

  it('shows empty state when no sessions', async () => {
    server.use(
      http.get(`${API}/members/coaching/sessions`, () =>
        HttpResponse.json({ data: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0, has_next: false, has_prev: false } })
      ),
    )
    renderPage()
    expect(await screen.findByText('No sessions found.')).toBeInTheDocument()
    expect(screen.getByText('Book Your First Session')).toBeInTheDocument()
  })

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API}/members/coaching/sessions`, () =>
        HttpResponse.json({ error: { code: 'ERROR', message: 'fail' } }, { status: 500 })
      ),
    )
    renderPage()
    expect(await screen.findByText('Failed to load sessions')).toBeInTheDocument()
  })

  it('opens reschedule modal on button click', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Dr. Smith')

    const rescheduleBtn = screen.getByTitle('Reschedule')
    await user.click(rescheduleBtn)

    expect(screen.getByText('Reschedule Session')).toBeInTheDocument()
    expect(screen.getByText('Request Reschedule')).toBeInTheDocument()
  })

  it('reschedule submit is disabled without datetime', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Dr. Smith')

    await user.click(screen.getByTitle('Reschedule'))
    expect(screen.getByText('Request Reschedule')).toBeInTheDocument()
    // Button should be disabled because no datetime entered
    const submitBtn = screen.getByRole('button', { name: /request reschedule/i })
    expect(submitBtn).toBeDisabled()
  })

  it('shows success state after reschedule', async () => {
    const user = userEvent.setup()
    server.use(
      http.patch(`${API}/members/coaching/sessions/:id/reschedule`, () =>
        HttpResponse.json({ ...upcomingSession, status: 'reschedule_requested' })
      ),
    )
    renderPage()
    await screen.findByText('Dr. Smith')

    await user.click(screen.getByTitle('Reschedule'))

    // GlassInput doesn't use htmlFor, find the datetime input directly
    const datetimeInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement
    expect(datetimeInput).toBeTruthy()
    // Programmatically set the value since userEvent.type on datetime-local is unreliable in jsdom
    await user.clear(datetimeInput)
    // Use fireEvent for native input change on datetime-local
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(datetimeInput, '2026-06-15T10:00')
    datetimeInput.dispatchEvent(new Event('input', { bubbles: true }))
    datetimeInput.dispatchEvent(new Event('change', { bubbles: true }))

    await user.click(screen.getByRole('button', { name: /request reschedule/i }))
    expect(await screen.findByText('Reschedule Requested')).toBeInTheDocument()
  })
})
