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

describe('useFeed hooks', () => {
  it('useFeed fetches GET /members/feed', async () => {
    const post = { id: 'p1', content: 'Hello' }
    server.use(
      http.get(`${API}/members/feed`, () =>
        HttpResponse.json({ data: [post], pagination: { page: 1, total: 1, has_next: false } })
      )
    )

    const { useFeed } = await import('./useFeed')
    const { result } = renderHook(() => useFeed(), { wrapper: createHookWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data).toEqual([post])
  })

  it('useFeed passes interest_group_id param', async () => {
    let capturedUrl = ''
    server.use(
      http.get(`${API}/members/feed`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ data: [] })
      })
    )

    const { useFeed } = await import('./useFeed')
    const { result } = renderHook(() => useFeed({ interest_group_id: 'group-1' }), { wrapper: createHookWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(capturedUrl).toContain('interest_group_id=group-1')
  })

  it('useCreatePost sends POST /members/feed', async () => {
    let body: unknown = null
    server.use(
      http.post(`${API}/members/feed`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ id: 'new' }, { status: 201 })
      })
    )

    const { useCreatePost } = await import('./useFeed')
    const { result } = renderHook(() => useCreatePost(), { wrapper: createHookWrapper() })
    result.current.mutate({ content: 'New post' })
    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toEqual({ content: 'New post' })
  })

  it('useLikePost sends POST /members/feed/{id}/like', async () => {
    let capturedUrl = ''
    server.use(
      http.post(`${API}/members/feed/:id/like`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({})
      })
    )

    const { useLikePost } = await import('./useFeed')
    const { result } = renderHook(() => useLikePost(), { wrapper: createHookWrapper() })
    result.current.mutate('post-42')
    await waitFor(() => expect(capturedUrl).toContain('/feed/post-42/like'))
  })

  it('useUnlikePost sends DELETE /members/feed/{id}/like', async () => {
    let method = ''
    server.use(
      http.delete(`${API}/members/feed/:id/like`, ({ request }) => {
        method = request.method
        return HttpResponse.json({})
      })
    )

    const { useUnlikePost } = await import('./useFeed')
    const { result } = renderHook(() => useUnlikePost(), { wrapper: createHookWrapper() })
    result.current.mutate('post-42')
    await waitFor(() => expect(method).toBe('DELETE'))
  })

  it('useDeletePost sends DELETE /members/feed/{id}', async () => {
    let capturedUrl = ''
    server.use(
      http.delete(`${API}/members/feed/:id`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({})
      })
    )

    const { useDeletePost } = await import('./useFeed')
    const { result } = renderHook(() => useDeletePost(), { wrapper: createHookWrapper() })
    result.current.mutate('post-99')
    await waitFor(() => expect(capturedUrl).toContain('/feed/post-99'))
  })

  it('useAddComment sends POST /members/feed/{postId}/comments', async () => {
    let body: unknown = null
    server.use(
      http.post(`${API}/members/feed/:id/comments`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ id: 'c1' }, { status: 201 })
      })
    )

    const { useAddComment } = await import('./useFeed')
    const { result } = renderHook(() => useAddComment(), { wrapper: createHookWrapper() })
    result.current.mutate({ postId: 'p1', data: { content: 'Nice!' } })
    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toEqual({ content: 'Nice!' })
  })
})
