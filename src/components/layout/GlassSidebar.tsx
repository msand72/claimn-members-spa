import { NavLink, useNavigate } from 'react-router-dom'
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
} from 'lucide-react'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
}

const mainNav: NavItem[] = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/feed', icon: Newspaper, label: 'Feed' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/connections', icon: Users, label: 'Connections' },
  { to: '/network', icon: Globe, label: 'Network' },
  { to: '/circles', icon: Award, label: 'Circles' },
  { to: '/programs', icon: GraduationCap, label: 'Programs' },
  { to: '/experts', icon: Sparkles, label: 'Experts' },
  { to: '/book-session', icon: Calendar, label: 'Book Session' },
]

const secondaryNav: NavItem[] = [
  { to: '/shop', icon: ShoppingBag, label: 'Shop' },
  { to: '/resources', icon: FolderOpen, label: 'Resources' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
  { to: '/profile', icon: User, label: 'Profile' },
]

function NavLinkItem({ to, icon: Icon, label }: NavItem) {
  return (
    <NavLink
      to={to}
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
      <Icon className="w-5 h-5" />
      {label}
    </NavLink>
  )
}

export function GlassSidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col glass-base border-r border-white/10">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-koppar to-jordbrun flex items-center justify-center">
            <span className="text-kalkvit font-bold text-lg">C</span>
          </div>
          <span className="font-display text-xl font-bold text-kalkvit">CLAIM'N</span>
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04]">
          <GlassAvatar initials={initials} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-kalkvit truncate">{displayName}</p>
            <p className="text-xs text-kalkvit/50 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {mainNav.map(item => (
            <NavLinkItem key={item.to} {...item} />
          ))}
        </div>

        <div className="pt-4 mt-4 border-t border-white/10 space-y-1">
          {secondaryNav.map(item => (
            <NavLinkItem key={item.to} {...item} />
          ))}
        </div>
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-white/10">
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
