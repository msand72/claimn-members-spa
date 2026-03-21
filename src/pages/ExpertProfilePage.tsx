import { useState, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassAvatar, GlassBadge, GlassModal, GlassModalFooter } from '../components/ui'
import {
  ArrowLeftIcon,
  StarIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  TrophyIcon as AwardIcon,
  ChatBubbleLeftIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { cn } from '../lib/utils'
import { useExpert, useExpertTestimonials, useExpertAvailability, useAvailableSlots, useBookSession } from '../lib/api/hooks/useExperts'
import { useCheckout, usePlans } from '../lib/api/hooks'
import { EXPERT_SESSION_PRICES } from '../config/stripe-prices'
import { isAllowedExternalUrl } from '../lib/url-validation'

function convertTo24Hour(time12h: string): string {
  const [time, modifier] = time12h.split(' ')
  let [hours, minutes] = time.split(':')
  if (hours === '12') {
    hours = modifier === 'AM' ? '00' : '12'
  } else if (modifier === 'PM') {
    hours = String(parseInt(hours, 10) + 12)
  }
  return `${hours.padStart(2, '0')}:${minutes}`
}

export function ExpertProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [sessionDuration, setSessionDuration] = useState(60)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [bookingError, setBookingError] = useState<string | null>(null)

  const { data: expert, isLoading, isError, refetch } = useExpert(id || '')
  const { data: testimonials } = useExpertTestimonials(id || '')
  const { data: availabilitySlots } = useExpertAvailability(id || '')

  // Booking hooks
  const { data: serverSlots, isLoading: isLoadingSlots } = useAvailableSlots(
    id || '', selectedDate || '', sessionDuration,
  )
  const bookSessionMutation = useBookSession()
  const checkoutMutation = useCheckout()
  const { data: plansData } = usePlans()
  const expertSessions = plansData?.expert_sessions || []

  const sessionPrice = useMemo(() => {
    return expertSessions.find((s) => s.duration === sessionDuration) || null
  }, [expertSessions, sessionDuration])

  // Time slots for the selected date
  const timeSlotsForDate = useMemo(() => {
    if (!selectedDate) return []
    if (serverSlots?.slots) {
      return serverSlots.slots.map((s) => {
        const timeMatch = s.start_local.match(/T(\d{2}):(\d{2})/)
        const h = timeMatch ? parseInt(timeMatch[1], 10) : 0
        const min = timeMatch ? parseInt(timeMatch[2], 10) : 0
        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
        const ampm = h < 12 ? 'AM' : 'PM'
        return { time: `${hour12}:${String(min).padStart(2, '0')} ${ampm}`, available: s.available }
      })
    }
    if (!availabilitySlots?.length) return []
    const dayOfWeek = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
    const matching = availabilitySlots.filter((s) => s.day.toLowerCase() === dayOfWeek.toLowerCase())
    const slots: { time: string; available: boolean }[] = []
    for (const a of matching) {
      if (!a.startTime || !a.endTime) continue
      const [startH, startM] = a.startTime.split(':').map(Number)
      const [endH, endM] = a.endTime.split(':').map(Number)
      for (let m = startH * 60 + startM; m + sessionDuration <= endH * 60 + endM; m += sessionDuration) {
        const h = Math.floor(m / 60)
        const mn = m % 60
        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
        const ampm = h < 12 ? 'AM' : 'PM'
        slots.push({ time: `${hour12}:${String(mn).padStart(2, '0')} ${ampm}`, available: true })
      }
    }
    return slots
  }, [selectedDate, serverSlots, availabilitySlots, sessionDuration])

  const handleBook = async () => {
    if (!expert || !selectedDate || !selectedTime) return
    const priceId = sessionPrice?.price_id
    if (!priceId) {
      setBookingError('Checkout is not configured for this session type. Please contact support.')
      return
    }
    try {
      const timeStr = convertTo24Hour(selectedTime)
      const scheduledAt = new Date(`${selectedDate}T${timeStr}:00`).toISOString()
      await bookSessionMutation.mutateAsync({
        expert_id: expert.id,
        scheduled_at: scheduledAt,
        duration: sessionDuration,
        session_type: 'coaching',
      })
      const checkoutData = await checkoutMutation.mutateAsync({
        price_id: priceId,
        product: 'expert_session',
        mode: 'payment',
        expert_id: expert.id,
        success_url: `${window.location.origin}/shop/success`,
        cancel_url: `${window.location.origin}/experts/${id}`,
      })
      if (isAllowedExternalUrl(checkoutData.url)) {
        window.location.href = checkoutData.url
      } else {
        setBookingError('Invalid checkout URL. Please try again.')
      }
    } catch (error: any) {
      const status = error?.status || error?.response?.status
      const code = error?.error?.code || error?.code || ''
      if (status === 409 || code === 'SLOT_UNAVAILABLE') {
        setBookingError('This time slot is no longer available. Please choose another.')
        setSelectedTime(null)
      } else {
        setBookingError(error?.error?.message || error?.message || 'Failed to book session.')
      }
    }
  }

  // Build next 7 calendar days
  const days = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      return {
        dateStr: d.toISOString().split('T')[0],
        dayShort: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayLong: d.toLocaleDateString('en-US', { weekday: 'long' }),
        dateNum: d.getDate(),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
      }
    })
  }, [])

  // Find available time for the selected date (match day-of-week)
  const selectedDaySlot = useMemo(() => {
    if (!selectedDate || !availabilitySlots?.length) return null
    const dayLong = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
    return availabilitySlots.find((s) => s.day.toLowerCase() === dayLong.toLowerCase()) ?? null
  }, [selectedDate, availabilitySlots])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-24">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-koppar" />
        </div>
      </MainLayout>
    )
  }

  if (isError || !expert) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <ExclamationTriangleIcon className="w-8 h-8 text-tegelrod" />
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
          <ArrowLeftIcon className="w-4 h-4" />
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
                      <StarIcon className="w-5 h-5 fill-brand-amber" />
                      <span className="font-semibold">{expert.rating}</span>
                      <span className="text-kalkvit/50 text-sm">({expert.reviews_count} reviews)</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-kalkvit/60">
                    {expert.location && (
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4" />
                        {expert.location}
                      </span>
                    )}
                    {expert.experience && (
                      <span className="flex items-center gap-1">
                        <BriefcaseIcon className="w-4 h-4" />
                        {expert.experience}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <UserGroupIcon className="w-4 h-4" />
                      {expert.total_sessions} sessions
                    </span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Link to={`/book-session?expert=${id}`}>
                      <GlassButton variant="primary">
                        <CalendarIcon className="w-4 h-4" />
                        Book Session
                      </GlassButton>
                    </Link>
                    <GlassButton
                      variant="secondary"
                      onClick={() => navigate(`/messages?user=${expert.user_id || id}`, {
                        state: { participantName: expert.name, participantAvatar: expert.avatar_url, participantType: 'expert' },
                      })}
                    >
                      <ChatBubbleLeftIcon className="w-4 h-4" />
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
            {expert.specialties?.length > 0 && (
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
            {(expert.certifications ?? []).length > 0 && (
              <GlassCard variant="base">
                <h2 className="font-semibold text-kalkvit mb-4 flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5 text-koppar" />
                  Certifications
                </h2>
                <ul className="space-y-3">
                  {(expert.certifications ?? []).map((cert, i) => (
                    <li key={i} className="flex items-center gap-3 text-kalkvit/70">
                      <CheckCircleIcon className="w-4 h-4 text-skogsgron flex-shrink-0" />
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
                  <AwardIcon className="w-5 h-5 text-brand-amber" />
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
                              <StarIcon
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
                        <p className="text-sm text-kalkvit/70 italic">"{testimonial.content}"</p>
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
                  <VideoCameraIcon className="w-4 h-4 text-koppar" />
                  Video sessions included
                </div>
                {expert.availability && (
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-koppar" />
                    {expert.availability}
                  </div>
                )}
                {(expert.languages ?? []).length > 0 && (
                  <div className="flex items-center gap-2">
                    <ChatBubbleLeftIcon className="w-4 h-4 text-koppar" />
                    {(expert.languages ?? []).join(', ')}
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Quick Book */}
            {availabilitySlots && availabilitySlots.length > 0 && (
              <GlassCard variant="base">
                <h3 className="font-semibold text-kalkvit mb-4">Quick Book</h3>
                <div className="flex justify-between gap-1">
                  {days.map((day) => {
                    const hasSlot = availabilitySlots.some(
                      (s) => s.day.toLowerCase() === day.dayLong.toLowerCase(),
                    )
                    return (
                      <button
                        key={day.dateStr}
                        onClick={() => hasSlot && setSelectedDate(day.dateStr)}
                        disabled={!hasSlot}
                        className={cn(
                          'flex-1 py-3 rounded-xl text-center transition-all min-w-0',
                          !hasSlot
                            ? 'opacity-30 cursor-not-allowed'
                            : selectedDate === day.dateStr
                              ? 'bg-koppar text-kalkvit'
                              : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1]',
                        )}
                      >
                        <p className="text-[11px] leading-tight">{day.dayShort}</p>
                        <p className="text-base font-semibold leading-tight mt-1">{day.dateNum}</p>
                      </button>
                    )
                  })}
                </div>
                {selectedDate && selectedDaySlot && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-kalkvit/60">
                      <ClockIcon className="w-4 h-4 text-koppar" />
                      Available {selectedDaySlot.time}
                    </div>
                    <GlassButton
                      variant="primary"
                      className="w-full"
                      onClick={() => { setSelectedTime(null); setBookingError(null); setShowBookingModal(true) }}
                    >
                      <CalendarIcon className="w-4 h-4" />
                      Book {days.find((d) => d.dateStr === selectedDate)?.month}{' '}
                      {days.find((d) => d.dateStr === selectedDate)?.dateNum}
                    </GlassButton>
                  </div>
                )}
                {selectedDate && !selectedDaySlot && (
                  <p className="mt-3 text-sm text-kalkvit/50 text-center">
                    Not available on this day
                  </p>
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

      {/* Booking Modal */}
      {expert && selectedDate && (
        <GlassModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          title={`Book Session with ${expert.name}`}
          size="md"
        >
          <div className="space-y-4">
            {/* Date display */}
            <div className="flex items-center gap-2 text-sm text-kalkvit/70">
              <CalendarIcon className="w-4 h-4 text-koppar" />
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>

            {/* Session duration */}
            <div>
              <p className="text-xs text-kalkvit/50 mb-2 font-medium uppercase tracking-wider">Session Length</p>
              <div className="flex gap-2">
                {([45, 60, 90] as const).map((dur) => {
                  const price = EXPERT_SESSION_PRICES[dur]
                  return (
                    <button
                      key={dur}
                      onClick={() => { setSessionDuration(dur); setSelectedTime(null) }}
                      className={cn(
                        'flex-1 py-2.5 rounded-xl text-center text-sm font-medium transition-all',
                        sessionDuration === dur
                          ? 'bg-koppar text-kalkvit'
                          : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1]'
                      )}
                    >
                      {price.label}
                      <span className="block text-xs opacity-70">${price.amount}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time slots */}
            <div>
              <p className="text-xs text-kalkvit/50 mb-2 font-medium uppercase tracking-wider">Available Times</p>
              {isLoadingSlots ? (
                <div className="flex justify-center py-4">
                  <ArrowPathIcon className="w-5 h-5 text-koppar animate-spin" />
                </div>
              ) : timeSlotsForDate.length === 0 ? (
                <p className="text-sm text-kalkvit/40 text-center py-3">No slots available for this date</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {timeSlotsForDate.filter((s) => s.available).map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedTime(slot.time)}
                      className={cn(
                        'py-2 rounded-xl text-sm font-medium transition-all',
                        selectedTime === slot.time
                          ? 'bg-koppar text-kalkvit'
                          : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1]'
                      )}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {bookingError && (
              <div className="p-3 rounded-xl bg-tegelrod/10 border border-tegelrod/20 text-sm text-tegelrod">
                {bookingError}
              </div>
            )}
          </div>

          <GlassModalFooter>
            <GlassButton variant="ghost" onClick={() => setShowBookingModal(false)}>
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={handleBook}
              disabled={!selectedTime || bookSessionMutation.isPending || checkoutMutation.isPending}
            >
              {bookSessionMutation.isPending || checkoutMutation.isPending ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarIcon className="w-4 h-4" />
              )}
              Confirm & Pay — ${sessionPrice?.amount || EXPERT_SESSION_PRICES[sessionDuration as 45 | 60 | 90]?.amount || 0}
            </GlassButton>
          </GlassModalFooter>
        </GlassModal>
      )}
    </MainLayout>
  )
}

export default ExpertProfilePage;
