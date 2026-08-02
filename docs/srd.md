# System Requirements Document (SRD): Shea Scheduling

---

## 1. Technology Stack
* **Core Application**: React 19 + TypeScript + Vite 8.
* **Styling**: Tailwind CSS v4 (CSS-first setup via `@import "tailwindcss";` in `src/index.css`).
* **Database**: Supabase PostgreSQL + Auth (30-day session states) + Real-time replication.
* **Routing & State**: `react-router` (v7) + `@tanstack/react-query`.
* **Form Validation**: `react-hook-form` + `zod`.
* **Dates & Scheduling**: `date-fns` parsing moments in facility local timezone **`America/Phoenix`**.
* **Testing**: Vitest + React Testing Library + Playwright.
* **Mobile & Desktop Shells**: Capacitor 8 (Android/iOS) + Tauri 2 (Windows/macOS/Linux).

---

## 2. Platform Architecture & Offline Safety
* **PWA Offline-Capable Read-Only Mode**:
  * Static assets (HTML shell, compiled JS/CSS, web fonts) are cached via Service Workers to guarantee instant boot times.
  * Supabase API candidate profiles and evaluation logs are *not* stored in local storage to prevent PII leaks.
  * If `navigator.onLine == false`, the app displays a stale data warning disclaimer and disables editing fields to prevent sync clashes.
* **Native Wrappers**:
  * Web build output (`dist/`) is compiled into Capacitor (mobile) and Tauri (desktop) frameworks when native integrations (lockscreen badging or offline tray apps) are required.

---

## 3. Database Schema Design (PostgreSQL DDL)

The database schema enforces server-authoritative business invariants, resource isolation, audit trails, and transactional constraints:

```sql
-- Enable pgcrypto for crypt password/PIN hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Staff Members Table (Roster of all floor hosts, preceptors, and interviewers)
CREATE TABLE staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name VARCHAR(100) NOT NULL,
    legal_name VARCHAR(150) NOT NULL,
    job_role VARCHAR(20) CHECK (job_role IN ('CNA', 'Nurse', 'Floor Staff', 'Management')) NOT NULL,
    default_shift VARCHAR(20) CHECK (default_shift IN ('Day', 'Evening', 'Night')) DEFAULT 'Day' NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. User Accounts Table (App credentials linked to staff roster)
CREATE TABLE user_accounts (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    staff_member_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
    pin_hash VARCHAR(255), -- Server-hashed transaction PIN
    pin_failure_count INT DEFAULT 0 NOT NULL,
    last_pin_failure_at TIMESTAMP WITH TIME ZONE,
    mute_notifications BOOLEAN DEFAULT FALSE NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. App Roles & Users Mapping (RBAC)
CREATE TABLE app_roles (
    role_key VARCHAR(30) PRIMARY KEY,
    description TEXT NOT NULL
);

INSERT INTO app_roles (role_key, description) VALUES
('scheduler', 'Facility scheduler can create bookings, shadows, and training'),
('receptionist', 'Front desk can check-in candidates and walk-ins'),
('interviewer', 'Management conducting first/final candidate interviews'),
('recovery_admin', 'Authorized to restore soft-deleted profiles and batches'),
('system_admin', 'Supreme manager with configuration and hard-purge rights');

CREATE TABLE user_app_roles (
    user_id UUID REFERENCES user_accounts(user_id) ON DELETE CASCADE,
    role_key VARCHAR(30) REFERENCES app_roles(role_key) ON DELETE RESTRICT,
    PRIMARY KEY (user_id, role_key)
);

-- 4. Availability Table (Recurring Weekly Available Slots)
CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE NOT NULL,
    day_of_week INT CHECK (day_of_week BETWEEN 1 AND 7) NOT NULL, -- 1=Monday, 7=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    effective_from DATE DEFAULT CURRENT_DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Recurring Exceptions Table (Weekly recurrent busy blocks, e.g. Thursday UR meetings)
CREATE TABLE recurring_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE NOT NULL,
    day_of_week INT CHECK (day_of_week BETWEEN 1 AND 7) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason VARCHAR(255) NOT NULL,
    effective_from DATE DEFAULT CURRENT_DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Date Exceptions Table (One-off busy dates, e.g. off-duty days)
CREATE TABLE date_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE NOT NULL,
    exception_date DATE NOT NULL,
    start_time TIME, -- If null, blocked all day
    end_time TIME,
    reason VARCHAR(255) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES user_accounts(user_id),
    deletion_batch_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Deletion Batches Table (Soft-delete transaction auditing)
CREATE TABLE deletion_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    root_entity_type VARCHAR(50) NOT NULL,
    root_entity_id UUID NOT NULL,
    deleted_by UUID REFERENCES user_accounts(user_id) NOT NULL,
    deletion_reason TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    retention_until TIMESTAMP WITH TIME ZONE NOT NULL,
    recovered_at TIMESTAMP WITH TIME ZONE,
    recovered_by UUID REFERENCES user_accounts(user_id)
);

-- 8. People Table (Durable Candidate Identities)
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name VARCHAR(100) NOT NULL,
    legal_name VARCHAR(150) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    normalized_email VARCHAR(255),
    normalized_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Applications Table (Hiring episodes per candidate person)
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE NOT NULL,
    position VARCHAR(20) CHECK (position IN ('CNA', 'Nurse')) NOT NULL,
    desired_shift VARCHAR(20) CHECK (desired_shift IN ('Day', 'Evening', 'Night')) DEFAULT 'Day' NOT NULL,
    referral_source VARCHAR(100),
    desired_wage VARCHAR(30),
    application_stage VARCHAR(30) CHECK (application_stage IN (
        'New', 'Interview_Scheduled', 'Interviewing', 'Shadow_Pending', 'Shadow_Scheduled',
        'Final_Review', 'Offer_Pending', 'Training', 'Employed', 'Rejected', 'Withdrawn', 'Archived'
    )) DEFAULT 'New' NOT NULL,
    hiring_outcome VARCHAR(30) CHECK (hiring_outcome IN ('Recommended', 'Rejected', 'Pending_Feedback', 'Candidate_Withdrew', 'Employed', 'In_Training')),
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES user_accounts(user_id),
    deletion_batch_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Application Stage History (Audit transition path)
CREATE TABLE application_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
    from_stage VARCHAR(30) NOT NULL,
    to_stage VARCHAR(30) NOT NULL,
    reason_code VARCHAR(50),
    notes TEXT,
    actor_user_id UUID REFERENCES user_accounts(user_id) NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Bookings Table (Interviews)
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interviewer_id UUID REFERENCES staff_members(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
    scheduled_start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start_at TIMESTAMP WITH TIME ZONE,
    actual_end_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INT,
    notes TEXT,
    status VARCHAR(20) CHECK (status IN (
        'Scheduled', 'Checked_In', 'Ready', 'In_Progress', 'Completed', 'Cancelled', 'No_Show', 'Rescheduled'
    )) DEFAULT 'Scheduled' NOT NULL,
    punctuality VARCHAR(20) CHECK (punctuality IN ('On Time', 'Late', 'No Show')),
    send_candidate_sms BOOLEAN DEFAULT TRUE NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES user_accounts(user_id),
    deletion_batch_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Schedule Overrides Audit Table
CREATE TABLE schedule_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    conflict_type VARCHAR(50) NOT NULL, -- e.g., 'Interviewer_Conflict', 'Date_Exception_Conflict'
    conflicting_event_id UUID,
    reason_code VARCHAR(30) NOT NULL,
    reason_text TEXT NOT NULL,
    acknowledged_by UUID REFERENCES user_accounts(user_id) NOT NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    conflict_snapshot JSONB NOT NULL
);

-- 13. Staff Capabilities Table (Shadow and preceptor credentials mapping)
CREATE TABLE staff_capabilities (
    staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE PRIMARY KEY,
    can_interview BOOLEAN DEFAULT FALSE NOT NULL,
    can_host_shadow BOOLEAN DEFAULT FALSE NOT NULL,
    can_precept BOOLEAN DEFAULT FALSE NOT NULL,
    max_concurrent_candidates INT DEFAULT 1 NOT NULL
);

-- 14. Shadow Shifts Table
CREATE TABLE shadow_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
    floor_staff_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
    write_in_host_name VARCHAR(100),
    scheduled_start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    skills_rating INT CHECK (skills_rating BETWEEN 1 AND 5),
    attitude_rating INT CHECK (attitude_rating BETWEEN 1 AND 5),
    recommend_hire BOOLEAN,
    notes TEXT,
    status VARCHAR(20) CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')) DEFAULT 'Scheduled' NOT NULL,
    double_shadow_acknowledged_by UUID REFERENCES user_accounts(user_id),
    off_duty_override_acknowledged_by UUID REFERENCES user_accounts(user_id),
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES user_accounts(user_id),
    deletion_batch_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Training Days Table (Individual Calendar Days)
CREATE TABLE training_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
    scheduled_start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    preceptor_staff_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
    write_in_preceptor_name VARCHAR(100),
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES user_accounts(user_id),
    deletion_batch_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. Staffing Requirements Table (FTE quota configurations)
CREATE TABLE staffing_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) CHECK (role IN ('CNA', 'Nurse')) NOT NULL,
    shift_type VARCHAR(20) CHECK (shift_type IN ('Day', 'Evening', 'Night')) NOT NULL,
    required_fte NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    effective_from DATE DEFAULT CURRENT_DATE NOT NULL,
    effective_to DATE,
    CONSTRAINT unique_requirement UNIQUE (role, shift_type, effective_from)
);

-- 17. Employment Assignments Table (Active hired FTE mapping)
CREATE TABLE employment_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('CNA', 'Nurse')) NOT NULL,
    shift_type VARCHAR(20) CHECK (shift_type IN ('Day', 'Evening', 'Night')) NOT NULL,
    assigned_fte NUMERIC(5,2) DEFAULT 1.00 NOT NULL,
    effective_from DATE DEFAULT CURRENT_DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18. Transactional Notification Outbox Queue
CREATE TABLE notification_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL, -- e.g., 'Walkin_Paperwork_Completed'
    source_record_id UUID NOT NULL,
    recipient_contact VARCHAR(255) NOT NULL,
    channel VARCHAR(10) CHECK (channel IN ('SMS', 'Email', 'Push')) NOT NULL,
    template_key VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) CHECK (status IN ('Pending', 'Sent', 'Failed')) DEFAULT 'Pending' NOT NULL,
    attempt_count INT DEFAULT 0 NOT NULL,
    next_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    provider_message_id VARCHAR(255),
    last_error TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE
);
```

---

## 4. PIN Lockout RPC Function
```sql
CREATE OR REPLACE FUNCTION verify_profile_pin(
    target_user_id UUID,
    input_pin VARCHAR(4)
) RETURNS BOOLEAN AS $$
DECLARE
    stored_hash VARCHAR(255);
    failures INT;
    last_failure TIMESTAMP WITH TIME ZONE;
    is_valid BOOLEAN;
BEGIN
    -- Authenticate transaction matches active token UID
    IF target_user_id <> auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: User ID mismatch.';
    END IF;

    SELECT pin_hash, pin_failure_count, last_pin_failure_at
    INTO stored_hash, failures, last_failure
    FROM user_accounts
    WHERE user_id = target_user_id AND active = TRUE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Enforce 15-minute lockout if threshold exceeded
    IF failures >= 5 AND last_failure > NOW() - INTERVAL '15 minutes' THEN
        RAISE EXCEPTION 'PIN authentication locked. Please wait 15 minutes.';
    END IF;

    -- Crypt comparison matches stored bcrypt salt values
    IF stored_hash = crypt(input_pin, stored_hash) THEN
        is_valid := TRUE;
    ELSE
        is_valid := FALSE;
    END IF;

    IF is_valid THEN
        UPDATE user_accounts 
        SET pin_failure_count = 0, last_pin_failure_at = NULL 
        WHERE user_id = target_user_id;
        RETURN TRUE;
    ELSE
        UPDATE user_accounts 
        SET pin_failure_count = pin_failure_count + 1, last_pin_failure_at = NOW() 
        WHERE user_id = target_user_id;
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
