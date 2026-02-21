import { Link, Navigate } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge } from '../components/ui'
import { PILLARS, ARCHETYPES } from '../lib/constants'
import { useLatestAssessmentResult } from '../lib/api/hooks/useAssessments'
import {
  ClipboardCheck,
  Clock,
  Target,
  Brain,
  Heart,
  Users,
  Compass,
  ArrowRight,
  Sparkles,
  Loader2,
} from 'lucide-react'

const pillarIcons = {
  identity: Compass,
  emotional: Brain,
  physical: Heart,
  connection: Users,
  mission: Target,
}

export function AssessmentPage() {
  const { data: latestResult, isLoading } = useLatestAssessmentResult()

  // Show loading while checking for existing results
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-koppar" />
        </div>
      </MainLayout>
    )
  }

  // If user already has results, redirect to results page
  if (latestResult) {
    return <Navigate to="/assessment/results" replace />
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <GlassCard variant="elevated" className="mb-8">
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-2xl bg-koppar/20 flex items-center justify-center mx-auto mb-6">
              <ClipboardCheck className="w-10 h-10 text-koppar" />
            </div>
            <h1 className="font-display text-4xl font-bold text-kalkvit mb-4">
              Discover Your Archetype
            </h1>
            <p className="text-lg text-kalkvit/70 max-w-2xl mx-auto mb-6">
              Take the CLAIM'N assessment to uncover your unique archetype and get personalized
              insights across the five pillars of transformation.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-kalkvit/50 mb-8">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                5-7 minutes
              </span>
              <span>•</span>
              <span>30 questions</span>
              <span>•</span>
              <span>Instant results</span>
            </div>
            <Link to="/assessment/take">
              <GlassButton variant="primary" className="text-lg px-8 py-4">
                Start Assessment
                <ArrowRight className="w-5 h-5" />
              </GlassButton>
            </Link>
          </div>
        </GlassCard>

        {/* What You'll Discover */}
        <h2 className="font-serif text-2xl font-bold text-kalkvit mb-6">What You'll Discover</h2>

        {/* Archetypes Section */}
        <GlassCard variant="base" className="mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-koppar/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-koppar" />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold text-kalkvit mb-2">
                Your Primary Archetype
              </h3>
              <p className="text-kalkvit/60 mb-4">
                Discover which of the six archetypes best describes your approach to life,
                challenges, and growth.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {ARCHETYPES.map((archetype) => (
              <GlassBadge key={archetype} variant="koppar">
                {archetype}
              </GlassBadge>
            ))}
          </div>
        </GlassCard>

        {/* Pillars Section */}
        <GlassCard variant="base" className="mb-8">
          <h3 className="font-display text-xl font-semibold text-kalkvit mb-6">
            Five Pillar Scores
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(PILLARS).map(([id, pillar]) => {
              const Icon = pillarIcons[id as keyof typeof pillarIcons]
              return (
                <div
                  key={id}
                  className="p-4 rounded-xl bg-white/[0.04] border border-white/10 text-center"
                >
                  <div className="w-10 h-10 rounded-lg bg-koppar/20 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-koppar" />
                  </div>
                  <p className="text-sm font-medium text-kalkvit">{pillar.name}</p>
                </div>
              )
            })}
          </div>
        </GlassCard>

        {/* How It Works */}
        <h2 className="font-serif text-2xl font-bold text-kalkvit mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <GlassCard variant="base" className="text-center">
            <div className="w-12 h-12 rounded-full bg-koppar/20 flex items-center justify-center mx-auto mb-4">
              <span className="font-display text-xl font-bold text-koppar">1</span>
            </div>
            <h4 className="font-semibold text-kalkvit mb-2">Answer Questions</h4>
            <p className="text-sm text-kalkvit/60">
              Respond honestly to 30 questions about your preferences, behaviors, and aspirations.
            </p>
          </GlassCard>

          <GlassCard variant="base" className="text-center">
            <div className="w-12 h-12 rounded-full bg-koppar/20 flex items-center justify-center mx-auto mb-4">
              <span className="font-display text-xl font-bold text-koppar">2</span>
            </div>
            <h4 className="font-semibold text-kalkvit mb-2">Get Scored</h4>
            <p className="text-sm text-kalkvit/60">
              Our algorithm analyzes your responses to determine your archetype and pillar scores.
            </p>
          </GlassCard>

          <GlassCard variant="base" className="text-center">
            <div className="w-12 h-12 rounded-full bg-koppar/20 flex items-center justify-center mx-auto mb-4">
              <span className="font-display text-xl font-bold text-koppar">3</span>
            </div>
            <h4 className="font-semibold text-kalkvit mb-2">Receive Insights</h4>
            <p className="text-sm text-kalkvit/60">
              Get personalized recommendations based on your unique profile and growth areas.
            </p>
          </GlassCard>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/assessment/take">
            <GlassButton variant="primary" className="text-lg px-8 py-4">
              Begin Your Assessment
              <ArrowRight className="w-5 h-5" />
            </GlassButton>
          </Link>
        </div>
      </div>
    </MainLayout>
  )
}

export default AssessmentPage;
