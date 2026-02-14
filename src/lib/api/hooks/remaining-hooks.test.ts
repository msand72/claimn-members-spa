/**
 * Tests for remaining hook modules — one representative test per module
 * to verify correct endpoint, method, and key behavior.
 */
import { describe, it, expect, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@testing-library/react'
import { server } from '../../../test/mocks/server'
import { createHookWrapper } from '../../../test/utils'

vi.mock('../../auth', () => ({
  getAccessToken: vi.fn(() => 'test-token'),
  getApiBaseUrl: vi.fn(() => 'http://localhost:3001'),
  clearTokens: vi.fn(),
}))

const API = 'http://localhost:3001/api/v2'
const wrapper = () => createHookWrapper()

describe('useProtocols', () => {
  it('useProtocols fetches GET /members/protocols/library', async () => {
    server.use(
      http.get(`${API}/members/protocols/library`, () =>
        HttpResponse.json({ data: [{ id: 'p1', slug: 'sleep-reset' }] })
      )
    )
    const { useProtocols } = await import('./useProtocols')
    const { result } = renderHook(() => useProtocols(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('useLogProtocolProgress sends POST', async () => {
    let body: unknown = null
    server.use(
      http.post(`${API}/members/protocols/:id/progress`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({}, { status: 201 })
      })
    )
    const { useLogProtocolProgress } = await import('./useProtocols')
    const { result } = renderHook(() => useLogProtocolProgress(), { wrapper: wrapper() })
    result.current.mutate({ protocolId: 'p1', data: { week: 2, notes: 'Going well' } })
    await waitFor(() => expect(body).not.toBeNull())
  })
})

describe('useBilling', () => {
  it('useCheckout sends POST with price_id and tier', async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.post(`${API}/members/billing/checkout`, async ({ request }) => {
        body = await request.json() as Record<string, unknown>
        return HttpResponse.json({ url: 'https://checkout.stripe.com/abc' })
      })
    )
    const { useCheckout } = await import('./useBilling')
    const { result } = renderHook(() => useCheckout(), { wrapper: wrapper() })
    result.current.mutate({
      price_id: 'price_123',
      tier: 'coaching',
      success_url: 'https://app.claimn.co/success',
      cancel_url: 'https://app.claimn.co/shop',
    })
    await waitFor(() => expect(body).not.toBeNull())
    expect(body!.price_id).toBe('price_123')
    expect(body!.tier).toBe('coaching')
  })
})

describe('useNotifications', () => {
  it('useNotifications fetches GET /members/notifications', async () => {
    server.use(
      http.get(`${API}/members/notifications`, () =>
        HttpResponse.json({ data: [{ id: 'n1', message: 'New session' }] })
      )
    )
    const { useNotifications } = await import('./useNotifications')
    const { result } = renderHook(() => useNotifications(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('useMarkAllNotificationsRead sends POST', async () => {
    let method = ''
    server.use(
      http.post(`${API}/members/notifications/read-all`, ({ request }) => {
        method = request.method
        return HttpResponse.json({})
      })
    )
    const { useMarkAllNotificationsRead } = await import('./useNotifications')
    const { result } = renderHook(() => useMarkAllNotificationsRead(), { wrapper: wrapper() })
    result.current.mutate()
    await waitFor(() => expect(method).toBe('POST'))
  })
})

describe('useJourney', () => {
  it('useJourney fetches GET /members/journey', async () => {
    server.use(
      http.get(`${API}/members/journey`, () =>
        HttpResponse.json({ pillar_scores: {}, overall_progress: 42 })
      )
    )
    const { useJourney } = await import('./useJourney')
    const { result } = renderHook(() => useJourney(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useCircles', () => {
  it('useJoinCircle sends POST /members/circles/{id}/join', async () => {
    let url = ''
    server.use(
      http.post(`${API}/members/circles/:id/join`, ({ request }) => {
        url = request.url
        return HttpResponse.json({})
      })
    )
    const { useJoinCircle } = await import('./useCircles')
    const { result } = renderHook(() => useJoinCircle(), { wrapper: wrapper() })
    result.current.mutate('circle-1')
    await waitFor(() => expect(url).toContain('/circles/circle-1/join'))
  })
})

describe('useEvents', () => {
  it('useEvents fetches with type filter', async () => {
    let url = ''
    server.use(
      http.get(`${API}/members/events`, ({ request }) => {
        url = request.url
        return HttpResponse.json({ data: [] })
      })
    )
    const { useEvents } = await import('./useEvents')
    const { result } = renderHook(
      () => useEvents({ type: 'brotherhood_call' }),
      { wrapper: wrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(url).toContain('type=brotherhood_call')
  })

  it('useRegisterForEvent sends POST', async () => {
    let url = ''
    server.use(
      http.post(`${API}/members/events/:id/register`, ({ request }) => {
        url = request.url
        return HttpResponse.json({})
      })
    )
    const { useRegisterForEvent } = await import('./useEvents')
    const { result } = renderHook(() => useRegisterForEvent(), { wrapper: wrapper() })
    result.current.mutate('event-1')
    await waitFor(() => expect(url).toContain('/events/event-1/register'))
  })
})

describe('useActionItems', () => {
  it('useActionItems fetches with priority filter', async () => {
    let url = ''
    server.use(
      http.get(`${API}/members/action-items`, ({ request }) => {
        url = request.url
        return HttpResponse.json({ data: [] })
      })
    )
    const { useActionItems } = await import('./useActionItems')
    const { result } = renderHook(
      () => useActionItems({ priority: 'high' }),
      { wrapper: wrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(url).toContain('priority=high')
  })

  it('useCreateActionItem sends POST', async () => {
    let body: unknown = null
    server.use(
      http.post(`${API}/members/action-items`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ id: 'ai-1' }, { status: 201 })
      })
    )
    const { useCreateActionItem } = await import('./useActionItems')
    const { result } = renderHook(() => useCreateActionItem(), { wrapper: wrapper() })
    result.current.mutate({ title: 'Meditate', priority: 'high' })
    await waitFor(() => expect(body).not.toBeNull())
  })
})

describe('useSubscription', () => {
  it('useSubscription fetches GET /members/billing', async () => {
    server.use(
      http.get(`${API}/members/billing`, () =>
        HttpResponse.json({ subscription: { tier: 'coaching', status: 'active' } })
      )
    )
    const { useSubscription } = await import('./useSubscription')
    const { result } = renderHook(() => useSubscription(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.tier).toBe('coaching')
  })

  it('useSubscription falls back to default on error', async () => {
    server.use(
      http.get(`${API}/members/billing`, () =>
        HttpResponse.json({ error: { code: 'ERROR', message: 'fail' } }, { status: 500 })
      )
    )
    const { useSubscription } = await import('./useSubscription')
    const { result } = renderHook(() => useSubscription(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 3000 })
    // Should have fallback data or error state, not crash
    expect(result.current.data?.tier === 'none' || result.current.isError).toBe(true)
  })
})

describe('useInterests', () => {
  it('useInterests fetches GET /members/interests', async () => {
    server.use(
      http.get(`${API}/members/interests`, () =>
        HttpResponse.json({ data: [{ id: 'i1', name: 'Meditation' }] })
      )
    )
    const { useInterests } = await import('./useInterests')
    const { result } = renderHook(() => useInterests(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('useUpdateMyInterests sends PUT with interest_ids', async () => {
    let body: unknown = null
    server.use(
      http.put(`${API}/members/interests`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({})
      })
    )
    const { useUpdateMyInterests } = await import('./useInterests')
    const { result } = renderHook(() => useUpdateMyInterests(), { wrapper: wrapper() })
    result.current.mutate(['i1', 'i2'])
    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toEqual({ interest_ids: ['i1', 'i2'] })
  })
})

describe('useOnboarding', () => {
  it('useOnboardingState fetches GET /members/onboarding', async () => {
    server.use(
      http.get(`${API}/members/onboarding`, () =>
        HttpResponse.json({ current_step: 'welcome', completed: false })
      )
    )
    const { useOnboardingState } = await import('./useOnboarding')
    const { result } = renderHook(() => useOnboardingState(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useDashboard', () => {
  it('useDashboard fetches GET /members/dashboard', async () => {
    server.use(
      http.get(`${API}/members/dashboard`, () =>
        HttpResponse.json({ streak: 5, goals_active: 3 })
      )
    )
    const { useDashboard } = await import('./useDashboard')
    const { result } = renderHook(() => useDashboard(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useNetwork', () => {
  it('useNetwork fetches with search filter', async () => {
    let url = ''
    server.use(
      http.get(`${API}/members/network`, ({ request }) => {
        url = request.url
        return HttpResponse.json({ data: [] })
      })
    )
    const { useNetwork } = await import('./useNetwork')
    const { result } = renderHook(
      () => useNetwork({ search: 'john' }),
      { wrapper: wrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(url).toContain('search=john')
  })
})

describe('useSettings', () => {
  it('useAssessmentSharing fetches GET /members/settings/assessment-sharing', async () => {
    server.use(
      http.get(`${API}/members/settings/assessment-sharing`, () =>
        HttpResponse.json({ shared: true })
      )
    )
    const { useAssessmentSharing } = await import('./useSettings')
    const { result } = renderHook(() => useAssessmentSharing(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
