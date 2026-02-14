import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'

// Mock AuthContext
const mockUser = { id: 'user-1', email: 'test@example.com' }
vi.mock('./AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}))

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(() =>
    Promise.resolve({
      width: 800,
      height: 600,
      toDataURL: () => 'data:image/jpeg;base64,mockScreenshot',
    })
  ),
}))

import { BugReportProvider, useBugReport } from './BugReportContext'

function wrapper({ children }: { children: ReactNode }) {
  return <BugReportProvider>{children}</BugReportProvider>
}

describe('BugReportContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('throws if useBugReport is used outside provider', () => {
    // Suppress console.error from React
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => {
      renderHook(() => useBugReport())
    }).toThrow('useBugReport must be used within a BugReportProvider')
    spy.mockRestore()
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useBugReport(), { wrapper })
    expect(result.current.pendingError).toBeNull()
    expect(result.current.isModalOpen).toBe(false)
    expect(result.current.isManualReport).toBe(false)
    expect(result.current.screenshot).toBeNull()
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.toast).toBeNull()
    expect(result.current.recentActions).toEqual([])
  })

  it('setPendingError sets error and shows toast', () => {
    const { result } = renderHook(() => useBugReport(), { wrapper })

    act(() => {
      result.current.setPendingError(
        new Error('Test error'),
        'error_boundary',
        '<App>'
      )
    })

    expect(result.current.pendingError).not.toBeNull()
    expect(result.current.pendingError!.error.message).toBe('Test error')
    expect(result.current.pendingError!.source).toBe('error_boundary')
    expect(result.current.toast).not.toBeNull()
    expect(result.current.toast!.variant).toBe('error')
    expect(result.current.toast!.showReportButton).toBe(true)
  })

  it('deduplicates identical errors within 60s window', () => {
    const { result } = renderHook(() => useBugReport(), { wrapper })
    const error = new Error('Duplicate error')

    act(() => {
      result.current.setPendingError(error, 'window_onerror')
    })
    expect(result.current.pendingError).not.toBeNull()

    // Reset to null, then try same error again
    act(() => {
      result.current.closeModal()
    })

    act(() => {
      result.current.setPendingError(error, 'window_onerror')
    })

    // Should be deduped — pendingError should have been cleared by closeModal
    // and not set again because the error hash is still in the dedup window
    expect(result.current.pendingError).toBeNull()
  })

  it('rate limits after MAX_REPORTS_PER_WINDOW submissions', async () => {
    // Rate limiting is checked in setPendingError but based on reportTimestamps
    // which only gets populated during submitReport. We mock fetch to simulate
    // 5 successful submissions, then the 6th setPendingError should be rate limited.
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    )
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true })

    const { result } = renderHook(() => useBugReport(), { wrapper })

    // Submit 5 reports (each submit pushes to reportTimestamps)
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.openManualReport()
      })
      await act(async () => {
        await result.current.submitReport(`Report ${i}`, false)
      })
    }

    // 6th error should be rate limited
    act(() => {
      result.current.setPendingError(
        new Error('Error after limit'),
        'manual'
      )
    })

    expect(result.current.toast?.message).toContain('Too many error reports')
    fetchSpy.mockRestore()
  })

  it('openManualReport sets isManualReport and opens modal', () => {
    const { result } = renderHook(() => useBugReport(), { wrapper })

    act(() => {
      result.current.openManualReport()
    })

    expect(result.current.isManualReport).toBe(true)
    expect(result.current.isModalOpen).toBe(true)
    expect(result.current.pendingError).toBeNull()
  })

  it('closeModal resets all modal state', () => {
    const { result } = renderHook(() => useBugReport(), { wrapper })

    act(() => {
      result.current.openManualReport()
    })
    expect(result.current.isModalOpen).toBe(true)

    act(() => {
      result.current.closeModal()
    })
    expect(result.current.isModalOpen).toBe(false)
    expect(result.current.isManualReport).toBe(false)
    expect(result.current.pendingError).toBeNull()
    expect(result.current.screenshot).toBeNull()
  })

  it('trackAction records user actions up to max limit', () => {
    const { result } = renderHook(() => useBugReport(), { wrapper })

    // Track 12 actions (max is 10)
    for (let i = 0; i < 12; i++) {
      act(() => {
        result.current.trackAction({ type: 'click', target: `button-${i}` })
      })
    }

    expect(result.current.recentActions.length).toBe(10)
    // Should keep the last 10 (indices 2-11)
    expect(result.current.recentActions[0].target).toBe('button-2')
    expect(result.current.recentActions[9].target).toBe('button-11')
  })

  it('trackAction adds timestamp and url', () => {
    const { result } = renderHook(() => useBugReport(), { wrapper })

    act(() => {
      result.current.trackAction({ type: 'navigation', target: '/goals' })
    })

    const action = result.current.recentActions[0]
    expect(action.timestamp).toBeGreaterThan(0)
    expect(action.url).toBeDefined()
    expect(action.type).toBe('navigation')
  })

  it('dismissToast clears toast', () => {
    const { result } = renderHook(() => useBugReport(), { wrapper })

    act(() => {
      result.current.setPendingError(new Error('toast test'), 'manual')
    })
    expect(result.current.toast).not.toBeNull()

    act(() => {
      result.current.dismissToast()
    })
    expect(result.current.toast).toBeNull()
  })

  it('submitReport queues offline when navigator.onLine is false', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true })

    const { result } = renderHook(() => useBugReport(), { wrapper })

    act(() => {
      result.current.openManualReport()
    })

    await act(async () => {
      await result.current.submitReport('Something broke', false)
    })

    // Should show offline queue message
    expect(result.current.toast?.message).toContain('saved')
    // Modal should be closed
    expect(result.current.isModalOpen).toBe(false)

    // Check localStorage queue
    const queue = JSON.parse(localStorage.getItem('bugReportQueue') || '[]')
    expect(queue.length).toBe(1)
    expect(queue[0].source_app).toBe('members-spa')

    // Restore
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
  })

  it('submitReport sends payload when online', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true })

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    )

    const { result } = renderHook(() => useBugReport(), { wrapper })

    // Set up a manual report
    act(() => {
      result.current.openManualReport()
    })

    await act(async () => {
      await result.current.submitReport('Button does not work', false)
    })

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, options] = fetchSpy.mock.calls[0]
    expect(url).toContain('bugs/report')
    expect(options?.method).toBe('POST')

    const body = JSON.parse(options?.body as string)
    expect(body.source_app).toBe('members-spa')
    expect(body.user_id).toBe('user-1')
    expect(body.user_email).toBe('test@example.com')
    expect(body.error_source).toBe('manual')

    // Should show success toast
    expect(result.current.toast?.variant).toBe('success')

    fetchSpy.mockRestore()
  })
})
