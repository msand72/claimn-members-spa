import type React from 'react'
import { cn } from '../../lib/utils'
import { GlassCard } from './GlassCard'

interface GlassStatsCardProps {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  trend?: string
  trendLabel?: string
  className?: string
  visual?: React.ReactNode
}

export function GlassStatsCard({
  label,
  value,
  trend,
  trendLabel,
  className,
  visual,
}: GlassStatsCardProps) {
  return (
    <GlassCard variant="accent" leftBorder={false} className={className}>
      <div className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-kalkvit/55 mb-2">
        {label}
      </div>
      <div className="font-display text-4xl font-bold text-kalkvit leading-none">
        {value}
      </div>
      {trend && (
        <div
          className={cn(
            'text-[11px] mt-2 font-display font-medium',
            trend.startsWith('+') ? 'text-skogsgron' : 'text-tegelrod'
          )}
        >
          {trend} {trendLabel}
        </div>
      )}
      {visual && (
        <div className="mt-4 h-[36px] opacity-60">
          {visual}
        </div>
      )}
    </GlassCard>
  )
}
