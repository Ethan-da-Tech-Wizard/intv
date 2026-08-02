# Functional Requirements Document (FRD): Shea Scheduling

---

## 1. Introduction
This Functional Requirements Document (FRD) defines the specific application actions, warning popups, recycle bins, notifications, and analytics screens required to implement the Shea Post Acute scheduling system.

---

## 2. User Roles & Access
* **Individual Accounts & Registration**: Accessing the application requires individual email/password auth. Schedulers/Admins invite new staff by entering their email on the Roster screen, which sends an automated email invitation. The link redirects users to set up their password and 4-digit PIN.
  * **Link Expirations**: Registration links contain a unique token associated with a database timestamp. Clicking links older than **7 days** redirects to an "Invitation Expired" error screen.
  * **Password Reset Links**: Outbound email links for password recovery remain active for **24 hours** from generation before invalidating. Clicks redirect directly to a customized password modification route (`/reset-password`) inside the PWA client application wrapper to maintain the app's premium dark glassmorphism styling. Custom template translations and dispatches are managed globally within the Supabase Developer Console.
  * **Reset Password Validation**: The password update input panel enforces that passwords entered are at least **8 characters** in length. Clicking save with shorter entries triggers a client-side warning, displaying an inline red text error message directly below the input field and blocking updates.
  * **Reset Auth Redirects**: If a user visits the `/reset-password` path directly without a valid Supabase recovery hash or active auth session, the app redirects them immediately to the `/login` screen showing an inline warning: `"Unauthorized: Password resets require a valid recovery token."`
  * **Reset Hash Session Expirations**: If a user reloads the `/reset-password` screen or navigates away, the recovery token inside the URL hash is discarded by the browser, expiring the session token. Any subsequent attempts to save a password without requesting a fresh forgot password link are blocked.
* **Identity Dropdown**: Users select their active profile name from a main header dropdown.
* **4-Digit Transaction PIN**: Any scheduling insert, edit, delete, or recovery action requires entering their personal 4-digit PIN.
  * **Session PIN Caching**: To prevent repetitive typing during busy scheduling blocks, the system caches the PIN locally in memory for **5 minutes** from the last validated action. If 5 minutes pass without a transaction, the session expires and re-entry is required.
* **Supreme Override User**: A file-based configuration profile checks if the selected identity is listed as a "Supreme User" in the server's `app_config.json`. If so, the user is authorized to perform hard-deletions in the "Oh Sh!t" recycle bin.
* **Seeded Administrator**: Upon deployment, a root admin account is seeded with a temporary password (`ChangeMePlease!2026` for `admin@sheapostacute.com`). This allows the facility to log in immediately and begin sending registrations to managers.
* **30-Day Session Persistence**: User sessions remain active for **30 days** on local browsers before requiring password re-entry. This minimizes floor friction, relying on the 5-minute transaction PIN cache for data changes.
* **Notification Mute Toggle**: Users toggle a `Mute Notification Sounds` checkbox in their Profile Settings drawer. When enabled (`mute_notifications = true` in profiles), the client-side audio engine bypasses ready chimes to prevent disruptions during presentations.
* **Deletion Safeguards**: The front-end validation and database row trigger block the deletion or recovery soft-delete update of any profile if it is the **last active Scheduler account** in the system, or if the email is declared in the `supreme_users` config file. This prevents complete lockouts.
* **Clinical Role Constraints**: Roster positions and candidates are strictly restricted to CNA and Nurse specialties. Med Techs, ward clerks, or other ancillary staff are not supported in Phase 1.

---

## 3. Core Modules

### 3.1. Advanced Availability & Exceptions Module
* **Recurring Weekly Blockouts**: Users can block out recurring windows for repeating meetings (e.g. blocking out "10:00 AM - 11:00 AM every Thursday" for UR meetings).
* **One-Off Date Exceptions**: Users can select a specific calendar date and block it out (e.g., unavailable all day August 5th), entering an **Unavailable Reason** (e.g., "Doctor Appointment").
* **Bulk-Apply Exclusions**: In the roster settings dashboard, admins can create a recurring meeting block (e.g., Thursday 10:00 AM - 11:00 AM) and select a department (e.g. "Nurses"). Clicking "Bulk Apply" loops through all active profiles matching that role and copies the exclusion to their calendar, avoiding individual entry.
* **Visual Calendar Key**:
  * **Green (Available)**: Free to conduct interviews.
  * **Red (Booked)**: An interview is scheduled.
  * **Orange (Meeting/Busy)**: Blocked due to UR meeting or custom task.
  * **Grey (Off-Duty/Unavailable)**: Blocked daily status.
  * **Yellow Pulse (Candidate Arrived)**: A candidate is currently waiting.
  * **Flashing Red/Thick Border (Walk-In)**: Walk-in candidate arrived.

### 3.2. Override Warning Engine
* **Rule 1: Overbooking**: 
  * Standard interview length is **45 minutes**.
  * Schedulers are warned if they book a slot **30 minutes or less** from the dedicated ending time of another interview for that staff member. Schedulers must click through double warning modals acknowledging the overbooking.
* **Rule 2: Unavailable Override**:
  * If a scheduler books an interview on a day/time an interviewer has marked as "Unavailable" (with a reason listed):
  * The system pops up a modal: *"This person said they are not available because they are '[Reason]'. Are you sure you wish to schedule them?"*
  * The scheduler must select one of two radio options to proceed:
    1. *"Yes, they filled out the information wrong"*
    2. *"No, I did not realize they are unavailable"* (Cancels the booking attempt).
  * If Option 1 is selected, it saves the booking and logs the override confirmation in `unavailable_override_acknowledged_by`.
* **Rule 3: Shadow Overbooking warning**:
  * If a scheduler assigns a Floor Host (e.g., Nurse Jane) who already has another candidate scheduled to host a shadow candidate on that same date and shift:
  * The system displays a warning popup: *"Warning: [Host Name] is already scheduled to host a shadow candidate ([Candidate A]) on [Date] during the [Shift] Shift. Proceed anyway?"*
  * Clicking the `"Yes, proceed"` confirmation button is sufficient to override and save the booking. Typing text-based override justifications is not required.
* **Rule 4: Off-Duty Floor Host warning**:
  * If a scheduler schedules a shadow shift on a Floor Host (e.g. Nurse Jane) on a date where Jane has declared a Date Exception (marked as off-duty or unavailable):
  * The system displays a warning alert modal: *"Warning: [Host Name] has declared an off-duty exception on [Date] for the reason: '[Reason]'. Do you wish to override and assign anyway?"*
  * Clicking `"Yes, override"` saves the booking and logs the override credentials in `off_duty_override_acknowledged_by`.

### 3.3. Walk-In Pipeline & Alerts
* **Interviewer Roster Assignment**: When a walk-in is logged, the dropdown list shows designated management interviewers. Management interviewers are cross-trained and can be assigned to interview for **both CNA and Nursing candidates**, regardless of their own clinical specialty.
* **Availability Tags**: Next to each interviewer's name, the system displays their current real-time status badge (`[Available]`, `[Busy]`, `[Booked]`, `[Off-Duty]`).
* **Adjustable Countdown**: When logging the walk-in candidate, the receptionist can adjust the application paperwork countdown timer using a simple input field (default is 30 minutes, adjustable between **5 and 120 minutes**). Typing numbers outside this range displays an inline validator error.
* **Optional Registration Fields**: Receptionists are only required to type the walk-in's `Name` and select their `Position` (CNA/Nurse) to log them in. Candidate phone and email inputs are optional, enabling instant check-ins.
* **Stacked Walk-In Queue Layout**: If multiple walk-ins arrive concurrently, they are displayed stacked in a dedicated "Walk-In Queue" side panel. Each candidate card displays a thick flashing Red/Orange border, the candidate's name/position, and their remaining paperwork countdown timer.
  * **Lobby Scroll limits**: If more than 5 walk-in candidate cards are checked in concurrently, the lobby side queue panel automatically converts to a scrollable container with a custom minimal scrollbar style, keeping page elements aligned without vertical overflow.
* **Countdown Color States**: The timer display changes color to signify urgency:
  * **Green**: $>15$ minutes remaining.
  * **Orange**: between 5 and 15 minutes remaining.
  * **Flashing Red**: $<5$ minutes remaining.
* **Overdue Waiting Visual Pulse**: If the candidate's status has not transitioned to "Completed" or "Interview in Progress" 10 minutes past the zero mark, the card border begins flashing a bold, thick Red Pulse to flag lobby delays.
* **SMS Format**: Walk-in text notifications follow a transactional template, automatically inserting name, position, wait time, and target start.
* **Centralized SMS Sender**: Outbound text alerts are routed through a single centralized facility Twilio virtual phone number. Department-specific sender configurations are not supported. SMS text messages support concatenated delivery, allowing instructions up to 320 characters to route cleanly.
* **Immediate SMS Dispatch**: When logged, the system immediately sends an SMS to the selected interviewer (if SMS is enabled in `app_config.json` and a phone number is registered):
  * *"Walk-in arrived: [Candidate Name] ([Position]). We will give them [Countdown] minutes to fill out paperwork, then you are expected at [Time]."*
* **Ready Chime Notification (Web Audio Synth)**: At the 0-minute mark, the browser plays a clean ready chime sound *only on the assigned interviewer's active dashboard browser tab (unless they have enabled `mute_notifications`)*:
  * **Implementation**: The sound is generated dynamically using the browser's native **Web Audio API** (using a sine-wave oscillator sweeping from 880Hz to 440Hz over 0.5 seconds, mimicking a soft-bell strike). This runs 100% offline without needing external media resources.
  * The system sends an **additional** urgent SMS to the interviewer (if SMS is enabled):
    * *"[URGENT] Walk-in is ready! [Candidate Name] ([Position]) is done with paperwork and waiting in the lobby."*
  * **PWA Web Push alerts**: The PWA immediately prompts the user for native browser Web Push permissions upon first login dashboard page load. If granted, the service worker registers push subscription tokens to trigger native lockscreen warnings when browser tabs are in background slots.

### 3.4. Multi-Stage Candidate Pipeline (ATS)
The application tracks candidate progress through five stages:
1. **First Interview**:
   * Management conducts this. Assumed duration is 45 minutes (interviewer can override with actual minutes).
   * **Walk-In Punctuality Default**: For walk-ins, candidate punctuality defaults to `On Time` (since they had no appointment), but the interviewer can manually override it if necessary.
   * **Completed Duration Selectors**: To streamline logging, the interviewer checkout panel provides quick select buttons for **`30m`**, **`45m`**, and **`60m`** to auto-populate the actual duration, alongside a standard numeric input field for outlier minutes.
   * Interviewer must complete punctuality and feedback notes to mark as `Completed`, triggering an "Interview Ended" broadcast.
   * **First Interview Alert Trigger**: Marking the interview as completed sends an automated HTML email to all Schedulers:
     * *"First Interview Completed: Candidate [Candidate Name] ([Position]). Recommendation: [Outcome]. Notes: [Notes]."* This alerts schedulers to coordinate their shadow shift.
2. **Shadow Shift**:
   * Candidates are scheduled to work alongside a Floor Staff member.
   * **Shift Matching**: Schedulers select the shift (`Day`, `Evening`, `Night`). The Floor Host dropdown automatically filters to display only staff members registered for that shift.
   * **Write-In Host Option**: Schedulers can type a custom name in the host field. Upon saving, the system triggers a popup dialog: *"This person is not in the active Floor Staff roster. Would you like to add [Name] to the Floor Staff list for [Shift]?"* 
     * If `Yes`, text input fields appear for an optional Phone Number. Clicking save creates the profile.
     * If `No`, the shift is saved with a text label.
   * **Floor Host Alerts**: If the host profile has a phone number registered and SMS is enabled, an automated booking SMS is sent. If blank or if SMS is disabled, the system skips SMS dispatch and proceeds gracefully.
   * **Structured Shadow Feedback**: Upon shadow shift completion, the Floor Host is prompted to log candidate evaluation metrics:
     * **Skills Competency**: 1 to 5-star rating.
     * **Professional Attitude**: 1 to 5-star rating.
     * **Recommend Hire**: Checkbox (Yes/No).
     * **Notes**: Brief text area for one-liner feedback.
   * **Shadow Feedback Timing**: Floor hosts are allowed to submit evaluation feedback **at any time** once scheduled, preventing hosts from being blocked by shift delay outliers.
   * **Shadow Shift Alert Trigger**: Saving this feedback form as completed triggers an automated email to all Schedulers:
     * *"Shadow shift completed for candidate [Candidate Name] hosted by [Host Name]. Ratings: Skills ([Skills]/5), Attitude ([Attitude]/5), Recommendation: [Yes/No]. Notes: [Notes]."* This prompts the scheduler to schedule the Final Interview.
3. **Final Interview**:
   * Scheduled with management. Interview notes and approval results are logged.
4. **Training**:
   * **Training Calendar Block Booking**: Clicking a candidate in the training stage opens their individual monthly training calendar. Schedulers can click "Add Training Block" to open a modal where they select date range, times, days, and notes.
   * **Skip Weekends Filter**: The block-booking modal features a `"Skip Weekends"` checkbox. When checked (default), the scheduler loops through orientation ranges and excludes any Saturday or Sunday dates from calendar generation, avoiding orientation conflicts.
   * **Master Training Calendar View**: Schedulers toggle a "Master Calendar" view on the Training screen. This merges training schedules for all active candidates onto a single monthly grid. Candidate names are colored differently to prevent preceptor overbooking. No automated warnings block scheduling overlays on the master orientation layout, permitting manual alignment.
   * **Hired Candidate Training Cleanup**: Once a candidate's pipeline status transitions to `"Employed"`, their training days are automatically hidden from active Master Training Calendar overlays to keep boards clean, while retaining historical calendar rows in database tables.
   * **Auto-Populate Shift Hours**: Selecting a shift type in the block booking modal automatically populates the `Start Time` and `End Time` fields:
     * **Day Shift**: Auto-fills `7:00 AM` to `3:00 PM`.
     * **Evening Shift**: Auto-fills `3:00 PM` to `11:00 PM`.
     * **Night Shift**: Auto-fills `11:00 PM` to `7:00 AM`.
     * (These default times are hardcoded in the codebase, but can be manually overridden). If a scheduler adjusts these times in the inputs, the customized hours are applied uniformly to all orientation days in that generated block.
   * **Weekend Warning Indicator**: Schedulers are permitted to book training days on weekends. However, any training day falling on a Saturday or Sunday displays a yellow outline and a warning tooltip: `"Notice: This training day falls on a weekend."` to double-check facility coordination.
   * **Trainer/Preceptor Notes**: Trainer assignments are recorded as a simple write-in text field inside the training notes, supporting external registry or registry float preceptors. Preceptor write-ins are strictly text-based and do not prompt additions to the Floor Staff roster database. Preceptor block-booking input fields default to blank, displaying the placeholder text `"Preceptor Name (e.g. Jane Doe)"`.
   * **Trainer Deletion Label Retention**: If a Floor Staff profile is soft-deleted, any existing orientation dates scheduled with them keep their name text label visible on orientation calendar grids, preventing data loss.
   * **Orientation Notes Truncation**: During candidate training schedule print sessions, custom preceptor/training notes on individual dates are automatically truncated (showing `text-overflow: ellipsis` at 4 lines depth) to preserve column boundaries.
   * **Training Calendar Printing**: Schedulers click the "Print Training Schedule" button. A custom stylesheet (`@media print`) hides navigation elements, page selectors, and headers, formatting the training monthly grid in high-contrast lines on a standard letter sheet.
   * **Orientation Confirmation Email**: Saving the orientation calendar sends an automated HTML email **only to the candidate**, compiling their complete training day parameters (dates, hours, preceptors). Automated preceptor email notifications are not supported. Updates to orientations trigger secondary orientation HTML email revisions.
5. **Employment (Employed)**:
   * Schedulers input the candidate's planned work schedule.

### 3.5. Hiring Needs Auto-Triangulation
* **Cumulative Target Monitoring**: The hiring needs tracker monitors targets as a simple cumulative headcount target per role/shift (e.g. Day Shift CNA target is 4) rather than splitting targets by individual days of the week. No target change audit records are logged.
* **Predictive Candidate Metrics**: The hiring needs panel tracks and overlays active pipeline applicant volumes, displaying count statistics representing candidates currently in active states:
  * **Active States**: Candidate `pipeline_stage` matching `First_Interview`, `Shadow_Shift`, `Final_Interview`, or `Training`. Candidates in Employed, Rejected, or Withdrawn stages are excluded.
  * **Zero Count Hidden**: If the active candidate count for a role/shift is 0, the predictive counter text appender is hidden completely to prevent screen clutter.
  * **Zero Spot vacancy format**: If a vacancy row has zero targets and zero pipeline candidates, the row simply displays the shift/role title with `"0 spots remaining"`.
* **Over-Staffed vacancy math**: If target vacancy counts are decreased (e.g. CNA Day Shift reduced from 4 to 2) but active Employed staff counts exceed the new target (e.g. 3 active profiles), the system view dynamically displays negative remaining vacancies (e.g. `-1 spots remaining`) without showing warning notices.
* **Decrement Rule**: Inputting a schedule in the "Employed" stage automatically decrements the corresponding slots in the open hiring needs statement.
* **Repopulate (Increment) Rule**: If a schedule is changed, or if a candidate is deleted/removed because "it didn't work out" prior to starting, the system automatically repopulates (increments) the hiring needs statement.
* **Employed Purge Rule**: If a candidate is removed from the active pipeline because they are successfully "Employed" (completed training and started shift), the system does **not** repopulate the hiring needs (slots remain filled).
* **Dropout Repopulation**: If a scheduler changes an Employed or In Training candidate's pipeline status to `Rejected` or `Candidate Withdrew` (such as if they drop out during orientation week), the database dynamic view automatically removes them from active scheduled headcount, instantly repopulating (incrementing) the open needs vacancy.
* **Over-Hiring Auto-Append**: If a scheduler saves a hired candidate's work schedule that does not match any current hiring needs parameters:
  * The system automatically generates a new row in the `hiring_needs` table with `spots_needed = 0` and the selected role/shift details.
  * The needs view dynamically updates to show `-1 spots remaining` (representing the over-hired slot) to align data without throwing transaction blocks.
* **Real-time needs view broadcast**: Changes to database views (`dynamic_hiring_needs`) are broadcast instantly to all active browsers using Supabase Real-Time database listener hooks, keeping dashboards synchronized without page reloads.

### 3.6. Calendar Navigation Controls
* The dashboard grid calendar default view focuses on the current week.
* **No Navigation Caps**: Schedulers can navigate forward in time indefinitely using next/previous arrow controls at the top of the grid, allowing bookings to be planned weeks or months in advance.

### 3.7. Network Connectivity Checks & Offline Warnings
* The application runs checks using the browser's `navigator.onLine` state.
* **Offline Detection**: If the internet connection drops:
  * A persistent red banner displays at the top of the app screen: `"Offline Mode: No Internet Connection. Scheduling updates are disabled."`
  * All editing forms, status toggles, check-in buttons, and recovery actions are disabled to prevent local conflict errors.

### 3.8. Security, Login & 2FA Recovery
* **Secure Login**: Accessing the app requires individual email/password auth.
* **Two-Factor Authentication (2FA)**: Login on unrecognized browsers prompts for a 6-digit TOTP token from a free authenticator app (Google Authenticator) or an email verification code.
* **Self-Service Password Reset**: Users click "Forgot Password". Supabase Auth emails a secure link to reset their credentials.
* **Self-Service PIN Reset**: Users click "Reset PIN". The system emails a 6-digit OTP code. Entering the code redirects to a screen to set a new transaction PIN.

### 3.9. "Oh Sh!t" Recycle Bin Module
* Deleting bookings, staff profiles, candidates, shadow hosts, or exceptions triggers a soft-delete (`is_deleted = true`), updating `deleted_at = now()` and `deleted_by = [active name dropdown selection]`.
* **Default Deletion Sorting**: Soft-deleted records are automatically sorted in the Recycle Bin grid by deletion date (most recently soft-deleted first, i.e., `deleted_at DESC`).
* **Open Access Viewing & Filtering**: Any logged-in user can navigate to the "Oh Sh!t" bin, view all soft-deleted records (including who deleted them), search by candidate or staff name using a search bar, and click the "Recover" button. Dropping down or filtering searches by deletion author is not supported. Stored recovery events (`recovered_by`, `recovered_at`) are saved inside database audit columns only.
* **Cascading recovery**: Restoring a candidate from the Recycle Bin triggers a database function that automatically cascading-undeletes all associated child records (bookings, shadow shifts, training orientation days) that were soft-deleted with the candidate.
  * **Undelete filter**: Relational cascading-recoveries only restore child rows that were soft-deleted at the same time as the parent candidate (where child `deleted_at` matches parent `deleted_at` within a 1-second margin). Cancelled or historical child soft-deletes remain deleted.
  * **Audits copy**: Relational cascading-recoveries automatically copy the parent's `recovered_by` and `recovered_at` details onto all restored child rows, ensuring precise audit tracking on every row.
  * **Confirmation Popup**: Completing a cascading recovery pops up a success confirmation dialog to the scheduler: `"Success: [Candidate Name] and [X] associated child records restored."` summarizing the operation. Users must click a Close button (or click the background overlay) to dismiss the popup; auto-timeout dismissals are not executed. A stylized green checkmark circle icon renders alongside the success summary.
* **Single-Item PIN-Restricted Recovery**: Recovery operations must be performed **one item at a time**. Clicking "Recover" prompts the user to enter their 4-digit transaction PIN (subject to the 5-minute cache), logging `recovered_at` and `recovered_by`. Bulk checkbox recovery is not supported.
* **Hard Purges Restricted**: Clicking "Delete Permanently" is greyed out unless the logged-in user is listed as a Supreme User in `app_config.json`.
  * **Lock Hover Tooltip**: When non-supreme users hover over the disabled "Delete Permanently" buttons, the system displays a tooltip: `"Permanent deletions are locked. Please contact a Supreme User to request a hard purge."`
* **Automated pg_cron Purging**: A daily database trigger scheduled via Supabase automates final hard-purges on soft-deleted rows where `deleted_at < NOW() - INTERVAL '90 days'`.

### 3.10. Notification Log Viewer & SMS Configuration Fallback
* Displays a table of all sent alerts showing: `Recipient`, `Contact Details`, `Type` (SMS/Email), `Message Body`, `Status` (Sent/Failed/Pending), `Error Message`, and `Timestamp`.
* If SMS alerts are disabled in `app_config.json`, any trigger trying to send an SMS writes a row to this log with: `Status = Failed` and `Error Message = SMS alerts disabled in configuration`.
* **Failed delivery log tries**: Outgoing text alerts write a single entry to the log if they fail. Automated retry queues are not supported.
* **Privacy Masking**: All contact phone numbers and emails in this dashboard table are masked:
  * Phone numbers are displayed as `+1 (XXX) XXX-5555`.
  * Emails are displayed as `c***@domain.com`.
* **Log Filters**: Schedulers filter the logs using top buttons to view: `All Logs`, `SMS Only`, `Email Only`, or `Failed Alerts Only`.
* **Historical Retention**: Outbound notification logs are automatically retained in the database for **365 days** (1 year) before automated database purging.

### 3.11. Stylized HTML Email Templates & Candidate Confirmations
All outbound email alerts are dispatched as clean, responsive HTML emails featuring colored header banners:
* **Green Header**: Booking confirmation alerts (sent to staff and candidates). Candidate confirmations include directions to Shea Post Acute Scottsdale, facility contacts, and a documentation checklist.
  * **Opt-Out Defaults**: When a candidate phone number is entered, the "Send SMS confirmation" checkbox defaults to `Checked` (opt-out), ensuring automated confirmations fire automatically.
* **Red Header**: Interview cancellation alerts.
* **Yellow Header**: Candidate physical arrival alerts.
* **Grey Header**: Completed interview summaries.

### 3.12. Candidate Referral & Wage Tracker
* Schedulers input a candidate's Referral Source (e.g. Indeed, Employee Name) and Desired Wage (hourly rate text) during candidate profile creation.
* These fields display on Candidate Pipeline Detail cards for review during evaluation gates.

### 3.13. Proof-of-Work Analytics & Leaderboard
* **Leaderboard Ordering**: The interviewer list is sorted by default by total completed interview counts conducted (highest to lowest).
* **Leaderboard Sort Toggles**: Schedulers can click header column labels (`Interviews Completed`, `Hours spent`) to toggle the sorting order directly (changing sorting between total count vs cumulative working time).
* **Tie-Breaker Ranking**: If total completed interview counts are equal, and the list is sorted by count, interviewers are ranked by total cumulative working time spent interviewing (highest first).
* **Working Time Contributions**: Cancelled or No-Show interviews contribute **0 minutes** of working time to the interviewer's leaderboard tally.
* **Blank Duration Default**: If an interviewer marks an interview completed but does not input actual durations, the system defaults their working time contribution to **45 minutes** for the leaderboard metrics.
* **Hour-Minute Working Time display**: Accumulated completed interview times are formatted as `Xh Ym` (e.g., `18h 30m`) next to each leaderboard row.
* **Visual Workload Ratios**: Next to each staff name, the dashboard renders a colored horizontal progress bar. The width represents their portion of the cumulative total completed facility interview workload (e.g. if Nurse Jane did 10 out of 100 total completed interviews, her progress bar sits at 10% width).
* **Leaderboard Drill-Down Drawer**: Clicking a leaderboard count opens a drill-down drawer showing a list of candidate Names and Positions. Simple text layouts display only, omitting specific interview date/time strings to maintain visual minimalism.
* **Timeframes**: Toggles data between: Today, Past 3 Days, Week, Past 2 Weeks, 3 Weeks, Month, 3 Months, Half Year, 9 Months, Year, 2 Years, 3 Years. Includes drill-down drawers.
* **Candidate Filters**: Candidate list views can be filtered by their current hiring outcome statuses (`All`, `Recommended`, `Rejected`, `Pending Shadow Feedback`, `Candidate Withdrew`, `Employed`, `In Training`).
