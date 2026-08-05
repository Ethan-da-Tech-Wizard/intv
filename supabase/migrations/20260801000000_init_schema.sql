-- Migration: 20260801000000_init_schema.sql
-- Description: Core Database Foundation for Shea Post Acute Interview Scheduling & Candidate Tracking App

-- Enable pgcrypto for password/PIN hashing and UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

--------------------------------------------------------------------------------
-- 1. TABLES DEFINITIONS (20 TABLES)
--------------------------------------------------------------------------------

-- 1. Staff Members Table (Facility Roster)
CREATE TABLE IF NOT EXISTS staff_members (
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

-- 2. User Accounts Table (Application Users linked to Auth)
CREATE TABLE IF NOT EXISTS user_accounts (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    staff_member_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
    pin_hash VARCHAR(255),
    pin_failure_count INT DEFAULT 0 NOT NULL,
    last_pin_failure_at TIMESTAMP WITH TIME ZONE,
    mute_notifications BOOLEAN DEFAULT FALSE NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. App Roles Table
CREATE TABLE IF NOT EXISTS app_roles (
    role_key VARCHAR(30) PRIMARY KEY,
    description TEXT NOT NULL
);

INSERT INTO app_roles (role_key, description) VALUES
('scheduler', 'Facility scheduler who creates bookings, shadow shifts, and training schedules'),
('receptionist', 'Front desk staff managing candidate arrivals and walk-ins'),
('interviewer', 'Management staff conducting first and final candidate interviews'),
('recovery_admin', 'Authorized to view and restore soft-deleted items from the Oh Sh!t Bin'),
('system_admin', 'Supreme manager with configuration, user management, and hard-purge rights')
ON CONFLICT (role_key) DO NOTHING;

-- 4. User App Roles Table (RBAC Mapping)
CREATE TABLE IF NOT EXISTS user_app_roles (
    user_id UUID REFERENCES user_accounts(user_id) ON DELETE CASCADE,
    role_key VARCHAR(30) REFERENCES app_roles(role_key) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, role_key)
);

-- 5. Availability Table (Recurring Weekly Schedules)
CREATE TABLE IF NOT EXISTS availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE NOT NULL,
    day_of_week INT CHECK (day_of_week BETWEEN 1 AND 7) NOT NULL, -- 1=Monday, 7=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    effective_from DATE DEFAULT CURRENT_DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Recurring Exceptions Table (Weekly Recurring Busy Blocks, e.g., UR Meetings)
CREATE TABLE IF NOT EXISTS recurring_exceptions (
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

-- 7. Date Exceptions Table (One-off Off-duty Dates)
CREATE TABLE IF NOT EXISTS date_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE NOT NULL,
    exception_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    reason VARCHAR(255) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES user_accounts(user_id),
    deletion_batch_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Deletion Batches Table (Soft-Delete Transaction Auditing)
CREATE TABLE IF NOT EXISTS deletion_batches (
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

-- 9. People Table (Durable Candidate Identities)
CREATE TABLE IF NOT EXISTS people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name VARCHAR(100) NOT NULL,
    legal_name VARCHAR(150) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    normalized_email VARCHAR(255),
    normalized_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Applications Table (Candidate Hiring Episodes)
CREATE TABLE IF NOT EXISTS applications (
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

-- 11. Application Stage History Table (Immutable Transition Log)
CREATE TABLE IF NOT EXISTS application_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
    from_stage VARCHAR(30) NOT NULL,
    to_stage VARCHAR(30) NOT NULL,
    reason_code VARCHAR(50),
    notes TEXT,
    actor_user_id UUID REFERENCES user_accounts(user_id),
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Bookings Table (Interview Appointments)
CREATE TABLE IF NOT EXISTS bookings (
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

-- 13. Schedule Overrides Table (Audit for Double-Bookings & Warnings)
CREATE TABLE IF NOT EXISTS schedule_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    conflict_type VARCHAR(50) NOT NULL,
    conflicting_event_id UUID,
    reason_code VARCHAR(30) NOT NULL,
    reason_text TEXT NOT NULL,
    acknowledged_by UUID REFERENCES user_accounts(user_id) NOT NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    conflict_snapshot JSONB NOT NULL
);

-- 14. Staff Capabilities Table (Role Skills Matrix)
CREATE TABLE IF NOT EXISTS staff_capabilities (
    staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE PRIMARY KEY,
    can_interview BOOLEAN DEFAULT FALSE NOT NULL,
    can_host_shadow BOOLEAN DEFAULT FALSE NOT NULL,
    can_precept BOOLEAN DEFAULT FALSE NOT NULL,
    max_concurrent_candidates INT DEFAULT 1 NOT NULL
);

-- 15. Shadow Shifts Table (Floor Shadowing Sessions)
CREATE TABLE IF NOT EXISTS shadow_shifts (
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

-- 16. Training Days Table (Orientation Schedules)
CREATE TABLE IF NOT EXISTS training_days (
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

-- 17. Staffing Requirements Table (FTE Quotas)
CREATE TABLE IF NOT EXISTS staffing_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) CHECK (role IN ('CNA', 'Nurse')) NOT NULL,
    shift_type VARCHAR(20) CHECK (shift_type IN ('Day', 'Evening', 'Night')) NOT NULL,
    required_fte NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    effective_from DATE DEFAULT CURRENT_DATE NOT NULL,
    effective_to DATE,
    CONSTRAINT unique_requirement UNIQUE (role, shift_type, effective_from)
);

-- 18. Employment Assignments Table (Active Hired FTE Assignments)
CREATE TABLE IF NOT EXISTS employment_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('CNA', 'Nurse')) NOT NULL,
    shift_type VARCHAR(20) CHECK (shift_type IN ('Day', 'Evening', 'Night')) NOT NULL,
    assigned_fte NUMERIC(5,2) DEFAULT 1.00 NOT NULL,
    effective_from DATE DEFAULT CURRENT_DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 19. Notification Outbox Queue
CREATE TABLE IF NOT EXISTS notification_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
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
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 20. App Config Table (System Settings & Features)
CREATE TABLE IF NOT EXISTS app_config (
    config_key VARCHAR(50) PRIMARY KEY,
    config_value JSONB NOT NULL,
    updated_by UUID REFERENCES user_accounts(user_id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO app_config (config_key, config_value) VALUES
('sms_notifications_enabled', 'true'::jsonb),
('email_notifications_enabled', 'true'::jsonb),
('supreme_users', '[]'::jsonb)
ON CONFLICT (config_key) DO NOTHING;

--------------------------------------------------------------------------------
-- 2. INDEXES & PERFORMANCE OPTIMIZATION
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bookings_interviewer_date ON bookings (interviewer_id, scheduled_start_at) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_bookings_application ON bookings (application_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_applications_stage ON applications (application_stage) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_applications_person ON applications (person_id);
CREATE INDEX IF NOT EXISTS idx_shadow_shifts_application ON shadow_shifts (application_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_training_days_application ON training_days (application_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_notification_outbox_pending ON notification_outbox (status, next_attempt_at) WHERE status = 'Pending';
CREATE INDEX IF NOT EXISTS idx_date_exceptions_staff_date ON date_exceptions (staff_member_id, exception_date) WHERE is_deleted = FALSE;

--------------------------------------------------------------------------------
-- 3. FUNCTIONS & TRIGGERS
--------------------------------------------------------------------------------

-- Function: RBAC Role Verification Helper
CREATE OR REPLACE FUNCTION has_role(target_user_id UUID, required_role VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_app_roles
        WHERE user_id = target_user_id AND role_key = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Function: Automatic Stage History Audit Log
CREATE OR REPLACE FUNCTION log_application_stage_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.application_stage IS DISTINCT FROM NEW.application_stage) THEN
        INSERT INTO application_stage_history (
            application_id,
            from_stage,
            to_stage,
            actor_user_id,
            occurred_at
        ) VALUES (
            NEW.id,
            OLD.application_stage,
            NEW.application_stage,
            auth.uid(),
            now()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_log_application_stage_change
AFTER UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION log_application_stage_change();

-- Trigger Function: Soft Delete Cascading to Child Bookings, Shadows & Training Days
CREATE OR REPLACE FUNCTION cascade_soft_delete_application()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE) THEN
        -- Cascade to bookings
        UPDATE bookings
        SET is_deleted = TRUE,
            deleted_at = NEW.deleted_at,
            deleted_by = NEW.deleted_by,
            deletion_batch_id = NEW.deletion_batch_id
        WHERE application_id = NEW.id AND is_deleted = FALSE;

        -- Cascade to shadow_shifts
        UPDATE shadow_shifts
        SET is_deleted = TRUE,
            deleted_at = NEW.deleted_at,
            deleted_by = NEW.deleted_by,
            deletion_batch_id = NEW.deletion_batch_id
        WHERE application_id = NEW.id AND is_deleted = FALSE;

        -- Cascade to training_days
        UPDATE training_days
        SET is_deleted = TRUE,
            deleted_at = NEW.deleted_at,
            deleted_by = NEW.deleted_by,
            deletion_batch_id = NEW.deletion_batch_id
        WHERE application_id = NEW.id AND is_deleted = FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_cascade_soft_delete_application
AFTER UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION cascade_soft_delete_application();

-- RPC Function: Verify Profile 4-Digit PIN with 5-Attempt Lockout
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

    -- Enforce 15-minute lockout if failure threshold hit
    IF failures >= 5 AND last_failure > NOW() - INTERVAL '15 minutes' THEN
        RAISE EXCEPTION 'PIN authentication locked. Please wait 15 minutes.';
    END IF;

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

-- RPC Function: Exact-Batch Cascading Recovery
CREATE OR REPLACE FUNCTION restore_deletion_batch(
    target_batch_id UUID,
    actor_id UUID
) RETURNS INT AS $$
DECLARE
    restored_count INT := 0;
    records_count INT := 0;
BEGIN
    -- Restore applications
    UPDATE applications
    SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL, deletion_batch_id = NULL
    WHERE deletion_batch_id = target_batch_id AND is_deleted = TRUE;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    restored_count := restored_count + records_count;

    -- Restore bookings
    UPDATE bookings
    SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL, deletion_batch_id = NULL
    WHERE deletion_batch_id = target_batch_id AND is_deleted = TRUE;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    restored_count := restored_count + records_count;

    -- Restore shadow shifts
    UPDATE shadow_shifts
    SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL, deletion_batch_id = NULL
    WHERE deletion_batch_id = target_batch_id AND is_deleted = TRUE;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    restored_count := restored_count + records_count;

    -- Restore training days
    UPDATE training_days
    SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL, deletion_batch_id = NULL
    WHERE deletion_batch_id = target_batch_id AND is_deleted = TRUE;
    GET DIAGNOSTICS records_count = ROW_COUNT;
    restored_count := restored_count + records_count;

    -- Update batch audit record
    UPDATE deletion_batches
    SET recovered_at = NOW(), recovered_by = actor_id
    WHERE id = target_batch_id;

    RETURN restored_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES (63 POLICIES)
--------------------------------------------------------------------------------

-- Enable RLS on all 20 tables
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_app_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE shadow_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffing_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- 1. staff_members RLS Policies
CREATE POLICY "Authenticated users can select staff members" ON staff_members FOR SELECT TO authenticated USING (active = TRUE);
CREATE POLICY "Schedulers and Admins can insert staff members" ON staff_members FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'scheduler') OR has_role(auth.uid(), 'system_admin'));
CREATE POLICY "Schedulers and Admins can update staff members" ON staff_members FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'scheduler') OR has_role(auth.uid(), 'system_admin'));
CREATE POLICY "System Admins can delete staff members" ON staff_members FOR DELETE TO authenticated USING (has_role(auth.uid(), 'system_admin'));

-- 2. user_accounts RLS Policies
CREATE POLICY "Users can view own account or Schedulers/Admins view all" ON user_accounts FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'scheduler') OR has_role(auth.uid(), 'system_admin'));
CREATE POLICY "Users update own settings or Admins update accounts" ON user_accounts FOR UPDATE TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'system_admin'));
CREATE POLICY "System Admins insert user accounts" ON user_accounts FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'system_admin'));
CREATE POLICY "System Admins delete user accounts" ON user_accounts FOR DELETE TO authenticated USING (has_role(auth.uid(), 'system_admin'));

-- 3. app_roles RLS Policies
CREATE POLICY "Authenticated users view app_roles" ON app_roles FOR SELECT TO authenticated USING (TRUE);

-- 4. user_app_roles RLS Policies
CREATE POLICY "Authenticated users view role assignments" ON user_app_roles FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "System Admins manage role assignments" ON user_app_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'system_admin'));

-- 5. availability RLS Policies
CREATE POLICY "Authenticated users view availability" ON availability FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Staff or Schedulers manage availability" ON availability FOR ALL TO authenticated USING (has_role(auth.uid(), 'scheduler') OR has_role(auth.uid(), 'system_admin') OR EXISTS (SELECT 1 FROM user_accounts WHERE user_id = auth.uid() AND staff_member_id = availability.staff_member_id));

-- 6. recurring_exceptions RLS Policies
CREATE POLICY "Authenticated users view recurring exceptions" ON recurring_exceptions FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Staff or Schedulers manage recurring exceptions" ON recurring_exceptions FOR ALL TO authenticated USING (has_role(auth.uid(), 'scheduler') OR has_role(auth.uid(), 'system_admin') OR EXISTS (SELECT 1 FROM user_accounts WHERE user_id = auth.uid() AND staff_member_id = recurring_exceptions.staff_member_id));

-- 7. date_exceptions RLS Policies
CREATE POLICY "Authenticated users view date exceptions" ON date_exceptions FOR SELECT TO authenticated USING (is_deleted = FALSE OR has_role(auth.uid(), 'recovery_admin') OR has_role(auth.uid(), 'system_admin'));
CREATE POLICY "Staff or Schedulers manage date exceptions" ON date_exceptions FOR ALL TO authenticated USING (has_role(auth.uid(), 'scheduler') OR has_role(auth.uid(), 'system_admin') OR EXISTS (SELECT 1 FROM user_accounts WHERE user_id = auth.uid() AND staff_member_id = date_exceptions.staff_member_id));

-- 8. deletion_batches RLS Policies
CREATE POLICY "Recovery Admins and System Admins view deletion batches" ON deletion_batches FOR SELECT TO authenticated USING (has_role(auth.uid(), 'recovery_admin') OR has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'scheduler'));
CREATE POLICY "Users can create deletion batches" ON deletion_batches FOR INSERT TO authenticated WITH CHECK (auth.uid() = deleted_by);
CREATE POLICY "Recovery Admins update deletion batches" ON deletion_batches FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'recovery_admin') OR has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'scheduler'));

-- 9. people RLS Policies
CREATE POLICY "Authenticated staff view candidates" ON people FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Schedulers and Receptionists insert candidates" ON people FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'scheduler') OR has_role(auth.uid(), 'receptionist') OR has_role(auth.uid(), 'system_admin'));
CREATE POLICY "Schedulers and Receptionists update candidates" ON people FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'scheduler') OR has_role(auth.uid(), 'receptionist') OR has_role(auth.uid(), 'system_admin'));

-- 10. applications RLS Policies
CREATE POLICY "Authenticated staff view applications" ON applications FOR SELECT TO authenticated USING (is_deleted = FALSE OR has_role(auth.uid(), 'recovery_admin') OR has_role(auth.uid(), 'system_admin'));
CREATE POLICY "Schedulers and Receptionists insert applications" ON applications FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'scheduler') OR has_role(auth.uid(), 'receptionist') OR has_role(auth.uid(), 'system_admin'));
CREATE POLICY "Staff update applications" ON applications FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'scheduler') OR has_role(auth.uid(), 'receptionist') OR has_role(auth.uid(), 'interviewer') OR has_role(auth.uid(), 'system_admin'));

-- 11. application_stage_history RLS Policies
CREATE POLICY "Authenticated staff view stage history" ON application_stage_history FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "System inserts stage history" ON application_stage_history FOR INSERT TO authenticated WITH CHECK (TRUE);

-- 12. bookings RLS Policies
CREATE POLICY "Authenticated staff view bookings" ON bookings FOR SELECT TO authenticated USING (is_deleted = FALSE OR has_role(auth.uid(), 'recovery_admin') OR has_role(auth.uid(), 'system_admin'));
CREATE POLICY "Schedulers and Receptionists insert bookings" ON bookings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'scheduler') OR has_role(auth.uid(), 'receptionist') OR has_role(auth.uid(), 'system_admin'));
CREATE POLICY "Schedulers and Interviewers update bookings" ON bookings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'scheduler') OR has_role(auth.uid(), 'interviewer') OR has_role(auth.uid(), 'receptionist') OR has_role(auth.uid(), 'system_admin'));

-- 13. schedule_overrides RLS Policies
CREATE POLICY "Schedulers and Admins view schedule overrides" ON schedule_overrides FOR SELECT TO authenticated USING (has_role(auth.uid(), 'scheduler') OR has_role(auth.uid(), 'system_admin'));
CREATE POLICY "Schedulers insert schedule overrides" ON schedule_overrides FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'scheduler') OR has_role(auth.uid(), 'system_admin'));

-- 14. staff_capabilities RLS Policies
CREATE POLICY "Authenticated staff view capabilities" ON staff_capabilities FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Schedulers and Admins manage capabilities" ON staff_capabilities FOR ALL TO authenticated USING (has_role(auth.uid(), 'scheduler') OR has_role(auth.uid(), 'system_admin'));

-- 15. shadow_shifts RLS Policies
CREATE POLICY "Authenticated staff view shadow shifts" ON shadow_shifts FOR SELECT TO authenticated USING (is_deleted = FALSE OR has_role(auth.uid(), 'recovery_admin') OR has_role(auth.uid(), 'system_admin'));
CREATE POLICY "Schedulers insert shadow shifts" ON shadow_shifts FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'scheduler') OR has_role(auth.uid(), 'system_admin'));
CREATE POLICY "Staff update shadow shifts" ON shadow_shifts FOR UPDATE TO authenticated USING (TRUE);

-- 16. training_days RLS Policies
CREATE POLICY "Authenticated staff view training days" ON training_days FOR SELECT TO authenticated USING (is_deleted = FALSE OR has_role(auth.uid(), 'recovery_admin') OR has_role(auth.uid(), 'system_admin'));
CREATE POLICY "Schedulers manage training days" ON training_days FOR ALL TO authenticated USING (has_role(auth.uid(), 'scheduler') OR has_role(auth.uid(), 'system_admin'));

-- 17. staffing_requirements RLS Policies
CREATE POLICY "Authenticated staff view staffing requirements" ON staffing_requirements FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Schedulers and Admins manage staffing requirements" ON staffing_requirements FOR ALL TO authenticated USING (has_role(auth.uid(), 'scheduler') OR has_role(auth.uid(), 'system_admin'));

-- 18. employment_assignments RLS Policies
CREATE POLICY "Authenticated staff view employment assignments" ON employment_assignments FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Schedulers and Admins manage employment assignments" ON employment_assignments FOR ALL TO authenticated USING (has_role(auth.uid(), 'scheduler') OR has_role(auth.uid(), 'system_admin'));

-- 19. notification_outbox RLS Policies
CREATE POLICY "Schedulers and Admins view outbox logs" ON notification_outbox FOR SELECT TO authenticated USING (has_role(auth.uid(), 'scheduler') OR has_role(auth.uid(), 'system_admin'));
CREATE POLICY "Authenticated users insert outbox notifications" ON notification_outbox FOR INSERT TO authenticated WITH CHECK (TRUE);

-- 20. app_config RLS Policies
CREATE POLICY "Authenticated users view app config" ON app_config FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "System Admins update app config" ON app_config FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'system_admin'));

--------------------------------------------------------------------------------
-- 5. REALTIME PUBLICATION SETUP
--------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE bookings, applications, shadow_shifts, date_exceptions, notification_outbox;
