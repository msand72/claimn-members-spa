import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-kalkvit/80">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-xl',
            'bg-white/[0.08] backdrop-blur-[12px]',
            'border border-white/[0.15]',
            'text-kalkvit placeholder:text-kalkvit/40',
            'focus:outline-none focus:border-koppar/50 focus:ring-1 focus:ring-koppar/30',
            'transition-all duration-200',
            error && 'border-tegelrod/50 focus:border-tegelrod focus:ring-tegelrod/30',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-tegelrod">{error}</p>
        )}
      </div>
    )
  }
)

GlassInput.displayName = 'GlassInput'

interface GlassTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const GlassTextarea = forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-kalkvit/80">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-xl min-h-[80px] sm:min-h-[120px] resize-y',
            'bg-white/[0.08] backdrop-blur-[12px]',
            'border border-white/[0.15]',
            'text-kalkvit placeholder:text-kalkvit/40',
            'focus:outline-none focus:border-koppar/50 focus:ring-1 focus:ring-koppar/30',
            'transition-all duration-200',
            error && 'border-tegelrod/50 focus:border-tegelrod focus:ring-tegelrod/30',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-tegelrod">{error}</p>
        )}
      </div>
    )
  }
)

GlassTextarea.displayName = 'GlassTextarea'

interface GlassSelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const GlassSelect = forwardRef<HTMLSelectElement, GlassSelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-kalkvit/80">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-xl appearance-none',
            'bg-white/[0.08] backdrop-blur-[12px]',
            'border border-white/[0.15]',
            'text-kalkvit',
            'focus:outline-none focus:border-koppar/50 focus:ring-1 focus:ring-koppar/30',
            'transition-all duration-200',
            'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23F9F7F4\' stroke-width=\'2\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")] bg-[length:20px] bg-[right_12px_center] bg-no-repeat',
            error && 'border-tegelrod/50 focus:border-tegelrod focus:ring-tegelrod/30',
            className
          )}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-charcoal text-kalkvit">
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-tegelrod">{error}</p>
        )}
      </div>
    )
  }
)

GlassSelect.displayName = 'GlassSelect'
