import { type ReactNode, useMemo } from 'react'
import { GlassSidebar } from './GlassSidebar'
import { MobileHeader } from './MobileHeader'
import { MobileBottomNav } from './MobileBottomNav'
import { BackgroundPattern } from '../ui/BackgroundPattern'
import { useCurrentSection } from './sectionNav'
import { SectionTopBar } from './SectionTopBar'
import { useCoachingUnreadCount } from '../../lib/api/hooks/useCoaching'
interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const section = useCurrentSection()
  const { data: unreadData } = useCoachingUnreadCount()

  const badges = useMemo(() => ({
    coachingUnread: unreadData?.count ?? 0,
  }), [unreadData?.count])

  return (
    <div className="min-h-dvh bg-glass-dark dark:bg-glass-dark light:bg-kalkvit transition-colors duration-300 overflow-x-hidden">
      <BackgroundPattern />

      {/* Mobile Header - visible on mobile/tablet */}
      <MobileHeader />

      {/* Mobile Bottom Nav - visible on mobile/tablet */}
      <MobileBottomNav />

      {/* Desktop Sidebar - hidden on mobile/tablet, fixed position */}
      <div className="hidden lg:block">
        <GlassSidebar />
      </div>

      {/* Main Content - with left margin for fixed sidebar on desktop */}
      <main className="relative z-10 min-h-dvh pt-[66px] pb-20 lg:pt-0 lg:pb-0 lg:ml-[260px]">
        {section && (
          <SectionTopBar
            items={section.items}
            moreItems={section.moreItems}
            mode={section.mode}
            badges={badges}
          />
        )}
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
