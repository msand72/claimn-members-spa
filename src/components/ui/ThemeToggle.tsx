import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { cn } from '../../lib/utils'

interface ThemeToggleProps {
  className?: string
  compact?: boolean
}

export function ThemeToggle({ className, compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'p-2.5 rounded-xl transition-all duration-200',
          'text-kalkvit/70 hover:bg-white/[0.08] hover:text-kalkvit',
          'glass-base',
          className
        )}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl w-full',
        'text-sm font-medium transition-all duration-200',
        'text-kalkvit/70 hover:bg-white/[0.06] hover:text-kalkvit',
        className
      )}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-5 h-5" />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-5 h-5" />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  )
}
