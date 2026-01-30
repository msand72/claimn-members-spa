import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 mb-6 rounded-full bg-white/[0.06] flex items-center justify-center">
        <Icon className="w-8 h-8 text-[#B87333]" />
      </div>
      <h3 className="text-lg font-semibold text-[#F9F7F4] mb-2">{title}</h3>
      {description && (
        <p className="text-[#F9F7F4]/60 max-w-sm mb-6">{description}</p>
      )}
      {action}
    </div>
  )
}
