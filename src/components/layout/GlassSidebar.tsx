import { NavLink, Link, useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { useAuth } from '../../contexts/AuthContext'
import { GlassAvatar } from '../ui/GlassAvatar'

import { SECTION_NAV, SECTION_KEYS, useCurrentSection } from './sectionNav'
import {
  User,
  CreditCard,
  LogOut,
  Library,
  Bell,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNotifications, safeArray, type Notification } from '../../lib/api'

interface NavItem {
  to: string
  icon: LucideIcon
  label: string
}

const accountNav: NavItem[] = [
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
  { to: '/resources', icon: Library, label: 'Resource Library' },
]

export function GlassSidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const currentSection = useCurrentSection()
  const { data: notifData } = useNotifications({ limit: 50 })
  const unreadCount = safeArray<Notification>(notifData).filter((n) => !n.read_at).length

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const displayName = user?.display_name || user?.email?.split('@')[0] || 'Member'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside className="w-64 h-screen fixed top-0 left-0 flex flex-col glass-base border-r border-white/10 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-koppar to-jordbrun flex items-center justify-center">
            <span className="text-kalkvit font-bold text-lg">C</span>
          </div>
          <span className="font-display text-xl font-bold text-kalkvit">CLAIM'N</span>
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04]">
          <GlassAvatar initials={initials} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-kalkvit truncate">{displayName}</p>
            <p className="text-xs text-kalkvit/50 truncate">{user?.email}</p>
          </div>
          <Link to="/notifications" className="relative p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-kalkvit/60 hover:text-kalkvit">
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-koppar text-[10px] font-bold text-kalkvit flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>


      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {/* Section Links */}
        {SECTION_KEYS.map((key) => {
          const section = SECTION_NAV[key]
          const isActive = currentSection?.key === key
          const Icon = section.icon

          return (
            <Link
              key={key}
              to={section.basePath}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl',
                'text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-koppar/20 text-koppar border-l-4 border-koppar -ml-1 pl-3'
                  : 'text-kalkvit/70 hover:bg-white/[0.06] hover:text-kalkvit'
              )}
            >
              <Icon className="w-5 h-5" />
              {section.label}
            </Link>
          )
        })}

        {/* Account */}
        <div className="pt-4 mt-2 border-t border-white/10 space-y-0.5">
          {accountNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl',
                  'text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-koppar/20 text-koppar border-l-4 border-koppar -ml-1 pl-3'
                    : 'text-kalkvit/70 hover:bg-white/[0.06] hover:text-kalkvit'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-white/10 shrink-0">
        <button
          onClick={handleSignOut}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
            'text-sm font-medium text-kalkvit/70',
            'hover:bg-tegelrod/10 hover:text-tegelrod',
            'transition-all duration-200'
          )}
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
