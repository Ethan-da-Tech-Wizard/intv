# Risk Register

---

## 1. Overview
This Risk Register identifies potential technical, operational, and user-adoption risks associated with deploying the Shea Post Acute scheduling application, along with calculated impacts and mitigation actions.

---

## 2. Risk Matrix

| Risk ID | Description | Likelihood | Impact | Mitigation Strategy |
| :---: | :--- | :---: | :---: | :--- |
| **R-01** | **Floor Network Instability**: Weak Wi-Fi coverage on the SNF floor causes WebSockets to disconnect. | High | High | • Add a visual "Online / Offline" connection status bar in the header.<br>• Implement auto-reconnect fallback with database polling if WebSockets fail.<br>• Cache client state locally in browser memory. |
| **R-02** | **SMS/Email Delivery Failure**: API limits or incorrect phone/email entries prevent alerts from arriving. | Medium | High | • Save notification delivery status (Sent/Failed) in the database.<br>• Provide a manual "Resend Alert" button inside the scheduler dashboard.<br>• Validate phone numbers (E.164 format) and emails before saving profiles. |
| **R-03** | **Home Screen Accessibility Issues**: Non-technical staff struggle to access the web app on their phones. | Medium | Medium | • Configure app as a Progressive Web App (PWA) allowing "Add to Home Screen" prompts.<br>• Provide a simple, visual 1-page setup sheet for iOS (Safari) and Android (Chrome) install processes. |
| **R-04** | **Warning Fatigue (Overbooking)**: Schedulers bypass the double-warning overbooking dialogs without reading them. | High | Medium | • Log the active user’s name in the `overbooked_acknowledged_by` column on override.<br>• Display a warning log on the analytics screen showing who approved the most overbookings to enforce operational accountability. |
| **R-05** | **Auto-Pruning Loss**: Staff accidentally allow important deleted records to cross the 90-day threshold and auto-destruct. | Low | Low | • Display a prominent "Days until permanent deletion" countdown ticker next to each item in the "Oh Sh!t" bin.<br>• Send an automated admin warning email when items are within 7 days of auto-destruction. |
| **R-06** | **Role/Title Ambiguity**: Schedulers assign interviews to the wrong person because of duplicate titles (e.g. two ADONs). | Medium | Medium | • Enforce unique first and last names in the `profiles` table.<br>• Require explicit sub-titles (e.g. "John Doe (ADON 1)" vs "Jane Smith (ADON 2)") to eliminate ambiguity. |
| **R-07** | **Double Booking Race Condition**: Two schedulers book the same slot at the exact same fraction of a second. | Low | Medium | • Database implements transaction-level isolation.<br>• Unique constraint on `bookings(interviewer_id, interview_date, interview_time)` prevents double-writing. |
