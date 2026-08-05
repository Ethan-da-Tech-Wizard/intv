import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CalendarGrid } from './components/CalendarGrid'
import { WalkInQueue } from './components/WalkInQueue'
import { CandidateTracker } from './components/CandidateTracker'
import { TrainingCalendar } from './components/TrainingCalendar'
import { AnalyticsLeaderboard } from './components/AnalyticsLeaderboard'
import { OhShitBin } from './components/OhShitBin'
import { NotificationLogs } from './components/NotificationLogs'
import { useRealtimeSubscriptions } from './hooks/useRealtimeSubscriptions'
import {
  Calendar,
  Users,
  Clock,
  RotateCcw,
  BarChart3,
  Building2,
  Lock,
  Unlock,
  ChevronDown,
  GraduationCap,
  Bell,
  Wifi,
  WifiOff,
} from 'lucide-react'

const DashboardContent: React.FC = () => {
  const {
    activeProfile,
    allStaff,
    userRoles,
    selectProfile,
    isPinVerified,
    clearPinVerification,
  } = useAuth()
  const [activeTab, setActiveTab] = useState<
    'schedule' | 'walkin' | 'pipeline' | 'training' | 'recovery' | 'logs' | 'analytics'
  >('schedule')

  const { status: realtimeStatus } = useRealtimeSubscriptions()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-900">
      {/* Top Application Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-xl px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo & Facility Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Shea Post Acute
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Scottsdale, AZ
                </span>
              </h1>
              <p className="text-xs text-slate-400">CNA & Nurse Interview Scheduling Dashboard</p>
            </div>
          </div>

          {/* Right Header Navigation Controls */}
          <div className="flex items-center gap-4">
            {/* Realtime WebSocket Telemetry Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-800 bg-slate-950/60 text-[11px] font-semibold">
              {realtimeStatus === 'CONNECTED' ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Live Sync</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="text-amber-300">Connecting...</span>
                </>
              )}
            </div>

            {/* PIN Session Security Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-800/40 text-xs">
              {isPinVerified ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-medium">PIN Active (5m)</span>
                  <button
                    onClick={clearPinVerification}
                    className="ml-1 text-[10px] text-slate-400 hover:text-white underline"
                  >
                    Lock
                  </button>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400">PIN Locked</span>
                </>
              )}
            </div>

            {/* Profile Switcher */}
            <div className="relative flex items-center gap-2 border-l border-slate-800 pl-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-white">
                  {activeProfile?.display_name || 'Select Staff'}
                </div>
                <div className="text-[10px] text-slate-400">{activeProfile?.job_role}</div>
              </div>

              <div className="relative">
                <select
                  value={activeProfile?.id || ''}
                  onChange={(e) => selectProfile(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-800 py-1.5 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none appearance-none pr-8 cursor-pointer"
                >
                  {allStaff.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.display_name} ({staff.job_role})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Secondary Navigation Bar */}
      <div className="border-b border-slate-800/60 bg-slate-900/40 px-6 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto overflow-x-auto gap-4">
          <nav className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'schedule'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Calendar className="w-4 h-4" /> Mon–Fri Schedule Grid
            </button>

            <button
              onClick={() => setActiveTab('walkin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'walkin'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Clock className="w-4 h-4" /> Walk-In Lobby Queue
            </button>

            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'pipeline'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4" /> Candidate Pipeline
            </button>

            <button
              onClick={() => setActiveTab('training')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'training'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Training Calendar
            </button>

            <button
              onClick={() => setActiveTab('recovery')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'recovery'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <RotateCcw className="w-4 h-4" /> Oh Sh!t Bin (Recycle)
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'logs'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Bell className="w-4 h-4" /> Outbox Logs
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'analytics'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Leaderboard & Analytics
            </button>
          </nav>

          {/* Role Badges */}
          <div className="flex items-center gap-1.5 shrink-0">
            {userRoles.map((role) => (
              <span
                key={role}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 capitalize"
              >
                {role.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {activeTab === 'schedule' && <CalendarGrid />}
        {activeTab === 'walkin' && <WalkInQueue />}
        {activeTab === 'pipeline' && <CandidateTracker />}
        {activeTab === 'training' && <TrainingCalendar />}
        {activeTab === 'recovery' && <OhShitBin />}
        {activeTab === 'logs' && <NotificationLogs />}
        {activeTab === 'analytics' && <AnalyticsLeaderboard />}
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  )
}

export default App
