import { cn } from '../../lib/utils'
import { PILLAR_CONFIG, type PillarId } from '../../tokens/pillars'
import type { ReactNode } from 'react'

interface GlassCardProps {
  variant?: 'base' | 'elevated' | 'accent' | 'selected'
  children: ReactNode
  className?: string
  leftBorder?: boolean
  pillar?: PillarId    // if set, left border uses pillar accent color
  onClick?: () => void
}

export function GlassCard({
  variant = 'base',
  children,
  className,
  leftBorder = true,
  pillar,
  onClick,
}: GlassCardProps) {
  const variantClasses = {
    base: 'glass-base',
    elevated: 'glass-elevated',
    accent: 'glass-accent',
    selected: 'glass-selected',
  }

  const pillarStyle = pillar && leftBorder && PILLAR_CONFIG[pillar]
    ? { borderLeftColor: PILLAR_CONFIG[pillar].color }
    : undefined

  return (
    <div
      className={cn(
        variantClasses[variant],
        'rounded-[20px] p-4 md:p-6 transition-all duration-200',
        leftBorder && 'border-l-[3px]',
        leftBorder && !pillar && 'border-l-koppar',
        className
      )}
      style={pillarStyle}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
