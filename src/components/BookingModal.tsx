import { useState, useMemo } from 'react'
import { GlassButton, GlassModal, GlassModalFooter } from './ui'
import { CalendarIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { cn } from '../lib/utils'
import { useAvailableSlots, useBookSession, useExpertAvailability } from '../lib/api/hooks/useExperts'
import { useCheckout } from '../lib/api/hooks'
import { EXPERT_SESSION_PRICES } from '../config/stripe-prices'
import { isAllowedExternalUrl } from '../lib/url-validation'
import type { Expert } from '../lib/api/types'

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

interface BookingModalProps {
  expert: Expert
  isOpen: boolean
  onClose: () => void
  /** Pre-selected date (YYYY-MM-DD). If not provided, shows a date picker. */
  preselectedDate?: string | null
  /** Pre-selected time (e.g. "10:00 AM"). If provided, auto-selects the time slot. */
  preselectedTime?: string | null
}

export function BookingModal({ expert, isOpen, onClose, preselectedDate, preselectedTime }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(preselectedDate ?? null)
  const [sessionDuration, setSessionDuration] = useState(60)
  const [selectedTime, setSelectedTime] = useState<string | null>(preselectedTime ?? null)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week')
  const [monthOffset, setMonthOffset] = useState(0)

  const { data: availabilitySlots } = useExpertAvailability(expert.id)

  const today = useMemo(() => new Date(), [])
  const todayStr = today.toISOString().split('T')[0]

  // Build 7 days starting from Monday of the current week + offset
  const days = useMemo(() => {
    // Find Monday of the current week
    const monday = new Date(today)
    const dayOfWeek = monday.getDay() // 0=Sun, 1=Mon, ...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    monday.setDate(monday.getDate() + diffToMonday + weekOffset * 7)

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return {
        dateStr: d.toISOString().split('T')[0],
        dayShort: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayLong: d.toLocaleDateString('en-US', { weekday: 'long' }),
        dateNum: d.getDate(),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        isPast: d.toISOString().split('T')[0] < todayStr,
      }
    })
  }, [weekOffset, today, todayStr])

  // Week label (e.g. "Mar 21 – Mar 27")
  const weekLabel = days.length > 0
    ? `${days[0].month} ${days[0].dateNum} – ${days[6].month} ${days[6].dateNum}`
    : ''

  // Month calendar grid
  const monthData = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    const firstDay = new Date(year, month, 1)
    const startOffset = (firstDay.getDay() + 6) % 7 // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    const cells: (null | { dateStr: string; day: number; dayLong: string; isPast: boolean })[] = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let day = 1; day <= daysInMonth; day++) {
      const dd = new Date(year, month, day)
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      cells.push({
        dateStr,
        day,
        dayLong: dd.toLocaleDateString('en-US', { weekday: 'long' }),
        isPast: dateStr < todayStr,
      })
    }
    return { cells, label, canGoPrev: monthOffset > 0 }
  }, [monthOffset, today, todayStr])

  // Hooks
  const { data: serverSlots, isLoading: isLoadingSlots } = useAvailableSlots(
    expert.id, selectedDate || '', sessionDuration,
  )
  const bookSessionMutation = useBookSession()
  const checkoutMutation = useCheckout()

  const sessionPrice = useMemo(() => {
    const dur = sessionDuration as 45 | 60 | 90
    return EXPERT_SESSION_PRICES[dur] || null
  }, [sessionDuration])

  // Time slots
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
    if (!selectedDate || !selectedTime) return
    const priceId = sessionPrice?.priceId
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
        cancel_url: window.location.href,
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

  const handleClose = () => {
    setBookingError(null)
    setSelectedTime(preselectedTime ?? null)
    setWeekOffset(0)
    setMonthOffset(0)
    setCalendarView('week')
    if (!preselectedDate) setSelectedDate(null)
    onClose()
  }

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Book Session with ${expert.name}`}
      size="sm"
    >
      <div className="space-y-4">
        {/* Date picker — always shown, pre-selects date if provided */}
          <div>
            {/* Week / Month toggle */}
            <div className="flex items-center justify-center gap-1 mb-3 bg-white/[0.06] rounded-lg p-0.5">
              <button
                onClick={() => setCalendarView('week')}
                className={cn(
                  'flex-1 py-1.5 rounded-md text-xs font-semibold transition-all',
                  calendarView === 'week'
                    ? 'bg-koppar text-kalkvit'
                    : 'text-kalkvit/50 hover:text-kalkvit/80'
                )}
              >
                Week
              </button>
              <button
                onClick={() => setCalendarView('month')}
                className={cn(
                  'flex-1 py-1.5 rounded-md text-xs font-semibold transition-all',
                  calendarView === 'month'
                    ? 'bg-koppar text-kalkvit'
                    : 'text-kalkvit/50 hover:text-kalkvit/80'
                )}
              >
                Month
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => {
                  if (calendarView === 'week') setWeekOffset((w) => Math.max(0, w - 1))
                  else setMonthOffset((m) => Math.max(0, m - 1))
                }}
                disabled={calendarView === 'week' ? weekOffset === 0 : !monthData.canGoPrev}
                className={cn(
                  'p-1 rounded-lg transition-all',
                  (calendarView === 'week' ? weekOffset === 0 : !monthData.canGoPrev)
                    ? 'opacity-20 cursor-not-allowed'
                    : 'text-kalkvit/60 hover:bg-white/[0.08] hover:text-kalkvit'
                )}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <p className="text-xs text-kalkvit/50 font-medium uppercase tracking-wider">
                {calendarView === 'week' ? weekLabel : monthData.label}
              </p>
              <button
                onClick={() => {
                  if (calendarView === 'week') setWeekOffset((w) => w + 1)
                  else setMonthOffset((m) => m + 1)
                }}
                className="p-1 rounded-lg text-kalkvit/60 hover:bg-white/[0.08] hover:text-kalkvit transition-all"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Week view */}
            {calendarView === 'week' && (
              <div className="grid grid-cols-7">
                {days.map((day) => {
                  const hasSlot = availabilitySlots?.some(
                    (s) => s.day.toLowerCase() === day.dayLong.toLowerCase(),
                  )
                  const disabled = !hasSlot || day.isPast
                  return (
                    <button
                      key={day.dateStr}
                      onClick={() => { if (!disabled) { setSelectedDate(day.dateStr); setSelectedTime(null) } }}
                      disabled={disabled}
                      className={cn(
                        'py-3 text-center transition-all border border-transparent',
                        'first:rounded-l-lg last:rounded-r-lg',
                        disabled
                          ? 'text-kalkvit/25 cursor-not-allowed'
                          : selectedDate === day.dateStr
                            ? 'bg-koppar text-kalkvit rounded-lg'
                            : 'text-kalkvit/70 hover:bg-white/[0.08]',
                      )}
                    >
                      <p className="text-[10px] leading-tight">{day.dayShort}</p>
                      <p className="text-sm font-semibold leading-tight mt-0.5">{day.dateNum}</p>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Month view */}
            {calendarView === 'month' && (
              <div>
                <div className="grid grid-cols-7 mb-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                    <div key={d} className="text-[10px] text-center text-kalkvit/30 font-medium py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {monthData.cells.map((cell, i) => {
                    if (!cell) return <div key={`empty-${i}`} />
                    const hasSlot = availabilitySlots?.some(
                      (s) => s.day.toLowerCase() === cell.dayLong.toLowerCase(),
                    )
                    const disabled = !hasSlot || cell.isPast
                    const isSelected = selectedDate === cell.dateStr
                    const isToday = cell.dateStr === todayStr
                    return (
                      <button
                        key={cell.dateStr}
                        onClick={() => { if (!disabled) { setSelectedDate(cell.dateStr); setSelectedTime(null) } }}
                        disabled={disabled}
                        className={cn(
                          'py-1.5 text-center text-sm transition-all rounded-lg',
                          disabled
                            ? 'text-kalkvit/30 cursor-not-allowed'
                            : isSelected
                              ? 'bg-koppar text-kalkvit font-semibold'
                              : isToday
                                ? 'text-koppar font-semibold hover:bg-white/[0.08]'
                                : 'text-kalkvit/70 hover:bg-white/[0.08]',
                        )}
                      >
                        {cell.day}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

        {/* Session duration */}
        {selectedDate && (
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
        )}

        {/* Time slots */}
        {selectedDate && (
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
        )}

        {bookingError && (
          <div className="p-3 rounded-xl bg-tegelrod/10 border border-tegelrod/20 text-sm text-tegelrod">
            {bookingError}
          </div>
        )}
      </div>

      <GlassModalFooter>
        <GlassButton variant="ghost" onClick={handleClose}>
          Cancel
        </GlassButton>
        <GlassButton
          variant="primary"
          onClick={handleBook}
          disabled={!selectedDate || !selectedTime || bookSessionMutation.isPending || checkoutMutation.isPending}
        >
          {bookSessionMutation.isPending || checkoutMutation.isPending ? (
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
          ) : (
            <CalendarIcon className="w-4 h-4" />
          )}
          Confirm & Pay — ${sessionPrice?.amount || 0}
        </GlassButton>
      </GlassModalFooter>
    </GlassModal>
  )
}
