import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, Home, User, CreditCard, TrendingUp, Users, Sparkles, GraduationCap, ShoppingBag, Library } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../contexts/AuthContext'
import { ThemeToggle } from '../ui/ThemeToggle'
import { useCurrentSection, SECTION_KEYS, SECTION_NAV } from './sectionNav'

const SECTION_ICONS: Record<string, React.ElementType> = {
  growth: TrendingUp,
  community: Users,
  coaching: Sparkles,
  programs: GraduationCap,
  shop: ShoppingBag,
}

const SECTION_LABELS: Record<string, string> = {
  growth: 'My Journey',
  community: 'Community',
  coaching: 'Coaching',
  programs: 'Programs',
  shop: 'Shop',
}

const accountLinks = [
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
  { to: '/resources', icon: Library, label: 'Resources' },
]

const linkClasses = 'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200'
const activeClasses = 'bg-koppar/20 text-koppar'
const inactiveClasses = 'text-kalkvit/70 hover:bg-white/[0.06] hover:text-kalkvit'

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const section = useCurrentSection()

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
          'lg:hidden fixed top-0 right-0 z-50 h-full w-72 glass-elevated mobile-drawer',
          'transform transition-transform duration-300 ease-in-out overflow-y-auto',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="p-4 pt-16 pb-24 space-y-4">
          {/* Section Links */}
          <div className="space-y-1">
            <NavLink
              to="/"
              end
              onClick={closeMenu}
              className={cn(
                linkClasses,
                section?.key === 'growth' && location.pathname === '/'
                  ? activeClasses
                  : inactiveClasses
              )}
            >
              <Home className="w-5 h-5" />
              Dashboard
            </NavLink>
            {SECTION_KEYS.map((key) => {
              const Icon = SECTION_ICONS[key]
              const label = SECTION_LABELS[key]
              const nav = SECTION_NAV[key]
              const isActive = section?.key === key

              return (
                <NavLink
                  key={key}
                  to={nav.basePath}
                  onClick={closeMenu}
                  className={cn(linkClasses, isActive ? activeClasses : inactiveClasses)}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </NavLink>
              )
            })}
          </div>

          {/* Account Links */}
          <div className="pt-4 border-t border-white/10 space-y-1">
            {accountLinks.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={closeMenu}
                className={({ isActive }) =>
                  cn(linkClasses, isActive ? activeClasses : inactiveClasses)
                }
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
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
