import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassBadge } from '../components/ui'
import { ArrowRight, Sparkles, BookOpen, Users, UserCheck, GraduationCap, Loader2 } from 'lucide-react'
import { useProtocols, useCircles, useExperts, usePrograms } from '../lib/api/hooks'

interface ShopSection {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  link: string
  linkText: string
  count?: number
  isLoading?: boolean
}

function ShopSectionCard({ section }: { section: ShopSection }) {
  return (
    <GlassCard
      variant="base"
      leftBorder={false}
      className="group cursor-pointer hover:scale-[1.02] transition-all duration-200 hover:border-koppar/30"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-koppar/20 flex items-center justify-center flex-shrink-0">
          {section.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-lg font-semibold text-kalkvit group-hover:text-koppar transition-colors">
              {section.title}
            </h3>
            {section.isLoading ? (
              <Loader2 className="w-4 h-4 text-kalkvit/40 animate-spin" />
            ) : section.count !== undefined ? (
              <GlassBadge variant="default" className="text-xs">
                {section.count} available
              </GlassBadge>
            ) : null}
          </div>
          <p className="text-sm text-kalkvit/60 mb-4">{section.description}</p>
          <Link to={section.link}>
            <GlassButton variant="secondary" className="group-hover:bg-koppar group-hover:border-koppar">
              {section.linkText}
              <ArrowRight className="w-4 h-4" />
            </GlassButton>
          </Link>
        </div>
      </div>
    </GlassCard>
  )
}

export function ShopPage() {
  // Fetch data from available API endpoints
  const { data: protocols, isLoading: protocolsLoading } = useProtocols()
  const { data: circlesData, isLoading: circlesLoading } = useCircles({ limit: 1 })
  const { data: expertsData, isLoading: expertsLoading } = useExperts({ limit: 1 })
  const { data: programsData, isLoading: programsLoading } = usePrograms({ limit: 1 })

  const shopSections: ShopSection[] = [
    {
      id: 'protocols',
      title: 'Protocols',
      description: 'Structured daily practices for transformation. Follow proven frameworks for physical fitness, mental clarity, and personal growth.',
      icon: <BookOpen className="w-7 h-7 text-koppar" />,
      link: '/shop/protocols',
      linkText: 'Browse Protocols',
      count: protocols?.length,
      isLoading: protocolsLoading,
    },
    {
      id: 'circles',
      title: 'Circles',
      description: 'Join exclusive communities of high-achievers. Connect with like-minded individuals, share experiences, and grow together.',
      icon: <Users className="w-7 h-7 text-koppar" />,
      link: '/shop/circles',
      linkText: 'Explore Circles',
      count: circlesData?.pagination?.total,
      isLoading: circlesLoading,
    },
    {
      id: 'coaching',
      title: 'Expert Coaching',
      description: 'Book 1-on-1 sessions with certified coaches. Get personalized guidance tailored to your specific challenges and goals.',
      icon: <UserCheck className="w-7 h-7 text-koppar" />,
      link: '/experts',
      linkText: 'Find a Coach',
      count: expertsData?.pagination?.total,
      isLoading: expertsLoading,
    },
    {
      id: 'programs',
      title: 'Programs & Courses',
      description: 'Deep-dive learning experiences. Multi-week programs covering mindset mastery, leadership, and life optimization.',
      icon: <GraduationCap className="w-7 h-7 text-koppar" />,
      link: '/programs',
      linkText: 'View Programs',
      count: programsData?.pagination?.total,
      isLoading: programsLoading,
    },
  ]

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">Shop</h1>
            <p className="text-kalkvit/60">Protocols, courses, and resources to accelerate your growth</p>
          </div>
          <Link to="/shop/upgrade">
            <GlassButton variant="primary">
              <Sparkles className="w-4 h-4" />
              Upgrade Membership
              <ArrowRight className="w-4 h-4" />
            </GlassButton>
          </Link>
        </div>

        {/* Shop Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {shopSections.map((section) => (
            <ShopSectionCard key={section.id} section={section} />
          ))}
        </div>

      </div>
    </MainLayout>
  )
}

export default ShopPage;
