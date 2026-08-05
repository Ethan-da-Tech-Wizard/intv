-- Security Hardening Test Suite (pgTAP)
BEGIN;
SELECT plan(4);

-- Test 1: PIN Format Validator
SELECT throws_ok(
    $$ SELECT verify_profile_pin('00000000-0000-0000-0000-000000000001'::uuid, 'abcd') $$,
    'Invalid PIN format: Must be 4 numeric digits.'
);

-- Test 2: User ID Mismatch Block
SELECT throws_ok(
    $$ SELECT verify_profile_pin('00000000-0000-0000-0000-000000000002'::uuid, '1234') $$,
    'Unauthorized: Transaction user ID mismatch.'
);

-- Test 3: RLS Enabled on All Tables
SELECT all_tables_are_rls_enabled();

-- Test 4: Realtime Publication Contains Target Tables
SELECT published_tables_are('supabase_realtime', ARRAY['bookings', 'applications', 'shadow_shifts', 'date_exceptions', 'notification_outbox']);

SELECT * FROM finish();
ROLLBACK;
