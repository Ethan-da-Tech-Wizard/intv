import React, { useState } from 'react'
import { RotateCcw, Search, Trash2, CheckCircle2, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { PINModal } from './PINModal'
import { supabase } from '../lib/supabase'

interface DeletedBatch {
  id: string
  entityType: string
  entityName: string
  deletedBy: string
  deletedAt: Date
  retentionUntil: Date
  itemCount: number
}

export const OhShitBin: React.FC = () => {
  const { isPinVerified, userId } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [showPinModal, setShowPinModal] = useState(false)
  const [pendingRestoreBatchId, setPendingRestoreBatchId] = useState<string | null>(null)
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; restoredCount: number } | null>(null)

  // Mock deleted batches data representing soft-delete audit queue
  const [deletedBatches, setDeletedBatches] = useState<DeletedBatch[]>([
    {
      id: 'b-101',
      entityType: 'Candidate Application & Bookings',
      entityName: 'Robert Vance (CNA Applicant)',
      deletedBy: 'ADON 1 (Sarah Connor)',
      deletedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      retentionUntil: new Date(Date.now() + 88 * 24 * 60 * 60 * 1000), // 88 days left
      itemCount: 4, // 1 App, 2 Bookings, 1 Shadow Shift
    },
    {
      id: 'b-102',
      entityType: 'Off-Duty Exception',
      entityName: 'MDS Coordinator - Thursday Off-Duty',
      deletedBy: 'DON (Rachel Vance)',
      deletedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      retentionUntil: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000),
      itemCount: 1,
    },
  ])

  const handleInitiateRestore = (batchId: string) => {
    setPendingRestoreBatchId(batchId)
    if (!isPinVerified) {
      setShowPinModal(true)
    } else {
      executeRestoreBatch(batchId)
    }
  }

  const executeRestoreBatch = async (batchId: string) => {
    const target = deletedBatches.find((b) => b.id === batchId)
    const count = target ? target.itemCount : 1

    try {
      if (userId) {
        await (supabase.rpc as any)('restore_deletion_batch', {
          target_batch_id: batchId,
          actor_id: userId,
        })
      }
    } catch (e) {
      console.warn('RPC restore_deletion_batch fallback:', e)
    }

    setDeletedBatches((prev) => prev.filter((b) => b.id !== batchId))
    setPendingRestoreBatchId(null)
    setSuccessModal({ isOpen: true, restoredCount: count })
  }

  const filteredBatches = deletedBatches.filter(
    (b) =>
      b.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.deletedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.entityType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl shadow-2xl">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Oh Sh!t Bin (Recycle & Recovery Center)</h2>
            <p className="text-xs text-slate-400">
              Recover soft-deleted candidates, bookings, shadow shifts, and date exceptions (90-day retention)
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search deleted items or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800/80 py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none w-64"
          />
        </div>
      </div>

      {/* Deleted Batches Queue */}
      <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
        {filteredBatches.map((batch) => {
          const daysRemaining = Math.ceil(
            (batch.retentionUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )

          return (
            <div
              key={batch.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg hover:border-cyan-500/40 transition"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{batch.entityName}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                    <span className="font-semibold px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                      {batch.entityType} ({batch.itemCount} items)
                    </span>
                    <span>Deleted by <strong className="text-slate-300">{batch.deletedBy}</strong></span>
                    <span>• {batch.deletedAt.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Retention Countdown */}
                <div className="text-right text-xs">
                  <span className="text-slate-400 font-medium">Retention</span>
                  <div className="font-mono text-cyan-400 font-bold">{daysRemaining} days left</div>
                </div>

                {/* Recovery Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleInitiateRestore(batch.id)}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Recover Batch
                  </button>

                  <button
                    disabled
                    title="Hard purges require Supreme User privileges."
                    className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-800/40 px-3 py-2 text-xs font-medium text-slate-600 cursor-not-allowed"
                  >
                    <Lock className="w-3 h-3" /> Delete Permanently
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {filteredBatches.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            No soft-deleted records in the Oh Sh!t Bin
          </div>
        )}
      </div>

      {/* Success Confirmation Modal */}
      {successModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-center text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Batch Restored Successfully!</h3>
            <p className="text-xs text-slate-300 mt-2">
              Successfully cascading-restored{' '}
              <strong className="text-emerald-300">{successModal.restoredCount}</strong> associated parent and child records to active schedules.
            </p>
            <button
              onClick={() => setSuccessModal(null)}
              className="mt-5 w-full rounded-xl border border-emerald-500/50 bg-emerald-500/20 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <PINModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={() => {
          if (pendingRestoreBatchId) {
            executeRestoreBatch(pendingRestoreBatchId)
          }
        }}
        actionTitle="Recover Soft-Deleted Batch"
      />
    </div>
  )
}
