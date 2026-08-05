import React, { useState } from 'react'
import { Clock, UserPlus, Bell, X, User } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface WalkInCandidate {
  id: string
  name: string
  position: 'CNA' | 'Nurse'
  checkInTime: Date
  timerMinutes: number
  status: 'Waiting' | 'Ready' | 'In_Interview'
}

export const WalkInQueue: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [candidateName, setCandidateName] = useState('')
  const [position, setPosition] = useState<'CNA' | 'Nurse'>('CNA')
  const [timerMinutes, setTimerMinutes] = useState<number>(30)

  const [queue, setQueue] = useState<WalkInCandidate[]>([
    {
      id: 'w1',
      name: 'James Wilson',
      position: 'CNA',
      checkInTime: new Date(Date.now() - 15 * 60 * 1000),
      timerMinutes: 30,
      status: 'Waiting',
    },
    {
      id: 'w2',
      name: 'Maria Rodriguez',
      position: 'Nurse',
      checkInTime: new Date(Date.now() - 28 * 60 * 1000),
      timerMinutes: 30,
      status: 'Ready',
    },
  ])

  // Play Web Audio API chime sound
  const playChimeSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5 note
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3) // A5 note

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5)

      osc.connect(gain)
      gain.connect(audioCtx.destination)

      osc.start()
      osc.stop(audioCtx.currentTime + 0.5)
    } catch (e) {
      console.warn('Web Audio chime fallback:', e)
    }
  }

  const handleRegisterWalkIn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!candidateName.trim()) return

    const newCandidate: WalkInCandidate = {
      id: 'w-' + Date.now(),
      name: candidateName.trim(),
      position: position,
      checkInTime: new Date(),
      timerMinutes: timerMinutes,
      status: 'Waiting',
    }

    setQueue((prev) => [newCandidate, ...prev])
    setCandidateName('')
    setShowAddModal(false)
  }

  const markCandidateArrived = async (candidateId: string) => {
    playChimeSound()
    setQueue((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status: 'Ready' } : c))
    )

    try {
      await (supabase.from('notification_outbox') as any).insert({
        event_type: 'Walkin_Paperwork_Completed',
        source_record_id: candidateId,
        recipient_contact: 'lobby-interviewer@sheapostacute.com',
        channel: 'SMS',
        template_key: 'walkin_ready_alert',
        payload: { candidateId, status: 'Ready' },
        status: 'Pending',
      })
    } catch (e) {
      console.warn('Notification outbox insert fallback:', e)
    }
  }

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl shadow-2xl">
      {/* Header Controls */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Walk-In Lobby Queue</h2>
            <p className="text-xs text-slate-400">Receptionist walk-in applicant check-in and countdown timers</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-xs font-semibold text-white hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-amber-500/20 transition active:scale-95"
        >
          <UserPlus className="w-4 h-4" /> Check-In Walk-In
        </button>
      </div>

      {/* Queue List Display */}
      <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
        {queue.map((candidate) => {
          const elapsedMins = Math.floor(
            (Date.now() - candidate.checkInTime.getTime()) / (1000 * 60)
          )
          const remainingMins = Math.max(0, candidate.timerMinutes - elapsedMins)

          const isUrgent = remainingMins < 5
          const isWarning = remainingMins >= 5 && remainingMins <= 15

          return (
            <div
              key={candidate.id}
              className={`flex items-center justify-between rounded-xl border p-4 transition ${
                isUrgent || candidate.status === 'Ready'
                  ? 'border-rose-500/60 bg-rose-500/10 text-rose-200 animate-pulse'
                  : isWarning
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                  : 'border-slate-800 bg-slate-900/80 text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">{candidate.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                    <span className="font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {candidate.position}
                    </span>
                    <span>Checked in {elapsedMins}m ago</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Timer Display */}
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-400">Paperwork Timer</div>
                  <div
                    className={`text-sm font-mono font-bold ${
                      isUrgent
                        ? 'text-rose-400'
                        : isWarning
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {remainingMins} mins remaining
                  </div>
                </div>

                {/* Mark Arrived Action */}
                <button
                  onClick={() => markCandidateArrived(candidate.id)}
                  disabled={candidate.status === 'Ready'}
                  className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/20 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition disabled:opacity-40"
                >
                  <Bell className="w-4 h-4" />{' '}
                  {candidate.status === 'Ready' ? 'Arrived & Notified' : 'Mark Arrived'}
                </button>
              </div>
            </div>
          )
        })}

        {queue.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            No walk-in candidates currently in lobby queue
          </div>
        )}
      </div>

      {/* Receptionist Check-In Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl text-white">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Register Walk-In Candidate</h3>
                <p className="text-xs text-slate-400">Front Desk Check-In</p>
              </div>
            </div>

            <form onSubmit={handleRegisterWalkIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Candidate Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Miller"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Position</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as 'CNA' | 'Nurse')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="CNA">CNA</option>
                  <option value="Nurse">Nurse</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Paperwork Timer (Minutes: 5 - 120)
                </label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2 text-xs font-semibold text-white hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-amber-500/20"
                >
                  Start Timer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
