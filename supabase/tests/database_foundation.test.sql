-- Database Foundation Test Suite (pgTAP)
BEGIN;
SELECT plan(15);

-- Test 1: Extension Check
SELECT has_extension('pgcrypto', 'pgcrypto extension must be enabled');

-- Test 2-6: Check Core Tables Existence
SELECT has_table('staff_members', 'staff_members table exists');
SELECT has_table('user_accounts', 'user_accounts table exists');
SELECT has_table('applications', 'applications table exists');
SELECT has_table('bookings', 'bookings table exists');
SELECT has_table('notification_outbox', 'notification_outbox table exists');

-- Test 7-11: Check RLS Enablement
SELECT id_enabled('staff_members', 'RLS enabled on staff_members');
SELECT id_enabled('user_accounts', 'RLS enabled on user_accounts');
SELECT id_enabled('applications', 'RLS enabled on applications');
SELECT id_enabled('bookings', 'RLS enabled on bookings');
SELECT id_enabled('shadow_shifts', 'RLS enabled on shadow_shifts');

-- Test 12-14: Check Functions Existence
SELECT has_function('verify_profile_pin', ARRAY['uuid', 'character varying'], 'verify_profile_pin function exists');
SELECT has_function('restore_deletion_batch', ARRAY['uuid', 'uuid'], 'restore_deletion_batch function exists');
SELECT has_function('has_role', ARRAY['uuid', 'character varying'], 'has_role function exists');

-- Test 15: Check Realtime Publication
SELECT published_tables_are('supabase_realtime', ARRAY['bookings', 'applications', 'shadow_shifts', 'date_exceptions', 'notification_outbox']);

SELECT * FROM finish();
ROLLBACK;
