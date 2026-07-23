import { describe, it, expect } from 'vitest'
import { isStaleTokenError, mapAuthError } from './auth-errors'

describe('isStaleTokenError', () => {
  it('treats any 401 as a dead token', () => {
    expect(isStaleTokenError({ status: 401, error: { code: 'UNKNOWN', message: '' } })).toBe(true)
  })

  it('matches known stale-token codes regardless of status', () => {
    for (const code of ['bad_jwt', 'user_not_found', 'invalid_jwt', 'jwt_expired']) {
      expect(isStaleTokenError({ status: 403, error: { code, message: '' } })).toBe(true)
    }
  })

  it('matches the raw GoTrue signature complaint with no code attached', () => {
    // The 2026-07-22 JWT-secret drift arrived exactly like this.
    expect(
      isStaleTokenError({ status: 403, error: { code: '', message: 'token signature is invalid' } })
    ).toBe(true)
  })

  it('matches a plain Error carrying the message', () => {
    expect(isStaleTokenError(new Error('invalid JWT: unable to parse'))).toBe(true)
  })

  it('does not fire on tier gating 403s', () => {
    expect(
      isStaleTokenError({ status: 403, error: { code: 'INSUFFICIENT_TIER', message: 'Coaching tier required' } })
    ).toBe(false)
  })

  it('does not fire on 404 / 500 / validation errors', () => {
    expect(isStaleTokenError({ status: 404, error: { code: 'NOT_FOUND', message: 'Not found' } })).toBe(false)
    expect(isStaleTokenError({ status: 500, error: { code: 'INTERNAL', message: 'boom' } })).toBe(false)
    expect(isStaleTokenError({ status: 422, error: { code: 'VALIDATION', message: 'bad field' } })).toBe(false)
  })

  it('is safe on empty input', () => {
    expect(isStaleTokenError(null)).toBe(false)
    expect(isStaleTokenError(undefined)).toBe(false)
  })
})

describe('mapAuthError', () => {
  it('maps a stale token to the session-expired copy', () => {
    expect(mapAuthError({ error: { code: 'bad_jwt', message: '' } })).toBe(
      'Din session har gått ut. Logga in igen.'
    )
  })
})
