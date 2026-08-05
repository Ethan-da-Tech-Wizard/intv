# Milestone 7 Deployment Architecture Guide

**Multi-Platform Distribution & Serverless Notification Pipeline**

---

## 1. Serverless Edge Functions (`notify-interviewer`)

* **Runtime**: Deno on Supabase Edge Network.
* **Service Integrations**:
  - **Twilio SMS**: Sends REST API POST payload to `https://api.twilio.com/2010-04-01/Accounts/{Sid}/Messages.json`.
  - **Resend HTML Email**: Dispatches responsive HTML email templates to candidate and staff inboxes via `https://api.resend.com/emails`.
* **Outbox Worker**: Executes `claim_notification_outbox_batch()` RPC to pull `Pending` queue rows with atomic `SKIP LOCKED` isolation.

---

## 2. Multi-Platform Packaging Configurations

### A. Progressive Web App (PWA)
* Configured in [vite.config.ts](file:///Users/mirandazavala/Desktop/intv/vite.config.ts) using `vite-plugin-pwa`.
* Generates `sw.js` precaching static assets (HTML, CSS, JS, web fonts) for instant offline boot.

### B. Mobile Native Shell (Capacitor 8)
* Configured in [capacitor.config.json](file:///Users/mirandazavala/Desktop/intv/capacitor.config.json).
* Package ID: `com.sheapostacute.intv`.
* Target Platforms: Android (`npx cap add android`) & iOS (`npx cap add ios`).

### C. Desktop Native Shell (Tauri 2.0)
* Configured in [tauri.conf.json](file:///Users/mirandazavala/Desktop/intv/src-tauri/tauri.conf.json).
* Target Installers: Windows (`.msi`/`.exe`), macOS (`.dmg`), and Linux (`.AppImage`).

---

## 3. Build & CI Verification Steps

```bash
# 1. Frontend Build & PWA Generation
npm run build

# 2. Capacitor Mobile Sync
npx cap sync

# 3. Deploy Edge Function to Supabase
supabase functions deploy notify-interviewer
```
