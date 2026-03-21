import { cn } from '../../lib/utils'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

export interface SortOption {
  key: string
  label: string
}

export interface SortState {
  key: string
  direction: 'asc' | 'desc'
}

interface SortBarProps {
  options: SortOption[]
  value: SortState
  onChange: (sort: SortState) => void
  className?: string
}

export function SortBar({ options, value, onChange, className }: SortBarProps) {
  const handleClick = (key: string) => {
    if (value.key === key) {
      onChange({ key, direction: value.direction === 'asc' ? 'desc' : 'asc' })
    } else {
      onChange({ key, direction: 'asc' })
    }
  }

  return (
    <div className={cn('flex items-center gap-1 flex-wrap', className)}>
      <span className="text-xs text-kalkvit/40 mr-1 font-medium">Sort by</span>
      {options.map((opt) => {
        const isActive = value.key === opt.key
        return (
          <button
            key={opt.key}
            onClick={() => handleClick(opt.key)}
            className={cn(
              'inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
              isActive
                ? 'bg-koppar/15 text-koppar'
                : 'text-kalkvit/50 hover:text-kalkvit/70 hover:bg-white/[0.05]'
            )}
          >
            {opt.label}
            {isActive && (
              value.direction === 'asc'
                ? <ChevronUpIcon className="w-3 h-3" />
                : <ChevronDownIcon className="w-3 h-3" />
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Generic sort function for arrays */
export function sortItems<T>(
  items: T[],
  sort: SortState,
  getters: Record<string, (item: T) => string | number | boolean | null | undefined>
): T[] {
  const getter = getters[sort.key]
  if (!getter) return items
  return [...items].sort((a, b) => {
    const aVal = getter(a)
    const bVal = getter(b)
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const cmp = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' })
      return sort.direction === 'asc' ? cmp : -cmp
    }
    const numA = Number(aVal)
    const numB = Number(bVal)
    return sort.direction === 'asc' ? numA - numB : numB - numA
  })
}
