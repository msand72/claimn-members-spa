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

describe('useMessages hooks', () => {
  it('useConversations fetches GET /members/messages/conversations', async () => {
    const conv = { id: 'c1', participant: { name: 'Alice' } }
    server.use(
      http.get(`${API}/members/messages/conversations`, () =>
        HttpResponse.json({ data: [conv] })
      )
    )

    const { useConversations } = await import('./useMessages')
    const { result } = renderHook(() => useConversations(), { wrapper: createHookWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('useSendMessage sends correct fields', async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.post(`${API}/members/messages`, async ({ request }) => {
        body = await request.json() as Record<string, unknown>
        return HttpResponse.json({ id: 'msg-1' }, { status: 201 })
      })
    )

    const { useSendMessage } = await import('./useMessages')
    const { result } = renderHook(() => useSendMessage(), { wrapper: createHookWrapper() })
    result.current.mutate({ content: 'Hey!', recipient_id: 'user-2' })
    await waitFor(() => expect(body).not.toBeNull())
    // Hook maps input `content` to API field `body`
    expect(body!.body).toBe('Hey!')
    expect(body!.recipient_id).toBe('user-2')
    expect(body).not.toHaveProperty('addressee_id')
  })

  it('useReportMessage sends POST /members/messages/{id}/report', async () => {
    let url = ''
    let body: unknown = null
    server.use(
      http.post(`${API}/members/messages/:id/report`, async ({ request }) => {
        url = request.url
        body = await request.json()
        return HttpResponse.json({}, { status: 201 })
      })
    )

    const { useReportMessage } = await import('./useMessages')
    const { result } = renderHook(() => useReportMessage(), { wrapper: createHookWrapper() })
    result.current.mutate({ messageId: 'msg-5', data: { reason: 'spam' } })
    await waitFor(() => expect(body).not.toBeNull())
    expect(url).toContain('/messages/msg-5/report')
  })

  it('useMarkMessageRead sends PUT', async () => {
    let method = ''
    server.use(
      http.put(`${API}/members/messages/:id/read`, ({ request }) => {
        method = request.method
        return HttpResponse.json({})
      })
    )

    const { useMarkMessageRead } = await import('./useMessages')
    const { result } = renderHook(() => useMarkMessageRead(), { wrapper: createHookWrapper() })
    result.current.mutate('msg-1')
    await waitFor(() => expect(method).toBe('PUT'))
  })

  it('useDeleteMessage sends DELETE', async () => {
    let url = ''
    server.use(
      http.delete(`${API}/members/messages/:id`, ({ request }) => {
        url = request.url
        return HttpResponse.json({})
      })
    )

    const { useDeleteMessage } = await import('./useMessages')
    const { result } = renderHook(() => useDeleteMessage(), { wrapper: createHookWrapper() })
    result.current.mutate('msg-7')
    await waitFor(() => expect(url).toContain('/messages/msg-7'))
  })
})
