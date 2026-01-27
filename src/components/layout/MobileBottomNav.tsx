import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'
import {
  Home,
  Newspaper,
  MessageCircle,
  Target,
  User,
} from 'lucide-react'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
}

const bottomNavItems: NavItem[] = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/feed', icon: Newspaper, label: 'Feed' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export function MobileBottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-elevated border-t border-white/10 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {bottomNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
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
        ))}
      </div>
    </nav>
  )
}
