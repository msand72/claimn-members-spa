import { useState } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassInput, GlassBadge } from '../components/ui'
import { Search, Clock, Users, CheckCircle, Play, Lock, Trophy, ArrowRight } from 'lucide-react'
import { cn } from '../lib/utils'

interface Program {
  id: number
  name: string
  description: string
  duration: string
  modules: number
  enrolled: number
  progress?: number
  category: string
  isEnrolled: boolean
  isLocked?: boolean
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
}

const mockPrograms: Program[] = [
  {
    id: 1,
    name: '30-Day Transformation Protocol',
    description: 'A comprehensive program covering fitness, nutrition, and mindset to kickstart your transformation journey.',
    duration: '30 days',
    modules: 12,
    enrolled: 1247,
    progress: 65,
    category: 'Foundation',
    isEnrolled: true,
    difficulty: 'Beginner',
  },
  {
    id: 2,
    name: 'Leadership Mastery',
    description: 'Develop essential leadership skills through practical exercises and real-world applications.',
    duration: '8 weeks',
    modules: 16,
    enrolled: 543,
    progress: 30,
    category: 'Leadership',
    isEnrolled: true,
    difficulty: 'Intermediate',
  },
  {
    id: 3,
    name: 'Mindset & Mental Resilience',
    description: 'Build unshakeable mental fortitude through stoic philosophy and modern psychology techniques.',
    duration: '6 weeks',
    modules: 10,
    enrolled: 892,
    category: 'Mindset',
    isEnrolled: false,
    difficulty: 'Beginner',
  },
  {
    id: 4,
    name: 'Business Growth Accelerator',
    description: 'Scale your business with proven strategies from successful entrepreneurs and mentors.',
    duration: '12 weeks',
    modules: 24,
    enrolled: 324,
    category: 'Business',
    isEnrolled: false,
    difficulty: 'Advanced',
  },
  {
    id: 5,
    name: 'Peak Performance Protocol',
    description: 'Optimize every aspect of your life - sleep, nutrition, exercise, and productivity.',
    duration: '8 weeks',
    modules: 14,
    enrolled: 678,
    category: 'Performance',
    isEnrolled: false,
    isLocked: true,
    difficulty: 'Intermediate',
  },
  {
    id: 6,
    name: 'Financial Freedom Blueprint',
    description: 'Master personal finance, investing, and wealth-building strategies.',
    duration: '10 weeks',
    modules: 18,
    enrolled: 456,
    category: 'Finance',
    isEnrolled: false,
    difficulty: 'Intermediate',
  },
]

const categories = ['All', 'My Programs', 'Foundation', 'Leadership', 'Mindset', 'Business', 'Finance']

const difficultyColors = {
  Beginner: 'success',
  Intermediate: 'warning',
  Advanced: 'error',
} as const

function ProgramCard({ program }: { program: Program }) {
  return (
    <GlassCard
      variant={program.isEnrolled ? 'accent' : 'base'}
      leftBorder={false}
      className={cn(
        'group transition-all',
        program.isLocked ? 'opacity-75' : 'hover:border-koppar/30'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-2">
          <GlassBadge variant="koppar">{program.category}</GlassBadge>
          <GlassBadge variant={difficultyColors[program.difficulty]}>{program.difficulty}</GlassBadge>
        </div>
        {program.isLocked && (
          <Lock className="w-5 h-5 text-kalkvit/40" />
        )}
        {program.isEnrolled && !program.isLocked && (
          <GlassBadge variant="success">Enrolled</GlassBadge>
        )}
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
          {program.enrolled.toLocaleString()}
        </span>
      </div>

      {program.isEnrolled && program.progress !== undefined && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-kalkvit/60">Progress</span>
            <span className="text-koppar font-semibold">{program.progress}%</span>
          </div>
          <div className="h-2 bg-white/[0.1] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-koppar to-brand-amber rounded-full transition-all"
              style={{ width: `${program.progress}%` }}
            />
          </div>
        </div>
      )}

      <GlassButton
        variant={program.isEnrolled ? 'primary' : program.isLocked ? 'ghost' : 'secondary'}
        className="w-full"
        disabled={program.isLocked}
      >
        {program.isLocked ? (
          <>
            <Lock className="w-4 h-4" />
            Unlock with Premium
          </>
        ) : program.isEnrolled ? (
          <>
            <Play className="w-4 h-4" />
            Continue Learning
          </>
        ) : (
          <>
            Start Program
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </GlassButton>
    </GlassCard>
  )
}

export function ProgramsPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPrograms = mockPrograms.filter((program) => {
    const matchesSearch = program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.description.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeCategory === 'All') return matchesSearch
    if (activeCategory === 'My Programs') return matchesSearch && program.isEnrolled
    return matchesSearch && program.category === activeCategory
  })

  const myPrograms = mockPrograms.filter(p => p.isEnrolled)
  const totalProgress = myPrograms.length > 0
    ? Math.round(myPrograms.reduce((acc, p) => acc + (p.progress || 0), 0) / myPrograms.length)
    : 0

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Programs</h1>
            <p className="text-kalkvit/60">Structured learning paths to accelerate your growth</p>
          </div>
          <div className="flex gap-4">
            <GlassCard variant="base" leftBorder={false} className="px-6 py-3 text-center">
              <p className="text-sm text-kalkvit/60">Enrolled</p>
              <p className="font-display text-2xl font-bold text-kalkvit">{myPrograms.length}</p>
            </GlassCard>
            <GlassCard variant="accent" leftBorder={false} className="px-6 py-3 text-center">
              <p className="text-sm text-kalkvit/60">Avg Progress</p>
              <p className="font-display text-2xl font-bold text-kalkvit">{totalProgress}%</p>
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

        {/* Continue Learning Section */}
        {activeCategory === 'All' && myPrograms.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-koppar" />
              <h2 className="font-display text-xl font-semibold text-kalkvit">Continue Learning</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myPrograms.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          </div>
        )}

        {/* All Programs */}
        <div>
          <h2 className="font-display text-xl font-semibold text-kalkvit mb-4">
            {activeCategory === 'My Programs' ? 'My Programs' : activeCategory === 'All' ? 'Explore Programs' : activeCategory}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms
              .filter(p => activeCategory !== 'All' || !p.isEnrolled)
              .map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
          </div>
        </div>

        {filteredPrograms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-kalkvit/60">No programs found matching your criteria.</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
