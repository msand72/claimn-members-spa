import { describe, it, expect } from 'vitest'
import { safeArray, safePagination, safeString, unwrapData, is404Error } from './client'

describe('safeArray', () => {
  it('returns bare array as-is', () => {
    expect(safeArray([1, 2, 3])).toEqual([1, 2, 3])
  })

  it('extracts from { data: [...] }', () => {
    expect(safeArray({ data: ['a', 'b'] })).toEqual(['a', 'b'])
  })

  it('extracts from { items: [...] }', () => {
    expect(safeArray({ items: [1, 2] })).toEqual([1, 2])
  })

  it('extracts from { results: [...] }', () => {
    expect(safeArray({ results: ['x'] })).toEqual(['x'])
  })

  it('returns empty array for null', () => {
    expect(safeArray(null)).toEqual([])
  })

  it('returns empty array for undefined', () => {
    expect(safeArray(undefined)).toEqual([])
  })

  it('returns empty array for non-object', () => {
    expect(safeArray('string')).toEqual([])
    expect(safeArray(42)).toEqual([])
  })

  it('returns empty array for object without recognized keys', () => {
    expect(safeArray({ foo: 'bar' })).toEqual([])
  })
})

describe('safePagination', () => {
  it('extracts from { pagination: {...} }', () => {
    const result = safePagination({ pagination: { page: 2, total: 50, has_next: true } })
    expect(result.page).toBe(2)
    expect(result.total).toBe(50)
    expect(result.has_next).toBe(true)
  })

  it('extracts from { meta: {...} }', () => {
    const result = safePagination({ meta: { page: 3, limit: 10 } })
    expect(result.page).toBe(3)
    expect(result.limit).toBe(10)
  })

  it('returns defaults for missing', () => {
    const result = safePagination(null)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
    expect(result.total).toBe(0)
    expect(result.has_next).toBe(false)
  })

  it('returns defaults for non-object', () => {
    const result = safePagination('not an object')
    expect(result.page).toBe(1)
  })
})

describe('safeString', () => {
  it('returns string value', () => {
    expect(safeString({ name: 'John' }, 'name')).toBe('John')
  })

  it('returns fallback for missing key', () => {
    expect(safeString({ name: 'John' }, 'age', 'unknown')).toBe('unknown')
  })

  it('returns fallback for empty string', () => {
    expect(safeString({ name: '' }, 'name', 'fallback')).toBe('fallback')
  })

  it('returns fallback for non-object', () => {
    expect(safeString(null, 'key', 'fb')).toBe('fb')
    expect(safeString(undefined, 'key')).toBe('')
  })

  it('returns fallback for non-string value', () => {
    expect(safeString({ count: 42 }, 'count', 'default')).toBe('default')
  })
})

describe('unwrapData', () => {
  it('unwraps { data: obj }', () => {
    const result = unwrapData<{ id: string }>({ data: { id: '123' } })
    expect(result).toEqual({ id: '123' })
  })

  it('returns object as-is when no wrapper', () => {
    const result = unwrapData<{ id: string }>({ id: '456' })
    expect(result).toEqual({ id: '456' })
  })

  it('does not unwrap arrays', () => {
    const result = unwrapData({ data: [1, 2, 3] })
    // data is an array, so it returns the whole object
    expect(result).toEqual({ data: [1, 2, 3] })
  })

  it('returns null for null', () => {
    expect(unwrapData(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(unwrapData(undefined)).toBeNull()
  })

  it('returns null for non-object', () => {
    expect(unwrapData('string')).toBeNull()
  })
})

describe('is404Error', () => {
  it('detects { status: 404 }', () => {
    expect(is404Error({ status: 404 })).toBe(true)
  })

  it('detects { statusCode: 404 }', () => {
    expect(is404Error({ statusCode: 404 })).toBe(true)
  })

  it('returns false for other statuses', () => {
    expect(is404Error({ status: 500 })).toBe(false)
    expect(is404Error({ status: 200 })).toBe(false)
  })

  it('returns false for null/undefined', () => {
    expect(is404Error(null)).toBe(false)
    expect(is404Error(undefined)).toBe(false)
  })

  it('returns false for non-object', () => {
    expect(is404Error('error')).toBe(false)
    expect(is404Error(404)).toBe(false)
  })
})
