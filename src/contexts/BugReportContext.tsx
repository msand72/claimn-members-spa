import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import html2canvas from 'html2canvas'
import { useAuth } from './AuthContext'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ErrorSource =
  | 'error_boundary'
  | 'window_onerror'
  | 'unhandled_rejection'
  | 'manual'

export interface UserAction {
  type: 'click' | 'navigation' | 'input' | 'submit' | 'api_error'
  target?: string
  value?: string
  timestamp: number
  url: string
}

interface BrowserInfo {
  userAgent: string
  viewport: { width: number; height: number }
  language: string
  platform: string
  cookiesEnabled: boolean
  timezone: string
}

interface PendingError {
  error: Error
  componentStack?: string
  source: ErrorSource
}

export interface BugReportPayload {
  error_message: string
  stack_trace: string | null
  component_tree: string | null
  error_source: ErrorSource
  screenshot: string | null
  user_id: string | null
  user_email: string | null
  user_description: string | null
  user_actions: UserAction[]
  browser_info: BrowserInfo
  url: string
  source_app: 'members-spa'
}

type ToastVariant = 'error' | 'success' | 'info'

interface ToastState {
  message: string
  variant: ToastVariant
  visible: boolean
  showReportButton: boolean
}

interface BugReportContextType {
  pendingError: PendingError | null
  isModalOpen: boolean
  isManualReport: boolean
  screenshot: string | null
  isSubmitting: boolean
  toast: ToastState | null
  recentActions: UserAction[]
  setPendingError: (
    error: Error,
    source: ErrorSource,
    componentStack?: string
  ) => void
  openModal: () => void
  closeModal: () => void
  openManualReport: () => void
  captureScreenshot: () => Promise<string | null>
  setScreenshot: (screenshot: string | null) => void
  submitReport: (
    userDescription: string | null,
    includeScreenshot: boolean
  ) => Promise<void>
  dismissToast: () => void
  trackAction: (action: Omit<UserAction, 'timestamp' | 'url'>) => void
}

const BugReportContext = createContext<BugReportContextType | undefined>(
  undefined
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BUG_REPORT_API_URL =
  import.meta.env.VITE_BUG_REPORT_API_URL ||
  'https://api.claimn.co/api/v2/public/bugs/report'

const OFFLINE_QUEUE_KEY = 'bugReportQueue'
const DEDUP_WINDOW_MS = 60_000
const MAX_REPORTS_PER_WINDOW = 5
const RATE_LIMIT_WINDOW_MS = 5 * 60_000
const MAX_ACTIONS = 10

function getBrowserInfo(): BrowserInfo {
  return {
    userAgent: navigator.userAgent,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    language: navigator.language,
    platform: navigator.platform,
    cookiesEnabled: navigator.cookieEnabled,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

function getErrorHash(error: Error): string {
  const firstFrame = (error.stack || '').split('\n')[1] || ''
  return `${error.message}::${firstFrame.trim()}`
}

async function captureScreenshotImpl(): Promise<string | null> {
  try {
    const canvas = await html2canvas(document.body, {
      windowWidth: Math.min(window.innerWidth, 1920),
      windowHeight: Math.min(window.innerHeight, 1080),
      scale: 1,
      logging: false,
      useCORS: true,
    })

    const maxWidth = 1280
    let finalCanvas = canvas
    if (canvas.width > maxWidth) {
      const ratio = maxWidth / canvas.width
      const resized = document.createElement('canvas')
      resized.width = maxWidth
      resized.height = canvas.height * ratio
      const ctx = resized.getContext('2d')
      if (ctx) {
        ctx.drawImage(canvas, 0, 0, resized.width, resized.height)
        finalCanvas = resized
      }
    }

    const dataUrl = finalCanvas.toDataURL('image/jpeg', 0.7)

    if (dataUrl.length > 500_000) {
      console.warn('[BugReport] Screenshot too large, reducing quality')
      return finalCanvas.toDataURL('image/jpeg', 0.4)
    }

    return dataUrl
  } catch (err) {
    console.error('[BugReport] Screenshot capture failed:', err)
    return null
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function BugReportProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  const [pendingError, setPendingErrorState] = useState<PendingError | null>(
    null
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isManualReport, setIsManualReport] = useState(false)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [recentActions, setRecentActions] = useState<UserAction[]>([])

  const recentErrorHashes = useRef<Map<string, number>>(new Map())
  const reportTimestamps = useRef<number[]>([])
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const offlineQueueRef = useRef<BugReportPayload[]>([])

  // Load offline queue from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY)
      if (stored) {
        offlineQueueRef.current = JSON.parse(stored)
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  // ── Toast helpers ──

  const showToast = useCallback(
    (
      message: string,
      variant: ToastVariant,
      showReportButton = false,
      durationMs = 5000
    ) => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      setToast({ message, variant, visible: true, showReportButton })
      toastTimerRef.current = setTimeout(() => {
        setToast(null)
      }, durationMs)
    },
    []
  )

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(null)
  }, [])

  // ── Dedup / rate limiting ──

  const isDuplicate = useCallback((error: Error): boolean => {
    const hash = getErrorHash(error)
    const lastSeen = recentErrorHashes.current.get(hash)
    const now = Date.now()
    if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) return true
    recentErrorHashes.current.set(hash, now)
    return false
  }, [])

  const isRateLimited = useCallback((): boolean => {
    const now = Date.now()
    reportTimestamps.current = reportTimestamps.current.filter(
      (t) => now - t < RATE_LIMIT_WINDOW_MS
    )
    return reportTimestamps.current.length >= MAX_REPORTS_PER_WINDOW
  }, [])

  // ── Core methods ──

  const setPendingError = useCallback(
    (error: Error, source: ErrorSource, componentStack?: string) => {
      if (isDuplicate(error)) return
      if (isRateLimited()) {
        showToast('Too many error reports. Please try again later.', 'info')
        return
      }
      setPendingErrorState({ error, source, componentStack })
      showToast('Something went wrong', 'error', true, 30_000)
    },
    [isDuplicate, isRateLimited, showToast]
  )

  const openModal = useCallback(() => {
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setIsManualReport(false)
    setPendingErrorState(null)
    setScreenshot(null)
  }, [])

  const openManualReport = useCallback(() => {
    setIsManualReport(true)
    setPendingErrorState(null)
    setScreenshot(null)
    setIsModalOpen(true)
  }, [])

  const captureScreenshot = useCallback(async () => {
    const result = await captureScreenshotImpl()
    setScreenshot(result)
    return result
  }, [])

  // ── Action tracking ──

  const trackAction = useCallback(
    (action: Omit<UserAction, 'timestamp' | 'url'>) => {
      setRecentActions((prev) => {
        const full: UserAction = {
          ...action,
          timestamp: Date.now(),
          url: window.location.href,
        }
        const next = [...prev, full]
        return next.length > MAX_ACTIONS ? next.slice(-MAX_ACTIONS) : next
      })
    },
    []
  )

  // ── Submit ──

  const buildPayload = useCallback(
    (
      userDescription: string | null,
      includeScreenshot: boolean
    ): BugReportPayload => {
      const error = pendingError?.error
      const errorMessage = isManualReport
        ? `[Manual Report] ${(userDescription || '').slice(0, 100)}`
        : error?.message || 'Unknown error'

      return {
        error_message: errorMessage,
        stack_trace: error?.stack || null,
        component_tree: pendingError?.componentStack || null,
        error_source: pendingError?.source || 'manual',
        screenshot: includeScreenshot ? screenshot : null,
        user_id: user?.id ? String(user.id) : null,
        user_email: user?.email || null,
        user_description: userDescription || null,
        user_actions: recentActions,
        browser_info: getBrowserInfo(),
        url: window.location.href,
        source_app: 'members-spa',
      }
    },
    [pendingError, isManualReport, screenshot, user, recentActions]
  )

  const sendPayload = useCallback(
    async (payload: BugReportPayload): Promise<boolean> => {
      const response = await fetch(BUG_REPORT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      return response.ok
    },
    []
  )

  const queueOffline = useCallback((payload: BugReportPayload) => {
    offlineQueueRef.current.push(payload)
    try {
      localStorage.setItem(
        OFFLINE_QUEUE_KEY,
        JSON.stringify(offlineQueueRef.current)
      )
    } catch {
      // localStorage full - drop oldest
      offlineQueueRef.current.shift()
      localStorage.setItem(
        OFFLINE_QUEUE_KEY,
        JSON.stringify(offlineQueueRef.current)
      )
    }
  }, [])

  const flushOfflineQueue = useCallback(async () => {
    if (offlineQueueRef.current.length === 0) return
    const queue = [...offlineQueueRef.current]
    offlineQueueRef.current = []
    localStorage.removeItem(OFFLINE_QUEUE_KEY)

    for (const payload of queue) {
      try {
        await sendPayload(payload)
      } catch {
        // Re-queue failures
        queueOffline(payload)
      }
    }
  }, [sendPayload, queueOffline])

  const submitReport = useCallback(
    async (userDescription: string | null, includeScreenshot: boolean) => {
      setIsSubmitting(true)
      const payload = buildPayload(userDescription, includeScreenshot)

      try {
        if (!navigator.onLine) {
          queueOffline(payload)
          closeModal()
          showToast(
            'Bug report saved. Will send when back online.',
            'info'
          )
          return
        }

        const success = await sendPayload(payload)
        if (success) {
          reportTimestamps.current.push(Date.now())
          closeModal()
          showToast("Bug report sent! We'll look into this.", 'success')
        } else {
          showToast('Failed to send report. Please try again.', 'error')
        }
      } catch {
        if (!navigator.onLine) {
          queueOffline(payload)
          closeModal()
          showToast(
            'Bug report saved. Will send when back online.',
            'info'
          )
        } else {
          showToast('Failed to send report. Please try again.', 'error')
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [buildPayload, sendPayload, queueOffline, closeModal, showToast]
  )

  // ── Global error listeners ──

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason))
      setPendingError(error, 'unhandled_rejection')
    }

    const handleError = (event: ErrorEvent) => {
      if (!event.filename || event.filename.includes('extension://')) return
      const error = event.error || new Error(event.message)
      setPendingError(error, 'window_onerror')
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      )
      window.removeEventListener('error', handleError)
    }
  }, [setPendingError])

  // ── Online/offline listeners ──

  useEffect(() => {
    const handleOnline = () => {
      flushOfflineQueue()
    }

    window.addEventListener('online', handleOnline)

    // Flush any queued reports on mount if online
    if (navigator.onLine) {
      flushOfflineQueue()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [flushOfflineQueue])

  // ── Cleanup toast timer ──

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  return (
    <BugReportContext.Provider
      value={{
        pendingError,
        isModalOpen,
        isManualReport,
        screenshot,
        isSubmitting,
        toast,
        recentActions,
        setPendingError,
        openModal,
        closeModal,
        openManualReport,
        captureScreenshot,
        setScreenshot,
        submitReport,
        dismissToast,
        trackAction,
      }}
    >
      {children}
    </BugReportContext.Provider>
  )
}

export function useBugReport() {
  const context = useContext(BugReportContext)
  if (!context) {
    throw new Error('useBugReport must be used within a BugReportProvider')
  }
  return context
}
