import { cn } from '../../lib/utils'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

interface Column<T> {
  key: keyof T | string
  header: string
  sortable?: boolean
  width?: string
  render?: (item: T, index: number) => React.ReactNode
  className?: string
}

interface GlassTableProps<T> {
  columns: Column<T>[]
  data: T[]
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (key: string) => void
  onRowClick?: (item: T, index: number) => void
  emptyMessage?: string
  isLoading?: boolean
  className?: string
}

export function GlassTable<T extends Record<string, unknown>>({
  columns,
  data,
  sortKey,
  sortDirection,
  onSort,
  onRowClick,
  emptyMessage = 'No data available',
  isLoading = false,
  className,
}: GlassTableProps<T>) {
  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null

    const isActive = sortKey === column.key

    if (!isActive) {
      return <ChevronsUpDown className="w-4 h-4 text-kalkvit/30" />
    }

    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-koppar" />
    ) : (
      <ChevronDown className="w-4 h-4 text-koppar" />
    )
  }

  const getCellValue = (item: T, column: Column<T>): React.ReactNode => {
    if (column.render) {
      return column.render(item, data.indexOf(item))
    }
    const value = item[column.key as keyof T]
    if (value === null || value === undefined) return '-'
    return String(value)
  }

  return (
    <div className={cn('overflow-x-auto rounded-xl border border-white/10', className)}>
      <table className="w-full">
        <thead>
          <tr className="bg-white/[0.03]">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  'px-4 py-3 text-left text-sm font-medium text-kalkvit/70',
                  column.sortable && 'cursor-pointer hover:text-kalkvit select-none',
                  column.className
                )}
                style={column.width ? { width: column.width } : undefined}
                onClick={() => column.sortable && onSort?.(String(column.key))}
              >
                <div className="flex items-center gap-2">
                  {column.header}
                  {renderSortIcon(column)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-4 py-3">
                    <div className="h-4 bg-white/[0.06] rounded w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-kalkvit/50"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={index}
                className={cn(
                  'transition-colors',
                  onRowClick
                    ? 'cursor-pointer hover:bg-white/[0.04]'
                    : 'hover:bg-white/[0.02]'
                )}
                onClick={() => onRowClick?.(item, index)}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={cn('px-4 py-3 text-sm text-kalkvit/80', column.className)}
                  >
                    {getCellValue(item, column)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// Pagination component for tables
interface GlassTablePaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function GlassTablePagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: GlassTablePaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  // Show max 5 page buttons
  const getVisiblePages = () => {
    if (totalPages <= 5) return pages

    if (currentPage <= 3) return pages.slice(0, 5)
    if (currentPage >= totalPages - 2) return pages.slice(-5)

    return pages.slice(currentPage - 3, currentPage + 2)
  }

  return (
    <div className={cn('flex items-center justify-between mt-4', className)}>
      <p className="text-sm text-kalkvit/50">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            currentPage === 1
              ? 'text-kalkvit/20 cursor-not-allowed'
              : 'text-kalkvit/70 hover:bg-white/[0.06]'
          )}
        >
          Previous
        </button>
        {getVisiblePages().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              'w-8 h-8 rounded-lg text-sm font-medium transition-all',
              page === currentPage
                ? 'bg-koppar text-kalkvit'
                : 'text-kalkvit/70 hover:bg-white/[0.06]'
            )}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            currentPage === totalPages
              ? 'text-kalkvit/20 cursor-not-allowed'
              : 'text-kalkvit/70 hover:bg-white/[0.06]'
          )}
        >
          Next
        </button>
      </div>
    </div>
  )
}
