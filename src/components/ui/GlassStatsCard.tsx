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
      <div className="flex items-stretch gap-4">
        {/* Left: label + number */}
        <div className="flex-1 min-w-0">
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
        </div>
        {/* Right: SVG visual */}
        {visual && (
          <div className="flex items-center justify-center w-[80px] flex-shrink-0 opacity-40">
            {visual}
          </div>
        )}
      </div>
    </GlassCard>
  )
}
