# Problem Statement: Shea Post Acute Interview Scheduling

**Location**: Shea Post Acute (Skilled Nursing Facility - SNF), Scottsdale, AZ  
**Target Focus**: CNA and Nursing Interview Scheduling  

---

## 1. Background
Shea Post Acute is a skilled nursing facility (SNF) operating in a highly competitive healthcare hiring market. Nursing and Certified Nursing Assistant (CNA) candidates are in high demand and often interview at multiple facilities simultaneously. Speed, professionalism, and scheduling efficiency during the hiring process are critical to securing top talent.

Currently, scheduling interviews involves multiple stakeholders:
* **Facility Schedulers / Managers**: Who coordinate candidate outreach and assign interview slots.
* **Nursing & CNA Interviewers**: Floor staff, nursing supervisors, or managers who conduct the interviews while balancing active patient care duties on the floor.
* **Candidates**: Job seekers expecting a structured, prompt interview experience.

---

## 2. Current Pain Points & Inefficiencies
The facility currently lacks a centralized, real-time scheduling communication tool, leading to the following operational issues:

1. **Scheduling Conflicts**: Interviews are frequently scheduled during times when the assigned staff members are unavailable (e.g., during medication passes, shift handoffs, patient care rounds, or when they are off-duty).
2. **Poor Inter-departmental Communication**: Schedulers book interviews without real-time visibility into the floor staff's availability, and do not communicate the bookings effectively.
3. **Candidate Wait Times**: Due to scheduling conflicts and delayed staff availability, candidates experience longer-than-necessary wait times in the lobby. This leaves a poor first impression and causes candidates to abandon the application.
4. **Surprise ("Sprung On") Interviews**: Interviewers are often notified of an interview at the very last second, forcing them to suddenly drop patient care duties. This creates high stress, poor preparation, and impacts facility operations.
5. **Out-of-Date Schedules**: Schedules are often printed or shared via static messages. Changes or updates made by one manager are not propagated to other managers, resulting in double bookings or missed appointments.

---

## 3. Business & Operational Impact
* **Talent Attrition**: High-quality CNA and nursing candidates choose competing facilities due to long wait times and perceived disorganization.
* **Staff Burnout**: Floor nurses and CNAs feel overwhelmed by surprise duties, reducing morale and interrupting clinical focus.
* **Quality of Care**: Sudden interruptions to clinical schedules can delay routine care and medication rounds.

---

## 4. Proposed Solution
To resolve these communication gaps, we will build a **Real-Time Web-Based Interview Scheduling Application** tailored for Shea Post Acute. 

Key characteristics of the solution:
* **Centralized Dashboard**: A shared, web-based dashboard accessible via desktops at nursing stations and mobile devices.
* **Availability Management**: CNA/Nursing staff can quickly update their weekly availability status (Monday–Friday) which persists until updated.
* **Conflict Prevention**: Schedulers can only assign interviews to staff members who have marked themselves as "Available" for that slot.
* **Instant Notifications**: Real-time push notifications on the dashboard sync all open sessions instantly. Automated SMS and Email alerts notify the interviewer the moment they are scheduled.
* **Zero-Licensing Deployment**: Built as a responsive web app, eliminating the need for paid developer/publishing accounts (App Store/Google Play).
