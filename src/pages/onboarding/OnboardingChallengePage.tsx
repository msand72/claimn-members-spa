import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUpdateOnboarding, type PrimaryChallenge } from '../../lib/api/hooks/useOnboarding'
import { OnboardingLayout } from './OnboardingLayout'
import { GlassButton } from '../../components/ui'
import { ArrowRight, Compass, Brain, Heart, Users, Target } from 'lucide-react'

const CHALLENGES: Array<{
  id: PrimaryChallenge
  label: string
  description: string
  icon: typeof Compass
  pillar: string
}> = [
  {
    id: 'identity',
    label: 'I feel disconnected from purpose',
    description: 'I need clarity on who I am and where I\'m going',
    icon: Compass,
    pillar: 'Identity & Purpose',
  },
  {
    id: 'vitality',
    label: 'I\'m exhausted and can\'t sustain this pace',
    description: 'My energy, sleep, and physical health need attention',
    icon: Heart,
    pillar: 'Physical & Vital',
  },
  {
    id: 'connection',
    label: 'My relationships feel shallow',
    description: 'I want deeper connections and better leadership skills',
    icon: Users,
    pillar: 'Connection & Leadership',
  },
  {
    id: 'emotional',
    label: 'I lack emotional regulation',
    description: 'Stress, anxiety, or reactivity are holding me back',
    icon: Brain,
    pillar: 'Emotional & Mental',
  },
  {
    id: 'mission',
    label: 'I\'m successful but unfulfilled',
    description: 'I want mastery and flow in my work and life',
    icon: Target,
    pillar: 'Mission & Mastery',
  },
]

export function OnboardingChallengePage() {
  const navigate = useNavigate()
  const updateOnboarding = useUpdateOnboarding()
  const [selected, setSelected] = useState<PrimaryChallenge | null>(null)

  const handleContinue = async () => {
    if (!selected) return
    await updateOnboarding.mutateAsync({
      current_step: 'assessment',
      primary_challenge: selected,
    })
    navigate('/onboarding/assessment')
  }

  return (
    <OnboardingLayout step={2} totalSteps={5}>
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-kalkvit mb-3">
          What's your primary challenge?
        </h1>
        <p className="text-kalkvit/60 text-lg">
          This helps us recommend the right starting point for your journey.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {CHALLENGES.map((challenge) => {
          const Icon = challenge.icon
          const isSelected = selected === challenge.id
          return (
            <button
              key={challenge.id}
              onClick={() => setSelected(challenge.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-koppar/10 border-koppar/40 ring-1 ring-koppar/20'
                  : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-koppar/20' : 'bg-white/[0.05]'
                }`}>
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-koppar' : 'text-kalkvit/40'}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${isSelected ? 'text-kalkvit' : 'text-kalkvit/80'}`}>
                    {challenge.label}
                  </h3>
                  <p className="text-kalkvit/50 text-sm mt-0.5">{challenge.description}</p>
                  <span className="text-kalkvit/30 text-xs mt-1 inline-block">
                    Pillar: {challenge.pillar}
                  </span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center ${
                  isSelected ? 'border-koppar bg-koppar' : 'border-white/20'
                }`}>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-charcoal" />
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end">
        <GlassButton
          variant="primary"
          onClick={handleContinue}
          disabled={!selected || updateOnboarding.isPending}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </GlassButton>
      </div>
    </OnboardingLayout>
  )
}

export default OnboardingChallengePage
