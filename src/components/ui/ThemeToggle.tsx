import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { cn } from '../../lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

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
