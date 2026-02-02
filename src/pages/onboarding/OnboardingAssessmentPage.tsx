import { useNavigate } from 'react-router-dom'
import { useUpdateOnboarding } from '../../lib/api/hooks/useOnboarding'
import { OnboardingLayout } from './OnboardingLayout'
import { GlassCard, GlassButton } from '../../components/ui'
import { ClipboardCheck, ArrowRight } from 'lucide-react'

/**
 * Step 2: Assessment bridge page.
 * Explains the assessment, then links to the existing assessment flow.
 * On completion, the assessment page redirects back to /onboarding/results.
 */
export function OnboardingAssessmentPage() {
  const navigate = useNavigate()
  const updateOnboarding = useUpdateOnboarding()

  const handleStart = () => {
    // Navigate to existing assessment flow with return URL
    navigate('/assessment/take?returnTo=/onboarding/results')
  }

  return (
    <OnboardingLayout step={2} totalSteps={5}>
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-koppar/10 flex items-center justify-center mx-auto mb-6">
          <ClipboardCheck className="w-10 h-10 text-koppar" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-kalkvit mb-3">
          The Five Pillars Assessment
        </h1>
        <p className="text-kalkvit/60 text-lg max-w-lg mx-auto">
          This assessment helps us understand where you are today across the five pillars
          of transformation, so we can personalize your journey.
        </p>
      </div>

      <GlassCard variant="elevated" className="!p-6 md:!p-8">
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-koppar/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-koppar font-bold text-sm">1</span>
            </div>
            <div>
              <h3 className="text-kalkvit font-medium">Answer honestly</h3>
              <p className="text-kalkvit/50 text-sm">There are no right or wrong answers. This is about where you are now.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-koppar/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-koppar font-bold text-sm">2</span>
            </div>
            <div>
              <h3 className="text-kalkvit font-medium">Discover your archetype</h3>
              <p className="text-kalkvit/50 text-sm">You'll be mapped to one of five archetypes that shapes your transformation path.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-koppar/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-koppar font-bold text-sm">3</span>
            </div>
            <div>
              <h3 className="text-kalkvit font-medium">Get personalized recommendations</h3>
              <p className="text-kalkvit/50 text-sm">Based on your results, we'll suggest protocols and circles to start with.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-kalkvit/40 text-sm">~30 minutes</span>
          <GlassButton variant="primary" onClick={handleStart}>
            Start Assessment
            <ArrowRight className="w-4 h-4" />
          </GlassButton>
        </div>
      </GlassCard>
    </OnboardingLayout>
  )
}

export default OnboardingAssessmentPage
