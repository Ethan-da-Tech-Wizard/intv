# Repository Structure Plan

---

## 1. Directory Tree Plan
The project will be structured to isolate the documentation, frontend Single Page Application (SPA), and backend serverless configuration (Supabase).

```text
/home/ethan/intv/
├── docs/                      # Project documentation (Milestone 1)
│   ├── problem_statement.md
│   ├── prd.md
│   ├── frd.md
│   ├── srd.md
│   ├── architecture_diagram.md
│   ├── scope_lock_milestones.md
│   ├── repository_structure.md
│   └── risk_register.md
│
├── supabase/                  # Supabase Backend Config & Code
│   ├── config.toml            # Project configuration
│   ├── migrations/            # SQL migration files
│   │   └── 20260801000000_init_schema.sql
│   └── functions/             # Serverless Edge Functions (Deno)
│       └── notify-interviewer/# Triggered by DB updates
│           └── index.ts       # Integrates Twilio & Resend APIs
│
├── src/                       # Frontend React Application Source
│   ├── assets/                # Icons, logos, animations
│   ├── components/            # Reusable UI Components
│   │   ├── ui/                # Base UI elements (buttons, inputs)
│   │   ├── CalendarGrid.tsx   # Mon-Fri schedule dashboard
│   │   ├── BookingModal.tsx   # Interview creation modal
│   │   ├── AvailabilityEditor.tsx # Interviewer availability editor
│   │   ├── AnalyticsLeaderboard.tsx # Interview volumes toggleable charts
│   │   ├── CandidateTracker.tsx # Simple ATS applicant profile grid
│   │   ├── OhShitBin.tsx      # Recycle bin recovery screen
│   │   └── PINLogin.tsx       # 4-digit PIN gatekeeper
│   │
│   ├── context/               # Global state contexts
│   │   └── AuthContext.tsx    # Manages active profile / session PIN
│   │
│   ├── hooks/                 # Custom React Hooks
│   │   ├── useRealtimeBookings.ts # WebSocket subscription hook
│   │   └── useRealtimeAvailability.ts
│   │
│   ├── styles/                # CSS styling configuration
│   │   └── index.css          # Core CSS overrides & Custom styling
│   │
│   ├── utils/                 # Utility functions (dates, formats)
│   │   └── helpers.ts
│   │
│   ├── App.tsx                # Main Router and Page Layout
│   └── main.tsx               # Application mount point
│
├── .env.example               # Template for system keys and URLs
├── index.html                 # HTML entry template
├── package.json               # Node.js dependencies
├── tsconfig.json              # TypeScript compilation setup
├── vite.config.ts             # Bundler configuration
└── tailwind.config.js         # Styling configurations
```
