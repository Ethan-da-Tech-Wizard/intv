-- Migration: 20260802000000_milestone_5_6_realtime_recovery.sql
-- Description: Realtime Publications & Deletion Batches View for Milestones 5 & 6

CREATE OR REPLACE VIEW deletion_batches_view AS
SELECT
    db.id AS batch_id,
    db.root_entity_type,
    db.root_entity_id,
    db.deleted_by,
    sm.display_name AS deleted_by_name,
    db.deletion_reason,
    db.deleted_at,
    db.retention_until,
    db.recovered_at,
    db.recovered_by
FROM deletion_batches db
LEFT JOIN user_accounts ua ON db.deleted_by = ua.user_id
LEFT JOIN staff_members sm ON ua.staff_member_id = sm.id
WHERE db.recovered_at IS NULL;

-- Indexes to accelerate soft-delete recovery searches
CREATE INDEX IF NOT EXISTS idx_deletion_batches_unrecovered ON deletion_batches (deleted_at DESC) WHERE recovered_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_applications_deleted ON applications (deletion_batch_id) WHERE is_deleted = TRUE;
CREATE INDEX IF NOT EXISTS idx_bookings_deleted ON bookings (deletion_batch_id) WHERE is_deleted = TRUE;
CREATE INDEX IF NOT EXISTS idx_shadow_shifts_deleted ON shadow_shifts (deletion_batch_id) WHERE is_deleted = TRUE;
CREATE INDEX IF NOT EXISTS idx_training_days_deleted ON training_days (deletion_batch_id) WHERE is_deleted = TRUE;
