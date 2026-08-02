# Scope Lock & Milestones

---

## 1. Scope Lock (Phase 1)
The scope has been locked to address the "nooks and crannies" of Skilled Nursing Facility (SNF) interview coordination.

### IN-SCOPE
1. **Frictionless PIN Login**: Single passcode access. Staff choose their active profile from a header dropdown.
2. **Weekly Grid Calendar (Mon-Fri)**: Fully responsive, color-coded grid (Green: Available, Red: Booked, Orange: Meeting, Grey: Off, Yellow Pulse: Arrived).
3. **Flexible Availability**: Supports weekly templates, date exceptions (Overrides), and recurring weekly meeting blocks (e.g. Thursday 10-11 AM UR).
4. **Warn-on-Overbook Logic**: If a booking is made within 30 minutes of a 45-minute interview's end, the scheduler must click through double warnings to proceed.
5. **Walk-In & "Hot" Alert**: Receptionist logs walk-in, initiating a 30-minute countdown. At the 30-minute mark, the dashboard flashes and sends an urgent SMS.
6. **Lobby Check-In**: Clicking "Mark Arrived" flashes the calendar block yellow and texts the interviewer immediately.
7. **Simple ATS Candidate Profiles**: Quick creation cards capturing name, position, arrival punctuality (On Time / Late / No Show), and brief comments.
8. **"Oh Sh!t" Bin (Recycle)**: Soft-deletes everything. Deleted staff, exceptions, or bookings are recoverable from the recycle panel, unless hard-purged.
9. **Interviewer Leaderboard**: Analytics tab detailing interview volume per interviewer, toggleable across Today, Week, Month, 6 Months, and 1 to 5 Years.
10. **Real-time Synchronization**: WebSockets sync changes in under 2 seconds across all devices.
11. **Notifications**: SMS (Twilio) and Email (Resend) alerts.

### OUT-OF-SCOPE
1. **Candidate-facing Scheduling Panel**: (Database schema will support this, but front-end is out of scope for Phase 1).
2. **HR / ATS Integrations**: No direct integrations with Indeed, ADP, etc.

---

## 2. Project Milestones

### Milestone 1: Requirements & Design (Current)
* **Deliverable**: Complete documentation suite under `/docs`.

### Milestone 2: Infrastructure & Schema Setup
* **Deliverable**: PostgreSQL schema migrations including tables, view definitions, index optimization, and mock data.

### Milestone 3: Core Calendar Grid & Availability Builder
* **Deliverable**: Frontend layouts, color-coded Mon-Fri grid, recurring meeting block editor, and single-date override calendar.

### Milestone 4: Simple ATS & Analytics Leaderboard
* **Deliverable**: Candidate profiles, punctuality tracking logs, and toggleable analytics charts (Today, Month, up to 5 Years).

### Milestone 5: Real-time Sync & Warning Engine
* **Deliverable**: Supabase subscriptions + overbook warning popups + walk-in 30-minute hot alert timers.

### Milestone 6: "Oh Sh!t" Recycle Bin
* **Deliverable**: Soft-delete triggers, bin dashboard, and recovery workflows.

### Milestone 7: SMS & Email Notification Pipeline
* **Deliverable**: Twilio & Resend Edge Function integration for booking alerts, lobby arrivals, and walk-ins.

### Milestone 8: Deployment & Launch
* **Deliverable**: Hosting on Vercel/Netlify.
