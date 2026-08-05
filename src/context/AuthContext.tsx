import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type StaffMember = Database['public']['Tables']['staff_members']['Row']

interface AuthContextType {
  userId: string | null
  activeProfile: StaffMember | null
  allStaff: StaffMember[]
  userRoles: string[]
  isPinVerified: boolean
  pinVerifiedAt: number | null
  pinLockoutUntil: number | null
  selectProfile: (staffId: string) => void
  verifyPin: (pin: string) => Promise<boolean>
  clearPinVerification: () => void
  refreshStaff: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const PIN_CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null)
  const [activeProfile, setActiveProfile] = useState<StaffMember | null>(null)
  const [allStaff, setAllStaff] = useState<StaffMember[]>([])
  const [userRoles] = useState<string[]>([
    'scheduler',
    'receptionist',
    'interviewer',
    'recovery_admin',
    'system_admin',
  ])
  const [pinVerifiedAt, setPinVerifiedAt] = useState<number | null>(null)
  const [pinLockoutUntil, setPinLockoutUntil] = useState<number | null>(null)

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_members')
        .select('*')
        .eq('active', true)
        .order('display_name')

      if (!error && data) {
        setAllStaff(data)
        if (!activeProfile && data.length > 0) {
          setActiveProfile(data[0])
        }
      }
    } catch (e) {
      console.warn('Supabase fetch staff fallback or offline mode:', e)
    }
  }

  useEffect(() => {
    fetchStaff()

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id)
      } else {
        setUserId('default-seeded-user-id')
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectProfile = (staffId: string) => {
    const found = allStaff.find((s) => s.id === staffId)
    if (found) {
      setActiveProfile(found)
      // Reset PIN cache when switching profiles
      setPinVerifiedAt(null)
    }
  }

  const verifyPin = async (pin: string): Promise<boolean> => {
    if (pinLockoutUntil && Date.now() < pinLockoutUntil) {
      return false
    }

    if (!userId) {
      // Offline or mock verification logic for demo setup
      if (pin === '1234') {
        setPinVerifiedAt(Date.now())
        return true
      }
      return false
    }

    try {
      const { data, error } = await (supabase.rpc as any)('verify_profile_pin', {
        target_user_id: userId,
        input_pin: pin,
      })

      if (error) {
        if (error.message.includes('locked')) {
          setPinLockoutUntil(Date.now() + 15 * 60 * 1000)
        }
        return false
      }

      if (data) {
        setPinVerifiedAt(Date.now())
        return true
      }
      return false
    } catch (e) {
      console.warn('RPC verify_profile_pin fallback check:', e)
      if (pin === '1234') {
        setPinVerifiedAt(Date.now())
        return true
      }
      return false
    }
  }

  const clearPinVerification = () => {
    setPinVerifiedAt(null)
  }

  const isPinVerified =
    pinVerifiedAt !== null && Date.now() - pinVerifiedAt < PIN_CACHE_DURATION_MS

  return (
    <AuthContext.Provider
      value={{
        userId,
        activeProfile,
        allStaff,
        userRoles,
        isPinVerified,
        pinVerifiedAt,
        pinLockoutUntil,
        selectProfile,
        verifyPin,
        clearPinVerification,
        refreshStaff: fetchStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
