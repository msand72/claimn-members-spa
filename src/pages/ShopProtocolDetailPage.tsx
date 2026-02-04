import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassAvatar, GlassBadge, GlassAlert } from '../components/ui'
import { useCheckout } from '../lib/api/hooks'
import {
  ArrowLeft,
  Clock,
  Users,
  Star,
  CheckCircle,
  Lock,
  Play,
  FileText,
  Award,
  ChevronRight,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { cn } from '../lib/utils'

interface Module {
  id: number
  title: string
  duration: string
  lessons: number
  isLocked: boolean
  isCompleted: boolean
}

interface Protocol {
  slug: string
  title: string
  tagline: string
  description: string
  category: string
  duration: string
  enrolledCount: number
  rating: number
  reviews: number
  price: number
  originalPrice?: number
  isPurchased: boolean
  modules: Module[]
  outcomes: string[]
  requirements: string[]
  instructor: {
    name: string
    initials: string
    title: string
    bio: string
  }
  testimonials: {
    author: string
    initials: string
    rating: number
    text: string
  }[]
}

const mockProtocol: Protocol = {
  slug: 'morning-mastery',
  title: 'Morning Mastery Protocol',
  tagline: 'Transform your mornings, transform your life',
  description:
    'This comprehensive 4-week protocol will help you build an unshakeable morning routine that sets you up for success every single day. Based on the latest research in habit formation and peak performance, you\'ll learn exactly how to structure your first hours for maximum energy, focus, and productivity.',
  category: 'Habits',
  duration: '4 weeks',
  enrolledCount: 1247,
  rating: 4.9,
  reviews: 312,
  price: 0,
  isPurchased: true,
  modules: [
    { id: 1, title: 'Foundation: Understanding Your Chronotype', duration: '45 min', lessons: 4, isLocked: false, isCompleted: true },
    { id: 2, title: 'The Wake-Up Protocol', duration: '60 min', lessons: 5, isLocked: false, isCompleted: true },
    { id: 3, title: 'Building Your Morning Stack', duration: '90 min', lessons: 6, isLocked: false, isCompleted: false },
    { id: 4, title: 'Movement & Energy', duration: '45 min', lessons: 4, isLocked: false, isCompleted: false },
    { id: 5, title: 'Mindfulness & Focus', duration: '60 min', lessons: 5, isLocked: false, isCompleted: false },
    { id: 6, title: 'Nutrition & Hydration', duration: '45 min', lessons: 4, isLocked: false, isCompleted: false },
    { id: 7, title: 'The Planning Hour', duration: '60 min', lessons: 5, isLocked: false, isCompleted: false },
    { id: 8, title: 'Habit Stacking Mastery', duration: '75 min', lessons: 6, isLocked: false, isCompleted: false },
    { id: 9, title: 'Troubleshooting & Optimization', duration: '45 min', lessons: 4, isLocked: false, isCompleted: false },
    { id: 10, title: 'Weekend Protocols', duration: '30 min', lessons: 3, isLocked: false, isCompleted: false },
    { id: 11, title: 'Travel & Disruption Recovery', duration: '45 min', lessons: 4, isLocked: false, isCompleted: false },
    { id: 12, title: 'Graduation & Next Steps', duration: '30 min', lessons: 3, isLocked: false, isCompleted: false },
  ],
  outcomes: [
    'Wake up energized without hitting snooze',
    'Complete a powerful morning routine in under 90 minutes',
    'Maintain consistency even on weekends',
    'Handle disruptions and get back on track quickly',
    'Stack habits effectively for compound results',
  ],
  requirements: [
    'Willingness to wake up 30-60 minutes earlier',
    'Commitment to daily practice for 4 weeks',
    'Basic journaling supplies',
  ],
  instructor: {
    name: 'Michael Chen',
    initials: 'MC',
    title: 'Performance Coach',
    bio: 'Michael has helped over 5,000 professionals optimize their morning routines. Former tech executive turned coach, he brings a practical, results-focused approach to habit formation.',
  },
  testimonials: [
    {
      author: 'Sarah T.',
      initials: 'ST',
      rating: 5,
      text: 'This protocol completely changed my relationship with mornings. I went from dreading my alarm to genuinely looking forward to my morning routine.',
    },
    {
      author: 'David W.',
      initials: 'DW',
      rating: 5,
      text: 'The most practical course I\'ve taken. No fluff, just actionable strategies that work. My productivity has increased significantly.',
    },
  ],
}

function ModuleCard({ module, index }: { module: Module; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      className={cn(
        'border border-white/10 rounded-xl overflow-hidden',
        module.isCompleted && 'border-skogsgron/30'
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              module.isCompleted
                ? 'bg-skogsgron text-kalkvit'
                : module.isLocked
                ? 'bg-white/[0.06] text-kalkvit/40'
                : 'bg-koppar/20 text-koppar'
            )}
          >
            {module.isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
          </div>
          <div className="text-left">
            <h4 className="font-medium text-kalkvit">{module.title}</h4>
            <p className="text-xs text-kalkvit/50">
              {module.lessons} lessons · {module.duration}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {module.isLocked && <Lock className="w-4 h-4 text-kalkvit/40" />}
          <ChevronDown
            className={cn(
              'w-5 h-5 text-kalkvit/50 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </div>
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/10">
          <div className="pt-4 space-y-2">
            {Array.from({ length: module.lessons }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-3">
                  <Play className="w-4 h-4 text-koppar" />
                  <span className="text-sm text-kalkvit/70">Lesson {i + 1}</span>
                </div>
                {!module.isLocked && (
                  <GlassButton variant="ghost" className="text-xs py-1 px-2">
                    {module.isCompleted || i < 2 ? 'Replay' : 'Start'}
                  </GlassButton>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function ShopProtocolDetailPage() {
  const { slug } = useParams()
  const checkout = useCheckout()
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // In real app, would fetch protocol based on slug
  const protocol = mockProtocol

  const handlePurchase = () => {
    setCheckoutError(null)
    checkout.mutate(
      { item_type: 'protocol', item_slug: slug },
      {
        onSuccess: (data) => {
          window.location.href = data.checkout_url
        },
        onError: () => {
          setCheckoutError('Failed to start checkout. Please try again.')
        },
      }
    )
  }

  const completedModules = protocol.modules.filter((m) => m.isCompleted).length
  const progress = Math.round((completedModules / protocol.modules.length) * 100)

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <Link
          to="/shop/protocols"
          className="inline-flex items-center gap-2 text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Protocols
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <GlassCard variant="elevated">
              <div className="flex items-start justify-between mb-4">
                <GlassBadge variant="koppar">{protocol.category}</GlassBadge>
                {protocol.isPurchased && (
                  <GlassBadge variant="success" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Enrolled
                  </GlassBadge>
                )}
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">
                {protocol.title}
              </h1>
              <p className="text-lg text-koppar mb-4">{protocol.tagline}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-kalkvit/60 mb-6">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {protocol.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {protocol.enrolledCount.toLocaleString()} enrolled
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-brand-amber fill-brand-amber" />
                  {protocol.rating} ({protocol.reviews} reviews)
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {protocol.modules.length} modules
                </span>
              </div>

              {protocol.isPurchased && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-kalkvit/60">Your Progress</span>
                    <span className="text-skogsgron font-medium">{progress}%</span>
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-skogsgron rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <p className="text-kalkvit/70">{protocol.description}</p>
            </GlassCard>

            {/* What You'll Learn */}
            <GlassCard variant="base">
              <h2 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-koppar" />
                What You'll Achieve
              </h2>
              <ul className="space-y-3">
                {protocol.outcomes.map((outcome, i) => (
                  <li key={i} className="flex items-start gap-3 text-kalkvit/70">
                    <CheckCircle className="w-5 h-5 text-skogsgron flex-shrink-0 mt-0.5" />
                    {outcome}
                  </li>
                ))}
              </ul>
            </GlassCard>

            {/* Curriculum */}
            <GlassCard variant="base">
              <h2 className="font-semibold text-kalkvit mb-4">Curriculum</h2>
              <div className="space-y-3">
                {protocol.modules.map((module, i) => (
                  <ModuleCard key={module.id} module={module} index={i} />
                ))}
              </div>
            </GlassCard>

            {/* Instructor */}
            <GlassCard variant="base">
              <h2 className="font-semibold text-kalkvit mb-4">Your Instructor</h2>
              <div className="flex items-start gap-4">
                <GlassAvatar initials={protocol.instructor.initials} size="lg" />
                <div>
                  <h3 className="font-semibold text-kalkvit">{protocol.instructor.name}</h3>
                  <p className="text-sm text-koppar mb-2">{protocol.instructor.title}</p>
                  <p className="text-sm text-kalkvit/70">{protocol.instructor.bio}</p>
                </div>
              </div>
            </GlassCard>

            {/* Testimonials */}
            <GlassCard variant="base">
              <h2 className="font-semibold text-kalkvit mb-4">What Students Say</h2>
              <div className="space-y-4">
                {protocol.testimonials.map((testimonial, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <GlassAvatar initials={testimonial.initials} size="sm" />
                      <div>
                        <p className="font-medium text-kalkvit text-sm">{testimonial.author}</p>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'w-3 h-3',
                                i < testimonial.rating
                                  ? 'text-brand-amber fill-brand-amber'
                                  : 'text-kalkvit/20'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-kalkvit/70 italic">"{testimonial.text}"</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <GlassCard variant="accent" leftBorder={false} className="sticky top-6">
              {protocol.isPurchased ? (
                <>
                  <div className="text-center mb-4">
                    <p className="text-skogsgron font-medium mb-2">You have access</p>
                    <p className="text-sm text-kalkvit/60">
                      Continue where you left off
                    </p>
                  </div>
                  <GlassButton variant="primary" className="w-full mb-3">
                    <Play className="w-4 h-4" />
                    Continue Learning
                  </GlassButton>
                  <Link to="/programs/sprints">
                    <GlassButton variant="secondary" className="w-full">
                      Join a Sprint
                      <ChevronRight className="w-4 h-4" />
                    </GlassButton>
                  </Link>
                </>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="font-display text-4xl font-bold text-kalkvit">
                        ${protocol.price}
                      </span>
                      {protocol.originalPrice && (
                        <span className="text-lg text-kalkvit/40 line-through">
                          ${protocol.originalPrice}
                        </span>
                      )}
                    </div>
                    {protocol.price === 0 && (
                      <p className="text-sm text-skogsgron mt-1">Included with membership</p>
                    )}
                  </div>
                  <GlassButton
                    variant="primary"
                    className="w-full"
                    onClick={handlePurchase}
                    disabled={checkout.isPending}
                  >
                    {checkout.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    {checkout.isPending ? 'Processing...' : 'Get Access'}
                  </GlassButton>
                  {checkoutError && (
                    <GlassAlert variant="error" className="mt-3">
                      {checkoutError}
                    </GlassAlert>
                  )}
                </>
              )}

              <div className="mt-6 pt-6 border-t border-white/10 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-kalkvit/60">
                  <CheckCircle className="w-4 h-4 text-skogsgron" />
                  Lifetime access
                </div>
                <div className="flex items-center gap-2 text-kalkvit/60">
                  <CheckCircle className="w-4 h-4 text-skogsgron" />
                  Certificate of completion
                </div>
                <div className="flex items-center gap-2 text-kalkvit/60">
                  <CheckCircle className="w-4 h-4 text-skogsgron" />
                  Community access
                </div>
                <div className="flex items-center gap-2 text-kalkvit/60">
                  <CheckCircle className="w-4 h-4 text-skogsgron" />
                  Sprint eligibility
                </div>
              </div>
            </GlassCard>

            {/* Requirements */}
            <GlassCard variant="base">
              <h3 className="font-semibold text-kalkvit mb-3">Requirements</h3>
              <ul className="space-y-2 text-sm text-kalkvit/60">
                {protocol.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-koppar">•</span>
                    {req}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default ShopProtocolDetailPage;
