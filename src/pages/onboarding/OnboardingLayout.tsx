import { BackgroundPattern } from '../../components/ui'

interface OnboardingLayoutProps {
  children: React.ReactNode
  step: number
  totalSteps: number
}

/**
 * Minimal layout for onboarding — no sidebar, no bottom nav.
 * Shows progress bar and CLAIM'N branding only.
 */
export function OnboardingLayout({ children, step, totalSteps }: OnboardingLayoutProps) {
  const progress = Math.round((step / totalSteps) * 100)

  return (
    <div className="min-h-screen bg-glass-dark relative">
      <BackgroundPattern />
      <div className="relative z-10">
        {/* Header with logo and progress */}
        <header className="border-b border-white/[0.06] bg-charcoal/80 backdrop-blur-sm">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-display font-bold text-xl text-koppar tracking-tight">
                CLAIM'N
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-kalkvit/50 text-sm">
                Step {step} of {totalSteps}
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-white/[0.06]">
            <div
              className="h-full bg-koppar transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        {/* Content */}
        <main className="max-w-2xl mx-auto px-4 py-8 md:py-12">
          {children}
        </main>
      </div>
    </div>
  )
}
