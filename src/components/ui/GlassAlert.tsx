import { cn } from '../../lib/utils'
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

interface GlassAlertProps {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  icon?: React.ReactNode
  onClose?: () => void
  className?: string
}

const variantConfig = {
  info: {
    icon: Info,
    bgColor: 'bg-koppar/10',
    borderColor: 'border-koppar/30',
    iconColor: 'text-koppar',
    titleColor: 'text-koppar',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-skogsgron/10',
    borderColor: 'border-skogsgron/30',
    iconColor: 'text-skogsgron',
    titleColor: 'text-skogsgron',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-brand-amber/10',
    borderColor: 'border-brand-amber/30',
    iconColor: 'text-brand-amber',
    titleColor: 'text-brand-amber',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-tegelrod/10',
    borderColor: 'border-tegelrod/30',
    iconColor: 'text-tegelrod',
    titleColor: 'text-tegelrod',
  },
}

export function GlassAlert({
  variant = 'info',
  title,
  children,
  icon,
  onClose,
  className,
}: GlassAlertProps) {
  const config = variantConfig[variant]
  const IconComponent = config.icon

  return (
    <div
      role="alert"
      className={cn(
        'rounded-xl border p-4',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="flex gap-3">
        <div className={cn('flex-shrink-0', config.iconColor)}>
          {icon || <IconComponent className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn('font-medium mb-1', config.titleColor)}>{title}</h4>
          )}
          <div className="text-sm text-kalkvit/70">{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-white/[0.1] text-kalkvit/50 hover:text-kalkvit transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Toast notification variant
interface GlassToastProps {
  variant?: AlertVariant
  message: string
  onClose?: () => void
  duration?: number
  className?: string
}

export function GlassToast({
  variant = 'info',
  message,
  onClose,
  className,
}: GlassToastProps) {
  const config = variantConfig[variant]
  const IconComponent = config.icon

  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-3 rounded-xl border p-4 shadow-lg',
        'glass-elevated',
        config.borderColor,
        'animate-in slide-in-from-right fade-in duration-300',
        className
      )}
    >
      <div className={config.iconColor}>
        <IconComponent className="w-5 h-5" />
      </div>
      <p className="flex-1 text-sm text-kalkvit">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/[0.1] text-kalkvit/50 hover:text-kalkvit transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
