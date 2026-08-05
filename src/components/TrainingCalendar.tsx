import React, { useState } from 'react'
import { Calendar, Printer, AlertTriangle } from 'lucide-react'

interface TrainingDay {
  date: string
  shift: 'Day' | 'Evening' | 'Night'
  startTime: string
  endTime: string
  preceptor: string
  notes?: string
  isWeekend?: boolean
}

export const TrainingCalendar: React.FC = () => {
  const [candidateName, setCandidateName] = useState('Elena Rostova')
  const [position, setPosition] = useState<'CNA' | 'Nurse'>('CNA')
  const [startDate, setStartDate] = useState('2026-08-03')
  const [endDate, setEndDate] = useState('2026-08-14')
  const [skipWeekends, setSkipWeekends] = useState(true)
  const [defaultShift, setDefaultShift] = useState<'Day' | 'Evening' | 'Night'>('Day')
  const [preceptorName, setPreceptorName] = useState('Jane Doe')

  const [generatedDays, setGeneratedDays] = useState<TrainingDay[]>([
    {
      date: '2026-08-03',
      shift: 'Day',
      startTime: '07:00',
      endTime: '15:00',
      preceptor: 'Jane Doe',
      notes: 'Facility Orientation & EMR Training',
    },
    {
      date: '2026-08-04',
      shift: 'Day',
      startTime: '07:00',
      endTime: '15:00',
      preceptor: 'Jane Doe',
      notes: 'Floor Shadow & Patient Care Rounds',
    },
  ])

  const handleGenerateBlock = () => {
    const days: TrainingDay[] = []
    const cur = new Date(startDate + 'T00:00:00')
    const last = new Date(endDate + 'T00:00:00')

    const times = {
      Day: { start: '07:00', end: '15:00' },
      Evening: { start: '15:00', end: '23:00' },
      Night: { start: '23:00', end: '07:00' },
    }

    while (cur <= last) {
      const dayOfWeek = cur.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

      if (!skipWeekends || !isWeekend) {
        days.push({
          date: cur.toISOString().split('T')[0],
          shift: defaultShift,
          startTime: times[defaultShift].start,
          endTime: times[defaultShift].end,
          preceptor: preceptorName.trim() || 'Preceptor Name (e.g. Jane Doe)',
          isWeekend: isWeekend,
        })
      }

      cur.setDate(cur.getDate() + 1)
    }

    setGeneratedDays(days)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl shadow-2xl print:bg-white print:text-black print:p-0 print:border-none">
      {/* Header Controls */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 print:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Candidate Block-Training Calendar</h2>
            <p className="text-xs text-slate-400">Generate and print multi-day orientation schedules</p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white transition"
        >
          <Printer className="w-4 h-4" /> Print Schedule
        </button>
      </div>

      {/* Block Generator Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 my-4 p-4 rounded-xl border border-slate-800 bg-slate-950/40 print:hidden">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Candidate</label>
          <input
            type="text"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Position</label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as 'CNA' | 'Nurse')}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
          >
            <option value="CNA">CNA</option>
            <option value="Nurse">Nurse</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Shift</label>
          <select
            value={defaultShift}
            onChange={(e) => setDefaultShift(e.target.value as 'Day' | 'Evening' | 'Night')}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
          >
            <option value="Day">Day (07:00 - 15:00)</option>
            <option value="Evening">Evening (15:00 - 23:00)</option>
            <option value="Night">Night (23:00 - 07:00)</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Preceptor</label>
          <input
            type="text"
            placeholder="Jane Doe"
            value={preceptorName}
            onChange={(e) => setPreceptorName(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-col justify-end gap-1.5">
          <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={skipWeekends}
              onChange={(e) => setSkipWeekends(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-purple-500 focus:ring-0"
            />
            Skip Weekends
          </label>
          <button
            onClick={handleGenerateBlock}
            className="w-full rounded-xl border border-purple-500/50 bg-purple-500/20 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/30 transition"
          >
            Generate Block
          </button>
        </div>
      </div>

      {/* Generated Schedule Handout Grid View */}
      <div className="flex-1 overflow-y-auto print:overflow-visible">
        <div className="text-center py-4 hidden print:block border-b mb-4">
          <h1 className="text-2xl font-bold">Shea Post Acute Scottsdale</h1>
          <h2 className="text-lg font-semibold text-gray-700">
            Orientation Schedule: {candidateName} ({position})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {generatedDays.map((day, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-3.5 ${
                day.isWeekend
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                  : 'border-slate-800 bg-slate-900/80 text-white'
              } print:border-gray-300 print:bg-white print:text-black`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span>{day.date}</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 print:bg-gray-100 print:text-black">
                  {day.shift} ({day.startTime} - {day.endTime})
                </span>
              </div>

              {day.isWeekend && (
                <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-400 font-semibold print:hidden">
                  <AlertTriangle className="w-3 h-3" /> Weekend Training Date
                </div>
              )}

              <div className="mt-2 text-xs space-y-1 text-slate-300 print:text-black">
                <div>
                  <span className="font-semibold text-slate-400 print:text-gray-700">Preceptor: </span>
                  {day.preceptor}
                </div>
                {day.notes && (
                  <div>
                    <span className="font-semibold text-slate-400 print:text-gray-700">Notes: </span>
                    {day.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
