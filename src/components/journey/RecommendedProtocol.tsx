import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, CheckCircle2, ArrowRight, Clock, Compass } from 'lucide-react'
import { GlassCard, GlassButton, GlassBadge } from '../ui'
import { useProtocolTemplate, useStartProtocol } from '../../lib/api/hooks'
import { PILLARS, type PillarId } from '../../lib/constants'

interface RecommendedProtocolProps {
  protocolSlug: string
}

export function RecommendedProtocol({ protocolSlug }: RecommendedProtocolProps) {
  const { data: template, isLoading, isError } = useProtocolTemplate(protocolSlug)
  const startProtocol = useStartProtocol()
  const [started, setStarted] = useState(false)

  const handleStart = () => {
    startProtocol.mutate(
      {
        protocol_slug: protocolSlug,
        protocol_name: template?.title || protocolSlug,
        pillar: template?.pillar,
        duration_weeks: template?.duration_weeks,
      },
      {
        onSuccess: () => {
          setStarted(true)
        },
      }
    )
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <GlassCard className="animate-pulse">
        <div className="h-4 w-32 bg-white/10 rounded mb-3" />
        <div className="h-3 w-48 bg-white/10 rounded mb-2" />
        <div className="h-3 w-40 bg-white/10 rounded" />
      </GlassCard>
    )
  }

  // Error or missing template — render nothing
  if (isError || !template) return null

  const pillarId = template.pillar as PillarId
  const pillar = pillarId in PILLARS ? PILLARS[pillarId] : null

  // Success state after starting
  if (started) {
    return (
      <GlassCard>
        <div className="flex flex-col items-center text-center py-4 gap-3">
          <CheckCircle2 className="w-10 h-10 text-koppar" />
          <h4 className="font-display text-lg font-semibold text-kalkvit">
            Protocol Started!
          </h4>
          <p className="text-kalkvit/60 text-sm max-w-xs">
            {template.title} has been added to your journey. Good luck!
          </p>
          <Link to={`/protocols/${protocolSlug}`}>
            <GlassButton variant="primary" className="mt-2">
              Go to Protocol <ArrowRight className="w-4 h-4 ml-1" />
            </GlassButton>
          </Link>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-3">
        <Compass className="w-4 h-4 text-koppar" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-kalkvit/40">
          Recommended Protocol
        </span>
      </div>

      <h4 className="font-display text-lg font-semibold text-kalkvit mb-2">
        {template.title}
      </h4>

      <div className="flex items-center gap-2 mb-3">
        {pillar && (
          <GlassBadge variant="koppar">{pillar.name}</GlassBadge>
        )}
        {template.duration_weeks && (
          <span className="flex items-center gap-1 text-kalkvit/50 text-xs">
            <Clock className="w-3.5 h-3.5" />
            {template.duration_weeks} weeks
          </span>
        )}
      </div>

      {template.description && (
        <p className="text-kalkvit/60 text-sm mb-4 line-clamp-2">
          {template.description}
        </p>
      )}

      <div className="flex items-center gap-3">
        <GlassButton
          variant="primary"
          onClick={handleStart}
          disabled={startProtocol.isPending}
        >
          {startProtocol.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Starting...
            </>
          ) : (
            'Start Protocol'
          )}
        </GlassButton>

        <Link to={`/protocols/${protocolSlug}`}>
          <GlassButton variant="secondary">
            View Details
          </GlassButton>
        </Link>
      </div>

      {startProtocol.isError && (
        <p className="text-tegelrod text-xs mt-3">
          Failed to start protocol. Please try again.
        </p>
      )}
    </GlassCard>
  )
}

export default RecommendedProtocol
