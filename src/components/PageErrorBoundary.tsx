import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { isChunkLoadError } from '../lib/isChunkLoadError'

interface Props {
  children: ReactNode
  /** Optional label shown in the error card (e.g. "Messages", "Feed") */
  section?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Catches runtime errors inside a page section so the rest of the app
 * keeps working. Renders an inline error card instead of a blank page.
 *
 * Usage:
 *   <PageErrorBoundary section="Messages">
 *     <MessagesPage />
 *   </PageErrorBoundary>
 */
export class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
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
      }
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const label = this.props.section || 'This section'
      return (
        <div className="flex items-center justify-center min-h-[300px] p-6">
          <div className="bg-white/[0.08] backdrop-blur-[16px] border border-white/[0.15] rounded-2xl p-8 max-w-md w-full text-center">
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
            <button
              onClick={this.handleRetry}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-koppar text-kalkvit hover:bg-koppar/80 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
