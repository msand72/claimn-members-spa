import { cn } from '../../lib/utils'
import type { ReactNode, ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  children: ReactNode
  icon?: LucideIcon
}

export function GlassButton({
  variant = 'primary',
  children,
  icon: Icon,
  className,
  ...props
}: GlassButtonProps) {
  const baseStyles =
    'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm font-sans cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    primary: cn(
      'bg-gradient-to-br from-koppar to-[#A66529] text-kalkvit border-none',
      'shadow-[0_4px_20px_rgba(184,115,51,0.4)]',
      'hover:shadow-[0_6px_24px_rgba(184,115,51,0.5)] hover:-translate-y-0.5'
    ),
    secondary: cn(
      'bg-white/[0.08] backdrop-blur-[12px] border border-white/[0.15] text-kalkvit',
      'hover:bg-white/[0.12] hover:border-koppar/40 hover:-translate-y-0.5'
    ),
    ghost: 'bg-transparent border-none text-kalkvit hover:bg-white/[0.05]',
  }

  return (
    <button className={cn(baseStyles, variantStyles[variant], className)} {...props}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  )
}
