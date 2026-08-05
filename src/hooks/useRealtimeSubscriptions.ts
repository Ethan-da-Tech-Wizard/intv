import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type ConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'

export const useRealtimeSubscriptions = (onDataChange?: () => void) => {
  const [status, setStatus] = useState<ConnectionStatus>('CONNECTING')
  const [lastEventAt, setLastEventAt] = useState<Date | null>(null)

  useEffect(() => {
    const channel = supabase
      .channel('app_realtime_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (_payload) => {
          setLastEventAt(new Date())
          if (onDataChange) onDataChange()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications' },
        (_payload) => {
          setLastEventAt(new Date())
          if (onDataChange) onDataChange()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shadow_shifts' },
        (_payload) => {
          setLastEventAt(new Date())
          if (onDataChange) onDataChange()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'date_exceptions' },
        (_payload) => {
          setLastEventAt(new Date())
          if (onDataChange) onDataChange()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notification_outbox' },
        (_payload) => {
          setLastEventAt(new Date())
          if (onDataChange) onDataChange()
        }
      )
      .subscribe((subscribeStatus) => {
        if (subscribeStatus === 'SUBSCRIBED') {
          setStatus('CONNECTED')
        } else if (subscribeStatus === 'CLOSED' || subscribeStatus === 'CHANNEL_ERROR') {
          setStatus('DISCONNECTED')
        } else {
          setStatus('CONNECTING')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onDataChange])

  return { status, lastEventAt }
}
