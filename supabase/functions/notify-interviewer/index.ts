// Supabase Edge Function: notify-interviewer
// Runtime: Deno

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (_req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Claim pending outbox items
    const { data: outboxItems, error: claimError } = await supabase
      .from('notification_outbox')
      .select('*')
      .eq('status', 'Pending')
      .limit(10)

    if (claimError || !outboxItems || outboxItems.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending notification items in outbox queue.' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    const results = []

    for (const item of outboxItems) {
      let isSuccess = false
      let providerMessageId = null
      let errorMsg = null

      if (item.channel === 'SMS' && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
        // Dispatch SMS via Twilio API
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
        const formData = new URLSearchParams()
        formData.append('From', TWILIO_PHONE_NUMBER)
        formData.append('To', item.recipient_contact)
        formData.append('Body', `[Shea Post Acute] ${item.event_type}: Candidate paperwork update.`)

        const twilioRes = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData,
        })

        if (twilioRes.ok) {
          const resData = await twilioRes.json()
          isSuccess = true
          providerMessageId = resData.sid
        } else {
          errorMsg = `Twilio HTTP Error ${twilioRes.status}`
        }
      } else if (item.channel === 'Email' && RESEND_API_KEY) {
        // Dispatch Email via Resend API
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Shea Post Acute Hiring <notifications@sheapostacute.com>',
            to: [item.recipient_contact],
            subject: `Shea Post Acute Notification: ${item.event_type}`,
            html: `<h2>Shea Post Acute Notification</h2><p>Event: ${item.event_type}</p>`,
          }),
        })

        if (resendRes.ok) {
          const resData = await resendRes.json()
          isSuccess = true
          providerMessageId = resData.id
        } else {
          errorMsg = `Resend HTTP Error ${resendRes.status}`
        }
      } else {
        errorMsg = 'Provider credentials not configured or unsupported channel (Free Mode)'
      }

      // Update outbox row status
      if (isSuccess) {
        await supabase
          .from('notification_outbox')
          .update({
            status: 'Sent',
            provider_message_id: providerMessageId,
            sent_at: new Date().toISOString(),
          })
          .eq('id', item.id)
      } else {
        await supabase
          .from('notification_outbox')
          .update({
            status: 'Failed',
            attempt_count: item.attempt_count + 1,
            last_error: errorMsg,
          })
          .eq('id', item.id)
      }

      results.push({ id: item.id, success: isSuccess, error: errorMsg })
    }

    return new Response(JSON.stringify({ processed: results.length, details: results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
