import { Link, NavLink, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { Home, TrendingUp, Users, Sparkles, User } from 'lucide-react'
import { SECTION_NAV } from './sectionNav'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  /** Section key in SECTION_NAV for custom active detection */
  sectionKey?: string
}

const bottomNavItems: NavItem[] = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/goals', icon: TrendingUp, label: 'Growth', sectionKey: 'growth' },
  { to: '/feed', icon: Users, label: 'Community', sectionKey: 'community' },
  { to: '/experts', icon: Sparkles, label: 'Coaching', sectionKey: 'coaching' },
  { to: '/profile', icon: User, label: 'Profile' },
]

function isSectionActive(pathname: string, sectionKey: string): boolean {
  const section = SECTION_NAV[sectionKey]
  if (!section) return false
  return section.allPaths.some((p) => {
    if (p === '/') return pathname === '/'
    return pathname === p || pathname.startsWith(p + '/')
  })
}

export function MobileBottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-elevated border-t border-white/10 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {bottomNavItems.map(({ to, icon: Icon, label, sectionKey }) => {
          if (sectionKey) {
            // Section-based tabs: active when current path is anywhere in the section
            const isActive = isSectionActive(pathname, sectionKey)
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[60px]',
                  'text-xs font-medium transition-all duration-200',
                  isActive
                    ? 'text-koppar bg-koppar/10'
                    : 'text-kalkvit/60 hover:text-kalkvit hover:bg-white/[0.04]'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            )
          }

          // Home and Profile: standard NavLink active detection
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[60px]',
                  'text-xs font-medium transition-all duration-200',
                  isActive
                    ? 'text-koppar bg-koppar/10'
                    : 'text-kalkvit/60 hover:text-kalkvit hover:bg-white/[0.04]'
                )
              }
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
