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

describe('useExperts hooks', () => {
  it('useExperts fetches GET /members/experts', async () => {
    server.use(
      http.get(`${API}/members/experts`, () =>
        HttpResponse.json({ data: [{ id: 'e1', name: 'Dr. Smith' }] })
      )
    )

    const { useExperts } = await import('./useExperts')
    const { result } = renderHook(() => useExperts(), { wrapper: createHookWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('useCoachingSessions fetches with status filter', async () => {
    let url = ''
    server.use(
      http.get(`${API}/members/coaching/sessions`, ({ request }) => {
        url = request.url
        return HttpResponse.json({ data: [] })
      })
    )

    const { useCoachingSessions } = await import('./useExperts')
    const { result } = renderHook(
      () => useCoachingSessions({ status: 'scheduled' }),
      { wrapper: createHookWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(url).toContain('status=scheduled')
  })

  it('useBookSession sends POST with session_type=coaching', async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.post(`${API}/members/coaching/sessions`, async ({ request }) => {
        body = await request.json() as Record<string, unknown>
        return HttpResponse.json({ id: 's1' }, { status: 201 })
      })
    )

    const { useBookSession } = await import('./useExperts')
    const { result } = renderHook(() => useBookSession(), { wrapper: createHookWrapper() })
    result.current.mutate({
      expert_id: 'e1',
      scheduled_at: '2026-03-01T10:00:00Z',
      duration: 60,
      session_type: 'coaching',
    })
    await waitFor(() => expect(body).not.toBeNull())
    expect(body!.session_type).toBe('coaching')
  })

  it('useCancelSession sends PATCH /sessions/{id}/cancel', async () => {
    let url = ''
    let method = ''
    server.use(
      http.patch(`${API}/members/coaching/sessions/:id/cancel`, ({ request }) => {
        url = request.url
        method = request.method
        return HttpResponse.json({ status: 'cancelled' })
      })
    )

    const { useCancelSession } = await import('./useExperts')
    const { result } = renderHook(() => useCancelSession(), { wrapper: createHookWrapper() })
    result.current.mutate({ sessionId: 's1', reason: 'Changed plans' })
    await waitFor(() => expect(method).toBe('PATCH'))
    expect(url).toContain('/sessions/s1/cancel')
  })

  it('useRescheduleSession sends PATCH /sessions/{id}/reschedule', async () => {
    let url = ''
    let body: Record<string, unknown> | null = null
    server.use(
      http.patch(`${API}/members/coaching/sessions/:id/reschedule`, async ({ request }) => {
        url = request.url
        body = await request.json() as Record<string, unknown>
        return HttpResponse.json({ status: 'reschedule_requested' })
      })
    )

    const { useRescheduleSession } = await import('./useExperts')
    const { result } = renderHook(() => useRescheduleSession(), { wrapper: createHookWrapper() })
    result.current.mutate({
      sessionId: 's2',
      data: { proposed_datetime: '2026-04-01T14:00:00Z', reason: 'Conflict' },
    })
    await waitFor(() => expect(body).not.toBeNull())
    expect(url).toContain('/sessions/s2/reschedule')
    expect(body!.proposed_datetime).toBe('2026-04-01T14:00:00Z')
    expect(body!.reason).toBe('Conflict')
  })

  it('useSessionNotes handles 404 (no notes yet)', async () => {
    server.use(
      http.get(`${API}/members/coaching/sessions/:id/notes`, () =>
        HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 })
      )
    )

    const { useSessionNotes } = await import('./useExperts')
    const { result } = renderHook(() => useSessionNotes('s1'), { wrapper: createHookWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 3000 })
    expect(result.current.data === null || result.current.data === undefined).toBe(true)
  })

  it('useUpdateSessionNotes sends PUT', async () => {
    let method = ''
    let body: unknown = null
    server.use(
      http.put(`${API}/members/coaching/sessions/:id/notes`, async ({ request }) => {
        method = request.method
        body = await request.json()
        return HttpResponse.json({ id: 'note-1' })
      })
    )

    const { useUpdateSessionNotes } = await import('./useExperts')
    const { result } = renderHook(() => useUpdateSessionNotes(), { wrapper: createHookWrapper() })
    result.current.mutate({ sessionId: 's1', data: { content: 'Session went well' } })
    await waitFor(() => expect(method).toBe('PUT'))
    expect(body).toEqual({ content: 'Session went well' })
  })
})
