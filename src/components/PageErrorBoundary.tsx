import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react'
import { isChunkLoadError } from '../lib/isChunkLoadError'
import { useBugReport, type ErrorSource } from '../contexts/BugReportContext'

interface InnerProps {
  children: ReactNode
  section?: string
  onError?: (error: Error, source: ErrorSource, componentStack?: string) => void
  onCaptureScreenshot?: () => Promise<string | null>
  onOpenModal?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Inner class component that catches render errors.
 * Connected to BugReportContext via the outer PageErrorBoundary wrapper.
 */
class PageErrorBoundaryInner extends Component<InnerProps, State> {
  constructor(props: InnerProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `[PageErrorBoundary${this.props.section ? ` ${this.props.section}` : ''}]`,
      error,
      info.componentStack
    )

    // Auto-reload on stale chunk errors (shared sub-chunks that fail during render)
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
    this.props.onCaptureScreenshot?.().catch(() => {
      // Non-critical failure
    })

    // Notify bug report context so toast + modal flow is triggered
    this.props.onError?.(
      error,
      'error_boundary',
      info.componentStack || undefined
    )
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const label = this.props.section || 'This section'
      return (
        <div className="flex items-center justify-center min-h-[300px] p-6">
          <div className="backdrop-blur-[24px] rounded-2xl p-8 max-w-md w-full text-center shadow-lg bg-[rgba(30,30,35,0.85)] border border-white/15">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-tegelrod/20 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-tegelrod" />
            </div>
            <h2 className="text-lg font-semibold text-kalkvit mb-2">
              {label} encountered an error
            </h2>
            <p className="text-sm text-kalkvit/60 mb-1">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            {import.meta.env.DEV && this.state.error?.stack && (
              <pre className="text-xs text-kalkvit/40 mt-2 mb-4 text-left overflow-auto max-h-32 bg-black/20 rounded-lg p-2">
                {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
              </pre>
            )}
            <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-white/10 border border-white/15 text-kalkvit hover:bg-white/15 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              {this.props.onOpenModal && (
                <button
                  onClick={this.props.onOpenModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-br from-koppar to-[#A66529] text-white shadow-[0_4px_20px_rgba(184,115,51,0.4)] hover:shadow-[0_6px_24px_rgba(184,115,51,0.5)] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Bug className="w-4 h-4" />
                  Report Bug
                </button>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// ─── Wrapper that connects class component to BugReportContext ────────────────

interface PageErrorBoundaryProps {
  children: ReactNode
  section?: string
}

export function PageErrorBoundary({ children, section }: PageErrorBoundaryProps) {
  const { setPendingError, captureScreenshot, openModal } = useBugReport()

  return (
    <PageErrorBoundaryInner
      section={section}
      onError={setPendingError}
      onCaptureScreenshot={captureScreenshot}
      onOpenModal={openModal}
    >
      {children}
    </PageErrorBoundaryInner>
  )
}
