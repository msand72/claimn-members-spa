import { useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { format } from 'date-fns'
import { useKPILogs } from '../../lib/api/hooks'
import { useTheme } from '../../contexts/ThemeContext'
import { cn } from '../../lib/utils'

interface KPIHistoryChartProps {
  kpiId: string
  target: number
  unit?: string | null
  className?: string
}

export function KPIHistoryChart({ kpiId, target, unit, className }: KPIHistoryChartProps) {
  const { data: logsData } = useKPILogs(kpiId, { limit: 50 })
  const { theme } = useTheme()

  const chartData = useMemo(() => {
    const logs = Array.isArray(logsData?.data) ? logsData.data : []
    return logs
      .map((log) => ({
        date: log.logged_at,
        value: log.value,
        notes: log.notes,
        label: format(new Date(log.logged_at), 'MMM d'),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [logsData])

  if (chartData.length === 0) {
    return (
      <div className={cn('text-center py-3', className)}>
        <span className="text-xs text-kalkvit/30">No data yet</span>
      </div>
    )
  }

  const isDark = theme === 'dark'
  const axisColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id={`kpi-fill-${kpiId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B87333" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#B87333" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: axisColor }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: axisColor }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1C1C1E' : '#fff',
              border: '1px solid rgba(184,115,51,0.3)',
              borderRadius: 8,
              fontSize: 12,
              color: isDark ? '#E5D9C7' : '#1C1C1E',
            }}
            formatter={(value: unknown) => [`${value}${unit ? ` ${unit}` : ''}`, 'Value']}
            labelFormatter={(label: unknown) => String(label)}
          />
          <ReferenceLine
            y={target}
            stroke={gridColor}
            strokeDasharray="4 4"
            label={{
              value: `Target: ${target}`,
              position: 'right',
              fontSize: 9,
              fill: axisColor,
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#B87333"
            strokeWidth={2}
            fill={`url(#kpi-fill-${kpiId})`}
            dot={{ r: 3, fill: '#B87333', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#CC8B3C', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
