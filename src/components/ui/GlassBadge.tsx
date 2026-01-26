import { cn } from '../../lib/utils'
import type { ReactNode } from 'react'

interface GlassBadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'koppar'
  children: ReactNode
  className?: string
}

const variantClasses = {
  default: 'bg-white/[0.1] border-white/20 text-kalkvit',
  success: 'bg-skogsgron/20 border-skogsgron/30 text-skogsgron',
  warning: 'bg-brand-amber/20 border-brand-amber/30 text-brand-amber',
  error: 'bg-tegelrod/20 border-tegelrod/30 text-tegelrod',
  koppar: 'bg-koppar/20 border-koppar/30 text-koppar',
}

export function GlassBadge({
  variant = 'default',
  children,
  className,
}: GlassBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full',
        'text-xs font-semibold',
        'backdrop-blur-[8px] border',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
