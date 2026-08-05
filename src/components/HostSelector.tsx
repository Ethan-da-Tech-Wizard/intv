import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { UserPlus, Check, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface HostSelectorProps {
  selectedHostId: string
  selectedShift: 'Day' | 'Evening' | 'Night'
  onSelectHost: (hostId: string, writeInName?: string) => void
}

export const HostSelector: React.FC<HostSelectorProps> = ({
  selectedHostId,
  selectedShift,
  onSelectHost,
}) => {
  const { allStaff, refreshStaff } = useAuth()
  const [isWriteIn, setIsWriteIn] = useState(false)
  const [writeInName, setWriteInName] = useState('')
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')

  // Filter roster hosts by selected shift
  const filteredHosts = allStaff.filter(
    (s) => s.default_shift === selectedShift || s.job_role === 'Management'
  )

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === 'CUSTOM_WRITE_IN') {
      setIsWriteIn(true)
      onSelectHost('', '')
    } else {
      setIsWriteIn(false)
      onSelectHost(val, undefined)
    }
  }

  const handleWriteInSubmit = () => {
    if (writeInName.trim()) {
      setShowSavePrompt(true)
    }
  }

  const handleSaveToRoster = async (savePermanently: boolean) => {
    if (savePermanently && writeInName.trim()) {
      try {
        await (supabase.from('staff_members') as any).insert({
          display_name: writeInName.trim(),
          legal_name: writeInName.trim(),
          job_role: 'Floor Staff',
          default_shift: selectedShift,
          phone: phoneInput.trim() || null,
          active: true,
        })
        await refreshStaff()
      } catch (e) {
        console.warn('Failed to insert write-in staff member to DB:', e)
      }
    }

    onSelectHost('', writeInName.trim())
    setShowSavePrompt(false)
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-300">
        Floor Host / Preceptor ({selectedShift} Shift)
      </label>

      {!isWriteIn ? (
        <div className="relative">
          <select
            value={selectedHostId}
            onChange={handleSelectChange}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 px-3 pr-8 text-sm text-white focus:border-cyan-500 focus:outline-none appearance-none"
          >
            <option value="">-- Select Floor Host --</option>
            {filteredHosts.map((host) => (
              <option key={host.id} value={host.id}>
                {host.display_name} ({host.job_role})
              </option>
            ))}
            <option value="CUSTOM_WRITE_IN">+ Write-in Custom Host...</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-3 w-4 h-4 text-slate-400" />
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type Custom Host Name..."
            value={writeInName}
            onChange={(e) => setWriteInName(e.target.value)}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 py-2 px-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleWriteInSubmit}
            disabled={!writeInName.trim()}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/20 px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-500/30 transition disabled:opacity-40"
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={() => setIsWriteIn(false)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Roster Auto-Save Modal */}
      {showSavePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Save to Staff Roster?</h4>
                <p className="text-xs text-slate-400">Add "{writeInName}" permanently?</p>
              </div>
            </div>

            <div className="space-y-3 my-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Optional Host Phone (for SMS booking alerts)
                </label>
                <input
                  type="tel"
                  placeholder="(602) 555-0199"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSaveToRoster(true)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/20 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 transition"
              >
                <Check className="w-3.5 h-3.5" /> Save to Roster
              </button>
              <button
                type="button"
                onClick={() => handleSaveToRoster(false)}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
              >
                Use Once Only
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
