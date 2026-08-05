# Production Launch Runbook & Go-Live Sign-Off Checklist

**Shea Post Acute Interview Scheduling App (Scottsdale, AZ)**

---

## 1. Production Environment Variables Checklist (`.env.production`)

Ensure the following secrets are configured in Vercel / Netlify and Supabase Console Secrets:

```env
# Supabase Production API Keys
VITE_SUPABASE_URL="https://your-production-project.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsIn..."

# Edge Function Serverless Secrets (Set via: supabase secrets set)
TWILIO_ACCOUNT_SID="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="+16025550199"
RESEND_API_KEY="re_123456789..."
```

---

## 2. Automated Database Backup Policy

* **Frequency**: Daily Point-In-Time Recovery (PITR) enabled on Supabase Production Instance.
* **Retention**: 30-day automated PITR backup retention.
* **Disaster Recovery SLA**: RPO < 5 minutes, RTO < 1 hour.

---

## 3. Go-Live Sign-Off Gates

- [x] **Milestone 1**: Requirements & Design Specs Approved (`docs/`)
- [x] **Milestone 2**: PostgreSQL 20-Table Migration & 63 RLS Policies Applied
- [x] **Milestone 3**: Mon-Fri Schedule Grid & PIN Gatekeeper Functional
- [x] **Milestone 4**: Candidate ATS Pipeline & Walk-In Queue Functional
- [x] **Milestones 5 & 6**: Realtime WebSocket Sync & Oh Sh!t Bin Cascading Recovery Tested
- [x] **Milestone 7**: Edge Function SMS/Email Outbox Worker Configured
- [ ] **Final Gate**: Facility Management Final Authorization Sign-Off
