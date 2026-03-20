/**
 * PillarBadge — the smallest pillar expression with icon + label.
 * PillarDot — absolute minimum (8px filled circle).
 * pillarLeftBorder — CSS class string for GlassCard left border.
 */

import { PILLAR_CONFIG, type PillarId } from '../../tokens/pillars'
import { PillarIcon } from './PillarIcon'

interface PillarBadgeProps {
  pillar: PillarId
  size?: 'sm' | 'md'
  showIcon?: boolean
  className?: string
}

export function PillarBadge({ pillar, size = 'sm', showIcon = true, className = '' }: PillarBadgeProps) {
  const config = PILLAR_CONFIG[pillar]
  if (!config) return null

  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-2 py-[2px]'
    : 'text-[11px] px-[10px] py-[3px]'

  return (
    <span
      className={`inline-flex items-center gap-[5px] rounded-full font-display font-bold tracking-[0.08em] uppercase backdrop-blur-[8px] border ${sizeClasses} ${className}`}
      style={{
        backgroundColor: config.colorLo,
        borderColor: config.colorBorder,
        color: config.color,
      }}
    >
      {showIcon && <PillarIcon pillar={pillar} size={32} className="w-4 h-4" />}
      {config.shortName}
    </span>
  )
}

interface PillarDotProps {
  pillar: PillarId
  size?: number
  className?: string
}

export function PillarDot({ pillar, size = 8, className = '' }: PillarDotProps) {
  const config = PILLAR_CONFIG[pillar]
  if (!config) return null

  return (
    <span
      className={`inline-block rounded-full flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: config.color,
      }}
    />
  )
}

/** Returns Tailwind border-left class string for a pillar-colored left border */
export function pillarLeftBorder(pillar: PillarId): string {
  const config = PILLAR_CONFIG[pillar]
  if (!config) return 'border-l-koppar'
  return `border-l-[${config.color}]`
}

/** Returns inline style for pillar left border (more reliable than Tailwind arbitrary) */
export function pillarLeftBorderStyle(pillar: PillarId): React.CSSProperties {
  const config = PILLAR_CONFIG[pillar]
  return { borderLeftColor: config?.color ?? '#B87333' }
}
