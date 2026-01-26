import type { ReactNode } from 'react'
import { GlassSidebar } from './GlassSidebar'
import { BackgroundPattern } from '../ui/BackgroundPattern'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-glass-dark">
      <BackgroundPattern />
      <div className="flex relative z-10">
        <GlassSidebar />
        <main className="flex-1 min-h-screen">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
