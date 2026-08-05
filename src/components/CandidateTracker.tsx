import React, { useState } from 'react'
import {
  Users,
  Search,
  Clock,
  Briefcase,
  DollarSign,
  ChevronRight,
} from 'lucide-react'
import { PINModal } from './PINModal'
import { useAuth } from '../context/AuthContext'

interface CandidateCard {
  id: string
  name: string
  position: 'CNA' | 'Nurse'
  shift: 'Day' | 'Evening' | 'Night'
  stage: string
  referralSource?: string
  desiredWage?: string
  punctuality?: 'On Time' | 'Late' | 'No Show'
  hiringOutcome?: string
  appliedDate: string
}

export const CandidateTracker: React.FC = () => {
  const { isPinVerified } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL')
  const [showPinModal, setShowPinModal] = useState(false)
  const [pendingStageChange, setPendingStageChange] = useState<{
    candidateId: string
    newStage: string
  } | null>(null)

  // Mock candidates data representing ATS state
  const [candidates, setCandidates] = useState<CandidateCard[]>([
    {
      id: 'c1',
      name: 'Sarah Jenkins',
      position: 'CNA',
      shift: 'Day',
      stage: 'Interview_Scheduled',
      referralSource: 'Indeed',
      desiredWage: '$22/hr',
      punctuality: 'On Time',
      appliedDate: '2026-08-01',
    },
    {
      id: 'c2',
      name: 'Michael Chang',
      position: 'Nurse',
      shift: 'Night',
      stage: 'Shadow_Scheduled',
      referralSource: 'Employee Referral (Maria R.)',
      desiredWage: '$38/hr',
      punctuality: 'On Time',
      hiringOutcome: 'Recommended',
      appliedDate: '2026-07-28',
    },
    {
      id: 'c3',
      name: 'Elena Rostova',
      position: 'CNA',
      shift: 'Evening',
      stage: 'Training',
      referralSource: 'Walk-in',
      desiredWage: '$23/hr',
      hiringOutcome: 'In_Training',
      appliedDate: '2026-07-25',
    },
    {
      id: 'c4',
      name: 'David Miller',
      position: 'Nurse',
      shift: 'Day',
      stage: 'Final_Review',
      referralSource: 'LinkedIn',
      desiredWage: '$40/hr',
      punctuality: 'Late',
      appliedDate: '2026-07-29',
    },
  ])

  const stages = [
    { key: 'New', label: 'New Applicants' },
    { key: 'Interview_Scheduled', label: 'Interview Scheduled' },
    { key: 'Interviewing', label: 'Interviewing' },
    { key: 'Shadow_Pending', label: 'Shadow Pending' },
    { key: 'Shadow_Scheduled', label: 'Shadow Scheduled' },
    { key: 'Final_Review', label: 'Final Review' },
    { key: 'Training', label: 'In Training' },
    { key: 'Employed', label: 'Hired & Employed' },
  ]

  const handleStageMove = (candidateId: string, newStage: string) => {
    if (!isPinVerified) {
      setPendingStageChange({ candidateId, newStage })
      setShowPinModal(true)
    } else {
      applyStageChange(candidateId, newStage)
    }
  }

  const applyStageChange = (candidateId: string, newStage: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, stage: newStage } : c))
    )
    setPendingStageChange(null)
  }

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.position.toLowerCase().includes(searchTerm.toLowerCase())

    if (selectedFilter === 'ALL') return matchesSearch
    if (selectedFilter === 'CNA') return matchesSearch && c.position === 'CNA'
    if (selectedFilter === 'Nurse') return matchesSearch && c.position === 'Nurse'
    return matchesSearch
  })

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl shadow-2xl">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Candidate ATS Pipeline</h2>
            <p className="text-xs text-slate-400">Track candidates from initial application to employment</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800/80 py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none w-56"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 p-1 text-xs">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                selectedFilter === 'ALL'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFilter('CNA')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                selectedFilter === 'CNA'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              CNA
            </button>
            <button
              onClick={() => setSelectedFilter('Nurse')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                selectedFilter === 'Nurse'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Nurse
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Pipeline Columns */}
      <div className="flex-1 overflow-x-auto mt-4 pb-2">
        <div className="flex gap-4 min-w-[1200px] h-full">
          {stages.map((stage) => {
            const stageCandidates = filteredCandidates.filter((c) => c.stage === stage.key)

            return (
              <div
                key={stage.key}
                className="flex-1 min-w-[240px] flex flex-col rounded-xl border border-slate-800 bg-slate-950/40 p-3"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
                  <span className="font-bold text-slate-300">{stage.label}</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-semibold text-cyan-400">
                    {stageCandidates.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {stageCandidates.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 shadow-lg hover:border-cyan-500/40 transition group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white">{c.name}</h4>
                          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 mt-1">
                            {c.position} ({c.shift})
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/60 space-y-1 text-[11px] text-slate-400">
                        {c.desiredWage && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3 h-3 text-emerald-400" />
                            <span>Desired: {c.desiredWage}</span>
                          </div>
                        )}
                        {c.referralSource && (
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="w-3 h-3 text-cyan-400" />
                            <span>Source: {c.referralSource}</span>
                          </div>
                        )}
                        {c.punctuality && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>Punctuality: {c.punctuality}</span>
                          </div>
                        )}
                      </div>

                      {/* Advance Stage Button */}
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => {
                            const nextStageIndex =
                              stages.findIndex((s) => s.key === c.stage) + 1
                            if (nextStageIndex < stages.length) {
                              handleStageMove(c.id, stages[nextStageIndex].key)
                            }
                          }}
                          className="flex items-center gap-1 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 transition"
                        >
                          Advance <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {stageCandidates.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-24 text-[11px] text-slate-600 border border-dashed border-slate-800/80 rounded-xl">
                      No candidates
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <PINModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={() => {
          if (pendingStageChange) {
            applyStageChange(pendingStageChange.candidateId, pendingStageChange.newStage)
          }
        }}
        actionTitle="Advance Candidate Stage"
      />
    </div>
  )
}
