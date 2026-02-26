import { cn } from '../../lib/utils'
import type { ReactNode } from 'react'

interface GlassCardProps {
  variant?: 'base' | 'elevated' | 'accent' | 'selected'
  children: ReactNode
  className?: string
  leftBorder?: boolean
  onClick?: () => void
}

export function GlassCard({
  variant = 'base',
  children,
  className,
  leftBorder = true,
  onClick,
}: GlassCardProps) {
  const variantClasses = {
    base: 'glass-base',
    elevated: 'glass-elevated',
    accent: 'glass-accent',
    selected: 'glass-selected',
  }

  return (
    <div
      className={cn(
        variantClasses[variant],
        'rounded-[20px] p-4 md:p-6 transition-all duration-200',
        leftBorder && 'border-l-4 border-l-koppar',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
