import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react'
import { isChunkLoadError } from '../lib/isChunkLoadError'
import { useBugReport, type ErrorSource } from '../contexts/BugReportContext'

// ─── Inner class component (required for componentDidCatch) ──────────────────

interface InnerProps {
  children: ReactNode
  onError: (error: Error, source: ErrorSource, componentStack?: string) => void
  onCaptureScreenshot: () => Promise<string | null>
  onOpenModal: () => void
}

interface InnerState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundaryInner extends Component<InnerProps, InnerState> {
  constructor(props: InnerProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): InnerState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GlobalErrorBoundary] Uncaught error:', error, errorInfo)

    // Auto-reload on stale chunk errors (keep existing behavior)
    if (isChunkLoadError(error)) {
      const reloadKey = 'chunk_reload_' + window.location.pathname
      const lastReload = sessionStorage.getItem(reloadKey)
      if (!lastReload || Date.now() - Number(lastReload) >= 10000) {
        sessionStorage.setItem(reloadKey, String(Date.now()))
        window.location.reload()
        return
      }
    }

    // Capture screenshot before rendering fallback UI
    this.props.onCaptureScreenshot().catch(() => {
      // Non-critical failure
    })

    // Notify bug report context
    this.props.onError(
      error,
      'error_boundary',
      errorInfo.componentStack || undefined
    )
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--bg-primary,#1A1A2E)] flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] backdrop-blur-[16px] rounded-2xl border border-[var(--border-color)] p-8 max-w-md w-full text-center shadow-lg">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-tegelrod/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-tegelrod" />
            </div>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-2">
              Something went wrong
            </h1>
            <p className="text-[var(--text-secondary)] mb-6 text-sm">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] hover:opacity-80 transition-all duration-200 cursor-pointer"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] hover:opacity-80 transition-all duration-200 cursor-pointer"
              >
                <RefreshCw size={16} />
                Reload
              </button>
              <button
                onClick={this.props.onOpenModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-br from-koppar to-[#A66529] text-white shadow-[0_4px_20px_rgba(184,115,51,0.4)] hover:shadow-[0_6px_24px_rgba(184,115,51,0.5)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                <Bug size={16} />
                Report Bug
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// ─── Wrapper that connects class component to BugReportContext ────────────────

export function GlobalErrorBoundary({ children }: { children: ReactNode }) {
  const { setPendingError, captureScreenshot, openModal } = useBugReport()

  return (
    <ErrorBoundaryInner
      onError={setPendingError}
      onCaptureScreenshot={captureScreenshot}
      onOpenModal={openModal}
    >
      {children}
    </ErrorBoundaryInner>
  )
}
