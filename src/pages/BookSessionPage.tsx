import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassAvatar, GlassBadge, GlassSelect } from '../components/ui'
import { useExperts, useExpertAvailability, useBookSession } from '../lib/api/hooks'
import type { Expert } from '../lib/api/types'
import { Calendar, Clock, Star, ChevronLeft, ChevronRight, Video, Loader2, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'
import { cn } from '../lib/utils'
import { safeOpenUrl } from '../lib/url-validation'

const sessionTypes = [
  { value: '30', label: '30 minutes - Quick Check-in' },
  { value: '60', label: '60 minutes - Standard Session' },
  { value: '90', label: '90 minutes - Deep Dive' },
]

function ExpertCardSkeleton() {
  return (
    <GlassCard variant="base">
      <div className="flex items-start gap-4 animate-pulse">
        <div className="w-12 h-12 rounded-xl bg-white/[0.1]" />
        <div className="flex-1 min-w-0">
          <div className="h-5 w-32 bg-white/[0.1] rounded mb-2" />
          <div className="h-4 w-24 bg-white/[0.1] rounded mb-2" />
          <div className="h-4 w-20 bg-white/[0.1] rounded" />
        </div>
        <div className="text-right">
          <div className="h-6 w-16 bg-white/[0.1] rounded mb-1" />
          <div className="h-3 w-10 bg-white/[0.1] rounded" />
        </div>
      </div>
    </GlassCard>
  )
}

function ExpertCard({
  expert,
  isSelected,
  onSelect,
}: {
  expert: Expert
  isSelected: boolean
  onSelect: () => void
}) {
  const initials = expert.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <button onClick={onSelect} className="w-full text-left">
      <GlassCard
        variant={isSelected ? 'accent' : 'base'}
        leftBorder={false}
        className={cn(
          'cursor-pointer transition-all',
          isSelected ? 'ring-2 ring-koppar' : 'hover:border-koppar/30'
        )}
      >
        <div className="flex items-start gap-4">
          {expert.avatar_url ? (
            <img
              src={expert.avatar_url}
              alt={expert.name}
              className="w-12 h-12 rounded-xl object-cover"
            />
          ) : (
            <GlassAvatar initials={initials} size="lg" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-kalkvit">{expert.name}</h3>
            <p className="text-sm text-koppar">{expert.title}</p>
            <div className="flex items-center gap-2 mt-1 text-sm text-kalkvit/50">
              <Star className="w-4 h-4 text-brand-amber fill-brand-amber" />
              <span>
                {expert.rating} ({expert.reviews_count} reviews)
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {expert.specialties.slice(0, 2).map((s) => (
                <GlassBadge key={s} variant="default" className="text-xs">
                  {s}
                </GlassBadge>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-xl font-bold text-kalkvit">${expert.hourly_rate}</p>
            <p className="text-xs text-kalkvit/50">/hour</p>
            {expert.availability && (
              <p className="text-xs text-skogsgron mt-2">Next: {expert.availability}</p>
            )}
          </div>
        </div>
      </GlassCard>
    </button>
  )
}

export function BookSessionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedExpertId = searchParams.get('expert')

  const [selectedExpertId, setSelectedExpertId] = useState<string | null>(preselectedExpertId)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [sessionType, setSessionType] = useState('60')
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [bookingError, setBookingError] = useState<string | null>(null)
  const navTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => () => { if (navTimerRef.current) clearTimeout(navTimerRef.current) }, [])

  // Fetch experts
  const { data: expertsData, isLoading: isLoadingExperts, error: expertsError } = useExperts()
  const experts = Array.isArray(expertsData?.data) ? expertsData.data : []

  // Find selected expert
  const selectedExpert = useMemo(
    () => experts.find((e) => e.id === selectedExpertId) || null,
    [experts, selectedExpertId]
  )

  // Fetch availability for selected expert
  const { data: availabilityData, isLoading: isLoadingAvailability } = useExpertAvailability(
    selectedExpertId || ''
  )
  const availability = availabilityData || []

  // Book session mutation
  const bookSessionMutation = useBookSession()

  // Build calendar grid for the displayed month
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth
    const firstDay = new Date(year, month, 1)
    const startOffset = firstDay.getDay() // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const cells: (null | { dateStr: string; day: number })[] = []
    // Leading empty cells
    for (let i = 0; i < startOffset; i++) cells.push(null)
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({ dateStr, day: d })
    }
    return cells
  }, [calendarMonth])

  const calendarLabel = new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const canGoPrev = calendarMonth.year > today.getFullYear() || calendarMonth.month > today.getMonth()

  const navigateMonth = (dir: -1 | 1) => {
    setCalendarMonth((prev) => {
      let m = prev.month + dir
      let y = prev.year
      if (m < 0) { m = 11; y-- }
      if (m > 11) { m = 0; y++ }
      return { year: y, month: m }
    })
  }

  // Set of available day-of-week names (lowercase) from the expert
  const availableDays = useMemo(() => {
    return new Set(availability.map((a) => a.day.toLowerCase()))
  }, [availability])

  // When expert has no availability configured, treat all future dates as available
  const hasAvailabilityConstraints = availableDays.size > 0

  // Get time slots for selected date from availability (match by day-of-week)
  const timeSlotsForDate = useMemo(() => {
    if (!selectedDate || !availability.length) return []
    const dayOfWeek = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
    const matching = availability.filter(
      (a) => a.day.toLowerCase() === dayOfWeek.toLowerCase(),
    )
    return matching.map((a) => ({ time: a.time, available: true }))
  }, [selectedDate, availability])

  const handleBook = async () => {
    if (!selectedExpert || !selectedDate || !selectedTime) return

    try {
      // Construct the scheduled_at datetime
      const scheduledAt = `${selectedDate}T${convertTo24Hour(selectedTime)}:00`

      await bookSessionMutation.mutateAsync({
        expert_id: selectedExpert.id,
        scheduled_at: scheduledAt,
        duration: parseInt(sessionType),
        session_type: 'coaching',
      })

      setBookingSuccess(true)

      // Navigate to sessions page after a short delay
      navTimerRef.current = setTimeout(() => {
        navigate('/expert-sessions')
      }, 2000)
    } catch (_error) {
      setBookingError('Failed to book session. Please try again.')
    }
  }

  // Helper to convert time string to 24-hour format
  const convertTo24Hour = (time12h: string): string => {
    const [time, modifier] = time12h.split(' ')
    let [hours, minutes] = time.split(':')
    if (hours === '12') {
      hours = modifier === 'AM' ? '00' : '12'
    } else if (modifier === 'PM') {
      hours = String(parseInt(hours, 10) + 12)
    }
    return `${hours.padStart(2, '0')}:${minutes}`
  }

  if (expertsError) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto">
          <GlassCard variant="base" className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-tegelrod mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">Failed to load experts</h3>
            <p className="text-kalkvit/50 text-sm">
              Please try refreshing the page or check your connection.
            </p>
          </GlassCard>
        </div>
      </MainLayout>
    )
  }

  if (bookingSuccess) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto">
          <GlassCard variant="accent" leftBorder={false} className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-skogsgron mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-kalkvit mb-2">
              Session Booked Successfully!
            </h2>
            <p className="text-kalkvit/60 mb-4">
              Your session with {selectedExpert?.name} has been confirmed.
            </p>
            <p className="text-sm text-kalkvit/50">Redirecting to your sessions...</p>
          </GlassCard>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">Book a Session</h1>
          <p className="text-kalkvit/60">Schedule a 1-on-1 coaching session with our experts</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Expert Selection */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-serif text-xl font-semibold text-kalkvit">Choose an Expert</h2>
            {isLoadingExperts ? (
              <>
                <ExpertCardSkeleton />
                <ExpertCardSkeleton />
                <ExpertCardSkeleton />
              </>
            ) : experts.length === 0 ? (
              <GlassCard variant="base" className="text-center py-8">
                <p className="text-kalkvit/60">No experts available at the moment.</p>
              </GlassCard>
            ) : (
              experts.map((expert) => (
                <ExpertCard
                  key={expert.id}
                  expert={expert}
                  isSelected={selectedExpertId === expert.id}
                  onSelect={() => {
                    setSelectedExpertId(expert.id)
                    setSelectedDate(null)
                    setSelectedTime(null)
                  }}
                />
              ))
            )}
          </div>

          {/* Booking Details */}
          <div className="space-y-6">
            {/* Session Type */}
            <GlassCard variant="base">
              <h3 className="font-semibold text-kalkvit mb-4">Session Type</h3>
              <GlassSelect
                options={sessionTypes}
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
              />
            </GlassCard>

            {/* Date Selection — hidden when expert uses external calendar */}
            {!selectedExpert?.calendar_url && (
              <GlassCard variant="base">
                <h3 className="font-semibold text-kalkvit mb-3">Select Date</h3>
                {/* Month navigation */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    className="p-1.5 rounded-lg hover:bg-white/[0.06] text-kalkvit/50 hover:text-kalkvit disabled:opacity-30 disabled:cursor-not-allowed"
                    onClick={() => navigateMonth(-1)}
                    disabled={!canGoPrev}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-kalkvit">
                    {calendarLabel}
                  </span>
                  <button
                    className="p-1.5 rounded-lg hover:bg-white/[0.06] text-kalkvit/50 hover:text-kalkvit"
                    onClick={() => navigateMonth(1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="text-center text-[11px] text-kalkvit/40 py-1">{d}</div>
                  ))}
                </div>
                {/* Calendar grid */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((cell, i) => {
                    if (!cell) return <div key={`empty-${i}`} />
                    const isPast = cell.dateStr < todayStr
                    const dayOfWeek = new Date(cell.dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
                    const isAvailable = !isPast && !!selectedExpertId && (!hasAvailabilityConstraints || availableDays.has(dayOfWeek))
                    const isSelected = selectedDate === cell.dateStr
                    const isToday = cell.dateStr === todayStr
                    return (
                      <button
                        key={cell.dateStr}
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedDate(cell.dateStr)
                            setSelectedTime(null)
                          }
                        }}
                        disabled={!isAvailable}
                        className={cn(
                          'aspect-square flex items-center justify-center rounded-lg text-sm transition-all',
                          isPast
                            ? 'text-kalkvit/15 cursor-default'
                            : !isAvailable
                              ? 'text-kalkvit/30 cursor-default'
                              : isSelected
                                ? 'bg-koppar text-kalkvit font-semibold'
                                : isToday
                                  ? 'bg-white/[0.08] text-kalkvit font-semibold hover:bg-white/[0.12]'
                                  : 'text-kalkvit/70 hover:bg-white/[0.06]',
                        )}
                      >
                        {cell.day}
                      </button>
                    )
                  })}
                </div>
                {!selectedExpertId && (
                  <p className="text-xs text-kalkvit/40 mt-3 text-center">Select an expert first</p>
                )}
              </GlassCard>
            )}

            {/* External Calendar Fallback */}
            {selectedExpert?.calendar_url && (
              <GlassCard variant="accent" leftBorder={false}>
                <div className="text-center space-y-3">
                  <Calendar className="w-8 h-8 text-koppar mx-auto" />
                  <h3 className="font-semibold text-kalkvit">
                    Book via External Calendar
                  </h3>
                  <p className="text-sm text-kalkvit/60">
                    {selectedExpert.name} uses an external calendar for scheduling.
                    Book your session directly through their booking page.
                  </p>
                  <GlassButton
                    variant="primary"
                    className="w-full"
                    onClick={() =>
                      safeOpenUrl(selectedExpert.calendar_url!)
                    }
                  >
                    <ExternalLink className="w-4 h-4" />
                    Book via Calendar
                  </GlassButton>
                </div>
              </GlassCard>
            )}

            {/* Time Selection — only show internal picker when expert has no external calendar */}
            {!selectedExpert?.calendar_url && (
              <GlassCard variant="base">
                <h3 className="font-semibold text-kalkvit mb-4">Select Time</h3>
                {isLoadingAvailability && selectedExpertId ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 text-koppar animate-spin" />
                  </div>
                ) : timeSlotsForDate.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {timeSlotsForDate.map((slot) => (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className={cn(
                          'p-2 rounded-xl text-sm font-medium transition-all',
                          !slot.available
                            ? 'bg-white/[0.03] text-kalkvit/30 cursor-not-allowed'
                            : selectedTime === slot.time
                              ? 'bg-koppar text-kalkvit'
                              : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1]'
                        )}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                ) : selectedDate ? (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-sm text-kalkvit/50">
                      No slots available for{' '}
                      <span className="text-kalkvit/70 font-medium">
                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      . Try selecting a different date.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-kalkvit/40 text-center py-4">
                    Select a date to see available times
                  </p>
                )}
              </GlassCard>
            )}

            {/* Session Summary — only for internal booking flow */}
            {selectedExpert && !selectedExpert.calendar_url && selectedDate && selectedTime && (
              <GlassCard variant="accent" leftBorder={false}>
                <h3 className="font-semibold text-kalkvit mb-4">Session Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-kalkvit/80">
                    {selectedExpert.avatar_url ? (
                      <img
                        src={selectedExpert.avatar_url}
                        alt={selectedExpert.name}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <GlassAvatar
                        initials={selectedExpert.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                        size="sm"
                      />
                    )}
                    <span>{selectedExpert.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-kalkvit/80">
                    <Calendar className="w-4 h-4 text-koppar" />
                    <span>
                      {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-kalkvit/80">
                    <Clock className="w-4 h-4 text-koppar" />
                    <span>
                      {selectedTime} ({sessionType} min)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-kalkvit/80">
                    <Video className="w-4 h-4 text-koppar" />
                    <span>Video Call</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-kalkvit/60">Total</span>
                    <span className="font-display text-2xl font-bold text-kalkvit">
                      ${Math.round(selectedExpert.hourly_rate * (parseInt(sessionType) / 60))}
                    </span>
                  </div>
                  <GlassButton
                    variant="primary"
                    className="w-full"
                    onClick={handleBook}
                    disabled={bookSessionMutation.isPending}
                  >
                    {bookSessionMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      'Confirm Booking'
                    )}
                  </GlassButton>
                  {(bookSessionMutation.isError || bookingError) && (
                    <p className="text-xs text-tegelrod mt-2 text-center">
                      {bookingError || 'Failed to book session. Please try again.'}
                    </p>
                  )}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default BookSessionPage;
