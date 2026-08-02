# Architecture Diagram & Data Flow

---

## 1. Overview
The Shea Post Acute scheduling application uses a modern **Serverless/BaaS (Backend-as-a-Service)** architecture, pairing a Single Page Application (SPA) on the client side with Supabase on the cloud. This avoids server provisioning costs, enables instant real-time synchronization, and eliminates licensing fees.

---

## 2. Mermaid Architecture Diagram

```mermaid
graph TB
    subgraph Client Tier [Client Tier - Mobile & Desktop]
        A1[Scheduler Web Browser - Desktop]
        A2[Interviewer Web Browser - Mobile]
    end

    subgraph CDN [Hosting CDN]
        B1[Vercel / Netlify Edge]
    end

    subgraph Backend Tier [Database & Serverless - Supabase]
        C1[Supabase PostgreSQL DB]
        C2[Supabase Realtime Engine]
        C3[Supabase Edge Functions]
    end

    subgraph Third Party APIs [Third-Party Integrations]
        D1[Twilio SMS API]
        D2[Resend Email API]
    end

    %% Deployment / Access Flows
    B1 -->|Serves React/JS assets| A1
    B1 -->|Serves React/JS assets| A2

    %% Read / Write Flows
    A1 -->|1. Create / Edit Booking HTTP POST| C1
    A2 -->|2. Toggle Availability HTTP POST| C1

    %% Real-time Sync Flows
    C1 -->|3. PostgreSQL WAL Replication| C2
    C2 -->|4. WebSocket Event Push| A1
    C2 -->|4. WebSocket Event Push| A2

    %% Notification Flows
    C1 -->|5. Trigger Event on Bookings Table| C3
    C3 -->|6. Send SMS Request| D1
    C3 -->|6. Send Email Request| D2
    
    D1 -->|7a. Staff SMS Delivery| E1((Interviewer Mobile))
    D1 -->|7b. Candidate SMS Delivery| E3((Candidate Mobile))
    D2 -->|8. Email Delivery| E2((Interviewer Inbox))
```

---

## 3. Data Flow Steps

### A. Scheduling Flow
1. **Booking Trigger**: A scheduler logs into the dashboard via desktop, checks availability, and submits a candidate booking for a Nurse Interviewer.
2. **Database Write**: The client sends an HTTPS request to the Supabase client API. RLS policies verify the facility session and save the booking.
3. **Database Change Capture**: The PostgreSQL database captures the insert in its Write-Ahead Log (WAL).

### B. Real-Time Sync Flow
4. **WebSocket Broadcast**: The Supabase Realtime Engine reads the WAL change and pushes a JSON event payload over WebSocket channels (`public:bookings`).
5. **UI Update**: All active frontend clients receive the event payload. The React state updates immediately, turning the grid slot red and showing the candidate name without page refresh.

### C. Notification Dispatch Flow
6. **Trigger Invocation**: A database trigger on `bookings` detects a new booking, status update (e.g. candidate arrival), or cancellation, and invokes a Deno-based Supabase Edge Function asynchronously.
7. **External Calls**: The Edge Function resolves the interviewer's and/or candidate's contact details, formats the template, and makes outbound API calls to Twilio (SMS) and Resend (Email).
8. **Worker & Candidate Notification**: 
   * The interviewer receives the text alert and email on their phone, notifying them of the upcoming interview or lobby arrival.
   * If opt-in is enabled, the candidate receives an automated text confirmation.
