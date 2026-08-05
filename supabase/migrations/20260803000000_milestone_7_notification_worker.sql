-- Migration: 20260803000000_milestone_7_notification_worker.sql
-- Description: Concurrency-Safe Notification Queue Worker Claim Function

CREATE OR REPLACE FUNCTION claim_notification_outbox_batch(
    batch_size INT DEFAULT 10
) RETURNS SETOF notification_outbox AS $$
BEGIN
    RETURN QUERY
    UPDATE notification_outbox
    SET attempt_count = attempt_count + 1
    WHERE id IN (
        SELECT id FROM notification_outbox
        WHERE status = 'Pending' AND next_attempt_at <= NOW()
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT batch_size
    )
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
