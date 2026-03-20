import type React from 'react'
import { cn } from '../../lib/utils'
import { GlassCard } from './GlassCard'

interface GlassStatsCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  trend?: string
  trendLabel?: string
  className?: string
  visual?: React.ReactNode
}

export function GlassStatsCard({
  icon: Icon,
  label,
  value,
  trend,
  trendLabel,
  className,
  visual,
}: GlassStatsCardProps) {
  return (
    <GlassCard variant="accent" leftBorder={false} className={className}>
      <div className="flex items-start gap-4">
        <div className="bg-sandbeige/10 p-3.5 rounded-[14px]">
          <Icon className="w-7 h-7 text-koppar" />
        </div>
        <div className="flex-1">
          <div className="font-display text-[10px] font-bold tracking-[0.14em] uppercase text-kalkvit/55 mb-1.5">
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
      </div>
      {visual && (
        <div className="mt-3 h-[44px]">
          {visual}
        </div>
      )}
    </GlassCard>
  )
}
