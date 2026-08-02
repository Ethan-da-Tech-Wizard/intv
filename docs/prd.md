# Product Requirements Document (PRD): SNF Scheduling App

---

## 1. Introduction
This Product Requirements Document (PRD) defines the requirements for the Shea Post Acute Interview Scheduling, Shadowing & Candidate Tracking App. The app serves as a real-time scheduling dashboard, hiring needs tracker, and applicant pipeline tracker designed to eliminate scheduling conflicts, facilitate floor shadowing, log interviewer analytics, and ensure floor staff are notified immediately when candidates arrive.

---

## 2. Target Audience & Personas
1. **Schedulers / Facility Managers (e.g., GF, HR, Director of Nursing)**
   * *Needs*: Wants to see at a glance who is available to conduct CNA/Nursing interviews on a given day/time, schedule candidate first and final interviews, schedule floor shadow shifts, receive notifications when interviews and shadow shifts are completed, mark candidate arrivals, track candidate diagnostics, review interviewer analytics, and access the notification log.
2. **Interviewers (Management Staff - e.g. ADON 1, MDS Coordinator)**
   * *Needs*: Wants a simple way to set availability, block out custom dates/times or recurring meetings (like UR meetings), receive text/email notifications, log actual interview durations, and write brief candidate notes.
3. **Floor Staff (CNA & Floor Nurses)**
   * *Needs*: Wants a clear list of candidates assigned to shadow them on shift, receive text notifications when shadow shifts are booked (if their phone number is populated), and update shadow shift feedback.
4. **Front Desk / Receptionist**
   * *Needs*: A simple check-in system to mark walk-ins or scheduled interviews as arrived, triggering immediate alerts.

---

## 3. Product Goals
* **Real-Time Consistency**: 100% synchronization. Updates reflect instantly on all active screens.
* **Granular Account Access & PIN Verification**: Secure login credentials (email/password) for users, plus a secondary 4-digit PIN for making changes.
* **30-Day Session Persistence**: Desktop sessions persist for 30 days to avoid repetitive password logins at nursing stations. All write operations are protected by the 5-minute cached transaction PIN.
* **Automated Free Security (Hacking Prevention)**: Password resets and 2FA recovery handled automatically using Supabase Auth's free tier (supporting email OTP and free authenticator apps), requiring zero customer support.
* **Multi-Stage Hiring Pipeline**: Seamless tracking of candidates from First Interview $\rightarrow$ Floor Shadow Shift $\rightarrow$ Final Interview $\rightarrow$ Training $\rightarrow$ Employed.
* **Hiring Needs Schedule Triangulation**: Open needs automatically decrement when candidates are hired, and automatically increment (repopulate) if a hire drops out before starting.
* **Write-in Dropdowns with Auto-Addition**: Schedulers can write in custom staff names on selectors; a dialog prompts to add them to the roster permanently.
* **Multi-Platform Compliance (PWA)**: Built as a Progressive Web App (PWA) to run natively on Windows, macOS, Linux, iOS, and Android using a single codebase for free.

---

## 4. User Stories

### For Schedulers / Managers / Front Desk
* **US-1**: As a Scheduler, I want to view a weekly grid showing interviewer availability with a visible color-coded key.
* **US-2**: As a Scheduler, I want to book interviews in 15-minute increments between 8:00 AM and 5:00 PM, or input a custom outlier time. Schedulers can navigate weeks/months in advance to pre-book schedules.
* **US-3**: As a Scheduler, I want to book shadow shifts for candidates, selecting a floor worker to host the candidate and inputting the shift time (Day/Evening/Night).
* **US-4**: As a Scheduler, when assigning a floor shadow host, I want the dropdown to filter for staff members working that specific shift, but allow me to write in a custom name if they aren't on the list.
* **US-5**: As a Scheduler, if I write in a custom name, I want the system to prompt: *"Would you like this name to always appear in this menu?"* and, if confirmed, save them to the roster with an optional phone number field.
* **US-6**: As a Scheduler, I want to view an individual calendar for each candidate in the "Training" stage. I want to select a date range (e.g. Aug 3rd-14th, Mon-Fri, 8 AM - 4 PM) to block-book their entire training schedule at once. I want to click individual training days to edit or delete them via simple modal panels. Custom edited hours during block orientation booking are applied uniformly across the generated range.
* **US-7**: As a Scheduler, I want the training block-booking modal to include a "Skip Weekends" checkbox (checked by default) that automatically skips Saturdays and Sundays during orientation range scheduling.
* **US-8**: As a Scheduler, I want a toggleable Master Training Calendar view that overlay orientation schedules for all active candidates on a single monthly grid to coordinate group orientation. Training calendars automatically hide orientation dates for candidates once they transition to Employed.
* **US-9**: As a Scheduler, I want the training calendar to allow weekend bookings but display a warning badge if a training date is set on a Saturday or Sunday.
* **US-10**: As a Scheduler, I want to print the candidate's training calendar using a "Print Schedule" button to hand them a clean physical calendar page.
* **US-11**: As a Scheduler, I want default shift selections during training block-booking to auto-populate standard shift hours (e.g. Day Shift auto-fills 7:00 AM - 3:00 PM; Evening Shift auto-fills 3:00 PM - 11:00 PM; Night Shift auto-fills 11:00 PM - 7:00 AM) to save time.
* **US-12**: As a Scheduler, I want to enter a recurring meeting exception (e.g. UR Meeting Thursdays 10-11 AM) and click a "Bulk Apply to Department" button to copy it instantly to all staff members in the "Nurses" department.
* **US-13**: As a Scheduler/Manager, I want a "Notification Logs" panel displaying the delivery logs (Sent/Failed/Pending, timestamp, message content) for all outgoing SMS and emails, with filters to view only SMS, only Emails, or only Failed alerts.
* **US-14**: As a Front Desk staff member, I want to log walk-in candidates by typing only their Name and Position (CNA/Nurse), leaving email/phone blank if they prefer to write it on paper, to start the countdown immediately.
* **US-15**: As a Front Desk staff member, I want the walk-in countdown timer on the dashboard to change colors to show urgency: Green ($>15$ minutes), Orange (5-15 minutes), and Flashing Red ($<5$ minutes).
* **US-16**: As a Front Desk staff member, I want the walk-in countdown timer field to validate that inputs are between 5 and 120 minutes to prevent typos.
* **US-17**: As a Front Desk staff member, I want the stacked walk-in lobby queue side panel to automatically become scrollable if more than 5 candidates are checked in concurrently.
* **US-18**: As a Scheduler, when assigning shadow hosts, I want a simple click-to-confirm button to proceed if a double-shadow warning displays, without needing to type override notes.
* **US-19**: As a Scheduler, I want to receive an email notification when a Floor Host completes a shadow shift, indicating the candidate's scores and hiring recommendation, so I can immediately schedule their final interview.
* **US-20**: As a Scheduler, I want to assign cross-trained management interviewers to conduct interviews for both CNA and Nursing candidates. Roster clinical role options are strictly limited to CNA and Nurse positions.
* **US-21**: As a Scheduler, I want to receive a warning popup alert if I assign a Floor Host to shadow a candidate on a date where the host has set an off-duty exception, logging my override if confirmed.
* **US-22**: As a Scheduler, I want to receive an automated email alert when an interviewer completes a candidate's First Interview, so I know I can proceed to schedule their floor shadow shift.
* **US-23**: As a Scheduler/Manager, I want to record and view a candidate's Referral Source (e.g. indeed, employee name) and Desired Wage (hourly rate) on their profile card to track HR logistics.
* **US-24**: As a Scheduler, when I save a hired candidate's work schedule that does not match any current hiring needs list, I want the system to automatically append a new row to the hiring needs list (showing it as 0 target, -1 spots remaining) to document over-hiring.
* **US-25**: As a Scheduler, I want the hiring needs tracker to monitor a simple cumulative headcount target per role/shift (e.g. Day Shift CNA target is 4) and display a predictive counter showing how many active candidates are currently in the recruitment pipeline (excluding Employed, Rejected, or Withdrawn profiles). Predictive pipeline counters hide completely if the count is zero. Target rows with 0 vacancy and pipeline counts render as "0 spots remaining". Over-hired profiles display negative headcount slots (e.g., -1 spots remaining) without warning alerts. Calculations update in real time via database broadcasts.
* **US-26**: As a Scheduler, I want the system to automatically repopulate open hiring needs slots when a hired candidate drops out (by moving them to "Rejected" or "Withdrew" stages).
* **US-27**: As a Front Desk staff member, if a walk-in candidate has been waiting in the lobby for more than 10 minutes past their target countdown ready time, I want their dashboard card to flash a bold red wait alert to prompt lobby coordination.
* **US-28**: As a Scheduler, when I delete a Floor Staff roster member, I want their name to remain visible on any orientation days already scheduled with them so historical logs remain intact.

### For Interviewers & Floor Shadow Hosts
* **US-29**: As a Floor Staff host, I want to receive an SMS text on my phone when a candidate is scheduled to shadow me *if* my phone number is registered in the system. If it is blank, I want the system to proceed gracefully without showing errors.
* **US-30**: As a Floor Staff host, I want to complete a structured shadow shift feedback form inside the app, scoring the candidate's skills competency (1-5 stars) and professional attitude (1-5 stars) alongside a "Recommend Hire" checkbox and brief notes. I want to be able to log this feedback at any time once scheduled, without being blocked by scheduling dates.
* **US-31**: As an Interviewer, I want to receive an SMS text from a single centralized facility Twilio virtual number on my lock screen with the default notification sound immediately when scheduled, or when my candidate arrives in the lobby.
* **US-32**: As an Interviewer, I want the dashboard to play a clean, synthesized soft-bell chime sound using the browser's native Web Audio API *only on my browser* when my candidate is marked as arrived, guaranteeing it triggers offline.
* **US-33**: As an Interviewer, I want to toggle a "Mute Notification Sounds" checkbox in my profile settings to silence browser audio chimes during meetings.
* **US-34**: As an Interviewer, I want to receive an **additional** urgent SMS text when a walk-in's application countdown timer hits zero: *"Walk-in is ready! [Candidate Name] ([Position]) is done with paperwork and waiting in the lobby."*
* **US-35**: As an Interviewer, when completing a walk-in candidate, I want their punctuality defaulted to "On Time" (since they had no appointment), but I want the option to manually adjust it if needed.
* **US-36**: As an Interviewer, when logging completed interview feedback, I want quick selector buttons (30m, 45m, 60m) to populate actual interview durations in seconds.
* **US-37**: As a staff member on the floor, if my device loses its internet connection, I want a clear warning message advising me to reconnect before attempting to update schedules or save feedback, to prevent data conflict issues.

### For Candidates
* **US-38**: As a Candidate, when scheduled for an interview or shadow shift, I want the "Send SMS Confirmation" checkbox to be checked by default (opt-out), sending me booking texts automatically when my number is entered.
* **US-39**: As a Candidate, when scheduled for an interview or shadow shift, I want to receive an automated HTML email containing directions to Shea Post Acute Scottsdale, facility contact details, and a checklist of what documentation to bring (e.g. ID, license, certifications).
* **US-40**: As a Candidate in the Training stage, I want to receive an automated HTML email detailing my block-booked training calendar schedule (dates, times, locations, preceptor notes) when Orientation is scheduled. Preceptor inputs default to blank inside block booking panels and display placeholder text `"Preceptor Name (e.g. Jane Doe)"`.
* **US-41**: As a Candidate in the Training stage, I want to receive an automated HTML email compiling my orientation calendar schedule when ORIENT block dates are modified.

### For Admin & Metrics Oversight
* **US-42**: As an Administrator, I want to log in to the default seeded account (`admin@sheapostacute.com`) upon first deployment to change the password and begin inviting the staff roster.
* **US-43**: As an Administrator, I want the registration invitation link sent to new staff profiles to expire after 7 days to maintain invite security.
* **US-44**: As an Administrator, I want password reset email links to expire after 24 hours to enforce secure accounts recovery. Clicking reset links redirects me to a secure reset page styled in the PWA's dark glassmorphism branding. Reloading or exiting the recovery screen invalidates the hash recovery token session. Unauthorized navigation directly to reset routes prompts login redirects. Password reset panels enforce an 8-character minimum strength validator, showing errors as red text below the input field. Supabase free-tier recovery mail templates are managed inside the Supabase Developer Console.
* **US-45**: As an Administrator, I want to lock final hard-deletions to profiles listed in a server configuration file `app_config.json` for maximum database security.
* **US-46**: As an Administrator, the system must block me from soft-deleting the last active profile with a Scheduler role, or any profile listed as a Supreme User, to protect dashboard administrative configurations.
* **US-47**: As an Administrator, I want to toggle SMS notifications on/off in `app_config.json` to keep the application 100% free (relying on emails by default) or plug in my Twilio API keys later.
* **US-48**: As a Manager, I want the analytics leaderboard to show total interviews completed, cancelled, and no-shows for each staff member (sorted by interview count highest to lowest by default), displaying working times as hour-minute durations (e.g. `18h 30m`), with progress bars illustrating workload ratios. Schedulers can toggle header links to re-sort lists by cumulative working time directly. Leaderboard drill-down lists show candidate Names and Positions without employment/interview date strings. If an interviewer does not log actual duration, the leaderboard defaults to 45 minutes for workload time tallies.
* **US-49**: As a Manager, I want cancelled or no-show interviews to add 0 minutes to an interviewer's total working time.
* **US-50**: As a Manager, I want to filter candidate list views based on their hiring outcome statuses (Recommended, Rejected, Pending Shadow Feedback, Candidate Withdrew, Employed, In Training).
* **US-51**: As a Manager, I want all system emails to be stylized HTML layouts with status-color headers (e.g. green for scheduled, red for cancelled) to easily review them in my inbox.
* **US-52**: As a Manager/Scheduler, I want to be able to open the "Oh Sh!t" Recycle Bin, view all deleted items sorted automatically by deletion date (most recently deleted first), search them by candidate or staff name using a text search bar, and recover them using my 4-digit PIN (subject to the cached session), even if I am not a Supreme User.
* **US-53**: As a Manager/Scheduler, when I recover a soft-deleted candidate, I want the system to automatically cascading-recover all their associated child bookings, shadows, and training orientation days, writing parent recovery logs onto all child rows. A confirmation popup displays the total count of successfully restored records along with a stylized green checkmark circle icon, and requires clicking a Close button to dismiss.
* **US-54**: As a Manager/Scheduler, I want cascading recovery undelete triggers to only restore child records that were soft-deleted with the candidate (matching deletion timestamps within a 1-second margin) to avoid recovering historical cancelled bookings.
* **US-55**: As a Manager/Scheduler, I want to inspect the "Oh Sh!t" Bin and see a record of *who* deleted each soft-deleted item.
* **US-56**: As a Manager/Scheduler, I want to view the disabled "Delete Permanently" button in the Recycle Bin with a tooltip explaining that hard purges require Supreme User privileges.
* **US-57**: As an Auditor, I want Notification Logs to remain in the database for 365 days (1 year) to maintain full communications history before purging. Failed notifications are logged on a single try basis without automated retry queues. Outbound text templates support concatenated layouts.
* **US-58**: As a User, when I log in to the PWA, I want the app to prompt me immediately to authorize Web Push notifications for lobby waiting warnings when the app is in background slots.
