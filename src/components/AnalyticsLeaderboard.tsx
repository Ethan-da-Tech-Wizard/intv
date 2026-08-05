import React, { useState } from 'react'
import { BarChart3, Trophy, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface InterviewerStats {
  id: string
  name: string
  role: string
  completed: number
  canceled: number
  noShow: number
  workingTimeMinutes: number
}

export const AnalyticsLeaderboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('month')

  const [stats] = useState<InterviewerStats[]>([
    {
      id: 's1',
      name: 'ADON 1 (Sarah Connor)',
      role: 'Management',
      completed: 24,
      canceled: 2,
      noShow: 1,
      workingTimeMinutes: 1110, // 18h 30m
    },
    {
      id: 's2',
      name: 'MDS Coordinator (Mark R.)',
      role: 'Management',
      completed: 18,
      canceled: 1,
      noShow: 2,
      workingTimeMinutes: 810, // 13h 30m
    },
    {
      id: 's3',
      name: 'DON (Rachel Vance)',
      role: 'Management',
      completed: 12,
      canceled: 0,
      noShow: 0,
      workingTimeMinutes: 540, // 9h 0m
    },
  ])

  const maxCompleted = Math.max(...stats.map((s) => s.completed), 1)

  const formatHoursMinutes = (mins: number) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}h ${m}m`
  }

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl shadow-2xl">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Interviewer Analytics & Workload Leaderboard</h2>
            <p className="text-xs text-slate-400">Track candidate interview volumes and cumulative staff workload hours</p>
          </div>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 p-1 text-xs">
          {(['today', 'week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1 rounded-lg font-semibold capitalize transition ${
                dateRange === range
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Rankings */}
      <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
        {stats.map((item, idx) => {
          const ratioPct = Math.round((item.completed / maxCompleted) * 100)

          return (
            <div
              key={item.id}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg hover:border-blue-500/40 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs ${
                      idx === 0
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : idx === 1
                        ? 'bg-slate-400/20 text-slate-200 border border-slate-400/40'
                        : 'bg-amber-700/20 text-amber-500 border border-amber-700/40'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {item.name}
                      {idx === 0 && <Trophy className="w-4 h-4 text-amber-400" />}
                    </h4>
                    <p className="text-xs text-slate-400">{item.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> {item.completed} Completed
                  </div>
                  <div className="text-rose-400 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> {item.canceled} Canceled
                  </div>
                  <div className="text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {item.noShow} No Show
                  </div>
                  <div className="text-cyan-300 font-mono flex items-center gap-1 pl-2 border-l border-slate-800">
                    <Clock className="w-3.5 h-3.5" /> {formatHoursMinutes(item.workingTimeMinutes)}
                  </div>
                </div>
              </div>

              {/* Workload Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Workload Ratio</span>
                  <span>{ratioPct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    style={{ width: `${ratioPct}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
