# Milestone 3 Frontend Architecture Specification

**Component Layer Architecture for Shea Post Acute Interview Scheduling & Candidate Tracking App**

---

## 1. Security & Authentication Layer (`AuthContext.tsx` & `PINModal.tsx`)

* **Active Profile Context**: Maintains state for selected user account (`user_id`), linked `staff_member_id`, active roles (`scheduler`, `receptionist`, `interviewer`, `recovery_admin`, `system_admin`), and active profile details.
* **5-Minute Cached Transaction PIN Token**:
  - Write actions (`schedule_interview`, `soft_delete`, `recover_batch`) check if `pin_verified_at` timestamp is within the last 5 minutes.
  - If expired or unverified, `PINModal` is rendered.
  - Verification calls Supabase RPC `verify_profile_pin(target_user_id, input_pin)`.
  - Failed attempts increment lockout counter; 5 consecutive failures trigger a 15-minute countdown lockout screen.

---

## 2. Calendar Grid Engine (`CalendarGrid.tsx`)

* **Timezone & Granularity**: Enforces facility local timezone (`America/Phoenix`). Renders 15-minute slot rows between 8:00 AM and 5:00 PM (36 slots per day, Mon-Fri).
* **Live Current Time Indicator**: Calculates offset percentage for current day column if within Mon-Fri 8:00 AM – 5:00 PM and renders a glowing red horizontal indicator line.
* **Status Badges**:
  - 🟢 **Available**: Staff member availability slot (`availability`).
  - 🔴 **Booked**: Active interview appointment (`bookings`).
  - 🟧 **Recurring Exception**: Weekly recurring busy block (`recurring_exceptions`).
  - 🩶 **Off-Duty**: Date-specific exception (`date_exceptions`).
  - 🟡 **Lobby Arrival (Yellow Pulse)**: Booking marked `Checked_In` or `Ready`.

---

## 3. Conflict Prevention & Override Engine (`BookingModal.tsx`)

* **Client-Side Conflict Detection**:
  - Evaluates requested interview time against interviewer availability and date exceptions.
  - Detects double-booking risks (interviews starting within 30 minutes of an existing booking).
* **PIN-Gated Override Confirmation**:
  - Displays a warning banner: *"Warning: Interviewer is booked or off-duty during this slot."*
  - Requires explicit click-to-proceed which logs a JSON snapshot into `schedule_overrides`.

---

## 4. Roster Auto-Save Host Selector (`HostSelector.tsx`)

* **Shift Filtering**: Dynamically filters staff list by default shift (`Day`, `Evening`, `Night`).
* **Write-in Host Auto-Save**: Allows typing custom staff names. Selecting a custom write-in triggers a modal prompt: *"Would you like [Host Name] to be saved permanently to the roster?"*, creating a new row in `staff_members`.
