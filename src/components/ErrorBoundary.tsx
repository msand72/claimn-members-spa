import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center p-4">
          <div className="bg-white/[0.1] backdrop-blur-[16px] border border-white/[0.2] rounded-[20px] p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#C85A40]/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-[#C85A40]" />
            </div>
            <h1 className="text-2xl font-bold text-[#F9F7F4] mb-2">
              Something went wrong
            </h1>
            <p className="text-[#F9F7F4]/60 mb-6">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-br from-[#B87333] to-[#A66529] text-[#F9F7F4] shadow-[0_4px_20px_rgba(184,115,51,0.4)] hover:shadow-[0_6px_24px_rgba(184,115,51,0.5)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <RefreshCw size={18} />
              Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
