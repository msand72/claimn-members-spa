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

describe('useProfile hooks', () => {
  it('useCurrentProfile fetches GET /members/profile', async () => {
    server.use(
      http.get(`${API}/members/profile`, () =>
        HttpResponse.json({ id: 'u1', name: 'Test User', archetype: 'achiever' })
      )
    )

    const { useCurrentProfile } = await import('./useProfile')
    const { result } = renderHook(() => useCurrentProfile(), { wrapper: createHookWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveProperty('name', 'Test User')
  })

  it('useUpdateProfile sends PUT /members/profile', async () => {
    let body: unknown = null
    server.use(
      http.put(`${API}/members/profile`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ id: 'u1', name: 'Updated' })
      })
    )

    const { useUpdateProfile } = await import('./useProfile')
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createHookWrapper() })
    result.current.mutate({ name: 'Updated', bio: 'New bio' })
    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toEqual({ name: 'Updated', bio: 'New bio' })
  })
})
