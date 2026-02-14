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

describe('useConnections hooks', () => {
  it('useConnections fetches with status filter', async () => {
    let url = ''
    server.use(
      http.get(`${API}/members/connections`, ({ request }) => {
        url = request.url
        return HttpResponse.json({ data: [] })
      })
    )

    const { useConnections } = await import('./useConnections')
    const { result } = renderHook(
      () => useConnections({ status: 'accepted' }),
      { wrapper: createHookWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(url).toContain('status=accepted')
  })

  it('useSendConnectionRequest sends POST', async () => {
    let body: unknown = null
    server.use(
      http.post(`${API}/members/connections`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({}, { status: 201 })
      })
    )

    const { useSendConnectionRequest } = await import('./useConnections')
    const { result } = renderHook(() => useSendConnectionRequest(), { wrapper: createHookWrapper() })
    result.current.mutate({ user_id: 'u2' })
    await waitFor(() => expect(body).not.toBeNull())
  })

  it('useAcceptConnection sends PUT /connections/{id}/accept', async () => {
    let url = ''
    server.use(
      http.put(`${API}/members/connections/:id/accept`, ({ request }) => {
        url = request.url
        return HttpResponse.json({})
      })
    )

    const { useAcceptConnection } = await import('./useConnections')
    const { result } = renderHook(() => useAcceptConnection(), { wrapper: createHookWrapper() })
    result.current.mutate('conn-1')
    await waitFor(() => expect(url).toContain('/connections/conn-1/accept'))
  })

  it('useRejectConnection sends PUT /connections/{id}/reject', async () => {
    let url = ''
    server.use(
      http.put(`${API}/members/connections/:id/reject`, ({ request }) => {
        url = request.url
        return HttpResponse.json({})
      })
    )

    const { useRejectConnection } = await import('./useConnections')
    const { result } = renderHook(() => useRejectConnection(), { wrapper: createHookWrapper() })
    result.current.mutate('conn-2')
    await waitFor(() => expect(url).toContain('/connections/conn-2/reject'))
  })

  it('useRemoveConnection sends DELETE', async () => {
    let method = ''
    server.use(
      http.delete(`${API}/members/connections/:id`, ({ request }) => {
        method = request.method
        return HttpResponse.json({})
      })
    )

    const { useRemoveConnection } = await import('./useConnections')
    const { result } = renderHook(() => useRemoveConnection(), { wrapper: createHookWrapper() })
    result.current.mutate('conn-3')
    await waitFor(() => expect(method).toBe('DELETE'))
  })
})
