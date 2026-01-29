import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { useAuth } from '../../contexts/AuthContext'
import { GlassAvatar } from '../ui/GlassAvatar'
import {
  Home,
  Newspaper,
  MessageCircle,
  Users,
  Calendar,
  ShoppingBag,
  User,
  CreditCard,
  FolderOpen,
  LogOut,
  Award,
  GraduationCap,
  Globe,
  Sparkles,
  Target,
  BarChart3,
  CheckSquare,
  BookOpen,
  Flag,
  UsersRound,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  ArrowUpCircle,
  Tag,
  FileText,
  CircleDot,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  to: string
  icon: LucideIcon
  label: string
}

interface NavGroup {
  label: string
  icon: LucideIcon
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'My Growth',
    icon: TrendingUp,
    items: [
      { to: '/goals', icon: Target, label: 'Goals' },
      { to: '/kpis', icon: BarChart3, label: 'KPIs' },
      { to: '/action-items', icon: CheckSquare, label: 'Action Items' },
      { to: '/protocols', icon: BookOpen, label: 'Protocols' },
      { to: '/milestones', icon: Flag, label: 'Milestones' },
      { to: '/accountability', icon: UsersRound, label: 'Accountability' },
      { to: '/assessment', icon: ClipboardCheck, label: 'Assessment' },
    ],
  },
  {
    label: 'Community',
    icon: Users,
    items: [
      { to: '/feed', icon: Newspaper, label: 'Feed' },
      { to: '/messages', icon: MessageCircle, label: 'Messages' },
      { to: '/connections', icon: Users, label: 'Connections' },
      { to: '/network', icon: Globe, label: 'Network' },
      { to: '/circles', icon: Award, label: 'Circles' },
    ],
  },
  {
    label: 'Coaching & Experts',
    icon: Sparkles,
    items: [
      { to: '/experts', icon: Sparkles, label: 'Experts' },
      { to: '/book-session', icon: Calendar, label: 'Book Session' },
      { to: '/coaching/sessions', icon: CircleDot, label: 'My Sessions' },
      { to: '/coaching/session-notes', icon: FileText, label: 'Session Notes' },
      { to: '/coaching/resources', icon: FolderOpen, label: 'Resources' },
    ],
  },
  {
    label: 'Programs',
    icon: GraduationCap,
    items: [
      { to: '/programs', icon: GraduationCap, label: 'My Programs' },
      { to: '/programs/sprints', icon: Target, label: 'Sprints' },
      { to: '/programs/reviews', icon: ClipboardCheck, label: 'Reviews' },
    ],
  },
  {
    label: 'Shop',
    icon: ShoppingBag,
    items: [
      { to: '/shop', icon: ShoppingBag, label: 'Browse' },
      { to: '/shop/protocols', icon: Tag, label: 'Protocols' },
      { to: '/shop/circles', icon: Award, label: 'Circles' },
      { to: '/shop/upgrade', icon: ArrowUpCircle, label: 'Upgrade' },
    ],
  },
]

const accountNav: NavItem[] = [
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
  { to: '/resources', icon: FolderOpen, label: 'Resources' },
]

const STORAGE_KEY = 'members_nav_expanded'

function getStoredExpanded(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function isActivePath(path: string, currentPath: string): boolean {
  if (path === '/') return currentPath === '/'
  return currentPath === path || currentPath.startsWith(path + '/')
}

export function GlassSidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const stored = getStoredExpanded()
    const active: Record<string, boolean> = { ...stored }
    for (const group of navGroups) {
      if (group.items.some(item => isActivePath(item.to, location.pathname))) {
        active[group.label] = true
      }
    }
    return active
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expandedGroups))
  }, [expandedGroups])

  // Auto-expand group when navigating
  useEffect(() => {
    for (const group of navGroups) {
      if (group.items.some(item => isActivePath(item.to, location.pathname))) {
        setExpandedGroups(prev => ({ ...prev, [group.label]: true }))
      }
    }
  }, [location.pathname])

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }))
  }

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
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {/* Home - always visible, not collapsible */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl',
              'text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-koppar/20 text-koppar border-l-4 border-koppar -ml-1 pl-3'
                : 'text-kalkvit/70 hover:bg-white/[0.06] hover:text-kalkvit'
            )
          }
        >
          <Home className="w-5 h-5" />
          Dashboard
        </NavLink>

        {/* Collapsible Groups */}
        {navGroups.map((group) => {
          const isExpanded = expandedGroups[group.label] ?? false
          const hasActiveItem = group.items.some(item => isActivePath(item.to, location.pathname))

          return (
            <div key={group.label} className="pt-2">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.label)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] uppercase tracking-wider font-semibold transition-colors',
                  hasActiveItem ? 'text-koppar/70' : 'text-kalkvit/40 hover:text-kalkvit/60'
                )}
              >
                <group.icon className="w-3.5 h-3.5" />
                <span className="flex-1 text-left">{group.label}</span>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>

              {/* Group Items */}
              {isExpanded && (
                <div className="ml-2 space-y-0.5 mt-0.5 mb-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-4 py-2 rounded-xl',
                          'text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-koppar/20 text-koppar border-l-2 border-koppar'
                            : 'text-kalkvit/70 hover:bg-white/[0.06] hover:text-kalkvit border-l-2 border-transparent'
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
          )
        })}

        {/* Account - always visible, not collapsible */}
        <div className="pt-4 mt-2 border-t border-white/10 space-y-0.5">
          {accountNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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
