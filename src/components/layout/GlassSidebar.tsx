import { Link, NavLink, useNavigate } from 'react-router-dom'
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
  Bug,
  ChevronRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNotifications, safeArray, type Notification } from '../../lib/api'
import { useBugReport } from '../../contexts/BugReportContext'

interface NavItem {
  to: string
  icon: LucideIcon
  label: string
}

const accountNav: NavItem[] = [
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
  { to: '/resources', icon: Library, label: 'Resources' },
]

export function GlassSidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const currentSection = useCurrentSection()
  const { openManualReport } = useBugReport()
  const { data: notifData } = useNotifications({ limit: 50 })
  const unreadCount = safeArray<Notification>(notifData).filter((n) => !n.read_at).length

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const displayName = user?.display_name || user?.email?.split('@')[0] || 'Member'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside className="w-[260px] h-screen fixed top-0 left-0 flex flex-col z-40 bg-[#1a1816]/80 backdrop-blur-2xl border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-koppar to-jordbrun flex items-center justify-center shadow-lg shadow-koppar/20">
            <span className="text-kalkvit font-bold text-sm">C</span>
          </div>
          <span className="font-display text-lg font-bold text-kalkvit tracking-tight">CLAIM'N</span>
        </div>
      </div>

      {/* User Card */}
      <div className="px-3 pb-3 shrink-0">
        <Link
          to="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group"
        >
          <GlassAvatar initials={initials} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-kalkvit truncate group-hover:text-koppar transition-colors">{displayName}</p>
            <p className="text-[11px] text-kalkvit/40 truncate">{user?.email}</p>
          </div>
          <Link
            to="/notifications"
            onClick={(e) => e.stopPropagation()}
            className="relative p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors text-kalkvit/40 hover:text-kalkvit"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-koppar text-[9px] font-bold text-kalkvit flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-white/[0.06]" />

      {/* Main Navigation */}
      <nav className="flex-1 py-2 px-3 overflow-y-auto">
        <div className="space-y-0.5">
          {SECTION_KEYS.map((key) => {
            const section = SECTION_NAV[key]
            const isActive = currentSection?.key === key
            const Icon = section.icon

            return (
              <Link
                key={key}
                to={section.basePath}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg',
                  'text-[13px] font-medium transition-all duration-150',
                  isActive
                    ? 'bg-koppar/15 text-koppar'
                    : 'text-kalkvit/60 hover:bg-white/[0.04] hover:text-kalkvit/90'
                )}
              >
                <Icon className={cn('w-[18px] h-[18px]', isActive && 'text-koppar')} />
                <span className="flex-1">{section.label}</span>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-koppar/60" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Account Section */}
        <div className="mt-4 pt-3 border-t border-white/[0.06]">
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-kalkvit/25">Account</p>
          <div className="space-y-0.5">
            {accountNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg',
                    'text-[13px] font-medium transition-all duration-150',
                    isActive
                      ? 'bg-koppar/15 text-koppar'
                      : 'text-kalkvit/60 hover:bg-white/[0.04] hover:text-kalkvit/90'
                  )
                }
              >
                <item.icon className="w-[18px] h-[18px]" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/[0.06] shrink-0 space-y-0.5">
        <button
          onClick={openManualReport}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
            'text-[13px] font-medium text-kalkvit/40',
            'hover:bg-white/[0.04] hover:text-kalkvit/60',
            'transition-all duration-150'
          )}
        >
          <Bug className="w-[18px] h-[18px]" />
          Report a Bug
        </button>
        <button
          onClick={handleSignOut}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
            'text-[13px] font-medium text-kalkvit/40',
            'hover:bg-tegelrod/10 hover:text-tegelrod',
            'transition-all duration-150'
          )}
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
