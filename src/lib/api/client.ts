import { getAccessToken, getApiBaseUrl } from '../auth'

const API_BASE_URL = getApiBaseUrl()
const API_PREFIX = '/api/v2'

export const API_URL = `${API_BASE_URL}${API_PREFIX}`

// ---------------------------------------------------------------------------
// API Response Logger — logs actual response shapes in development so
// mismatches between TypeScript types and backend reality are visible
// in the console instead of causing silent UI bugs.
// ---------------------------------------------------------------------------
// Enable logging in dev, or on production via localStorage: localStorage.setItem('api_debug', '1')
const IS_DEV = import.meta.env.DEV || (typeof localStorage !== 'undefined' && localStorage.getItem('api_debug') === '1')

// ---------------------------------------------------------------------------
// Persistent API error log — errors are stored in window.__apiErrors so they
// can be inspected even after they scroll out of the console.
// Usage: type `__apiErrors` in the browser console to see all captured errors.
// ---------------------------------------------------------------------------
interface ApiErrorEntry {
  timestamp: string
  method: string
  endpoint: string
  status: string | number
  code: string
  message: string
}

declare global {
  interface Window {
    __apiErrors: ApiErrorEntry[]
  }
}

if (typeof window !== 'undefined') {
  window.__apiErrors = window.__apiErrors || []
}

function logApiError(method: string, endpoint: string, status: string | number, code: string, message: string) {
  const entry: ApiErrorEntry = {
    timestamp: new Date().toISOString(),
    method,
    endpoint,
    status,
    code,
    message,
  }
  if (typeof window !== 'undefined') {
    window.__apiErrors.push(entry)
  }
  console.error(`[API ${method} ${endpoint}] ${status} ${code}: ${message}`)
}

function describeShape(obj: unknown): string {
  if (obj === null) return 'null'
  if (obj === undefined) return 'undefined'
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'
    return `[${describeShape(obj[0])} x${obj.length}]`
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj as Record<string, unknown>)
    if (keys.length === 0) return '{}'
    const entries = keys.slice(0, 8).map((k) => {
      const v = (obj as Record<string, unknown>)[k]
      if (v === null) return `${k}:null`
      if (v === undefined) return `${k}:undef`
      if (Array.isArray(v)) return `${k}:[${v.length}]`
      if (typeof v === 'object') return `${k}:{…}`
      return `${k}:${typeof v}`
    })
    if (keys.length > 8) entries.push(`+${keys.length - 8}`)
    return `{${entries.join(', ')}}`
  }
  return typeof obj
}

function logResponse(method: string, endpoint: string, data: unknown) {
  if (!IS_DEV) return
  console.log(`[API ${method} ${endpoint}]`, describeShape(data))
}

// ---------------------------------------------------------------------------
// Safe data extraction helpers — used by hooks to safely pull data from
// API responses regardless of wrapper format.
// ---------------------------------------------------------------------------

/** Extract an array from a paginated or bare response. Never throws. */
export function safeArray<T>(response: unknown): T[] {
  if (!response) return []
  if (Array.isArray(response)) return response as T[]
  if (typeof response === 'object' && response !== null) {
    const obj = response as Record<string, unknown>
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.results)) return obj.results as T[]
  }
  return []
}

/** Extract pagination meta, with sensible defaults. */
export function safePagination(response: unknown): PaginationMeta {
  const defaults: PaginationMeta = {
    page: 1, limit: 20, total: 0, total_pages: 1, has_next: false, has_prev: false,
  }
  if (!response || typeof response !== 'object') return defaults
  const obj = response as Record<string, unknown>
  const p = obj.pagination ?? obj.meta ?? obj.paging
  if (p && typeof p === 'object') return { ...defaults, ...(p as Partial<PaginationMeta>) }
  return defaults
}

/** Safely read a string field, returning fallback if missing/empty. */
export function safeString(obj: unknown, key: string, fallback = ''): string {
  if (!obj || typeof obj !== 'object') return fallback
  const val = (obj as Record<string, unknown>)[key]
  return typeof val === 'string' && val.length > 0 ? val : fallback
}

/** Unwrap a single object from { data: T } wrapper. Returns null if not found. */
export function unwrapData<T>(response: unknown): T | null {
  if (!response) return null
  if (typeof response !== 'object') return null
  const obj = response as Record<string, unknown>
  // If it has a 'data' key that's an object (not array), unwrap it
  if ('data' in obj && obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
    return obj.data as T
  }
  // Return as-is if it looks like the object we want
  return response as T
}

/** Check if an error is a 404 Not Found response. */
export function is404Error(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as Record<string, unknown>
  return err.status === 404 || err.statusCode === 404
}

// Error type from backend
export interface ApiError {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  status?: number
}

// Pagination response
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

// Pagination params
export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
}

async function getAuthToken(): Promise<string | null> {
  return getAccessToken()
}

// API client with automatic auth
class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await getAuthToken()

    if (!token) {
      throw new Error('Not authenticated')
    }

    // Strip trailing slashes to avoid 404s from Go backend
    const cleanEndpoint = endpoint.replace(/\/+$/, '')
    const url = `${API_URL}${cleanEndpoint}`
    const method = options.method || 'GET'

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: { code: 'UNKNOWN', message: 'An unknown error occurred' }
        }))
        errorData.status = response.status
        throw errorData
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T
      }

      const data = await response.json()
      logResponse(method, cleanEndpoint, data)
      return data
    } catch (error: any) {
      const status = error?.status || 'unknown'
      const code = error?.error?.code || 'UNKNOWN'
      const message = error?.error?.message || (error instanceof Error ? error.message : 'Unknown error')
      logApiError(method, cleanEndpoint, status, code, message)
      throw error
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    let url = endpoint
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        url = `${endpoint}?${queryString}`
      }
    }
    return this.request<T>(url, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async uploadFile(endpoint: string, file: File, fieldName = 'file'): Promise<{ url: string }> {
    const token = await getAuthToken()

    if (!token) {
      throw new Error('Not authenticated')
    }

    const formData = new FormData()
    formData.append(fieldName, file)

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: { code: 'UPLOAD_FAILED', message: 'File upload failed' }
      }))
      errorData.status = response.status
      throw errorData
    }

    return response.json()
  }
}

export const api = new ApiClient()
