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

const mockProgram = {
  id: 'prog-1',
  name: 'Leadership Foundations',
  description: 'A 12-week program',
  category: 'Leadership',
  difficulty: 'Intermediate',
  duration: '12 weeks',
  modules: 6,
  enrolled_count: 42,
  is_locked: false,
  requires_application: false,
}

const mockSprint = {
  id: 'sprint-1',
  program_id: 'prog-1',
  title: 'Sprint 1: Self-Discovery',
  description: 'Focus on identity pillar',
  sprint_number: 1,
  status: 'active',
  sequence_order: 1,
  focus_area: 'Identity',
  duration_weeks: 2,
  start_date: '2026-01-01',
  end_date: '2026-01-14',
  goals: ['Define personal values', 'Leadership philosophy draft'],
  progress: 45,
  participants: 12,
}

const mockAssessment = {
  id: 'assess-1',
  program_id: 'prog-1',
  name: 'Baseline Assessment',
  type: 'baseline',
  question_count: 15,
  status: 'pending',
}

describe('usePrograms', () => {
  it('fetches GET /members/programs', async () => {
    server.use(
      http.get(`${API}/members/programs`, () =>
        HttpResponse.json({ data: [mockProgram] })
      )
    )
    const { usePrograms } = await import('./usePrograms')
    const { result } = renderHook(() => usePrograms(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data).toHaveLength(1)
  })

  it('passes category filter as query param', async () => {
    let capturedUrl = ''
    server.use(
      http.get(`${API}/members/programs`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ data: [] })
      })
    )
    const { usePrograms } = await import('./usePrograms')
    const { result } = renderHook(
      () => usePrograms({ category: 'Leadership' }),
      { wrapper: wrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(capturedUrl).toContain('category=Leadership')
  })
})

describe('useEnrolledPrograms', () => {
  it('fetches GET /members/programs/enrolled', async () => {
    server.use(
      http.get(`${API}/members/programs/enrolled`, () =>
        HttpResponse.json({ data: [{ program_id: 'prog-1', status: 'active', progress: 50 }] })
      )
    )
    const { useEnrolledPrograms } = await import('./usePrograms')
    const { result } = renderHook(() => useEnrolledPrograms(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useProgram', () => {
  it('fetches GET /members/programs/:id', async () => {
    server.use(
      http.get(`${API}/members/programs/:id`, () =>
        HttpResponse.json(mockProgram)
      )
    )
    const { useProgram } = await import('./usePrograms')
    const { result } = renderHook(() => useProgram('prog-1'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.name).toBe('Leadership Foundations')
  })

  it('is disabled when id is empty', async () => {
    const { useProgram } = await import('./usePrograms')
    const { result } = renderHook(() => useProgram(''), { wrapper: wrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useSprints', () => {
  it('fetches GET /members/programs/:id/sprints', async () => {
    server.use(
      http.get(`${API}/members/programs/:id/sprints`, () =>
        HttpResponse.json({ data: [mockSprint] })
      )
    )
    const { useSprints } = await import('./usePrograms')
    const { result } = renderHook(() => useSprints('prog-1'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useProgramAssessments', () => {
  it('fetches GET /members/programs/:id/assessments', async () => {
    server.use(
      http.get(`${API}/members/programs/:id/assessments`, () =>
        HttpResponse.json({ data: [mockAssessment] })
      )
    )
    const { useProgramAssessments } = await import('./usePrograms')
    const { result } = renderHook(() => useProgramAssessments('prog-1'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useProgramCohort', () => {
  it('fetches GET /members/programs/cohorts with program_id param', async () => {
    let capturedUrl = ''
    server.use(
      http.get(`${API}/members/programs/cohorts`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ data: [{ id: 'c1', members: [{ id: 'u1', name: 'Alice' }] }] })
      })
    )
    const { useProgramCohort } = await import('./usePrograms')
    const { result } = renderHook(() => useProgramCohort('prog-1'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(capturedUrl).toContain('program_id=prog-1')
  })
})

describe('useSubmitApplication', () => {
  it('sends POST /members/programs/applications', async () => {
    let capturedBody: Record<string, unknown> | null = null
    server.use(
      http.post(`${API}/members/programs/applications`, async ({ request }) => {
        capturedBody = await request.json() as Record<string, unknown>
        return HttpResponse.json({ id: 'app-1', status: 'pending' }, { status: 201 })
      })
    )
    const { useSubmitApplication } = await import('./usePrograms')
    const { result } = renderHook(() => useSubmitApplication(), { wrapper: wrapper() })
    result.current.mutate({
      program_id: 'prog-1',
      motivation: 'I want to grow as a leader',
    })
    await waitFor(() => expect(capturedBody).not.toBeNull())
    expect(capturedBody!.program_id).toBe('prog-1')
    expect(capturedBody!.motivation).toBe('I want to grow as a leader')
  })
})
