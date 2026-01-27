import type { ReactNode } from 'react'
import { GlassSidebar } from './GlassSidebar'
import { MobileHeader } from './MobileHeader'
import { MobileBottomNav } from './MobileBottomNav'
import { BackgroundPattern } from '../ui/BackgroundPattern'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-glass-dark dark:bg-glass-dark light:bg-kalkvit transition-colors duration-300">
      <BackgroundPattern />

      {/* Mobile Header - visible on mobile/tablet */}
      <MobileHeader />

      {/* Mobile Bottom Nav - visible on mobile/tablet */}
      <MobileBottomNav />

      <div className="flex relative z-10">
        {/* Desktop Sidebar - hidden on mobile/tablet */}
        <div className="hidden lg:block">
          <GlassSidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 min-h-screen pt-14 pb-20 lg:pt-0 lg:pb-0">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
