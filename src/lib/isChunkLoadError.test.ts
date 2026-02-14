import { describe, it, expect } from 'vitest'
import { isChunkLoadError } from './isChunkLoadError'

describe('isChunkLoadError', () => {
  it('detects Chrome dynamic import error', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: /assets/Page-abc.js'))).toBe(true)
  })

  it('detects Firefox dynamic import error', () => {
    expect(isChunkLoadError(new TypeError('error loading dynamically imported module'))).toBe(true)
  })

  it('detects Safari module import error', () => {
    expect(isChunkLoadError(new TypeError('Importing a module script failed'))).toBe(true)
  })

  it('detects webpack chunk error', () => {
    expect(isChunkLoadError(new Error('Loading chunk 42 failed'))).toBe(true)
    expect(isChunkLoadError(new Error('Loading CSS chunk 42 failed'))).toBe(true)
  })

  it('detects failed to fetch error', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch'))).toBe(true)
  })

  it('detects SyntaxError from 404 HTML response', () => {
    expect(isChunkLoadError(new SyntaxError("Unexpected token '<'"))).toBe(true)
  })

  it('rejects normal errors', () => {
    expect(isChunkLoadError(new Error('Something went wrong'))).toBe(false)
    expect(isChunkLoadError(new TypeError('Cannot read properties of undefined'))).toBe(false)
  })

  it('rejects non-Error values', () => {
    expect(isChunkLoadError('string error')).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
    expect(isChunkLoadError(undefined)).toBe(false)
    expect(isChunkLoadError(42)).toBe(false)
  })
})
