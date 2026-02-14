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

describe('useGoals hooks', () => {
  it('useGoals fetches with filters', async () => {
    let url = ''
    server.use(
      http.get(`${API}/members/goals`, ({ request }) => {
        url = request.url
        return HttpResponse.json({ data: [] })
      })
    )

    const { useGoals } = await import('./useGoals')
    const { result } = renderHook(
      () => useGoals({ status: 'active', pillar_id: 'physical' }),
      { wrapper: createHookWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(url).toContain('status=active')
    expect(url).toContain('pillar_id=physical')
  })

  it('useCreateGoal sends POST /members/goals', async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.post(`${API}/members/goals`, async ({ request }) => {
        body = await request.json() as Record<string, unknown>
        return HttpResponse.json({ id: 'g1' }, { status: 201 })
      })
    )

    const { useCreateGoal } = await import('./useGoals')
    const { result } = renderHook(() => useCreateGoal(), { wrapper: createHookWrapper() })
    result.current.mutate({
      title: 'Run 5k',
      pillar_id: 'physical',
      target_date: '2026-06-01',
    })
    await waitFor(() => expect(body).not.toBeNull())
    expect(body!.title).toBe('Run 5k')
    expect(body!.pillar_id).toBe('physical')
  })

  it('useDeleteGoal sends DELETE', async () => {
    let url = ''
    server.use(
      http.delete(`${API}/members/goals/:id`, ({ request }) => {
        url = request.url
        return HttpResponse.json({})
      })
    )

    const { useDeleteGoal } = await import('./useGoals')
    const { result } = renderHook(() => useDeleteGoal(), { wrapper: createHookWrapper() })
    result.current.mutate('goal-1')
    await waitFor(() => expect(url).toContain('/goals/goal-1'))
  })
})
