import { supabase } from '../supabase'

// API Configuration
// Auto-detect production based on hostname, fallback to env var or localhost
function getApiBaseUrl(): string {
  // If env var is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  // Auto-detect production based on hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname === 'members.claimn.co' || hostname === 'www.members.claimn.co') {
      return 'https://api.claimn.co'
    }
  }

  // Default to localhost for development
  return 'http://localhost:3001'
}

const API_BASE_URL = getApiBaseUrl()
const API_PREFIX = '/api/v2'

export const API_URL = `${API_BASE_URL}${API_PREFIX}`

// Debug logging - set to true to enable
const DEBUG = true

function log(level: 'info' | 'warn' | 'error', message: string, data?: unknown) {
  if (!DEBUG) return
  const prefix = `[API ${level.toUpperCase()}]`
  if (data !== undefined) {
    console[level](prefix, message, data)
  } else {
    console[level](prefix, message)
  }
}

log('info', `API Client initialized - Base URL: ${API_URL}`)

// Error type from backend
export interface ApiError {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
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

// Get auth token from Supabase session
async function getAuthToken(): Promise<string | null> {
  log('info', 'Getting auth token from Supabase session...')
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    log('error', 'Failed to get session', error)
    return null
  }

  if (!session) {
    log('warn', 'No active session found')
    return null
  }

  log('info', `Auth token retrieved - User: ${session.user?.email}, Expires: ${new Date(session.expires_at! * 1000).toISOString()}`)
  return session.access_token
}

// API client with automatic auth
class ApiClient {
  private requestId = 0

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const reqId = ++this.requestId
    const method = options.method || 'GET'
    const startTime = performance.now()

    log('info', `[${reqId}] ${method} ${endpoint} - Starting request...`)

    const token = await getAuthToken()

    if (!token) {
      log('error', `[${reqId}] ${method} ${endpoint} - No auth token available`)
      throw new Error('Not authenticated')
    }

    const url = `${API_URL}${endpoint}`
    log('info', `[${reqId}] Full URL: ${url}`)

    if (options.body) {
      log('info', `[${reqId}] Request body:`, JSON.parse(options.body as string))
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      })

      const duration = Math.round(performance.now() - startTime)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: { code: 'UNKNOWN', message: 'An unknown error occurred' }
        }))
        log('error', `[${reqId}] ${method} ${endpoint} - Failed (${response.status}) in ${duration}ms`, errorData)
        throw errorData
      }

      // Handle 204 No Content
      if (response.status === 204) {
        log('info', `[${reqId}] ${method} ${endpoint} - Success (204 No Content) in ${duration}ms`)
        return {} as T
      }

      const data = await response.json()
      log('info', `[${reqId}] ${method} ${endpoint} - Success (${response.status}) in ${duration}ms`, data)
      return data
    } catch (error) {
      const duration = Math.round(performance.now() - startTime)
      if (error instanceof Error && error.message !== 'Not authenticated') {
        log('error', `[${reqId}] ${method} ${endpoint} - Network error in ${duration}ms`, error.message)
      }
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

  // Special method for file uploads
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
      throw errorData
    }

    return response.json()
  }
}

export const api = new ApiClient()
