import { describe, it, expect } from 'vitest'

describe('Test infrastructure', () => {
  it('vitest runs', () => {
    expect(1 + 1).toBe(2)
  })

  it('jsdom environment works', () => {
    expect(typeof document).toBe('object')
    expect(typeof window).toBe('object')
  })
})
