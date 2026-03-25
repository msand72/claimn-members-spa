import type React from 'react'
import { useLocation } from 'react-router-dom'
import {
  ViewfinderCircleIcon as Target,
  Squares2X2Icon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  SparklesIcon,
  AcademicCapIcon,
  ShoppingBagIcon,
  ClipboardDocumentCheckIcon,
  BookOpenIcon,
  CheckBadgeIcon,
  FlagIcon,
  ChartBarIcon,
  NewspaperIcon,
  ChatBubbleLeftIcon,
  GlobeAltIcon,
  TrophyIcon,
  HeartIcon,
  CalendarIcon,
  StopCircleIcon,
  DocumentTextIcon,
  FolderOpenIcon,
  TagIcon,
  ArrowUpCircleIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'

export interface SectionNavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  /** Optional key used by SectionTopBar to look up a live badge count */
  badgeKey?: string
}

export interface SectionConfig {
  label: string
  icon: React.ComponentType<{ className?: string }>
  basePath: string
  mode: 'tabs' | 'stepper'
  items: SectionNavItem[]
  moreItems?: SectionNavItem[]
  allPaths: string[]
}

export const SECTION_NAV: Record<string, SectionConfig> = {
  dashboard: {
    label: 'The Hub',
    icon: Squares2X2Icon,
    basePath: '/',
    mode: 'tabs',
    items: [],
    allPaths: ['/'],
  },
  growth: {
    label: 'My Plan',
    icon: ArrowTrendingUpIcon,
    basePath: '/goals',
    mode: 'stepper',
    items: [
      { to: '/goals', label: 'Goals', icon: Target },
      { to: '/plan', label: 'Plan', icon: SparklesIcon },
      { to: '/events', label: 'Sessions', icon: CalendarIcon },
      { to: '/action-items', label: 'Actions', icon: CheckBadgeIcon },
      { to: '/milestones', label: 'Milestones', icon: FlagIcon },
      { to: '/kpis', label: 'KPIs', icon: ChartBarIcon },
      { to: '/assessment/results', label: 'Assessment', icon: ClipboardDocumentCheckIcon },
    ],
    moreItems: [
      { to: '/protocols', label: 'Protocols', icon: BookOpenIcon },
      { to: '/accountability', label: 'Accountability', icon: UserGroupIcon },
    ],
    allPaths: ['/goals', '/plan', '/kpis', '/action-items', '/protocols', '/my-protocols', '/milestones', '/accountability', '/assessment', '/assessment/results', '/assessment/take', '/events'],
  },
  community: {
    label: 'Community',
    icon: UserGroupIcon,
    basePath: '/feed',
    mode: 'tabs',
    items: [
      { to: '/feed', label: 'Feed', icon: NewspaperIcon },
      { to: '/messages', label: 'Messages', icon: ChatBubbleLeftIcon },
      { to: '/connections', label: 'Connections', icon: UserGroupIcon },
      { to: '/network', label: 'Network', icon: GlobeAltIcon },
      { to: '/circles', label: 'Circles', icon: TrophyIcon },
      { to: '/interest-groups', label: 'Groups', icon: HeartIcon },
    ],
    allPaths: ['/feed', '/messages', '/connections', '/network', '/circles', '/interest-groups'],
  },
  coaching: {
    label: 'Coaching & Experts',
    icon: SparklesIcon,
    basePath: '/experts',
    mode: 'tabs',
    items: [
      { to: '/experts', label: 'Experts', icon: SparklesIcon },
      { to: '/coaching/ai', label: 'AI Coach', icon: SparklesIcon, badgeKey: 'coachingUnread' },
      { to: '/book-session', label: 'Book Session', icon: CalendarIcon },
      { to: '/coaching/sessions', label: 'My Sessions', icon: StopCircleIcon },
      { to: '/coaching/session-notes', label: 'Notes', icon: DocumentTextIcon },
      { to: '/coaching/resources', label: 'Materials', icon: FolderOpenIcon },
    ],
    moreItems: [
      { to: '/coaching/quarterly-reviews', label: 'Quarterly Reviews', icon: ClipboardDocumentCheckIcon },
    ],
    allPaths: ['/experts', '/expert-sessions', '/book-session', '/coaching/ai', '/coaching/ai/chat', '/coaching/sessions', '/coaching/session-notes', '/coaching/resources', '/coaching/quarterly-reviews'],
  },
  programs: {
    label: 'Programs',
    icon: AcademicCapIcon,
    basePath: '/programs',
    mode: 'tabs',
    items: [
      { to: '/programs', label: 'My Programs', icon: AcademicCapIcon },
      { to: '/programs/sprints', label: 'Sprints', icon: BoltIcon },
      { to: '/programs/reviews', label: 'Reviews', icon: ClipboardDocumentCheckIcon },
    ],
    allPaths: ['/programs', '/programs/sprints', '/programs/reviews'],
  },
  shop: {
    label: 'Shop',
    icon: ShoppingBagIcon,
    basePath: '/shop',
    mode: 'tabs',
    items: [
      { to: '/shop', label: 'Browse', icon: ShoppingBagIcon },
      { to: '/shop/protocols', label: 'Protocols', icon: TagIcon },
      { to: '/shop/circles', label: 'Circles', icon: TrophyIcon },
      { to: '/shop/upgrade', label: 'Upgrade', icon: ArrowUpCircleIcon },
    ],
    allPaths: ['/shop', '/shop/protocols', '/shop/circles', '/shop/upgrade', '/shop/success'],
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
