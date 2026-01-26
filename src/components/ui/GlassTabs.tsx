import { cn } from '../../lib/utils'

interface Tab {
  value: string
  label: string
  icon?: React.ReactNode
  badge?: string | number
  disabled?: boolean
}

interface GlassTabsProps {
  tabs: Tab[]
  value: string
  onChange: (value: string) => void
  variant?: 'underline' | 'pills' | 'contained'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  className?: string
}

export function GlassTabs({
  tabs,
  value,
  onChange,
  variant = 'underline',
  size = 'md',
  fullWidth = false,
  className,
}: GlassTabsProps) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const paddingClasses = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-5 py-2.5',
  }

  const renderUnderlineTabs = () => (
    <div
      role="tablist"
      className={cn(
        'flex border-b border-white/10',
        fullWidth && 'w-full',
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={tab.value === value}
          aria-disabled={tab.disabled}
          disabled={tab.disabled}
          onClick={() => !tab.disabled && onChange(tab.value)}
          className={cn(
            'flex items-center gap-2 font-medium transition-colors relative',
            paddingClasses[size],
            sizeClasses[size],
            fullWidth && 'flex-1 justify-center',
            tab.disabled
              ? 'text-kalkvit/30 cursor-not-allowed'
              : tab.value === value
              ? 'text-koppar'
              : 'text-kalkvit/60 hover:text-kalkvit'
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.badge !== undefined && (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-xs font-medium',
                tab.value === value
                  ? 'bg-koppar/20 text-koppar'
                  : 'bg-white/[0.1] text-kalkvit/60'
              )}
            >
              {tab.badge}
            </span>
          )}
          {tab.value === value && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-koppar" />
          )}
        </button>
      ))}
    </div>
  )

  const renderPillTabs = () => (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 p-1 rounded-xl bg-white/[0.05]',
        fullWidth && 'w-full',
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={tab.value === value}
          aria-disabled={tab.disabled}
          disabled={tab.disabled}
          onClick={() => !tab.disabled && onChange(tab.value)}
          className={cn(
            'flex items-center gap-2 rounded-lg font-medium transition-all',
            paddingClasses[size],
            sizeClasses[size],
            fullWidth && 'flex-1 justify-center',
            tab.disabled
              ? 'text-kalkvit/30 cursor-not-allowed'
              : tab.value === value
              ? 'bg-koppar text-kalkvit shadow-sm'
              : 'text-kalkvit/60 hover:text-kalkvit hover:bg-white/[0.05]'
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.badge !== undefined && (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-xs font-medium',
                tab.value === value
                  ? 'bg-white/20 text-kalkvit'
                  : 'bg-white/[0.1] text-kalkvit/60'
              )}
            >
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )

  const renderContainedTabs = () => (
    <div
      role="tablist"
      className={cn(
        'flex rounded-xl border border-white/10 overflow-hidden',
        fullWidth && 'w-full',
        className
      )}
    >
      {tabs.map((tab, index) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={tab.value === value}
          aria-disabled={tab.disabled}
          disabled={tab.disabled}
          onClick={() => !tab.disabled && onChange(tab.value)}
          className={cn(
            'flex items-center gap-2 font-medium transition-all',
            paddingClasses[size],
            sizeClasses[size],
            fullWidth && 'flex-1 justify-center',
            index !== 0 && 'border-l border-white/10',
            tab.disabled
              ? 'text-kalkvit/30 cursor-not-allowed bg-white/[0.02]'
              : tab.value === value
              ? 'bg-koppar/20 text-koppar'
              : 'text-kalkvit/60 hover:text-kalkvit hover:bg-white/[0.04]'
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.badge !== undefined && (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-xs font-medium',
                tab.value === value
                  ? 'bg-koppar/30 text-koppar'
                  : 'bg-white/[0.1] text-kalkvit/60'
              )}
            >
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )

  switch (variant) {
    case 'pills':
      return renderPillTabs()
    case 'contained':
      return renderContainedTabs()
    default:
      return renderUnderlineTabs()
  }
}

// Tab panel component for content
interface GlassTabPanelProps {
  value: string
  activeValue: string
  children: React.ReactNode
  className?: string
}

export function GlassTabPanel({
  value,
  activeValue,
  children,
  className,
}: GlassTabPanelProps) {
  if (value !== activeValue) return null

  return (
    <div
      role="tabpanel"
      className={cn('animate-in fade-in duration-200', className)}
    >
      {children}
    </div>
  )
}
