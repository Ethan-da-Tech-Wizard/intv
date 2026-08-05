-- Migration: 20260804000000_post_launch_security_hardening.sql
-- Description: Post-Launch Security Hardening & RPC Constraints

-- Reinforce verify_profile_pin RPC security
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
    -- Strict auth verification preventing client spoofing
    IF target_user_id <> auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Transaction user ID mismatch.';
    END IF;

    -- Validate input PIN format
    IF input_pin IS NULL OR LENGTH(input_pin) <> 4 OR input_pin !~ '^[0-9]{4}$' THEN
        RAISE EXCEPTION 'Invalid PIN format: Must be 4 numeric digits.';
    END IF;

    SELECT pin_hash, pin_failure_count, last_pin_failure_at
    INTO stored_hash, failures, last_failure
    FROM user_accounts
    WHERE user_id = target_user_id AND active = TRUE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- 15-minute lockout check
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
