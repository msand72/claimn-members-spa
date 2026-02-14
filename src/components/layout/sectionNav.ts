import { useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Sparkles,
  GraduationCap,
  ShoppingBag,
  ClipboardCheck,
  Target,
  BookOpen,
  CheckSquare,
  Flag,
  BarChart3,
  UsersRound,
  Newspaper,
  MessageCircle,
  Globe,
  Award,
  Heart,
  Calendar,
  CircleDot,
  FileText,
  FolderOpen,
  Tag,
  ArrowUpCircle,
} from 'lucide-react'

export interface SectionNavItem {
  to: string
  label: string
  icon: LucideIcon
}

export interface SectionConfig {
  label: string
  icon: LucideIcon
  basePath: string
  mode: 'tabs' | 'stepper'
  items: SectionNavItem[]
  moreItems?: SectionNavItem[]
  allPaths: string[]
}

export const SECTION_NAV: Record<string, SectionConfig> = {
  dashboard: {
    label: 'The Hub',
    icon: LayoutDashboard,
    basePath: '/',
    mode: 'tabs',
    items: [],
    allPaths: ['/'],
  },
  growth: {
    label: 'My Plan',
    icon: TrendingUp,
    basePath: '/goals',
    mode: 'stepper',
    items: [
      { to: '/assessment/results', label: 'Assessment', icon: ClipboardCheck },
      { to: '/goals', label: 'Goals', icon: Target },
      { to: '/protocols', label: 'Protocols', icon: BookOpen },
      { to: '/action-items', label: 'Actions', icon: CheckSquare },
      { to: '/milestones', label: 'Milestones', icon: Flag },
      { to: '/kpis', label: 'KPIs', icon: BarChart3 },
      { to: '/accountability', label: 'Accountability', icon: UsersRound },
    ],
    allPaths: ['/goals', '/kpis', '/action-items', '/protocols', '/my-protocols', '/milestones', '/accountability', '/assessment', '/assessment/results', '/assessment/take'],
  },
  community: {
    label: 'Community',
    icon: Users,
    basePath: '/feed',
    mode: 'tabs',
    items: [
      { to: '/feed', label: 'Feed', icon: Newspaper },
      { to: '/messages', label: 'Messages', icon: MessageCircle },
      { to: '/connections', label: 'Connections', icon: Users },
      { to: '/network', label: 'Network', icon: Globe },
      { to: '/circles', label: 'Circles', icon: Award },
      { to: '/interest-groups', label: 'Groups', icon: Heart },
    ],
    allPaths: ['/feed', '/messages', '/connections', '/network', '/circles', '/interest-groups'],
  },
  coaching: {
    label: 'Coaching & Experts',
    icon: Sparkles,
    basePath: '/experts',
    mode: 'tabs',
    items: [
      { to: '/experts', label: 'Experts', icon: Sparkles },
      { to: '/book-session', label: 'Book Session', icon: Calendar },
      { to: '/coaching/sessions', label: 'My Sessions', icon: CircleDot },
      { to: '/coaching/session-notes', label: 'Notes', icon: FileText },
      { to: '/coaching/resources', label: 'Materials', icon: FolderOpen },
    ],
    moreItems: [
      { to: '/coaching/quarterly-reviews', label: 'Quarterly Reviews', icon: ClipboardCheck },
      { to: '/events', label: 'Events', icon: Calendar },
    ],
    allPaths: ['/experts', '/expert-sessions', '/book-session', '/coaching/sessions', '/coaching/session-notes', '/coaching/resources', '/coaching/quarterly-reviews', '/events'],
  },
  programs: {
    label: 'Programs',
    icon: GraduationCap,
    basePath: '/programs',
    mode: 'tabs',
    items: [
      { to: '/programs', label: 'My Programs', icon: GraduationCap },
      { to: '/programs/sprints', label: 'Sprints', icon: Target },
      { to: '/programs/reviews', label: 'Reviews', icon: ClipboardCheck },
    ],
    allPaths: ['/programs', '/programs/sprints', '/programs/reviews'],
  },
  shop: {
    label: 'Shop',
    icon: ShoppingBag,
    basePath: '/shop',
    mode: 'tabs',
    items: [
      { to: '/shop', label: 'Browse', icon: ShoppingBag },
      { to: '/shop/protocols', label: 'Protocols', icon: Tag },
      { to: '/shop/circles', label: 'Circles', icon: Award },
      { to: '/shop/upgrade', label: 'Upgrade', icon: ArrowUpCircle },
    ],
    allPaths: ['/shop', '/shop/protocols', '/shop/circles', '/shop/upgrade'],
  },
}

// Ordered keys for sidebar rendering
export const SECTION_KEYS = ['dashboard', 'growth', 'community', 'coaching', 'programs', 'shop'] as const

export function useCurrentSection(): (SectionConfig & { key: string }) | null {
  const { pathname } = useLocation()

  for (const [key, section] of Object.entries(SECTION_NAV)) {
    const match = section.allPaths.some((p) => {
      if (p === '/') return pathname === '/'
      return pathname === p || pathname.startsWith(p + '/')
    })
    if (match) return { key, ...section }
  }

  return null
}
