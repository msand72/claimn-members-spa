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
      <h3 className="text-lg font-semibold text-[#F9F7F4] mb-2">
        Failed to load
      </h3>
      <p className="text-[#F9F7F4]/60 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-white/[0.08] backdrop-blur-[12px] border border-white/[0.15] text-[#F9F7F4] hover:bg-white/[0.12] hover:border-[#B87333]/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
        >
          <RefreshCw size={18} />
          Try Again
        </button>
      )}
    </div>
  )
}
