import { useState } from 'react'
import { GlassCard, GlassButton, GlassBadge } from '../ui'
import { GlassInput } from '../ui/GlassInput'
import { useSessionPulse, useSubmitSessionPulse } from '../../lib/api/hooks'
import { is404Error } from '../../lib/api/client'
import { cn } from '../../lib/utils'
import { Loader2, Heart } from 'lucide-react'

interface SessionPulseFormProps {
  eventId: string
}

function ScaleButtons({
  label,
  anchors,
  min,
  max,
  value,
  onChange,
}: {
  label: string
  anchors: [string, string]
  min: number
  max: number
  value: number | undefined
  onChange: (val: number) => void
}) {
  const points = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div>
      <label className="block text-sm font-medium text-kalkvit/80 mb-2">{label}</label>
      <div className="flex gap-2 flex-wrap">
        {points.map((point) => (
          <button
            key={point}
            type="button"
            onClick={() => onChange(point)}
            className={cn(
              'w-10 h-10 rounded-xl text-sm font-medium transition-all',
              value === point
                ? 'bg-koppar text-white shadow-lg shadow-koppar/20'
                : 'bg-white/[0.06] text-kalkvit/60 hover:bg-white/[0.1] hover:text-kalkvit'
            )}
          >
            {point}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-kalkvit/40">{anchors[0]}</span>
        <span className="text-[10px] text-kalkvit/40">{anchors[1]}</span>
      </div>
    </div>
  )
}

export function SessionPulseForm({ eventId }: SessionPulseFormProps) {
  const { data: existingPulse, error: pulseError, isLoading } = useSessionPulse(eventId)
  const submitMutation = useSubmitSessionPulse()

  const [energy, setEnergy] = useState<number | undefined>()
  const [stress, setStress] = useState<number | undefined>()
  const [sleepHours, setSleepHours] = useState<string>('')

  const hasExistingPulse = existingPulse && !is404Error(pulseError)
  const allFilled = energy !== undefined && stress !== undefined && sleepHours !== ''
  const parsedSleep = parseFloat(sleepHours)

  const handleSubmit = () => {
    if (!allFilled || isNaN(parsedSleep)) return
    submitMutation.mutate({
      eventId,
      data: { energy: energy!, stress: stress!, sleep_hours: parsedSleep },
    })
  }

  if (isLoading) {
    return (
      <GlassCard variant="base">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 text-koppar animate-spin" />
        </div>
      </GlassCard>
    )
  }

  // Already submitted — show read-only summary
  if (hasExistingPulse || submitMutation.isSuccess) {
    const pulse = existingPulse || {
      energy,
      stress,
      sleep_hours: parsedSleep,
    }

    return (
      <GlassCard variant="base">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-kalkvit flex items-center gap-2">
            <Heart className="w-4 h-4 text-koppar" />
            Vitality Check-in
          </h2>
          <GlassBadge variant="success">Completed</GlassBadge>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xl font-bold text-koppar">{pulse.energy}</p>
            <p className="text-[10px] text-kalkvit/50">Energy</p>
          </div>
          <div>
            <p className="text-xl font-bold text-koppar">{pulse.stress}</p>
            <p className="text-[10px] text-kalkvit/50">Stress</p>
          </div>
          <div>
            <p className="text-xl font-bold text-koppar">{pulse.sleep_hours}h</p>
            <p className="text-[10px] text-kalkvit/50">Sleep</p>
          </div>
        </div>
      </GlassCard>
    )
  }

  // Form
  return (
    <GlassCard variant="base">
      <h2 className="font-display text-lg font-semibold text-kalkvit mb-1 flex items-center gap-2">
        <Heart className="w-4 h-4 text-koppar" />
        Session Vitality Check-in
      </h2>
      <p className="text-xs text-kalkvit/50 mb-5">
        Three numbers. Takes less time than checking your phone.
      </p>

      <div className="space-y-5">
        <ScaleButtons
          label="I feel energized"
          anchors={['Not at all', 'Very much']}
          min={1}
          max={7}
          value={energy}
          onChange={setEnergy}
        />

        <ScaleButtons
          label="My stress level this week"
          anchors={['Very low', 'Very high']}
          min={1}
          max={10}
          value={stress}
          onChange={setStress}
        />

        <GlassInput
          type="number"
          label="Hours of sleep last night"
          placeholder="e.g. 7.5"
          value={sleepHours}
          onChange={(e) => setSleepHours(e.target.value)}
          min={0}
          max={14}
          step={0.5}
        />
      </div>

      {submitMutation.isError && (
        <p className="text-sm text-tegelrod mt-3">Failed to submit. Please try again.</p>
      )}

      <GlassButton
        variant="primary"
        className="w-full mt-5"
        onClick={handleSubmit}
        disabled={!allFilled || submitMutation.isPending}
      >
        {submitMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : null}
        Submit Check-in
      </GlassButton>
    </GlassCard>
  )
}
