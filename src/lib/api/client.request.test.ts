import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/mocks/server'

// Mock auth module before importing client
vi.mock('../auth', () => ({
  getAccessToken: vi.fn(() => 'test-token-123'),
  getApiBaseUrl: vi.fn(() => 'http://localhost:3001'),
  clearTokens: vi.fn(),
}))

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type ClientModule = typeof import('./client')
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type AuthModule = typeof import('../auth')

let api: ClientModule['api']
let clearTokens: AuthModule['clearTokens']

// Use top-level await to import after mocking
const clientMod = await import('./client')
const authMod = await import('../auth')
api = clientMod.api
clearTokens = authMod.clearTokens

const API_BASE = 'http://localhost:3001/api/v2'

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('sends correct URL and auth header', async () => {
      let capturedHeaders: Headers | null = null
      server.use(
        http.get(`${API_BASE}/members/profile`, ({ request }) => {
          capturedHeaders = new Headers(request.headers)
          return HttpResponse.json({ id: '1', name: 'Test' })
        })
      )

      const result = await api.get('/members/profile')
      expect(result).toEqual({ id: '1', name: 'Test' })
      expect(capturedHeaders?.get('authorization')).toBe('Bearer test-token-123')
      expect(capturedHeaders?.get('content-type')).toBe('application/json')
    })

    it('builds query string from params', async () => {
      let capturedUrl = ''
      server.use(
        http.get(`${API_BASE}/members/feed`, ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json({ data: [] })
        })
      )

      await api.get('/members/feed', { page: 1, limit: 20, sort: 'created_at' })
      expect(capturedUrl).toContain('page=1')
      expect(capturedUrl).toContain('limit=20')
      expect(capturedUrl).toContain('sort=created_at')
    })

    it('omits undefined params', async () => {
      let capturedUrl = ''
      server.use(
        http.get(`${API_BASE}/members/feed`, ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json({ data: [] })
        })
      )

      await api.get('/members/feed', { page: 1, filter: undefined })
      expect(capturedUrl).toContain('page=1')
      expect(capturedUrl).not.toContain('filter')
    })
  })

  describe('POST', () => {
    it('sends JSON body', async () => {
      let capturedBody: unknown = null
      server.use(
        http.post(`${API_BASE}/members/feed`, async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json({ id: 'new-post' }, { status: 201 })
        })
      )

      await api.post('/members/feed', { content: 'Hello world' })
      expect(capturedBody).toEqual({ content: 'Hello world' })
    })
  })

  describe('PUT', () => {
    it('sends PUT with body', async () => {
      let capturedMethod = ''
      server.use(
        http.put(`${API_BASE}/members/profile`, ({ request }) => {
          capturedMethod = request.method
          return HttpResponse.json({ id: '1' })
        })
      )

      await api.put('/members/profile', { name: 'Updated' })
      expect(capturedMethod).toBe('PUT')
    })
  })

  describe('PATCH', () => {
    it('sends PATCH with body', async () => {
      let capturedMethod = ''
      let capturedBody: unknown = null
      server.use(
        http.patch(`${API_BASE}/members/coaching/sessions/s1/reschedule`, async ({ request }) => {
          capturedMethod = request.method
          capturedBody = await request.json()
          return HttpResponse.json({ status: 'reschedule_requested' })
        })
      )

      await api.patch('/members/coaching/sessions/s1/reschedule', {
        proposed_datetime: '2026-03-01T10:00:00Z',
        reason: 'Conflict',
      })
      expect(capturedMethod).toBe('PATCH')
      expect(capturedBody).toEqual({
        proposed_datetime: '2026-03-01T10:00:00Z',
        reason: 'Conflict',
      })
    })
  })

  describe('DELETE', () => {
    it('sends DELETE request', async () => {
      let capturedMethod = ''
      server.use(
        http.delete(`${API_BASE}/members/feed/post-1`, ({ request }) => {
          capturedMethod = request.method
          return HttpResponse.json({})
        })
      )

      await api.delete('/members/feed/post-1')
      expect(capturedMethod).toBe('DELETE')
    })
  })

  describe('trailing slash stripping', () => {
    it('strips trailing slashes from endpoint', async () => {
      let capturedUrl = ''
      server.use(
        http.get(`${API_BASE}/members/profile`, ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json({ id: '1' })
        })
      )

      await api.get('/members/profile/')
      expect(capturedUrl).not.toMatch(/\/profile\/(\?|$)/)
    })
  })

  describe('204 No Content', () => {
    it('returns empty object', async () => {
      server.use(
        http.delete(`${API_BASE}/members/feed/post-1`, () =>
          new HttpResponse(null, { status: 204 })
        )
      )

      const result = await api.delete('/members/feed/post-1')
      expect(result).toEqual({})
    })
  })

  describe('401 handling', () => {
    it('clears tokens and redirects on 401', async () => {
      server.use(
        http.get(`${API_BASE}/members/profile`, () =>
          HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Expired' } }, { status: 401 })
        )
      )

      await expect(api.get('/members/profile')).rejects.toThrow('Session expired')
      expect(clearTokens).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('throws API error shape on non-ok response', async () => {
      server.use(
        http.get(`${API_BASE}/members/profile`, () =>
          HttpResponse.json(
            { error: { code: 'NOT_FOUND', message: 'Not found' } },
            { status: 404 }
          )
        )
      )

      try {
        await api.get('/members/profile')
        expect.fail('Should have thrown')
      } catch (err: unknown) {
        const error = err as { error: { code: string; message: string }; status: number }
        expect(error.error.code).toBe('NOT_FOUND')
        expect(error.error.message).toBe('Not found')
        expect(error.status).toBe(404)
      }
    })
  })
})
