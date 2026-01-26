import { useState } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassAvatar, GlassBadge, GlassSelect } from '../components/ui'
import { Calendar, Clock, Star, ChevronLeft, ChevronRight, Video } from 'lucide-react'
import { cn } from '../lib/utils'

interface Expert {
  id: number
  name: string
  initials: string
  title: string
  specialties: string[]
  rating: number
  reviews: number
  hourlyRate: number
  nextAvailable: string
}

interface TimeSlot {
  time: string
  available: boolean
}

const mockExperts: Expert[] = [
  {
    id: 1,
    name: 'Michael Chen',
    initials: 'MC',
    title: 'Leadership Coach',
    specialties: ['Executive Coaching', 'Team Building', 'Strategic Planning'],
    rating: 4.9,
    reviews: 127,
    hourlyRate: 199,
    nextAvailable: 'Tomorrow',
  },
  {
    id: 2,
    name: 'Sarah Thompson',
    initials: 'ST',
    title: 'Performance Coach',
    specialties: ['Mindset', 'Productivity', 'Goal Setting'],
    rating: 4.8,
    reviews: 89,
    hourlyRate: 149,
    nextAvailable: 'Today',
  },
  {
    id: 3,
    name: 'David Wilson',
    initials: 'DW',
    title: 'Business Mentor',
    specialties: ['Entrepreneurship', 'Scaling', 'Fundraising'],
    rating: 5.0,
    reviews: 64,
    hourlyRate: 249,
    nextAvailable: 'In 2 days',
  },
]

const timeSlots: TimeSlot[] = [
  { time: '9:00 AM', available: true },
  { time: '10:00 AM', available: false },
  { time: '11:00 AM', available: true },
  { time: '12:00 PM', available: false },
  { time: '1:00 PM', available: true },
  { time: '2:00 PM', available: true },
  { time: '3:00 PM', available: false },
  { time: '4:00 PM', available: true },
  { time: '5:00 PM', available: true },
]

const sessionTypes = [
  { value: '30', label: '30 minutes - Quick Check-in' },
  { value: '60', label: '60 minutes - Standard Session' },
  { value: '90', label: '90 minutes - Deep Dive' },
]

function ExpertCard({ expert, isSelected, onSelect }: { expert: Expert; isSelected: boolean; onSelect: () => void }) {
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
          <GlassAvatar initials={expert.initials} size="lg" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-kalkvit">{expert.name}</h3>
            <p className="text-sm text-koppar">{expert.title}</p>
            <div className="flex items-center gap-2 mt-1 text-sm text-kalkvit/50">
              <Star className="w-4 h-4 text-brand-amber fill-brand-amber" />
              <span>{expert.rating} ({expert.reviews} reviews)</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {expert.specialties.slice(0, 2).map((s) => (
                <GlassBadge key={s} variant="default" className="text-xs">{s}</GlassBadge>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-xl font-bold text-kalkvit">${expert.hourlyRate}</p>
            <p className="text-xs text-kalkvit/50">/hour</p>
            <p className="text-xs text-skogsgron mt-2">Next: {expert.nextAvailable}</p>
          </div>
        </div>
      </GlassCard>
    </button>
  )
}

export function BookSessionPage() {
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null)
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [sessionType, setSessionType] = useState('60')

  // Generate calendar days (current week + next week)
  const today = new Date()
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    return {
      date: date.getDate(),
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      isToday: i === 0,
    }
  })

  const handleBook = () => {
    if (selectedExpert && selectedDate && selectedTime) {
      // TODO: Implement booking via API
      console.log('Booking:', { expert: selectedExpert, date: selectedDate, time: selectedTime, duration: sessionType })
    }
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Book a Session</h1>
          <p className="text-kalkvit/60">Schedule a 1-on-1 coaching session with our experts</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Expert Selection */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display text-xl font-semibold text-kalkvit">Choose an Expert</h2>
            {mockExperts.map((expert) => (
              <ExpertCard
                key={expert.id}
                expert={expert}
                isSelected={selectedExpert?.id === expert.id}
                onSelect={() => setSelectedExpert(expert)}
              />
            ))}
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

            {/* Date Selection */}
            <GlassCard variant="base">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-kalkvit">Select Date</h3>
                <div className="flex gap-1">
                  <button className="p-1 rounded hover:bg-white/[0.06] text-kalkvit/50 hover:text-kalkvit">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button className="p-1 rounded hover:bg-white/[0.06] text-kalkvit/50 hover:text-kalkvit">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {days.slice(0, 7).map((day, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day.date)}
                    className={cn(
                      'p-2 rounded-xl text-center transition-all',
                      selectedDate === day.date
                        ? 'bg-koppar text-kalkvit'
                        : day.isToday
                        ? 'bg-white/[0.08] text-kalkvit'
                        : 'hover:bg-white/[0.06] text-kalkvit/70'
                    )}
                  >
                    <p className="text-xs">{day.day}</p>
                    <p className="font-semibold">{day.date}</p>
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Time Selection */}
            <GlassCard variant="base">
              <h3 className="font-semibold text-kalkvit mb-4">Select Time</h3>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => (
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
            </GlassCard>

            {/* Session Summary */}
            {selectedExpert && selectedDate && selectedTime && (
              <GlassCard variant="accent" leftBorder={false}>
                <h3 className="font-semibold text-kalkvit mb-4">Session Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-kalkvit/80">
                    <GlassAvatar initials={selectedExpert.initials} size="sm" />
                    <span>{selectedExpert.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-kalkvit/80">
                    <Calendar className="w-4 h-4 text-koppar" />
                    <span>{days.find(d => d.date === selectedDate)?.month} {selectedDate}</span>
                  </div>
                  <div className="flex items-center gap-3 text-kalkvit/80">
                    <Clock className="w-4 h-4 text-koppar" />
                    <span>{selectedTime} ({sessionType} min)</span>
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
                      ${Math.round(selectedExpert.hourlyRate * (parseInt(sessionType) / 60))}
                    </span>
                  </div>
                  <GlassButton variant="primary" className="w-full" onClick={handleBook}>
                    Confirm Booking
                  </GlassButton>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
