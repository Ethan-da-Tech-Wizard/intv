import React, { useState } from 'react'
import { Bell, CheckCircle, XCircle, Clock, Phone, Mail } from 'lucide-react'

interface NotificationLog {
  id: string
  eventType: string
  channel: 'SMS' | 'Email'
  recipientMasked: string
  templateKey: string
  status: 'Pending' | 'Sent' | 'Failed'
  attemptCount: number
  lastError?: string
  createdAt: Date
}

export const NotificationLogs: React.FC = () => {
  const [filterChannel, setFilterChannel] = useState<'ALL' | 'SMS' | 'Email' | 'Failed'>('ALL')
  const [smsEnabled, setSmsEnabled] = useState(true)

  const [logs] = useState<NotificationLog[]>([
    {
      id: 'n1',
      eventType: 'Walkin_Paperwork_Completed',
      channel: 'SMS',
      recipientMasked: '(602) ***-0199',
      templateKey: 'walkin_ready_alert',
      status: 'Sent',
      attemptCount: 1,
      createdAt: new Date(Date.now() - 10 * 60 * 1000),
    },
    {
      id: 'n2',
      eventType: 'Interview_Scheduled_Confirmation',
      channel: 'Email',
      recipientMasked: 's***@sheapostacute.com',
      templateKey: 'interview_booking_candidate',
      status: 'Sent',
      attemptCount: 1,
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
    },
    {
      id: 'n3',
      eventType: 'Shadow_Shift_Booked',
      channel: 'SMS',
      recipientMasked: '(602) ***-4410',
      templateKey: 'shadow_host_alert',
      status: 'Failed',
      attemptCount: 1,
      lastError: 'Provider SMS Dispatch Disabled (Free Mode)',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  ])

  const filteredLogs = logs.filter((log) => {
    if (filterChannel === 'ALL') return true
    if (filterChannel === 'SMS') return log.channel === 'SMS'
    if (filterChannel === 'Email') return log.channel === 'Email'
    if (filterChannel === 'Failed') return log.status === 'Failed'
    return true
  })

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl shadow-2xl">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Outbound Notification Logs</h2>
            <p className="text-xs text-slate-400">Transactional delivery audit trail for SMS and Email alerts (365-day retention)</p>
          </div>
        </div>

        {/* SMS Toggle & Filters */}
        <div className="flex items-center gap-3">
          {/* SMS Mode Switcher */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs">
            <span className="text-slate-400 font-medium">SMS Dispatch</span>
            <button
              onClick={() => setSmsEnabled(!smsEnabled)}
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase transition ${
                smsEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {smsEnabled ? 'Enabled' : 'Disabled (Free)'}
            </button>
          </div>

          {/* Filter Channel Buttons */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 p-1 text-xs">
            {(['ALL', 'SMS', 'Email', 'Failed'] as const).map((ch) => (
              <button
                key={ch}
                onClick={() => setFilterChannel(ch)}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  filterChannel === ch
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Outbox Logs List */}
      <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg hover:border-cyan-500/40 transition"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  log.channel === 'SMS'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                }`}
              >
                {log.channel === 'SMS' ? <Phone className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{log.eventType}</h4>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-400">
                  <span className="font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {log.templateKey}
                  </span>
                  <span>Recipient: <strong className="text-slate-300">{log.recipientMasked}</strong></span>
                  <span>• {log.createdAt.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              {log.status === 'Sent' && (
                <span className="flex items-center gap-1 text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <CheckCircle className="w-3.5 h-3.5" /> Sent (1 try)
                </span>
              )}
              {log.status === 'Failed' && (
                <span className="flex items-center gap-1 text-rose-400 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30">
                  <XCircle className="w-3.5 h-3.5" /> Failed
                </span>
              )}
              {log.status === 'Pending' && (
                <span className="flex items-center gap-1 text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5" /> Pending
                </span>
              )}
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            No notification outbox logs matching filter
          </div>
        )}
      </div>
    </div>
  )
}
