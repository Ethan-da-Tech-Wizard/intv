# Milestone 4 Frontend Architecture Specification

**Component Layer Architecture for Shea Post Acute Interview Scheduling & Candidate Tracking App**

---

## 1. Candidate ATS Pipeline Engine (`CandidateTracker.tsx`)

* **Stage Lifecycle**: Manages candidate progression across 11 stages:
  `New` -> `Interview_Scheduled` -> `Interviewing` -> `Shadow_Pending` -> `Shadow_Scheduled` -> `Final_Review` -> `Offer_Pending` -> `Training` -> `Employed` -> `Rejected` / `Withdrawn` / `Archived`.
* **Database Triggers**: Changing `applications.application_stage` triggers automatic insert into `application_stage_history`.
* **Candidate Profile Cards**: Display durable candidate contact details, position (`CNA`/`Nurse`), desired shift (`Day`/`Evening`/`Night`), referral source, desired wage, and punctuality badges (`On Time`, `Late`, `No Show`).

---

## 2. Receptionist Walk-In Lobby Queue (`WalkInQueue.tsx`)

* **Registration & Countdown**: Requires Candidate Name, Position, and Paperwork Timer (5–120 mins).
* **Color Urgency Thresholds**:
  - 🟢 Green: $>15$ minutes remaining.
  - 🟧 Orange: 5–15 minutes remaining.
  - 🔴 Flashing Red: $<5$ minutes remaining or candidate waiting $>10$ mins past ready time.
* **Web Audio API Chime**: Synthesizes a soft dual-tone bell sound on browser when "Mark Arrived" is clicked or ready timer hits zero.
* **Outbox Log Creation**: Inserts lobby arrival event into `notification_outbox` for SMS/Email alert processing.

---

## 3. Candidate Block-Training Calendar (`TrainingCalendar.tsx`)

* **Block Range Generator**: Takes start date, end date, and shift type (`Day`: 7–3, `Evening`: 3–11, `Night`: 11–7).
* **Skip Weekends Default**: "Skip Weekends" checkbox automatically skips Saturdays and Sundays. If unchecked, weekend dates are generated with amber warning badges.
* **Print Layout**: Supports `@media print` rules generating clean black-and-white physical calendar sheets for candidate orientation handouts.

---

## 4. Interviewer Analytics Leaderboard (`AnalyticsLeaderboard.tsx`)

* **Workload Ranking**: Ranks staff members by total completed interviews.
* **Workload Ratio Bars**: Renders horizontal CSS progress bars representing workload share proportion relative to top interviewer.
* **Cumulative Time Tallies**: Formats working time in clean hours and minutes (e.g. `18h 30m`), defaulting to 45 minutes per completed interview if actual duration is unpopulated.
