import { useRef, useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronRight, ChevronDown, MoreHorizontal } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { SectionNavItem } from './sectionNav'

interface SectionTopBarProps {
  items: SectionNavItem[]
  moreItems?: SectionNavItem[]
  mode?: 'tabs' | 'stepper'
}

function isActive(to: string, pathname: string): boolean {
  if (to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(to + '/')
}

/* ── Mobile: compact dropdown showing current page ── */
function MobileDropdown({
  items,
  moreItems,
}: {
  items: SectionNavItem[]
  moreItems?: SectionNavItem[]
}) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const allItems = [...items, ...(moreItems ?? [])]
  const current = allItems.find((item) => isActive(item.to, pathname)) ?? allItems[0]

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!current) return null

  return (
    <div ref={ref} className="relative w-full p-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-kalkvit transition-all hover:bg-white/[0.05]"
      >
        <span className="flex items-center gap-2">
          <current.icon className="w-4 h-4 text-koppar" />
          {current.label}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-kalkvit/40 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 mx-1 py-1 rounded-xl glass-dropdown shadow-2xl z-[100]">
          {allItems.map((item) => {
            const active = isActive(item.to, pathname)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'text-koppar bg-koppar/10'
                    : 'text-kalkvit/70 hover:text-kalkvit hover:bg-white/[0.05]'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Desktop: horizontal tabs ── */
function TabsBar({ items }: { items: SectionNavItem[] }) {
  return (
    <div className="flex gap-1 p-1 overflow-x-auto scrollbar-hide">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive: active }) =>
            cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              active
                ? 'bg-koppar/15 text-koppar'
                : 'text-kalkvit/60 hover:text-kalkvit hover:bg-white/[0.05]'
            )
          }
        >
          <item.icon className="w-4 h-4" />
          {item.label}
        </NavLink>
      ))}
    </div>
  )
}

/* ── Desktop: stepper breadcrumbs ── */
function StepperBar({
  items,
  moreItems,
}: {
  items: SectionNavItem[]
  moreItems?: SectionNavItem[]
}) {
  const { pathname } = useLocation()
  const [showMore, setShowMore] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!showMore) return
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMore])

  return (
    <div className="relative flex items-center gap-1 p-1">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {items.map((item, index) => {
          const active = isActive(item.to, pathname)

          return (
            <div key={item.to} className="flex items-center shrink-0">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-kalkvit/20 mx-0.5 shrink-0" />
              )}
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  active
                    ? 'bg-koppar/15 text-koppar border border-koppar/30'
                    : 'text-kalkvit/60 hover:text-kalkvit hover:bg-white/[0.05] border border-transparent'
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </NavLink>
            </div>
          )
        })}
      </div>

      {/* More dropdown for extra items */}
      {moreItems && moreItems.length > 0 && (
        <div className="relative shrink-0 ml-1" ref={moreRef}>
          <ChevronRight className="w-4 h-4 text-kalkvit/20 mx-0.5 shrink-0 inline" />
          <button
            onClick={() => setShowMore((prev) => !prev)}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all',
              moreItems.some((m) => isActive(m.to, pathname))
                ? 'bg-koppar/15 text-koppar'
                : 'text-kalkvit/40 hover:text-kalkvit/70 hover:bg-white/[0.05]'
            )}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMore && (
            <div className="absolute top-full right-0 mt-1 py-1 min-w-[160px] rounded-xl glass-dropdown shadow-2xl z-[100]">
              {moreItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setShowMore(false)}
                  className={({ isActive: active }) =>
                    cn(
                      'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'text-koppar bg-koppar/10'
                        : 'text-kalkvit/70 hover:text-kalkvit hover:bg-white/[0.05]'
                    )
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function SectionTopBar({ items, moreItems, mode = 'tabs' }: SectionTopBarProps) {
  return (
    <div className="sticky top-[57px] lg:top-0 z-20 glass-base border-t-0 rounded-none px-3 sm:px-4 md:px-6 lg:px-8">
      {/* Mobile: compact dropdown */}
      <div className="md:hidden">
        <MobileDropdown items={items} moreItems={moreItems} />
      </div>

      {/* Desktop: full tabs/stepper */}
      <div className="hidden md:flex justify-center">
        {mode === 'stepper' ? (
          <StepperBar items={items} moreItems={moreItems} />
        ) : (
          <TabsBar items={items} />
        )}
      </div>
    </div>
  )
}
