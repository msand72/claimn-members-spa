import { useRef, useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronRightIcon, ChevronDownIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline'
import { cn } from '../../lib/utils'
import { useTheme } from '../../contexts/ThemeContext'
import type { SectionNavItem } from './sectionNav'

interface SectionTopBarProps {
  items: SectionNavItem[]
  moreItems?: SectionNavItem[]
  mode?: 'tabs' | 'stepper'
  /** Map of badgeKey → count for live badge rendering */
  badges?: Record<string, number>
}

function isActive(to: string, pathname: string): boolean {
  if (to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(to + '/')
}

/* ── Mobile: compact dropdown showing current page ── */
function MobileDropdown({
  items,
  moreItems,
  badges,
}: {
  items: SectionNavItem[]
  moreItems?: SectionNavItem[]
  badges?: Record<string, number>
}) {
  const { pathname } = useLocation()
  const { theme } = useTheme()
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
        <ChevronDownIcon className={cn('w-4 h-4 text-kalkvit/40 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 mx-1 py-1 rounded-xl glass-dropdown shadow-2xl z-[100]"
          style={{ background: theme === 'light' ? undefined : 'rgba(28,28,30,0.90)' }}
        >
          {allItems.map((item) => {
            const active = isActive(item.to, pathname)
            const badgeCount = item.badgeKey ? badges?.[item.badgeKey] ?? 0 : 0
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
                {badgeCount > 0 && (
                  <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-koppar text-kalkvit text-[10px] font-bold px-1">
                    {badgeCount}
                  </span>
                )}
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Desktop: horizontal tabs ── */
function TabsBar({ items, badges }: { items: SectionNavItem[]; badges?: Record<string, number> }) {
  return (
    <div className="flex gap-1 p-1 overflow-x-auto scrollbar-hide">
      {items.map((item) => {
        const badgeCount = item.badgeKey ? badges?.[item.badgeKey] ?? 0 : 0
        return (
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
            {badgeCount > 0 && (
              <span className="ml-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-koppar text-kalkvit text-[10px] font-bold px-1">
                {badgeCount}
              </span>
            )}
          </NavLink>
        )
      })}
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
  const { theme } = useTheme()
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
                <ChevronRightIcon className="w-4 h-4 text-kalkvit/20 mx-0.5 shrink-0" />
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
          <ChevronRightIcon className="w-4 h-4 text-kalkvit/20 mx-0.5 shrink-0 inline" />
          <button
            onClick={() => setShowMore((prev) => !prev)}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all',
              moreItems.some((m) => isActive(m.to, pathname))
                ? 'bg-koppar/15 text-koppar'
                : 'text-kalkvit/40 hover:text-kalkvit/70 hover:bg-white/[0.05]'
            )}
          >
            <EllipsisHorizontalIcon className="w-4 h-4" />
          </button>

          {showMore && (
            <div
              className="absolute top-full right-0 mt-1 py-1 min-w-[160px] rounded-xl glass-dropdown shadow-2xl z-[100]"
              style={{ background: theme === 'light' ? undefined : 'rgba(28,28,30,0.90)' }}
            >
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

export function SectionTopBar({ items, moreItems, mode = 'tabs', badges }: SectionTopBarProps) {
  const { theme } = useTheme()
  const barBg = theme === 'light' ? 'rgba(255,255,255,0.72)' : 'rgba(28,28,30,0.90)'
  const barBorder = theme === 'light' ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.10)'

  return (
    <div
      className="sticky top-[66px] lg:top-0 z-30 border-t-0 rounded-none px-3 sm:px-4 md:px-6 lg:px-8 backdrop-blur-xl"
      style={{ background: barBg, borderBottom: `1px solid ${barBorder}` }}
    >
      {/* Mobile: compact dropdown */}
      <div className="md:hidden">
        <MobileDropdown items={items} moreItems={moreItems} badges={badges} />
      </div>

      {/* Desktop: full tabs/stepper */}
      <div className="hidden md:flex justify-center">
        {mode === 'stepper' ? (
          <StepperBar items={items} moreItems={moreItems} />
        ) : (
          <TabsBar items={items} badges={badges} />
        )}
      </div>
    </div>
  )
}
