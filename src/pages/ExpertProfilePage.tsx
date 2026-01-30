import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassAvatar, GlassBadge } from '../components/ui'
import {
  ArrowLeft,
  Star,
  Calendar,
  Clock,
  Users,
  Award,
  MessageCircle,
  Video,
  CheckCircle,
  MapPin,
  Briefcase,
  GraduationCap,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useExpert, useExpertTestimonials, useExpertAvailability } from '../lib/api/hooks/useExperts'

export function ExpertProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null)

  const { data: expert, isLoading, isError, refetch } = useExpert(id || '')
  const { data: testimonials } = useExpertTestimonials(id || '')
  const { data: availabilitySlots } = useExpertAvailability(id || '')

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-koppar" />
        </div>
      </MainLayout>
    )
  }

  if (isError || !expert) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <AlertTriangle className="w-8 h-8 text-tegelrod" />
          <p className="text-kalkvit/70">Failed to load expert profile.</p>
          <GlassButton variant="secondary" onClick={() => refetch()}>
            Try Again
          </GlassButton>
        </div>
      </MainLayout>
    )
  }

  const initials = expert.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <Link
          to="/experts"
          className="inline-flex items-center gap-2 text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Experts
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <GlassCard variant="elevated">
              <div className="flex items-start gap-6">
                <GlassAvatar initials={initials} size="xl" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="font-display text-2xl font-bold text-kalkvit mb-1">
                        {expert.name}
                      </h1>
                      <p className="text-koppar text-lg">{expert.title}</p>
                    </div>
                    <div className="flex items-center gap-1 text-brand-amber">
                      <Star className="w-5 h-5 fill-brand-amber" />
                      <span className="font-semibold">{expert.rating}</span>
                      <span className="text-kalkvit/50 text-sm">({expert.reviews_count} reviews)</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-kalkvit/60">
                    {expert.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {expert.location}
                      </span>
                    )}
                    {expert.experience && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {expert.experience}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {expert.total_sessions} sessions
                    </span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Link to={`/book-session?expert=${id}`}>
                      <GlassButton variant="primary">
                        <Calendar className="w-4 h-4" />
                        Book Session
                      </GlassButton>
                    </Link>
                    <GlassButton
                      variant="secondary"
                      onClick={() => navigate(`/messages?user=${id}`)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </GlassButton>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Bio */}
            <GlassCard variant="base">
              <h2 className="font-semibold text-kalkvit mb-4">About</h2>
              <p className="text-kalkvit/70 leading-relaxed">{expert.bio}</p>
            </GlassCard>

            {/* Specialties */}
            {expert.specialties.length > 0 && (
              <GlassCard variant="base">
                <h2 className="font-semibold text-kalkvit mb-4">Specialties</h2>
                <div className="flex flex-wrap gap-2">
                  {expert.specialties.map((specialty) => (
                    <GlassBadge key={specialty} variant="koppar">
                      {specialty}
                    </GlassBadge>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Certifications */}
            {expert.certifications.length > 0 && (
              <GlassCard variant="base">
                <h2 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-koppar" />
                  Certifications
                </h2>
                <ul className="space-y-3">
                  {expert.certifications.map((cert, i) => (
                    <li key={i} className="flex items-center gap-3 text-kalkvit/70">
                      <CheckCircle className="w-4 h-4 text-skogsgron flex-shrink-0" />
                      {cert}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}

            {/* Testimonials */}
            {testimonials && testimonials.length > 0 && (
              <GlassCard variant="base">
                <h2 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-brand-amber" />
                  Client Testimonials
                </h2>
                <div className="space-y-4">
                  {testimonials.map((testimonial) => {
                    const authorInitials = testimonial.author_name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                    return (
                      <div
                        key={testimonial.id}
                        className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <GlassAvatar initials={authorInitials} size="sm" />
                            <div>
                              <p className="font-medium text-kalkvit text-sm">{testimonial.author_name}</p>
                              <p className="text-xs text-kalkvit/50">
                                {new Date(testimonial.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
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
                        <p className="text-sm text-kalkvit/70 italic">"{testimonial.text}"</p>
                      </div>
                    )
                  })}
                </div>
              </GlassCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <GlassCard variant="accent" leftBorder={false}>
              <div className="text-center mb-4">
                <p className="text-sm text-kalkvit/60">Hourly Rate</p>
                <p className="font-display text-4xl font-bold text-kalkvit">${expert.hourly_rate}</p>
              </div>
              <div className="space-y-2 text-sm text-kalkvit/60">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-koppar" />
                  Video sessions included
                </div>
                {expert.availability && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-koppar" />
                    {expert.availability}
                  </div>
                )}
                {expert.languages.length > 0 && (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-koppar" />
                    {expert.languages.join(', ')}
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Quick Book */}
            {availabilitySlots && availabilitySlots.length > 0 && (
              <GlassCard variant="base">
                <h3 className="font-semibold text-kalkvit mb-4">Quick Book</h3>
                <div className="space-y-4">
                  {availabilitySlots.map((slot) => (
                    <div key={slot.date}>
                      <p className="text-sm text-kalkvit/60 mb-2">{slot.date}</p>
                      <div className="flex flex-wrap gap-2">
                        {slot.times.map((time) => (
                          <button
                            key={`${slot.date}-${time}`}
                            onClick={() => setSelectedSlot({ date: slot.date, time })}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                              selectedSlot?.date === slot.date && selectedSlot?.time === time
                                ? 'bg-koppar text-kalkvit'
                                : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1]'
                            )}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {selectedSlot && (
                  <Link to={`/book-session?expert=${id}&date=${selectedSlot.date}&time=${selectedSlot.time}`}>
                    <GlassButton variant="primary" className="w-full mt-4">
                      Book {selectedSlot.date} at {selectedSlot.time}
                    </GlassButton>
                  </Link>
                )}
              </GlassCard>
            )}

            {/* Stats */}
            <GlassCard variant="base">
              <h3 className="font-semibold text-kalkvit mb-4">Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-xl bg-white/[0.03]">
                  <p className="text-2xl font-display font-bold text-kalkvit">{expert.total_sessions}</p>
                  <p className="text-xs text-kalkvit/50">Sessions</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/[0.03]">
                  <p className="text-2xl font-display font-bold text-kalkvit">{expert.reviews_count}</p>
                  <p className="text-xs text-kalkvit/50">Reviews</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/[0.03]">
                  <p className="text-2xl font-display font-bold text-brand-amber">{expert.rating}</p>
                  <p className="text-xs text-kalkvit/50">Rating</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/[0.03]">
                  <p className="text-2xl font-display font-bold text-skogsgron">
                    {expert.rating > 0 ? Math.round((expert.rating / 5) * 100) : '--'}%
                  </p>
                  <p className="text-xs text-kalkvit/50">Satisfaction</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
