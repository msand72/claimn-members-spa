import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassInput, GlassBadge } from '../components/ui'
import { usePrograms, useEnrolledPrograms, useEnrollProgram } from '../lib/api/hooks'
import type { Program, UserProgram } from '../lib/api/types'
import {
  Search,
  Clock,
  Users,
  CheckCircle,
  Play,
  Lock,
  Trophy,
  ArrowRight,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '../lib/utils'

const categories = ['All', 'My Programs', 'Foundation', 'Leadership', 'Mindset', 'Business', 'Finance']

const difficultyColors = {
  Beginner: 'success',
  Intermediate: 'warning',
  Advanced: 'error',
} as const

function ProgramCard({
  program,
  userProgram,
  onEnroll,
  isEnrolling,
}: {
  program: Program
  userProgram?: UserProgram
  onEnroll: (programId: string) => void
  isEnrolling: boolean
}) {
  const isEnrolled = !!userProgram
  const progress = userProgram?.progress || 0

  return (
    <GlassCard
      variant={isEnrolled ? 'accent' : 'base'}
      leftBorder={false}
      className={cn(
        'group transition-all',
        program.is_locked ? 'opacity-75' : 'hover:border-koppar/30'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-2">
          <GlassBadge variant="koppar">{program.category}</GlassBadge>
          <GlassBadge variant={difficultyColors[program.difficulty]}>
            {program.difficulty}
          </GlassBadge>
        </div>
        {program.is_locked && <Lock className="w-5 h-5 text-kalkvit/40" />}
        {isEnrolled && !program.is_locked && <GlassBadge variant="success">Enrolled</GlassBadge>}
      </div>

      <h3 className="font-display text-lg font-semibold text-kalkvit mb-2 group-hover:text-koppar transition-colors">
        {program.name}
      </h3>
      <p className="text-sm text-kalkvit/60 mb-4 line-clamp-2">{program.description}</p>

      <div className="flex items-center gap-4 text-sm text-kalkvit/50 mb-4">
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {program.duration}
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          {program.modules} modules
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {(program.enrolled_count ?? 0).toLocaleString()}
        </span>
      </div>

      {isEnrolled && progress > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-kalkvit/60">Progress</span>
            <span className="text-koppar font-semibold">{progress}%</span>
          </div>
          <div className="h-2 bg-white/[0.1] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-koppar to-brand-amber rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {program.is_locked ? (
        <GlassButton variant="ghost" className="w-full" disabled>
          <Lock className="w-4 h-4" />
          Unlock with Premium
        </GlassButton>
      ) : isEnrolled ? (
        <Link to="/programs">
          <GlassButton variant="primary" className="w-full">
            <Play className="w-4 h-4" />
            Continue Learning
          </GlassButton>
        </Link>
      ) : (
        <GlassButton
          variant="secondary"
          className="w-full"
          onClick={() => onEnroll(program.id)}
          disabled={isEnrolling}
        >
          {isEnrolling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Start Program
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </GlassButton>
      )}
    </GlassCard>
  )
}

export function ProgramsPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [enrollingProgramId, setEnrollingProgramId] = useState<string | null>(null)

  const {
    data: programsData,
    isLoading: isLoadingPrograms,
    error: programsError,
  } = usePrograms({
    category:
      activeCategory !== 'All' && activeCategory !== 'My Programs' ? activeCategory : undefined,
    search: searchQuery || undefined,
  })

  const { data: enrolledData, isLoading: isLoadingEnrolled } = useEnrolledPrograms()
  const enrollMutation = useEnrollProgram()

  const programs = Array.isArray(programsData?.data) ? programsData.data : []
  const enrolledPrograms = Array.isArray(enrolledData?.data) ? enrolledData.data : []

  const enrolledProgramIds = new Set(enrolledPrograms.map((ep) => ep.program_id))

  const handleEnroll = async (programId: string) => {
    setEnrollingProgramId(programId)
    try {
      await enrollMutation.mutateAsync({ program_id: programId })
    } finally {
      setEnrollingProgramId(null)
    }
  }

  const filteredPrograms =
    activeCategory === 'My Programs'
      ? programs.filter((p) => enrolledProgramIds.has(p.id))
      : programs.filter(
          (p) =>
            (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
        )

  const myPrograms = programs.filter((p) => enrolledProgramIds.has(p.id))
  const totalProgress =
    enrolledPrograms.length > 0
      ? Math.round(
          enrolledPrograms.reduce((acc, p) => acc + (p.progress || 0), 0) / enrolledPrograms.length
        )
      : 0

  const isLoading = isLoadingPrograms || isLoadingEnrolled
  const error = programsError

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto">
          <GlassCard variant="base" className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-tegelrod mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">Failed to load programs</h3>
            <p className="text-kalkvit/50 text-sm">
              Please try refreshing the page or check your connection.
            </p>
          </GlassCard>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">Programs</h1>
            <p className="text-kalkvit/60">Structured learning paths to accelerate your growth</p>
          </div>
          <div className="flex gap-4">
            <GlassCard variant="base" leftBorder={false} className="px-6 py-3 text-center">
              <p className="text-sm text-kalkvit/60">Enrolled</p>
              <p className="font-display text-2xl font-bold text-kalkvit">
                {isLoading ? '-' : myPrograms.length}
              </p>
            </GlassCard>
            <GlassCard variant="accent" leftBorder={false} className="px-6 py-3 text-center">
              <p className="text-sm text-kalkvit/60">Avg Progress</p>
              <p className="font-display text-2xl font-bold text-kalkvit">
                {isLoading ? '-' : `${totalProgress}%`}
              </p>
            </GlassCard>
          </div>
        </div>

        {/* Search and Categories */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kalkvit/40" />
            <GlassInput
              placeholder="Search programs..."
              className="pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                activeCategory === category
                  ? 'bg-koppar text-kalkvit'
                  : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1] hover:text-kalkvit'
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-koppar animate-spin" />
          </div>
        ) : (
          <>
            {/* Continue Learning Section */}
            {activeCategory === 'All' && myPrograms.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-koppar" />
                  <h2 className="font-serif text-xl font-semibold text-kalkvit">
                    Continue Learning
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myPrograms.map((program) => (
                    <ProgramCard
                      key={program.id}
                      program={program}
                      userProgram={enrolledPrograms.find((ep) => ep.program_id === program.id)}
                      onEnroll={handleEnroll}
                      isEnrolling={enrollingProgramId === program.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Programs */}
            <div>
              <h2 className="font-serif text-xl font-semibold text-kalkvit mb-4">
                {activeCategory === 'My Programs'
                  ? 'My Programs'
                  : activeCategory === 'All'
                    ? 'Explore Programs'
                    : activeCategory}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPrograms
                  .filter((p) => activeCategory !== 'All' || !enrolledProgramIds.has(p.id))
                  .map((program) => (
                    <ProgramCard
                      key={program.id}
                      program={program}
                      userProgram={enrolledPrograms.find((ep) => ep.program_id === program.id)}
                      onEnroll={handleEnroll}
                      isEnrolling={enrollingProgramId === program.id}
                    />
                  ))}
              </div>
            </div>

            {filteredPrograms.length === 0 && (
              <div className="text-center py-12">
                <p className="text-kalkvit/60">No programs found matching your criteria.</p>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}

export default ProgramsPage;
