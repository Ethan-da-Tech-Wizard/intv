import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react'
import { BookingModal } from './BookingModal'

interface Slot {
  time: string
  label: string
}

export const CalendarGrid: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()))
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null)
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number>(0)

  // Generate 15-min slots from 08:00 to 17:00
  const slots: Slot[] = []
  for (let hour = 8; hour < 17; hour++) {
    for (let min = 0; min < 60; min += 15) {
      const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const labelStr = `${hour12}:${String(min).padStart(2, '0')} ${ampm}`
      slots.push({ time: timeStr, label: labelStr })
    }
  }

  function getMonday(d: Date) {
    const date = new Date(d)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(date.setDate(diff))
  }

  const weekDays = [0, 1, 2, 3, 4].map((offset) => {
    const day = new Date(currentWeekStart)
    day.setDate(day.getDate() + offset)
    return day
  })

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours()
      const mins = now.getMinutes()
      setCurrentTimeMinutes(hours * 60 + mins)
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleSlotClick = (dateStr: string, timeStr: string) => {
    setSelectedSlot({ date: dateStr, time: timeStr })
    setIsBookingOpen(true)
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeekStart(newStart)
  }

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl shadow-2xl">
      {/* Grid Header Controls */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Interview & Shadow Schedule</h2>
            <p className="text-xs text-slate-400">
              Week of {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
              -{' '}
              {weekDays[4].toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-700 bg-slate-800/80 p-1">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentWeekStart(getMonday(new Date()))}
              className="px-3 py-1 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              Today
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedSlot(null)
              setIsBookingOpen(true)
            }}
            className="flex items-center gap-1.5 rounded-xl border border-cyan-500/50 bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> Schedule Candidate
          </button>
        </div>
      </div>

      {/* Grid Status Key */}
      <div className="flex flex-wrap items-center gap-4 py-3 text-xs border-b border-slate-800/60 text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />{' '}
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />{' '}
          Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Recurring Meeting
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-600" /> Off-Duty
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-300 animate-ping" /> Candidate
          Arrived
        </span>
      </div>

      {/* Mon-Fri Grid Body */}
      <div className="flex-1 overflow-auto mt-2 pr-1">
        <div className="grid grid-cols-[70px_repeat(5,1fr)] min-w-[700px] border-b border-slate-800">
          {/* Header Row */}
          <div className="p-2 text-[11px] font-semibold text-slate-500 border-r border-slate-800">
            Time
          </div>
          {weekDays.map((day, idx) => {
            const isToday = day.toDateString() === new Date().toDateString()
            return (
              <div
                key={idx}
                className={`p-2 text-center border-r border-slate-800 ${
                  isToday ? 'bg-cyan-500/10 text-cyan-300 font-bold' : 'text-slate-300'
                }`}
              >
                <div className="text-[11px] uppercase tracking-wider">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-sm font-semibold">{day.getDate()}</div>
              </div>
            )
          })}

          {/* Time Slots Rows */}
          {slots.map((slot) => {
            const [h, m] = slot.time.split(':').map(Number)
            const slotMinutes = h * 60 + m
            const showLiveLine =
              currentTimeMinutes >= slotMinutes && currentTimeMinutes < slotMinutes + 15

            return (
              <React.Fragment key={slot.time}>
                <div className="p-2 text-[10px] text-slate-500 border-r border-b border-slate-800/60 flex items-center justify-end font-mono">
                  {slot.time.endsWith(':00') ? slot.label : ''}
                </div>

                {weekDays.map((day, dIdx) => {
                  const dateStr = day.toISOString().split('T')[0]
                  const isToday = day.toDateString() === new Date().toDateString()

                  // Simulation of mock status for demonstration
                  const isBooked = dIdx === 1 && slot.time === '10:00'
                  const isAvailable = dIdx === 2 && slot.time.startsWith('09')
                  const isArrived = dIdx === 0 && slot.time === '08:30'

                  return (
                    <div
                      key={dIdx}
                      onClick={() => handleSlotClick(dateStr, slot.time)}
                      className={`relative border-r border-b border-slate-800/40 p-1 min-h-[32px] cursor-pointer transition hover:bg-cyan-500/10 group ${
                        isBooked
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                          : isArrived
                          ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-200 animate-pulse'
                          : isAvailable
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                          : 'bg-slate-900/30'
                      }`}
                    >
                      {/* Live Time Red Bar */}
                      {isToday && showLiveLine && (
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-rose-500 z-10 shadow-[0_0_8px_rgba(244,63,94,1)]">
                          <div className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500" />
                        </div>
                      )}

                      {isBooked && (
                        <div className="text-[10px] font-semibold truncate px-1 rounded bg-rose-500/30 border border-rose-500/50">
                          Interview: Jane Doe (CNA)
                        </div>
                      )}

                      {isArrived && (
                        <div className="text-[10px] font-bold truncate px-1 rounded bg-yellow-400/40 text-yellow-100 border border-yellow-400">
                          ARRIVED: John Smith
                        </div>
                      )}

                      <button className="opacity-0 group-hover:opacity-100 absolute right-1 top-1 text-[9px] bg-cyan-500 text-slate-900 font-bold px-1.5 rounded transition">
                        +
                      </button>
                    </div>
                  )
                })}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={() => {
          setIsBookingOpen(false)
        }}
        initialDate={selectedSlot?.date}
        initialSlotTime={selectedSlot?.time}
      />
    </div>
  )
}
