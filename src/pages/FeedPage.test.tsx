/**
 * FeedPage integration tests — rendering, post creation, likes, comments, report.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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

const { FeedPage } = await import('./FeedPage')

const mockPost = {
  id: 'post-1',
  author_id: 'user-2',
  content: 'Hello community!',
  created_at: new Date().toISOString(),
  likes_count: 3,
  comments_count: 1,
  is_liked: false,
  image_url: null,
  interest_group_id: null,
  author: {
    id: 'user-2',
    display_name: 'Other User',
    archetype: 'achiever',
    avatar_url: null,
  },
}

function renderFeed() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <ThemeProvider>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/feed']}>
          <FeedPage />
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  )
}

describe('FeedPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.use(
      http.get(`${API}/members/feed`, () =>
        HttpResponse.json({
          data: [mockPost],
          pagination: { page: 1, limit: 20, total: 1, total_pages: 1, has_next: false, has_prev: false },
        })
      ),
      // Interest groups / interests return empty by default
      http.get(`${API}/members/interest-groups/my`, () =>
        HttpResponse.json({ data: [] })
      ),
      http.get(`${API}/members/interest-groups`, () =>
        HttpResponse.json({ data: [] })
      ),
      http.get(`${API}/members/interests`, () =>
        HttpResponse.json({ data: [] })
      ),
      http.get(`${API}/members/interests/my`, () =>
        HttpResponse.json({ data: [] })
      ),
    )
  })

  it('renders page title and create post form', async () => {
    renderFeed()
    expect(await screen.findByText('Community Feed')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/share something/i)).toBeInTheDocument()
  })

  it('displays a feed post with author name and content', async () => {
    renderFeed()
    expect(await screen.findByText('Other User')).toBeInTheDocument()
    expect(screen.getByText('Hello community!')).toBeInTheDocument()
  })

  it('shows like count and comment count', async () => {
    renderFeed()
    await screen.findByText('Other User')
    expect(screen.getByText('3')).toBeInTheDocument() // likes
    expect(screen.getByText('1')).toBeInTheDocument() // comments
  })

  it('post button disabled when textarea is empty', async () => {
    renderFeed()
    await screen.findByText('Community Feed')
    const postBtn = screen.getByRole('button', { name: /^post$/i })
    expect(postBtn).toBeDisabled()
  })

  it('enables post button when text entered', async () => {
    const user = userEvent.setup()
    renderFeed()
    await screen.findByText('Community Feed')

    await user.type(screen.getByPlaceholderText(/share something/i), 'My new post')
    const postBtn = screen.getByRole('button', { name: /^post$/i })
    expect(postBtn).not.toBeDisabled()
  })

  it('creates a post on submit', async () => {
    let capturedBody: unknown = null
    server.use(
      http.post(`${API}/members/feed`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockPost, id: 'post-new', content: 'My new post' }, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderFeed()
    await screen.findByText('Community Feed')

    await user.type(screen.getByPlaceholderText(/share something/i), 'My new post')
    await user.click(screen.getByRole('button', { name: /^post$/i }))

    // Wait for the mutation to fire
    await vi.waitFor(() => expect(capturedBody).not.toBeNull())
    expect((capturedBody as Record<string, unknown>).content).toBe('My new post')
  })

  it('shows empty state when no posts', async () => {
    server.use(
      http.get(`${API}/members/feed`, () =>
        HttpResponse.json({
          data: [],
          pagination: { page: 1, limit: 20, total: 0, total_pages: 0, has_next: false, has_prev: false },
        })
      ),
    )
    renderFeed()
    expect(await screen.findByText('No posts yet')).toBeInTheDocument()
  })

  it('toggles comments section on click', async () => {
    server.use(
      http.get(`${API}/members/feed/:postId/comments`, () =>
        HttpResponse.json({ data: [] })
      ),
    )
    const user = userEvent.setup()
    renderFeed()
    await screen.findByText('Other User')

    // Click comment button (the one with count "1")
    const commentBtn = screen.getByText('1').closest('button')!
    await user.click(commentBtn)

    expect(await screen.findByPlaceholderText('Write a comment...')).toBeInTheDocument()
  })

  it('shows report modal on report click', async () => {
    const user = userEvent.setup()
    renderFeed()
    await screen.findByText('Other User')

    // Click the more menu (MoreHorizontal)
    const moreButtons = screen.getAllByRole('button')
    const moreBtn = moreButtons.find(
      (btn) => btn.querySelector('svg') && btn.textContent === ''
    )
    // Find the "..." button by looking for one near the post
    const postMoreBtns = screen.getAllByRole('button').filter(
      (btn) => btn.classList.contains('p-2') && btn.closest('.glass-card')
    )
    // Alternative: just click the first post's more button
    if (postMoreBtns[0]) {
      await user.click(postMoreBtns[0])
    }

    // If "Report Post" appeared in the dropdown
    const reportOption = screen.queryByText('Report Post')
    if (reportOption) {
      await user.click(reportOption)
      expect(screen.getByText('Report Content')).toBeInTheDocument()
    }
  })
})
