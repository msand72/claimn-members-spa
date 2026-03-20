import { cn, colors } from '../../lib/utils'
import { GlassCard } from './GlassCard'
import type { LucideIcon } from 'lucide-react'

interface GlassStatsCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: string
  trendLabel?: string
  className?: string
}

export function GlassStatsCard({
  icon: Icon,
  label,
  value,
  trend,
  trendLabel,
  className,
}: GlassStatsCardProps) {
  return (
    <GlassCard variant="accent" leftBorder={false} className={className}>
      <div className="flex items-start gap-4">
        <div className="bg-sandbeige/10 p-3.5 rounded-[14px]">
          <Icon size={28} color={colors.koppar} />
        </div>
        <div className="flex-1">
          <div className="font-sans text-[13px] font-medium text-kalkvit/60 mb-1.5">
            {label}
          </div>
          <div className="font-display text-4xl font-bold text-kalkvit leading-none">
            {value}
          </div>
          {trend && (
            <div
              className={cn(
                'text-[13px] mt-2.5 font-sans font-medium',
                trend.startsWith('+') ? 'text-skogsgron' : 'text-tegelrod'
              )}
            >
              {trend} {trendLabel}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
