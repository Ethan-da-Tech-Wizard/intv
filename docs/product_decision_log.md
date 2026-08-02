# Product Decision Log (PDL): Shea Post Acute Scheduling App

This document logs critical architectural, security, and workflow decisions resolved during the planning and system audit phase to prevent downstream code rewrites.

---

## 1. Authentication vs. Roster separation (Question 1)
* **Decision**: We will separate application authentication accounts from the actual physical facility staff roster.
* **Implementation**:
  * Create a `staff_members` table for all roster entries (interviewer managers, floor shadow hosts, preceptors) with columns for name, title, default shift, contact info, and active status.
  * Create a `user_accounts` table linking `auth.users` to `staff_members`. Only staff who conduct scheduling, receptionist check-ins, or admin functions will have a credentials record.
  * Floor-only shadow hosts and external registry preceptors exist purely as database records in `staff_members` and have no logins.

---

## 2. Granular Role-Based Permissions (Question 2)
* **Decision**: De-couple clinical roles (CNA, Nurse) from system permissions (Scheduler, Receptionist, Admin, Interviewer).
* **Implementation**:
  * Define explicit system roles: `Scheduler`, `Receptionist`, `Interviewer`, `Recovery_Admin`, `System_Admin`.
  * Track clinical specialties (CNA, Nurse) as staff roster properties (`job_role`).
  * Support multi-role profiles (e.g. a Nurse who also has Scheduler and Interviewer credentials).

---

## 3. Server-Authoritative Booking & Conflict Engine (Question 3 & 4)
* **Decision**: The backend database server, not client-side React UI forms, is the single source of truth for scheduling rules, overbooking validations, and conflict prevention.
* **Implementation**:
  * Events will record explicit start and end moments using `scheduled_start_at` and `scheduled_end_at` (TIMESTAMPTZ).
  * Write mutations will route through a PostgreSQL RPC function `schedule_event(...)` that executes inside a transaction block, checking for concurrent overlaps and resource locks.
  * Overrides (e.g. overbooking or scheduling unavailable interviewers) require writing an immutable audit row in `schedule_overrides` logging the conflicting event ID, actor ID, timestamp, and justification code.

---

## 4. Authoritative Date & Time Standard (Question 5)
* **Decision**: Standardize all database date/time values using the `TIMESTAMPTZ` timezone-aware format.
* **Implementation**:
  * Store all dates/times relative to UTC.
  * Set the default application render layer to display times in the facility's local timezone: **`America/Phoenix`** (Scottsdale, AZ), bypassing device-local timezone offsets.
  * Define night shifts (11:00 PM - 7:00 AM) based on the shift start date.

---

## 5. Canonical Candidate Pipeline & Episode Logging (Question 6 & 7)
* **Decision**: Implement a strict candidate stage state machine and separate candidate identity from individual reapplication episodes.
* **Implementation**:
  * Create a `people` table for durable candidate name and contact records.
  * Create an `applications` table referencing `people` for individual candidacy instances (allowing a candidate to re-apply months later without corrupting historical notes).
  * Enforce canonical stage progression transitions (New $\rightarrow$ Interview_Scheduled $\rightarrow$ Interviewing $\rightarrow$ Shadow_Pending $\rightarrow$ Shadow_Scheduled $\rightarrow$ Final_Review $\rightarrow$ Offer_Pending $\rightarrow$ Training $\rightarrow$ Employed $\rightarrow$ Rejected / Withdrawn / Archived) logged via `application_stage_history` audits.

---

## 6. Walk-In Lobby Lifecycle & Server-Generated Deadlines (Question 8)
* **Decision**: Walk-ins transition through an explicit state machine, and countdown targets are calculated relative to server-generated timestamps rather than client-side intervals.
* **Implementation**:
  * Track walk-in queue states: `Checked_In`, `Completing_Paperwork`, `Ready`, `Interviewer_Notified`, `Acknowledged`, `Interview_In_Progress`, `Completed`, `Left_Lobby`.
  * Save a `ready_at` database timestamp during receptionist check-in. The UI computes remaining time as `ready_at - current_time` to prevent background browser timer drift.
  * Schedulers select the interviewer immediately. If unassigned, the system broadcasts lobby check-in notifications to all active interviewers.

---

## 7. Transactional Notification Outbox & Escalation (Question 9)
* **Decision**: Re-engineer notifications into a durable transaction outbox queue, tracking delivery feedback and human acknowledgements before escalating alerts.
* **Implementation**:
  * Outbound notifications write to a `notification_outbox` queue table. A database edge worker processes entries and triggers retries for temporary network drops.
  * Schedulers toggle mute preferences via `profiles`. Muted interviewers block browser chimes and SMS alerts but remain visible on active queue panels.
  * If the assigned interviewer does not click the dashboard "Acknowledge" button within **5 minutes** of the walk-in timer hitting zero, the outbox executes escalation alerts to backup interviewers and schedulers.

---

## 8. Shared-Device Local Application Lock (Question 10)
* **Decision**: Introduce a local UI lock with short-lived session caches to protect shared nursing station tablets.
* **Implementation**:
  * While Supabase login tokens persist for 30 days, the user interface locks after **15 minutes** of inactivity, backgrounding, or device sleep.
  * Unlocking the interface requires entering the user's 4-digit PIN. The PIN is hashed (`pin_hash`) on the server.
  * PIN caches are held in client volatile memory only (not in `localStorage` or `IndexedDB`) and clear on user switches or lockouts.
  * Normal UI actions use standard Supabase Auth tokens; transaction PIN checks apply exclusively to destructive deletes, overrides, and recovery gates.

---

## 9. Staffing Quota Representation (Question 11 & 12)
* **Decision**: Express hiring needs as required Full-Time Equivalents (FTE) rather than simple vacancy headcounts.
* **Implementation**:
  * Track shift staffing allocations via `staffing_requirements` (FTE targets) and `employment_assignments`.
  * Vacancy math resolves as: `Required FTE - Active Employed FTE - Accepted Offers = Remaining Projected Need`.
  * Over-hiring displays exception notifications to schedulers rather than appending zero-target Needs rows, preventing manual typos.

---

## 10. Shadow Preceptor Capacities (Question 13)
* **Decision**: Floor preceptors and shadow hosts are structured resources with defined training capacities.
* **Implementation**:
  * Create `staff_capabilities` to map which floor hosts are qualified to precept CNAs or Nurses, and their maximum concurrent candidate capacities.
  * Record shadow shift events as structured event assignments.

---

## 11. Transactional Deletion Batches (Question 14)
* **Decision**: Deletion and recovery cascading operations must use explicit UUID batch identifiers inside transactional database routines.
* **Implementation**:
  * Deleting a candidate generates a unique `deletion_batch_id` stamped on the parent profile and all cascaded children (bookings, shadow records, orientation dates).
  * Recovery calls restore records sharing that batch ID in a single transaction block.
  * Before committing recoveries, the database checks for current conflicts (overlapping restored bookings, disabled hosts) and presents a conflict preview screen.

---

## 12. HIPAA & Privacy Safeguards (Question 15)
* **Decision**: Restrict candidate PII (Personal Identifiable Information) and evaluation comments to authorized application roles.
* **Implementation**:
  * Suppress desired wages, referral details, and interviewer ratings from floor-staff shadow feedback views.
  * Mask phone numbers and emails on notification logs and lobby dashboard cards.
  * Candidate records are not cached locally in browser storage when PWA offline modes are active.
