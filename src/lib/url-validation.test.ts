import { describe, it, expect, vi } from 'vitest'
import { isSafeRedirect, sanitizeRedirect, isAllowedExternalUrl, safeOpenUrl } from './url-validation'

describe('isSafeRedirect', () => {
  it('accepts valid internal paths', () => {
    expect(isSafeRedirect('/')).toBe(true)
    expect(isSafeRedirect('/dashboard')).toBe(true)
    expect(isSafeRedirect('/coaching/sessions')).toBe(true)
    expect(isSafeRedirect('/goals?filter=active')).toBe(true)
  })

  it('rejects protocol-relative URLs', () => {
    expect(isSafeRedirect('//evil.com')).toBe(false)
    expect(isSafeRedirect('//evil.com/path')).toBe(false)
  })

  it('rejects URLs with @ (credential injection)', () => {
    expect(isSafeRedirect('/@evil')).toBe(false)
    expect(isSafeRedirect('/path@host')).toBe(false)
  })

  it('rejects absolute URLs with protocol', () => {
    expect(isSafeRedirect('/http://evil.com')).toBe(false)
  })

  it('rejects empty and invalid inputs', () => {
    expect(isSafeRedirect('')).toBe(false)
    expect(isSafeRedirect(null as unknown as string)).toBe(false)
    expect(isSafeRedirect(undefined as unknown as string)).toBe(false)
  })

  it('rejects non-slash-starting paths', () => {
    expect(isSafeRedirect('dashboard')).toBe(false)
    expect(isSafeRedirect('https://evil.com')).toBe(false)
  })
})

describe('sanitizeRedirect', () => {
  it('returns URL when safe', () => {
    expect(sanitizeRedirect('/dashboard', '/')).toBe('/dashboard')
  })

  it('returns fallback when unsafe', () => {
    expect(sanitizeRedirect('//evil.com', '/')).toBe('/')
    expect(sanitizeRedirect('', '/')).toBe('/')
  })

  it('handles null/undefined', () => {
    expect(sanitizeRedirect(null, '/fallback')).toBe('/fallback')
    expect(sanitizeRedirect(undefined, '/fallback')).toBe('/fallback')
  })
})

describe('isAllowedExternalUrl', () => {
  it('accepts Stripe checkout URLs', () => {
    expect(isAllowedExternalUrl('https://checkout.stripe.com/session/abc')).toBe(true)
  })

  it('accepts Stripe billing URLs', () => {
    expect(isAllowedExternalUrl('https://billing.stripe.com/portal/abc')).toBe(true)
  })

  it('rejects non-Stripe URLs', () => {
    expect(isAllowedExternalUrl('https://evil.com')).toBe(false)
    expect(isAllowedExternalUrl('https://google.com')).toBe(false)
  })

  it('rejects http (non-https)', () => {
    expect(isAllowedExternalUrl('http://checkout.stripe.com/session/abc')).toBe(false)
  })

  it('rejects invalid URLs', () => {
    expect(isAllowedExternalUrl('not-a-url')).toBe(false)
    expect(isAllowedExternalUrl('')).toBe(false)
  })
})

describe('safeOpenUrl', () => {
  it('opens http/https URLs', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    expect(safeOpenUrl('https://meet.example.com')).toBe(true)
    expect(openSpy).toHaveBeenCalledWith(
      'https://meet.example.com/',
      '_blank',
      'noopener,noreferrer'
    )
    openSpy.mockRestore()
  })

  it('rejects javascript: protocol', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    expect(safeOpenUrl('javascript:alert(1)')).toBe(false)
    expect(openSpy).not.toHaveBeenCalled()
    openSpy.mockRestore()
  })

  it('rejects data: protocol', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    expect(safeOpenUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
    expect(openSpy).not.toHaveBeenCalled()
    openSpy.mockRestore()
  })

  it('rejects empty/invalid input', () => {
    expect(safeOpenUrl('')).toBe(false)
    expect(safeOpenUrl(null as unknown as string)).toBe(false)
  })
})
