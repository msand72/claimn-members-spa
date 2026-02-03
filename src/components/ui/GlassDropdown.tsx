import { useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'
import { ChevronDown, Check } from 'lucide-react'

interface DropdownItem {
  value: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
  description?: string
}

interface GlassDropdownProps {
  items: DropdownItem[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  menuClassName?: string
}

export function GlassDropdown({
  items,
  value,
  onChange,
  placeholder = 'Select option',
  disabled = false,
  className,
  menuClassName,
}: GlassDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedItem = items.find((item) => item.value === value)

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

  const handleSelect = (item: DropdownItem) => {
    if (item.disabled) return
    onChange?.(item.value)
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className={cn('relative z-20', className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between gap-2',
          'px-4 py-3 rounded-xl',
          'bg-white/[0.05] border border-white/[0.15]',
          'text-sm text-left transition-all',
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:border-koppar/30 focus:outline-none focus:border-koppar/50 focus:ring-1 focus:ring-koppar/50'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={selectedItem ? 'text-kalkvit' : 'text-kalkvit/40'}>
          {selectedItem ? (
            <span className="flex items-center gap-2">
              {selectedItem.icon}
              {selectedItem.label}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-kalkvit/50 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className={cn(
            'absolute z-[100] w-full mt-2',
            'glass-dropdown rounded-xl',
            'py-2 shadow-xl',
            'animate-in fade-in slide-in-from-top-2 duration-150',
            menuClassName
          )}
        >
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              role="option"
              aria-selected={item.value === value}
              disabled={item.disabled}
              onClick={() => handleSelect(item)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm',
                'transition-colors',
                item.disabled
                  ? 'text-kalkvit/30 cursor-not-allowed'
                  : item.value === value
                  ? 'bg-koppar/10 text-koppar'
                  : 'text-kalkvit/70 hover:bg-white/[0.06] hover:text-kalkvit'
              )}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <div className="flex-1 min-w-0">
                <p>{item.label}</p>
                {item.description && (
                  <p className="text-xs text-kalkvit/40 mt-0.5">{item.description}</p>
                )}
              </div>
              {item.value === value && (
                <Check className="w-4 h-4 text-koppar flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Menu dropdown variant (for actions)
interface MenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}

interface GlassMenuProps {
  trigger: React.ReactNode
  items: MenuItem[]
  align?: 'left' | 'right'
  className?: string
}

export function GlassMenu({
  trigger,
  items,
  align = 'right',
  className,
}: GlassMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={menuRef} className={cn('relative inline-block', className)}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute z-[100] mt-2 min-w-[160px]',
            align === 'right' ? 'right-0' : 'left-0',
            'glass-dropdown rounded-xl',
            'py-1 shadow-xl',
            'animate-in fade-in slide-in-from-top-2 duration-150'
          )}
        >
          {items.map((item, index) => (
            <button
              key={index}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick()
                  setIsOpen(false)
                }
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2 text-left text-sm',
                'transition-colors',
                item.disabled
                  ? 'text-kalkvit/30 cursor-not-allowed'
                  : item.danger
                  ? 'text-tegelrod hover:bg-tegelrod/10'
                  : 'text-kalkvit/70 hover:bg-white/[0.06] hover:text-kalkvit'
              )}
            >
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
