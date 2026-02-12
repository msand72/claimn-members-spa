import { Bug, X } from 'lucide-react'
import { useBugReport } from '../contexts/BugReportContext'
import { cn } from '../lib/utils'
import { GlassButton } from './ui/GlassButton'

const variantStyles = {
  error: {
    border: 'border-tegelrod/30',
    icon: 'text-tegelrod',
    bg: 'bg-tegelrod/10',
  },
  success: {
    border: 'border-skogsgron/30',
    icon: 'text-skogsgron',
    bg: 'bg-skogsgron/10',
  },
  info: {
    border: 'border-koppar/30',
    icon: 'text-koppar',
    bg: 'bg-koppar/10',
  },
}

export function BugReportToast() {
  const { toast, dismissToast, openModal } = useBugReport()

  if (!toast?.visible) return null

  const styles = variantStyles[toast.variant]

  return (
    <div className="fixed bottom-6 right-6 z-[60] max-w-sm w-full animate-in slide-in-from-right fade-in duration-300">
      <div
        role="alert"
        className={cn(
          'rounded-xl border p-4 shadow-lg glass-elevated',
          styles.border,
          styles.bg
        )}
      >
        <div className="flex items-start gap-3">
          <Bug className={cn('w-5 h-5 mt-0.5 flex-shrink-0', styles.icon)} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-kalkvit">{toast.message}</p>
            {toast.showReportButton && (
              <div className="flex gap-2 mt-3">
                <GlassButton
                  variant="primary"
                  onClick={() => {
                    dismissToast()
                    openModal()
                  }}
                  className="text-xs px-3 py-1.5"
                >
                  Report Bug
                </GlassButton>
                <GlassButton
                  variant="ghost"
                  onClick={dismissToast}
                  className="text-xs px-3 py-1.5"
                >
                  Dismiss
                </GlassButton>
              </div>
            )}
          </div>
          {!toast.showReportButton && (
            <button
              onClick={dismissToast}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-white/[0.1] text-kalkvit/50 hover:text-kalkvit transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
