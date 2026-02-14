import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorCardProps {
  message?: string
  onRetry?: () => void
}

export function ErrorCard({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: ErrorCardProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 mb-6 rounded-full bg-[#C85A40]/20 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-[#C85A40]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        Failed to load
      </h3>
      <p className="text-[var(--text-secondary)] max-w-sm mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-[var(--bg-card)] backdrop-blur-[12px] border border-[var(--border-color)] text-[var(--text-primary)] hover:opacity-80 transition-all duration-200 cursor-pointer"
        >
          <RefreshCw size={18} />
          Try Again
        </button>
      )}
    </div>
  )
}
