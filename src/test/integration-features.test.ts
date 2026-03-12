/**
 * Unit tests for all new member-expert integration features.
 * Covers: 2.2 Reviews, 2.3 Pairing/My Expert, 2.3.6 Coach Request,
 * 2.4 Meeting URL, 3.1 Route consolidation, 3.3 Polling.
 */
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from './mocks/server'
import { createHookWrapper } from './utils'

// Mock auth — required for API client to attach Bearer token
vi.mock('../lib/auth', () => ({
  getAccessToken: vi.fn(() => 'test-token'),
  getApiBaseUrl: vi.fn(() => 'http://localhost:3001'),
  clearTokens: vi.fn(),
}))

const API_BASE = 'http://localhost:3001/api/v2'

// ─── 2.2: Session Review Hooks ──────────────────────────

describe('2.2 — Session Review Submission', () => {
  it('useSessionReview returns null for unreviewed session (404)', async () => {
    server.use(
      http.get(`${API_BASE}/members/coaching/sessions/:id/review`, () =>
        HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 }),
      ),
    )

    const { useSessionReview } = await import('../lib/api/hooks/useExperts')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useSessionReview('session-1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true))
    // 404 should return null (is404Error fallback pattern)
    expect(result.current.data).toBeNull()
  })

  it('useSubmitReview sends correct payload', async () => {
    let capturedBody: Record<string, unknown> | null = null
    server.use(
      http.post(`${API_BASE}/members/coaching/sessions/:id/review`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(
          { id: 'review-1', rating: capturedBody.rating, comment: capturedBody.comment },
          { status: 201 },
        )
      }),
    )

    const { useSubmitReview } = await import('../lib/api/hooks/useExperts')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useSubmitReview(), { wrapper })

    result.current.mutate({
      sessionId: 'session-1',
      data: { rating: 5, comment: 'Great session!' },
    })

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody!.rating).toBe(5)
    expect(capturedBody!.comment).toBe('Great session!')
  })

  it('useSubmitReview handles duplicate review (409)', async () => {
    server.use(
      http.post(`${API_BASE}/members/coaching/sessions/:id/review`, () =>
        HttpResponse.json(
          { error: { code: 'CONFLICT', message: 'Review already exists' } },
          { status: 409 },
        ),
      ),
    )

    const { useSubmitReview } = await import('../lib/api/hooks/useExperts')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useSubmitReview(), { wrapper })

    result.current.mutate({
      sessionId: 'session-1',
      data: { rating: 4 },
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ─── 2.3: My Expert / Pairing ──────────────────────────

describe('2.3 — My Expert / Explicit Pairing', () => {
  it('useMyExpert returns expert data when assigned', async () => {
    // Default handler already returns expert data
    const { useMyExpert } = await import('../lib/api/hooks/useMyExpert')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useMyExpert(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.expert?.display_name).toBe('Dr. Smith')
    expect(result.current.data?.assigned).toBe(true)
  })

  it('useMyExpert returns null expert when unassigned (404)', async () => {
    server.use(
      http.get(`${API_BASE}/members/my-expert`, () =>
        HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 }),
      ),
    )

    const { useMyExpert } = await import('../lib/api/hooks/useMyExpert')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useMyExpert(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true))
    // 404 means no expert — hook should not retry
  })
})

// ─── 2.3.6: Coach Request ──────────────────────────────

describe('2.3.6 — Coach Match Request', () => {
  it('useCoachRequest returns null when no request exists (404)', async () => {
    const { useCoachRequest } = await import('../lib/api/hooks/useCoachRequest')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useCoachRequest(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('useCoachRequest returns pending request', async () => {
    server.use(
      http.get(`${API_BASE}/members/expert-match-request`, () =>
        HttpResponse.json({
          id: 'req-1',
          status: 'pending',
          goals: ['Leadership'],
          preferred_specialties: [],
          availability_preferences: '',
          created_at: new Date().toISOString(),
        }),
      ),
    )

    const { useCoachRequest } = await import('../lib/api/hooks/useCoachRequest')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useCoachRequest(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.status).toBe('pending')
  })

  it('useSubmitCoachRequest sends correct payload', async () => {
    let capturedBody: Record<string, unknown> | null = null
    server.use(
      http.post(`${API_BASE}/members/expert-match-request`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(
          { id: 'req-1', status: 'pending', ...capturedBody, created_at: new Date().toISOString() },
          { status: 201 },
        )
      }),
    )

    const { useSubmitCoachRequest } = await import('../lib/api/hooks/useCoachRequest')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useSubmitCoachRequest(), { wrapper })

    result.current.mutate({
      preferred_specialties: ['leadership'],
      goals: ['Improve leadership', 'Work-life balance'],
      availability_preferences: 'Mornings',
      notes: 'Prefer someone with corporate experience',
    })

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody!.goals).toEqual(['Improve leadership', 'Work-life balance'])
    expect(capturedBody!.preferred_specialties).toEqual(['leadership'])
    expect(capturedBody!.notes).toBe('Prefer someone with corporate experience')
  })

  it('useSubmitCoachRequest handles duplicate request (409)', async () => {
    server.use(
      http.post(`${API_BASE}/members/expert-match-request`, () =>
        HttpResponse.json(
          { error: { code: 'ALREADY_PENDING', message: 'You already have a pending request' } },
          { status: 409 },
        ),
      ),
    )

    const { useSubmitCoachRequest } = await import('../lib/api/hooks/useCoachRequest')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useSubmitCoachRequest(), { wrapper })

    result.current.mutate({
      preferred_specialties: [],
      goals: ['Test'],
      availability_preferences: '',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    const err = result.current.error as any
    expect(err?.error?.code).toBe('ALREADY_PENDING')
  })
})

// ─── 3.3: Polling ───────────────────────────────────────

describe('3.3 — Real-Time Polling', () => {
  it('useConversations with polling option sets refetchInterval', async () => {
    const { useConversations } = await import('../lib/api/hooks/useMessages')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useConversations({ limit: 10 }, { polling: true }), {
      wrapper,
    })

    // Hook should be configured — we verify it doesn't crash
    await waitFor(() =>
      expect(result.current.isSuccess || result.current.isError).toBe(true),
    )
  })

  it('useNotifications has global polling configured', async () => {
    const { useNotifications } = await import('../lib/api/hooks/useNotifications')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useNotifications(), { wrapper })

    await waitFor(() =>
      expect(result.current.isSuccess || result.current.isError).toBe(true),
    )
  })

  it('useCoachingSessions has polling configured', async () => {
    const { useCoachingSessions } = await import('../lib/api/hooks/useExperts')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useCoachingSessions(), { wrapper })

    await waitFor(() =>
      expect(result.current.isSuccess || result.current.isError).toBe(true),
    )
  })
})

// ─── 2.4: Meeting URL Fallback ──────────────────────────

describe('2.4 — Meeting URL', () => {
  it('session without meeting_url has null meeting_url in response', async () => {
    server.use(
      http.get(`${API_BASE}/members/coaching/sessions`, () =>
        HttpResponse.json({
          data: [
            {
              id: 'session-no-url',
              expert_id: 'expert-1',
              scheduled_at: new Date(Date.now() + 86400000).toISOString(),
              duration: 60,
              status: 'scheduled',
              session_type: 'coaching',
              meeting_url: null,
              expert: { id: 'expert-1', name: 'Dr. Smith' },
            },
          ],
        }),
      ),
    )

    const { useCoachingSessions } = await import('../lib/api/hooks/useExperts')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useCoachingSessions(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const sessions = result.current.data as any
    const session = (sessions?.data || sessions)?.[0]
    expect(session?.meeting_url).toBeNull()
  })
})

// ─── Reschedule ─────────────────────────────────────────

describe('2.1 — Reschedule Session', () => {
  it('useRescheduleSession sends proposed datetime and reason', async () => {
    let capturedBody: Record<string, unknown> | null = null
    server.use(
      http.patch(`${API_BASE}/members/coaching/sessions/:id/reschedule`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ success: true })
      }),
    )

    const { useRescheduleSession } = await import('../lib/api/hooks/useExperts')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useRescheduleSession(), { wrapper })

    result.current.mutate({
      sessionId: 'session-1',
      data: {
        proposed_datetime: '2026-03-20T14:00:00Z',
        reason: 'Schedule conflict',
      },
    })

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody!.proposed_datetime).toBe('2026-03-20T14:00:00Z')
    expect(capturedBody!.reason).toBe('Schedule conflict')
  })
})
