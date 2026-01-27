import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../contexts/AuthContext'
import {
  Users,
  Calendar,
  ShoppingBag,
  CreditCard,
  FolderOpen,
  Award,
  GraduationCap,
  Globe,
  Sparkles,
  BarChart3,
  CheckSquare,
  BookOpen,
  Flag,
  UsersRound,
  ClipboardCheck,
} from 'lucide-react'
import { ThemeToggle } from '../ui/ThemeToggle'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
}

// Secondary navigation items (not in bottom nav)
const menuItems: NavItem[] = [
  { to: '/connections', icon: Users, label: 'Connections' },
  { to: '/network', icon: Globe, label: 'Network' },
  { to: '/circles', icon: Award, label: 'Circles' },
  { to: '/programs', icon: GraduationCap, label: 'Programs' },
  { to: '/experts', icon: Sparkles, label: 'Experts' },
  { to: '/book-session', icon: Calendar, label: 'Book Session' },
]

const transformationItems: NavItem[] = [
  { to: '/kpis', icon: BarChart3, label: 'KPIs' },
  { to: '/action-items', icon: CheckSquare, label: 'Action Items' },
  { to: '/protocols', icon: BookOpen, label: 'Protocols' },
  { to: '/milestones', icon: Flag, label: 'Milestones' },
  { to: '/accountability', icon: UsersRound, label: 'Accountability' },
  { to: '/assessment', icon: ClipboardCheck, label: 'Assessment' },
]

const utilityItems: NavItem[] = [
  { to: '/shop', icon: ShoppingBag, label: 'Shop' },
  { to: '/resources', icon: FolderOpen, label: 'Resources' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
]

function MenuNavLink({ to, icon: Icon, label, onClick }: NavItem & { onClick: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl',
          'text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-koppar/20 text-koppar'
            : 'text-kalkvit/70 hover:bg-white/[0.06] hover:text-kalkvit'
        )
      }
    >
      <Icon className="w-5 h-5" />
      {label}
    </NavLink>
  )
}

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const closeMenu = () => setIsOpen(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile Header Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-base border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-koppar to-jordbrun flex items-center justify-center">
              <span className="text-kalkvit font-bold text-sm">C</span>
            </div>
            <span className="font-display text-lg font-bold text-kalkvit">CLAIM'N</span>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl text-kalkvit/70 hover:bg-white/[0.06] hover:text-kalkvit transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Menu Drawer */}
      <nav
        className={cn(
          'lg:hidden fixed top-0 right-0 z-50 h-full w-72 glass-elevated',
          'transform transition-transform duration-300 ease-in-out overflow-y-auto',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="p-4 pt-16 pb-24 space-y-4">
          {/* Community & Connection */}
          <div className="space-y-1">
            <p className="px-4 py-2 text-xs font-semibold text-kalkvit/40 uppercase tracking-wider">
              Community
            </p>
            {menuItems.map(item => (
              <MenuNavLink key={item.to} {...item} onClick={closeMenu} />
            ))}
          </div>

          {/* Transformation */}
          <div className="pt-4 border-t border-white/10">
            <p className="px-4 py-2 text-xs font-semibold text-kalkvit/40 uppercase tracking-wider">
              Transformation
            </p>
            <div className="space-y-1">
              {transformationItems.map(item => (
                <MenuNavLink key={item.to} {...item} onClick={closeMenu} />
              ))}
            </div>
          </div>

          {/* Utility */}
          <div className="pt-4 border-t border-white/10 space-y-1">
            {utilityItems.map(item => (
              <MenuNavLink key={item.to} {...item} onClick={closeMenu} />
            ))}
          </div>

          {/* Theme Toggle & Sign Out */}
          <div className="pt-4 border-t border-white/10 space-y-1">
            <ThemeToggle />
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
        </div>
      </nav>
    </>
  )
}
