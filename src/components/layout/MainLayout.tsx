import type { ReactNode } from 'react'
import { GlassSidebar } from './GlassSidebar'
import { MobileHeader } from './MobileHeader'
import { MobileBottomNav } from './MobileBottomNav'
import { BackgroundPattern } from '../ui/BackgroundPattern'
import { ThemeToggle } from '../ui/ThemeToggle'
import { useCurrentSection } from './sectionNav'
import { SectionTopBar } from './SectionTopBar'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const section = useCurrentSection()

  return (
    <div className="min-h-screen bg-glass-dark dark:bg-glass-dark light:bg-kalkvit transition-colors duration-300 overflow-x-hidden">
      <BackgroundPattern />

      {/* Mobile Header - visible on mobile/tablet */}
      <MobileHeader />

      {/* Mobile Bottom Nav - visible on mobile/tablet */}
      <MobileBottomNav />

      {/* Desktop Theme Toggle - top right corner */}
      <div className="hidden lg:block fixed top-4 right-4 z-50">
        <ThemeToggle compact />
      </div>

      {/* Desktop Sidebar - hidden on mobile/tablet, fixed position */}
      <div className="hidden lg:block">
        <GlassSidebar />
      </div>

      {/* Main Content - with left margin for fixed sidebar on desktop */}
      <main className="relative z-10 min-h-screen pt-[60px] pb-20 lg:pt-0 lg:pb-0 lg:ml-64">
        {section && (
          <SectionTopBar
            items={section.items}
            moreItems={section.moreItems}
            mode={section.mode}
          />
        )}
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
