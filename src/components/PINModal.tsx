import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Lock, ShieldAlert, KeyRound, X } from 'lucide-react'

interface PINModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  actionTitle?: string
}

export const PINModal: React.FC<PINModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = 'Perform Protected Action',
}) => {
  const { verifyPin, pinLockoutUntil, activeProfile } = useAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lockoutRemaining, setLockoutRemaining] = useState(0)

  useEffect(() => {
    if (pinLockoutUntil) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((pinLockoutUntil - Date.now()) / 1000))
        setLockoutRemaining(remaining)
        if (remaining === 0) {
          clearInterval(interval)
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [pinLockoutUntil])

  if (!isOpen) return null

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4 && lockoutRemaining === 0) {
      setPin((prev) => prev + digit)
      setError('')
    }
  }

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1))
    setError('')
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN.')
      return
    }

    setIsSubmitting(true)
    setError('')

    const isValid = await verifyPin(pin)
    setIsSubmitting(false)

    if (isValid) {
      setPin('')
      onSuccess()
      onClose()
    } else {
      setPin('')
      setError('Invalid PIN code. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-100">PIN Verification Required</h3>
          <p className="text-xs text-slate-400 mt-1">
            Required to confirm: <span className="font-semibold text-cyan-300">{actionTitle}</span>
          </p>
          {activeProfile && (
            <p className="text-xs text-slate-500 mt-0.5">
              Active User: <span className="text-slate-300">{activeProfile.display_name}</span>
            </p>
          )}
        </div>

        {lockoutRemaining > 0 ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-center text-rose-300 mb-4">
            <ShieldAlert className="w-6 h-6 mx-auto mb-2 text-rose-400" />
            <p className="font-semibold text-sm">PIN Locked Out</p>
            <p className="text-xs mt-1 text-rose-300/80">
              Too many failed attempts. Try again in {Math.floor(lockoutRemaining / 60)}m{' '}
              {lockoutRemaining % 60}s.
            </p>
          </div>
        ) : (
          <>
            {/* PIN Indicator Dots */}
            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`h-4 w-4 rounded-full border transition-all duration-200 ${
                    pin.length > index
                      ? 'border-cyan-400 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                      : 'border-slate-600 bg-slate-800'
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="text-center text-xs font-semibold text-rose-400 mb-4 animate-shake">
                {error}
              </p>
            )}

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  className="flex h-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/60 text-lg font-semibold text-slate-200 hover:bg-slate-700/80 hover:border-cyan-500/50 hover:text-white transition active:scale-95"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleDelete}
                className="flex h-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/40 text-xs font-medium text-slate-400 hover:bg-slate-700/60 hover:text-white transition"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="flex h-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/60 text-lg font-semibold text-slate-200 hover:bg-slate-700/80 hover:border-cyan-500/50 hover:text-white transition active:scale-95"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={pin.length !== 4 || isSubmitting}
                className="flex h-12 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <KeyRound className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        <div className="text-center text-[10px] text-slate-500">
          5-minute session security enabled. PIN verification cached in memory.
        </div>
      </div>
    </div>
  )
}
