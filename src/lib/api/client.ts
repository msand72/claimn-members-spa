import { getAccessToken, getApiBaseUrl } from '../auth'

const API_BASE_URL = getApiBaseUrl()
const API_PREFIX = '/api/v2'

export const API_URL = `${API_BASE_URL}${API_PREFIX}`

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

      return await response.json()
    } catch (error) {
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
