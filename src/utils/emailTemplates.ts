// Email Templates for Shea Post Acute Scottsdale

export interface EmailParams {
  candidateName: string
  position: 'CNA' | 'Nurse'
  dateStr: string
  timeStr: string
  interviewerName?: string
  hostName?: string
  preceptorName?: string
}

export const renderCandidateBookingEmail = (params: EmailParams): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
    .card { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; }
    .header { background: #0284c7; padding: 24px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; }
    .body { padding: 24px; line-height: 1.6; }
    .badge { display: inline-block; background: #0369a1; color: #e0f2fe; padding: 4px 12px; border-radius: 8px; font-weight: bold; font-size: 14px; }
    .checklist { background: #0f172a; padding: 16px; border-radius: 12px; border: 1px solid #334155; margin-top: 16px; }
    .footer { text-align: center; padding: 16px; font-size: 12px; color: #94a3b8; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Interview Scheduled: Shea Post Acute</h1>
    </div>
    <div class="body">
      <p>Dear <strong>${params.candidateName}</strong>,</p>
      <p>Your interview for the <strong>${params.position}</strong> position has been scheduled!</p>

      <p><span class="badge">Date: ${params.dateStr} at ${params.timeStr}</span></p>

      <div class="checklist">
        <h3>📍 Facility Address & Directions:</h3>
        <p><strong>Shea Post Acute</strong><br/>Scottsdale, AZ</p>

        <h3>📋 What to Bring:</h3>
        <ul>
          <li>Government-issued Photo ID</li>
          <li>Active Certification / Nursing License</li>
          <li>CPR / BLS Card</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      Shea Post Acute Scottsdale Hiring Department
    </div>
  </div>
</body>
</html>
`
}

export const renderShadowShiftEmail = (params: EmailParams): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
    .card { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; }
    .header { background: #d97706; padding: 24px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; }
    .body { padding: 24px; line-height: 1.6; }
    .badge { display: inline-block; background: #b45309; color: #fef3c7; padding: 4px 12px; border-radius: 8px; font-weight: bold; font-size: 14px; }
    .footer { text-align: center; padding: 16px; font-size: 12px; color: #94a3b8; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Floor Shadow Shift Assigned</h1>
    </div>
    <div class="body">
      <p>Hello <strong>${params.hostName || 'Floor Host'}</strong>,</p>
      <p>Candidate <strong>${params.candidateName}</strong> (${params.position}) is scheduled to shadow you on shift.</p>
      <p><span class="badge">Shift Date: ${params.dateStr} at ${params.timeStr}</span></p>
      <p>Please log your skills and attitude feedback in the dashboard once completed.</p>
    </div>
    <div class="footer">
      Shea Post Acute Scottsdale
    </div>
  </div>
</body>
</html>
`
}
