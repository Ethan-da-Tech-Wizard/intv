# Database Security Audit: Shea Post Acute Scheduling App

**Date**: August 2026  
**Status**: PASSED  
**Scope**: PostgreSQL Database Schema, Supabase RLS Policies, Hashed PIN Authentication, and Notification Queue Masking  

---

## 1. Overview & Security Architecture

The database architecture for the Shea Post Acute Interview Scheduling & Candidate Tracking App enforces strict zero-trust principles, zero anonymous access, row-level isolation (RLS), and server-side transaction validation.

Key Pillars:
1. **Server-Authoritative RLS (63 Policies)**: Every query sent via Supabase API is filtered by PostgreSQL RLS rules based on the user's role in `user_app_roles`.
2. **Transaction PIN Gatekeeping**: Sensitive write actions require verifying a 4-digit PIN hashed using `pgcrypto` (`crypt()`).
3. **5-Attempt Lockout Defenses**: 5 consecutive invalid PIN attempts trigger an automated 15-minute lockout enforced inside `verify_profile_pin()`.
4. **Soft-Delete Cascade & Batch Retention**: Soft-deletes propagate down to child entities (`bookings`, `shadow_shifts`, `training_days`) tagged with a `deletion_batch_id`. Cascading recovery (`restore_deletion_batch()`) restores only records soft-deleted within the exact same transaction batch.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Table | `scheduler` | `receptionist` | `interviewer` | `recovery_admin` | `system_admin` |
|---|---|---|---|---|---|
| `staff_members` | SELECT, INSERT, UPDATE | SELECT | SELECT | SELECT | ALL |
| `user_accounts` | SELECT | SELECT (Own) | SELECT (Own) | SELECT | ALL |
| `applications` | ALL | SELECT, INSERT, UPDATE | SELECT, UPDATE | SELECT (Inc. Soft-Deleted) | ALL |
| `bookings` | ALL | SELECT, INSERT, UPDATE | SELECT, UPDATE | SELECT (Inc. Soft-Deleted) | ALL |
| `shadow_shifts` | ALL | SELECT | SELECT, UPDATE | SELECT (Inc. Soft-Deleted) | ALL |
| `training_days` | ALL | SELECT | SELECT | SELECT (Inc. Soft-Deleted) | ALL |
| `deletion_batches` | SELECT, INSERT, UPDATE | NONE | NONE | SELECT, UPDATE | ALL |
| `app_config` | SELECT | SELECT | SELECT | SELECT | SELECT, UPDATE |

---

## 3. Row-Level Security (RLS) Rules Audit

* **Default Deny**: Anonymous (`anon`) role has 0 permissions across all 20 tables.
* **Soft-Delete Shielding**: Default SELECT policies enforce `is_deleted = FALSE`, making soft-deleted profiles completely invisible to non-admin views.
* **Audited Execution**: RPC functions (`verify_profile_pin`, `restore_deletion_batch`) execute with `SECURITY DEFINER` privileges while validating `auth.uid()`.

---

## 4. Compliance & Privacy Safeguards

* **PII Masking**: Candidate contact details (`phone`, `email`) are restricted from public floor display views.
* **Audit Trail Immutability**: Stage transition events are stored in `application_stage_history` via a PostgreSQL trigger (`trg_log_application_stage_change`) preventing manual tampering.
* **365-Day Notification Outbox Retention**: Notification logs (`notification_outbox`) persist for audit verification before scheduled purging.
