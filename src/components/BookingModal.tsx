import { useState, useMemo } from 'react'
import { GlassButton, GlassModal, GlassModalFooter } from './ui'
import { CalendarIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
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
}

export function BookingModal({ expert, isOpen, onClose, preselectedDate }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(preselectedDate ?? null)
  const [sessionDuration, setSessionDuration] = useState(60)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [bookingError, setBookingError] = useState<string | null>(null)

  const { data: availabilitySlots } = useExpertAvailability(expert.id)

  // Build next 7 days for date picker
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
    setSelectedTime(null)
    if (!preselectedDate) setSelectedDate(null)
    onClose()
  }

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Book Session with ${expert.name}`}
      size="md"
    >
      <div className="space-y-4">
        {/* Date picker — shown when no pre-selected date */}
        {!preselectedDate && (
          <div>
            <p className="text-xs text-kalkvit/50 mb-2 font-medium uppercase tracking-wider">Select Date</p>
            <div className="flex justify-between gap-1">
              {days.map((day) => {
                const hasSlot = availabilitySlots?.some(
                  (s) => s.day.toLowerCase() === day.dayLong.toLowerCase(),
                )
                return (
                  <button
                    key={day.dateStr}
                    onClick={() => { if (hasSlot) { setSelectedDate(day.dateStr); setSelectedTime(null) } }}
                    disabled={!hasSlot}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl text-center transition-all min-w-0',
                      !hasSlot
                        ? 'opacity-30 cursor-not-allowed'
                        : selectedDate === day.dateStr
                          ? 'bg-koppar text-kalkvit'
                          : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1]',
                    )}
                  >
                    <p className="text-[10px] leading-tight">{day.dayShort}</p>
                    <p className="text-sm font-semibold leading-tight mt-0.5">{day.dateNum}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Date display — shown when pre-selected */}
        {preselectedDate && selectedDate && (
          <div className="flex items-center gap-2 text-sm text-kalkvit/70">
            <CalendarIcon className="w-4 h-4 text-koppar" />
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        )}

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
