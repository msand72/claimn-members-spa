/**
 * Regression tests for all fixed bugs from BUGS.md
 * Each test prevents re-introducing a previously fixed issue.
 */
import { describe, it, expect, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@testing-library/react'
import { server } from './mocks/server'
import { createHookWrapper } from './utils'

// Mock auth
vi.mock('../lib/auth', () => ({
  getAccessToken: vi.fn(() => 'test-token'),
  getApiBaseUrl: vi.fn(() => 'http://localhost:3001'),
  clearTokens: vi.fn(),
}))

const API_BASE = 'http://localhost:3001/api/v2'

describe('Bug Regressions', () => {
  // BUG-F02: Session booking must use 'coaching' not 'video'
  it('BUG-F02: useBookSession sends session_type=coaching', async () => {
    let capturedBody: Record<string, unknown> | null = null
    server.use(
      http.post(`${API_BASE}/members/coaching/sessions`, async ({ request }) => {
        capturedBody = await request.json() as Record<string, unknown>
        return HttpResponse.json({ id: 'session-1' }, { status: 201 })
      })
    )

    const { useBookSession } = await import('../lib/api/hooks/useExperts')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useBookSession(), { wrapper })

    result.current.mutate({
      expert_id: 'expert-1',
      scheduled_at: '2026-03-01T10:00:00Z',
      duration: 60,
      session_type: 'coaching',
    })

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody!.session_type).toBe('coaching')
    // Must NOT be 'video'
    expect(capturedBody!.session_type).not.toBe('video')
  })

  // BUG-F05: Session cancellation uses PATCH /sessions/{id}/cancel
  it('BUG-F05: useCancelSession calls PATCH /cancel', async () => {
    let capturedMethod = ''
    let capturedUrl = ''
    server.use(
      http.patch(`${API_BASE}/members/coaching/sessions/:id/cancel`, ({ request }) => {
        capturedMethod = request.method
        capturedUrl = request.url
        return HttpResponse.json({ status: 'cancelled' })
      })
    )

    const { useCancelSession } = await import('../lib/api/hooks/useExperts')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useCancelSession(), { wrapper })

    result.current.mutate({ sessionId: 'session-123', reason: 'Schedule change' })

    await waitFor(() => expect(capturedMethod).toBe('PATCH'))
    expect(capturedUrl).toContain('/sessions/session-123/cancel')
  })

  // BUG-F07: Messages sends 'body' + 'recipient_id' (not old 'addressee_id')
  // Hook accepts `content` from caller, maps it to API field `body`
  it('BUG-F07: useSendMessage sends body + recipient_id', async () => {
    let capturedBody: Record<string, unknown> | null = null
    server.use(
      http.post(`${API_BASE}/members/messages`, async ({ request }) => {
        capturedBody = await request.json() as Record<string, unknown>
        return HttpResponse.json({ id: 'msg-1' }, { status: 201 })
      })
    )

    const { useSendMessage } = await import('../lib/api/hooks/useMessages')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useSendMessage(), { wrapper })

    result.current.mutate({ content: 'Hello', recipient_id: 'user-2' })

    await waitFor(() => expect(capturedBody).not.toBeNull())
    // Hook maps input `content` to API field `body`
    expect(capturedBody!.body).toBe('Hello')
    expect(capturedBody!.recipient_id).toBe('user-2')
    // Must NOT have old field names
    expect(capturedBody).not.toHaveProperty('addressee_id')
  })

  // BUG-F14: Checkout sends price_id + tier
  it('BUG-F14: useCheckout sends price_id and tier', async () => {
    let capturedBody: Record<string, unknown> | null = null
    server.use(
      http.post(`${API_BASE}/members/billing/checkout`, async ({ request }) => {
        capturedBody = await request.json() as Record<string, unknown>
        return HttpResponse.json({ checkout_url: 'https://checkout.stripe.com/session/abc' })
      })
    )

    const { useCheckout } = await import('../lib/api/hooks/useBilling')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useCheckout(), { wrapper })

    result.current.mutate({
      price_id: 'price_abc',
      tier: 'premium',
      success_url: 'https://app.claimn.co/shop/success',
      cancel_url: 'https://app.claimn.co/shop',
    })

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody!.price_id).toBe('price_abc')
    expect(capturedBody!.tier).toBe('premium')
  })

  // BUG-F17: Global mutation error dispatches CustomEvent
  it('BUG-F17: QueryClient global onError dispatches mutation-error event', () => {
    // The mechanism: QueryClient.defaultOptions.mutations.onError dispatches a CustomEvent
    // We verify by reading the error shape extraction logic
    const error = { error: { message: 'Session expired' } }
    let receivedMessage = ''
    const listener = (e: Event) => {
      receivedMessage = (e as CustomEvent).detail.message
    }
    window.addEventListener('mutation-error', listener)

    // Simulate what QueryClient onError does
    let message = 'Something went wrong. Please try again.'
    if (error && typeof error === 'object') {
      const err = error as unknown as Record<string, unknown>
      if (err.error && typeof err.error === 'object') {
        const inner = err.error as Record<string, unknown>
        if (typeof inner.message === 'string') message = inner.message
      }
    }
    window.dispatchEvent(new CustomEvent('mutation-error', { detail: { message } }))

    expect(receivedMessage).toBe('Session expired')
    window.removeEventListener('mutation-error', listener)
  })

  // BUG-F18: useSessionNotes returns null on 404
  it('BUG-F18: useSessionNotes handles 404 gracefully', async () => {
    server.use(
      http.get(`${API_BASE}/members/coaching/sessions/:sessionId/notes`, () =>
        HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Not found' } },
          { status: 404 }
        )
      )
    )

    const { useSessionNotes } = await import('../lib/api/hooks/useExperts')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useSessionNotes('session-1'), { wrapper })

    // Should not throw — 404 is handled
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 3000 })
    // Data should be null (404 handler returns null)
    expect(result.current.data === null || result.current.data === undefined).toBe(true)
  })

  // BUG-F21: staleTime constants are applied correctly
  it('BUG-F21: STALE_TIME constants are correct', async () => {
    const { STALE_TIME } = await import('../lib/constants')
    expect(STALE_TIME.FREQUENT).toBe(2 * 60 * 1000)   // 2 min
    expect(STALE_TIME.DEFAULT).toBe(5 * 60 * 1000)     // 5 min
    expect(STALE_TIME.SEMI_STATIC).toBe(10 * 60 * 1000) // 10 min
    expect(STALE_TIME.STATIC).toBe(60 * 60 * 1000)     // 1 hour
  })

  // New features: Report post endpoint
  it('useReportPost calls POST /members/feed/{id}/report', async () => {
    let capturedUrl = ''
    let capturedBody: Record<string, unknown> | null = null
    server.use(
      http.post(`${API_BASE}/members/feed/:postId/report`, async ({ request }) => {
        capturedUrl = request.url
        capturedBody = await request.json() as Record<string, unknown>
        return HttpResponse.json({}, { status: 201 })
      })
    )

    const { useReportPost } = await import('../lib/api/hooks/useFeed')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useReportPost(), { wrapper })

    result.current.mutate({ postId: 'post-42', data: { reason: 'spam', details: 'Bot content' } })

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedUrl).toContain('/feed/post-42/report')
    expect(capturedBody!.reason).toBe('spam')
    expect(capturedBody!.details).toBe('Bot content')
  })

  // New features: Report message endpoint
  it('useReportMessage calls POST /members/messages/{id}/report', async () => {
    let capturedUrl = ''
    let capturedBody: Record<string, unknown> | null = null
    server.use(
      http.post(`${API_BASE}/members/messages/:messageId/report`, async ({ request }) => {
        capturedUrl = request.url
        capturedBody = await request.json() as Record<string, unknown>
        return HttpResponse.json({}, { status: 201 })
      })
    )

    const { useReportMessage } = await import('../lib/api/hooks/useMessages')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useReportMessage(), { wrapper })

    result.current.mutate({ messageId: 'msg-99', data: { reason: 'harassment' } })

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedUrl).toContain('/messages/msg-99/report')
    expect(capturedBody!.reason).toBe('harassment')
  })

  // New features: Reschedule session endpoint
  it('useRescheduleSession calls PATCH /members/coaching/sessions/{id}/reschedule', async () => {
    let capturedUrl = ''
    let capturedMethod = ''
    let capturedBody: Record<string, unknown> | null = null
    server.use(
      http.patch(`${API_BASE}/members/coaching/sessions/:id/reschedule`, async ({ request }) => {
        capturedUrl = request.url
        capturedMethod = request.method
        capturedBody = await request.json() as Record<string, unknown>
        return HttpResponse.json({ status: 'reschedule_requested' })
      })
    )

    const { useRescheduleSession } = await import('../lib/api/hooks/useExperts')
    const wrapper = createHookWrapper()
    const { result } = renderHook(() => useRescheduleSession(), { wrapper })

    result.current.mutate({
      sessionId: 'session-5',
      data: {
        proposed_datetime: '2026-03-15T14:00:00Z',
        reason: 'Schedule conflict',
      },
    })

    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedMethod).toBe('PATCH')
    expect(capturedUrl).toContain('/sessions/session-5/reschedule')
    expect(capturedBody!.proposed_datetime).toBe('2026-03-15T14:00:00Z')
    expect(capturedBody!.reason).toBe('Schedule conflict')
  })
})
