# Milestones 5 & 6 Architecture Specification

**Real-Time Sync Engine, Oh Sh!t Bin Recovery Center & Outbox Log Security**

---

## 1. Real-Time Subscription Layer (`useRealtimeSubscriptions.ts`)

* **Channel Architecture**: Uses a single reconnect-safe Supabase WebSocket channel listening to `postgres_changes` across key operational tables:
  - `bookings`: Refreshes scheduling grid.
  - `applications`: Updates ATS pipeline stages.
  - `shadow_shifts`: Updates shadowing feedback.
  - `date_exceptions`: Updates off-duty date blocks.
  - `notification_outbox`: Refreshes outbox delivery log indicators.
* **Connection State**: Exposes live status (`CONNECTED`, `CONNECTING`, `DISCONNECTED`) to the UI header telemetry badge.

---

## 2. Oh Sh!t Bin & Exact-Batch Cascading Recovery (`OhShitBin.tsx`)

* **Soft-Delete Invariant**: Deletions flag `is_deleted = TRUE` and tag all child rows with `deletion_batch_id`.
* **Exact-Batch Recovery**: Calling `restore_deletion_batch(target_batch_id, actor_id)` restores only records soft-deleted in that exact batch, ensuring legacy canceled bookings remain untouched.
* **Server-Validated Actor Audit**: The `actor_id` is set via `auth.uid()` inside PostgreSQL stored functions to prevent client spoofing.
* **Supreme User Lockout**: Hard-purging (`DELETE FROM`) is disabled in the UI for standard users, displaying an authorization tooltip notice.

---

## 3. Notification Outbox Log Viewer & Privacy Masking (`NotificationLogs.tsx`)

* **PII Masking**: Contact info (`recipient_contact`) is masked (e.g. `(***) ***-0199` / `j***@sheapostacute.com`) on non-admin screens.
* **SMS Toggle**: System-wide SMS notification dispatcher can be enabled/disabled via `app_config`. Disabled SMS attempts write audit rows marked as `Failed (SMS Disabled)`.
