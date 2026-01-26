import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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
} from 'lucide-react'
import { cn } from '../lib/utils'

interface Expert {
  id: number
  name: string
  initials: string
  title: string
  bio: string
  location: string
  experience: string
  specialties: string[]
  certifications: string[]
  rating: number
  reviews: number
  totalSessions: number
  hourlyRate: number
  availability: string
  languages: string[]
  testimonials: {
    id: number
    author: string
    initials: string
    rating: number
    text: string
    date: string
  }[]
  upcomingSlots: {
    date: string
    times: string[]
  }[]
}

const mockExpert: Expert = {
  id: 1,
  name: 'Michael Chen',
  initials: 'MC',
  title: 'Executive Leadership Coach',
  bio: 'With over 15 years of experience coaching C-suite executives and emerging leaders, I help ambitious professionals unlock their full potential. My approach combines proven frameworks from top business schools with practical, real-world application. I believe that great leadership is a skill that can be developed through intentional practice and continuous feedback.',
  location: 'San Francisco, CA',
  experience: '15+ years',
  specialties: [
    'Executive Coaching',
    'Leadership Development',
    'Strategic Planning',
    'Team Building',
    'Communication',
    'Decision Making',
  ],
  certifications: [
    'ICF Professional Certified Coach (PCC)',
    'Harvard Business School - Leadership Certificate',
    'Stanford GSB - Executive Education',
  ],
  rating: 4.9,
  reviews: 127,
  totalSessions: 850,
  hourlyRate: 199,
  availability: 'Mon-Fri, 8AM-6PM PST',
  languages: ['English', 'Mandarin'],
  testimonials: [
    {
      id: 1,
      author: 'Sarah Thompson',
      initials: 'ST',
      rating: 5,
      text: "Michael's coaching transformed how I approach leadership. His frameworks are practical and immediately applicable. Within 3 months, I saw dramatic improvements in team engagement and my own confidence.",
      date: 'Jan 2026',
    },
    {
      id: 2,
      author: 'David Wilson',
      initials: 'DW',
      rating: 5,
      text: 'The ROI on coaching with Michael has been incredible. He helped me navigate a complex organizational change that I thought was impossible. Highly recommend for any leader facing big challenges.',
      date: 'Dec 2025',
    },
    {
      id: 3,
      author: 'Emily Davis',
      initials: 'ED',
      rating: 5,
      text: "I've worked with several coaches, but Michael stands out. He asks the right questions and pushes you just enough to grow without overwhelming. His leadership framework is now central to how I operate.",
      date: 'Nov 2025',
    },
  ],
  upcomingSlots: [
    { date: 'Tomorrow', times: ['9:00 AM', '2:00 PM', '4:00 PM'] },
    { date: 'Wednesday', times: ['10:00 AM', '1:00 PM', '3:00 PM'] },
    { date: 'Thursday', times: ['9:00 AM', '11:00 AM'] },
  ],
}

export function ExpertProfilePage() {
  const { id: _expertId } = useParams() // Expert ID for future API calls
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null)

  // In real app, would fetch expert based on ID
  const expert = mockExpert

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
                <GlassAvatar initials={expert.initials} size="xl" />
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
                      <span className="text-kalkvit/50 text-sm">({expert.reviews} reviews)</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-kalkvit/60">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {expert.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {expert.experience}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {expert.totalSessions} sessions
                    </span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Link to="/book-session">
                      <GlassButton variant="primary">
                        <Calendar className="w-4 h-4" />
                        Book Session
                      </GlassButton>
                    </Link>
                    <GlassButton variant="secondary">
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

            {/* Certifications */}
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

            {/* Testimonials */}
            <GlassCard variant="base">
              <h2 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-brand-amber" />
                Client Testimonials
              </h2>
              <div className="space-y-4">
                {expert.testimonials.map((testimonial) => (
                  <div
                    key={testimonial.id}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <GlassAvatar initials={testimonial.initials} size="sm" />
                        <div>
                          <p className="font-medium text-kalkvit text-sm">{testimonial.author}</p>
                          <p className="text-xs text-kalkvit/50">{testimonial.date}</p>
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
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <GlassCard variant="accent" leftBorder={false}>
              <div className="text-center mb-4">
                <p className="text-sm text-kalkvit/60">Hourly Rate</p>
                <p className="font-display text-4xl font-bold text-kalkvit">${expert.hourlyRate}</p>
              </div>
              <div className="space-y-2 text-sm text-kalkvit/60">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-koppar" />
                  Video sessions included
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-koppar" />
                  {expert.availability}
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-koppar" />
                  {expert.languages.join(', ')}
                </div>
              </div>
            </GlassCard>

            {/* Quick Book */}
            <GlassCard variant="base">
              <h3 className="font-semibold text-kalkvit mb-4">Quick Book</h3>
              <div className="space-y-4">
                {expert.upcomingSlots.map((slot) => (
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
                <Link to="/book-session">
                  <GlassButton variant="primary" className="w-full mt-4">
                    Book {selectedSlot.date} at {selectedSlot.time}
                  </GlassButton>
                </Link>
              )}
            </GlassCard>

            {/* Stats */}
            <GlassCard variant="base">
              <h3 className="font-semibold text-kalkvit mb-4">Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-xl bg-white/[0.03]">
                  <p className="text-2xl font-display font-bold text-kalkvit">{expert.totalSessions}</p>
                  <p className="text-xs text-kalkvit/50">Sessions</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/[0.03]">
                  <p className="text-2xl font-display font-bold text-kalkvit">{expert.reviews}</p>
                  <p className="text-xs text-kalkvit/50">Reviews</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/[0.03]">
                  <p className="text-2xl font-display font-bold text-brand-amber">{expert.rating}</p>
                  <p className="text-xs text-kalkvit/50">Rating</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/[0.03]">
                  <p className="text-2xl font-display font-bold text-skogsgron">98%</p>
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
