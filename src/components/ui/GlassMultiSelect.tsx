import { useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'
import { ChevronDown, Check, X } from 'lucide-react'

interface MultiSelectItem {
  value: string
  label: string
  icon?: React.ReactNode
  description?: string
}

interface GlassMultiSelectProps {
  items: MultiSelectItem[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  label?: string
  disabled?: boolean
  className?: string
  maxDisplay?: number
}

export function GlassMultiSelect({
  items,
  value,
  onChange,
  placeholder = 'Select options',
  label,
  disabled = false,
  className,
  maxDisplay = 3,
}: GlassMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedItems = items.filter((item) => value.includes(item.value))

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const toggleItem = (itemValue: string) => {
    if (value.includes(itemValue)) {
      onChange(value.filter((v) => v !== itemValue))
    } else {
      onChange([...value, itemValue])
    }
  }

  const removeItem = (e: React.MouseEvent, itemValue: string) => {
    e.stopPropagation()
    onChange(value.filter((v) => v !== itemValue))
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-kalkvit/80">{label}</label>
      )}
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between gap-2',
            'px-4 py-3 rounded-xl min-h-[52px]',
            'bg-white/[0.05] border border-white/[0.15]',
            'text-sm text-left transition-all',
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:border-koppar/30 focus:outline-none focus:border-koppar/50 focus:ring-1 focus:ring-koppar/50'
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex-1 flex flex-wrap gap-1.5">
            {selectedItems.length === 0 ? (
              <span className="text-kalkvit/40">{placeholder}</span>
            ) : selectedItems.length <= maxDisplay ? (
              selectedItems.map((item) => (
                <span
                  key={item.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-koppar/20 text-koppar text-xs"
                >
                  {item.label}
                  {!disabled && (
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-kalkvit transition-colors"
                      onClick={(e) => removeItem(e, item.value)}
                    />
                  )}
                </span>
              ))
            ) : (
              <span className="text-kalkvit">
                {selectedItems.length} selected
              </span>
            )}
          </div>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-kalkvit/50 transition-transform flex-shrink-0',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {isOpen && (
          <div
            role="listbox"
            className={cn(
              'absolute z-50 w-full mt-2 max-h-64 overflow-y-auto',
              'glass-elevated rounded-xl border border-white/[0.15]',
              'py-2 shadow-xl',
              'animate-in fade-in slide-in-from-top-2 duration-150'
            )}
          >
            {items.map((item) => {
              const isSelected = value.includes(item.value)
              return (
                <button
                  key={item.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggleItem(item.value)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm',
                    'transition-colors',
                    isSelected
                      ? 'bg-koppar/10 text-koppar'
                      : 'text-kalkvit/70 hover:bg-white/[0.06] hover:text-kalkvit'
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                      isSelected
                        ? 'bg-koppar border-koppar'
                        : 'border-white/30'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 text-kalkvit" />}
                  </div>
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  <div className="flex-1 min-w-0">
                    <p>{item.label}</p>
                    {item.description && (
                      <p className="text-xs text-kalkvit/40 mt-0.5">{item.description}</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
