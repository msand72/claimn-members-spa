import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge } from '../components/ui'
import { PILLARS } from '../lib/constants'
import type { PillarId } from '../lib/constants'
import {
  calculatePillarScores,
  determineArchetypesFromAnswers,
  generateSimpleMicroInsights,
  generateSimpleIntegrationInsights,
} from '../lib/assessment/scoring'
import { ASSESSMENT_QUESTIONS } from '../lib/assessment/questions'
import {
  Compass,
  Brain,
  Heart,
  Users,
  Target,
  ArrowRight,
  Download,
  Share2,
  Sparkles,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { cn } from '../lib/utils'

const PILLAR_ICONS: Record<PillarId, React.ReactNode> = {
  identity: <Compass className="w-5 h-5" />,
  emotional: <Brain className="w-5 h-5" />,
  physical: <Heart className="w-5 h-5" />,
  connection: <Users className="w-5 h-5" />,
  mission: <Target className="w-5 h-5" />,
}

interface AssessmentResults {
  pillarScores: Record<PillarId, number>
  archetypes: string[]
  answers: Record<string, number>
}

export function AssessmentResultsPage() {
  const navigate = useNavigate()
  const [results, setResults] = useState<AssessmentResults | null>(null)
  const [insights, setInsights] = useState<{
    micro: Record<PillarId, string>
    integration: string[]
  } | null>(null)

  useEffect(() => {
    // Get answers from sessionStorage
    const storedAnswers = sessionStorage.getItem('assessmentAnswers')
    if (!storedAnswers) {
      navigate('/assessment')
      return
    }

    const answers = JSON.parse(storedAnswers) as Record<string, number>

    // Calculate results
    const pillarScores = calculatePillarScores(answers, ASSESSMENT_QUESTIONS)
    const archetypes = determineArchetypesFromAnswers(answers, ASSESSMENT_QUESTIONS)

    setResults({
      pillarScores,
      archetypes,
      answers,
    })

    // Generate insights
    setInsights({
      micro: generateSimpleMicroInsights(pillarScores),
      integration: generateSimpleIntegrationInsights(pillarScores, archetypes),
    })
  }, [navigate])

  if (!results || !insights) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-koppar border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-kalkvit/60">Calculating your results...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Sort pillars by score for display
  const sortedPillars = Object.entries(results.pillarScores)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => id as PillarId)

  const strongestPillar = sortedPillars[0]
  const weakestPillar = sortedPillars[sortedPillars.length - 1]
  const overallScore = Math.round(
    Object.values(results.pillarScores).reduce((sum, score) => sum + score, 0) / 5
  )

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <GlassBadge variant="koppar" className="mb-4">
            <Sparkles className="w-4 h-4" />
            Assessment Complete
          </GlassBadge>
          <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">
            Your CLAIM'N Profile
          </h1>
          <p className="text-kalkvit/60">
            Here's what we learned about your current state and growth opportunities
          </p>
        </div>

        {/* Overall Score */}
        <GlassCard variant="elevated" className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-koppar/20 to-brandAmber/20 border-2 border-koppar mb-4">
            <span className="font-display text-4xl font-bold text-koppar">{overallScore}</span>
          </div>
          <h2 className="font-serif text-xl font-semibold text-kalkvit mb-2">
            Overall Wellbeing Score
          </h2>
          <p className="text-kalkvit/60 text-sm max-w-md mx-auto">
            {overallScore >= 80
              ? 'Excellent! You have a strong foundation across all pillars.'
              : overallScore >= 60
                ? 'Good progress! Some areas show strength while others offer growth opportunities.'
                : overallScore >= 40
                  ? 'Solid starting point. Focused work on key pillars will drive transformation.'
                  : 'Great potential for growth. Your journey starts here.'}
          </p>
        </GlassCard>

        {/* Archetype Section */}
        <GlassCard variant="base" className="mb-8">
          <h3 className="font-display text-lg font-semibold text-kalkvit mb-4">
            Your Primary Archetype{results.archetypes.length > 1 ? 's' : ''}
          </h3>
          <div className="flex flex-wrap gap-3 mb-4">
            {results.archetypes.map((archetype, index) => (
              <GlassBadge
                key={archetype}
                variant={index === 0 ? 'koppar' : 'default'}
                className="text-base py-2 px-4"
              >
                {archetype}
              </GlassBadge>
            ))}
          </div>
          <p className="text-kalkvit/60 text-sm">
            {results.archetypes.length === 1
              ? `You strongly identify as ${results.archetypes[0]}. This archetype shapes how you approach challenges and growth.`
              : `You show traits of multiple archetypes, with ${results.archetypes[0]} being your primary style. This versatility can be a strength.`}
          </p>
        </GlassCard>

        {/* Pillar Scores */}
        <div className="mb-8">
          <h3 className="font-display text-lg font-semibold text-kalkvit mb-4">
            Your Five Pillars
          </h3>
          <div className="space-y-4">
            {sortedPillars.map((pillarId) => {
              const pillar = PILLARS[pillarId]
              const score = results.pillarScores[pillarId]
              const isStrongest = pillarId === strongestPillar
              const isWeakest = pillarId === weakestPillar

              return (
                <GlassCard
                  key={pillarId}
                  variant={isStrongest ? 'accent' : 'base'}
                  className={cn(
                    'transition-all',
                    isStrongest && 'ring-1 ring-koppar/30'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'p-3 rounded-xl',
                        isStrongest
                          ? 'bg-koppar/20 text-koppar'
                          : 'bg-white/10 text-kalkvit/60'
                      )}
                    >
                      {PILLAR_ICONS[pillarId]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-kalkvit">{pillar.name}</h4>
                          {isStrongest && (
                            <GlassBadge variant="success" className="text-xs">
                              <TrendingUp className="w-3 h-3" />
                              Strongest
                            </GlassBadge>
                          )}
                          {isWeakest && (
                            <GlassBadge variant="warning" className="text-xs">
                              <AlertCircle className="w-3 h-3" />
                              Growth Area
                            </GlassBadge>
                          )}
                        </div>
                        <span
                          className={cn(
                            'font-display text-xl font-bold',
                            score >= 70 ? 'text-skogsgron' : score >= 40 ? 'text-koppar' : 'text-tegelrod'
                          )}
                        >
                          {score}
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            score >= 70
                              ? 'bg-skogsgron'
                              : score >= 40
                                ? 'bg-gradient-to-r from-koppar to-brandAmber'
                                : 'bg-tegelrod'
                          )}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <p className="text-sm text-kalkvit/60">{insights.micro[pillarId]}</p>
                    </div>
                  </div>
                </GlassCard>
              )
            })}
          </div>
        </div>

        {/* Integration Insights */}
        <GlassCard variant="elevated" className="mb-8">
          <h3 className="font-display text-lg font-semibold text-kalkvit mb-4">
            Key Insights
          </h3>
          <div className="space-y-3">
            {insights.integration.map((insight, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-koppar/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-koppar">{index + 1}</span>
                </div>
                <p className="text-kalkvit/80 text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Recommended Next Steps */}
        <GlassCard variant="base" className="mb-8">
          <h3 className="font-display text-lg font-semibold text-kalkvit mb-4">
            Recommended Next Steps
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/protocols">
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.04] hover:border-koppar/30 hover:bg-white/[0.06] transition-all">
                <h4 className="font-medium text-kalkvit mb-1">Start a Protocol</h4>
                <p className="text-sm text-kalkvit/60">
                  Begin with the {PILLARS[weakestPillar].name} protocol to address your growth area
                </p>
              </div>
            </Link>
            <Link to="/goals">
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.04] hover:border-koppar/30 hover:bg-white/[0.06] transition-all">
                <h4 className="font-medium text-kalkvit mb-1">Set Your Goals</h4>
                <p className="text-sm text-kalkvit/60">
                  Create measurable goals aligned with your assessment insights
                </p>
              </div>
            </Link>
            <Link to="/book-session">
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.04] hover:border-koppar/30 hover:bg-white/[0.06] transition-all">
                <h4 className="font-medium text-kalkvit mb-1">Book a Coaching Session</h4>
                <p className="text-sm text-kalkvit/60">
                  Get personalized guidance from an expert coach
                </p>
              </div>
            </Link>
            <Link to="/network">
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.04] hover:border-koppar/30 hover:bg-white/[0.06] transition-all">
                <h4 className="font-medium text-kalkvit mb-1">Connect with Others</h4>
                <p className="text-sm text-kalkvit/60">
                  Find members with shared interests and goals
                </p>
              </div>
            </Link>
          </div>
        </GlassCard>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/">
            <GlassButton variant="primary">
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </GlassButton>
          </Link>
          <GlassButton variant="secondary">
            <Download className="w-4 h-4" />
            Download Report
          </GlassButton>
          <GlassButton variant="ghost">
            <Share2 className="w-4 h-4" />
            Share Results
          </GlassButton>
        </div>
      </div>
    </MainLayout>
  )
}
