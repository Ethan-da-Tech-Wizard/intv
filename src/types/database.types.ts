export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      staff_members: {
        Row: {
          id: string
          display_name: string
          legal_name: string
          job_role: 'CNA' | 'Nurse' | 'Floor Staff' | 'Management'
          default_shift: 'Day' | 'Evening' | 'Night'
          email: string | null
          phone: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          display_name: string
          legal_name: string
          job_role: 'CNA' | 'Nurse' | 'Floor Staff' | 'Management'
          default_shift?: 'Day' | 'Evening' | 'Night'
          email?: string | null
          phone?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          legal_name?: string
          job_role?: 'CNA' | 'Nurse' | 'Floor Staff' | 'Management'
          default_shift?: 'Day' | 'Evening' | 'Night'
          email?: string | null
          phone?: string | null
          active?: boolean
          created_at?: string
        }
      }
      user_accounts: {
        Row: {
          user_id: string
          staff_member_id: string | null
          pin_hash: string | null
          pin_failure_count: number
          last_pin_failure_at: string | null
          mute_notifications: boolean
          active: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          staff_member_id?: string | null
          pin_hash?: string | null
          pin_failure_count?: number
          last_pin_failure_at?: string | null
          mute_notifications?: boolean
          active?: boolean
          created_at?: string
        }
        Update: {
          user_id?: string
          staff_member_id?: string | null
          pin_hash?: string | null
          pin_failure_count?: number
          last_pin_failure_at?: string | null
          mute_notifications?: boolean
          active?: boolean
          created_at?: string
        }
      }
      app_roles: {
        Row: {
          role_key: string
          description: string
        }
        Insert: {
          role_key: string
          description: string
        }
        Update: {
          role_key?: string
          description?: string
        }
      }
      user_app_roles: {
        Row: {
          user_id: string
          role_key: string
          created_at: string
        }
        Insert: {
          user_id: string
          role_key: string
          created_at?: string
        }
        Update: {
          user_id?: string
          role_key?: string
          created_at?: string
        }
      }
      availability: {
        Row: {
          id: string
          staff_member_id: string
          day_of_week: number
          start_time: string
          end_time: string
          effective_from: string
          effective_to: string | null
          created_at: string
        }
        Insert: {
          id?: string
          staff_member_id: string
          day_of_week: number
          start_time: string
          end_time: string
          effective_from?: string
          effective_to?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          staff_member_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          effective_from?: string
          effective_to?: string | null
          created_at?: string
        }
      }
      recurring_exceptions: {
        Row: {
          id: string
          staff_member_id: string
          day_of_week: number
          start_time: string
          end_time: string
          reason: string
          effective_from: string
          effective_to: string | null
          created_at: string
        }
        Insert: {
          id?: string
          staff_member_id: string
          day_of_week: number
          start_time: string
          end_time: string
          reason: string
          effective_from?: string
          effective_to?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          staff_member_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          reason?: string
          effective_from?: string
          effective_to?: string | null
          created_at?: string
        }
      }
      date_exceptions: {
        Row: {
          id: string
          staff_member_id: string
          exception_date: string
          start_time: string | null
          end_time: string | null
          reason: string
          is_deleted: boolean
          deleted_at: string | null
          deleted_by: string | null
          deletion_batch_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          staff_member_id: string
          exception_date: string
          start_time?: string | null
          end_time?: string | null
          reason: string
          is_deleted?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_batch_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          staff_member_id?: string
          exception_date?: string
          start_time?: string | null
          end_time?: string | null
          reason?: string
          is_deleted?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_batch_id?: string | null
          created_at?: string
        }
      }
      deletion_batches: {
        Row: {
          id: string
          root_entity_type: string
          root_entity_id: string
          deleted_by: string
          deletion_reason: string | null
          deleted_at: string
          retention_until: string
          recovered_at: string | null
          recovered_by: string | null
        }
        Insert: {
          id?: string
          root_entity_type: string
          root_entity_id: string
          deleted_by: string
          deletion_reason?: string | null
          deleted_at?: string
          retention_until: string
          recovered_at?: string | null
          recovered_by?: string | null
        }
        Update: {
          id?: string
          root_entity_type?: string
          root_entity_id?: string
          deleted_by?: string
          deletion_reason?: string | null
          deleted_at?: string
          retention_until?: string
          recovered_at?: string | null
          recovered_by?: string | null
        }
      }
      people: {
        Row: {
          id: string
          display_name: string
          legal_name: string
          email: string | null
          phone: string | null
          normalized_email: string | null
          normalized_phone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          display_name: string
          legal_name: string
          email?: string | null
          phone?: string | null
          normalized_email?: string | null
          normalized_phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          legal_name?: string
          email?: string | null
          phone?: string | null
          normalized_email?: string | null
          normalized_phone?: string | null
          created_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          person_id: string
          position: 'CNA' | 'Nurse'
          desired_shift: 'Day' | 'Evening' | 'Night'
          referral_source: string | null
          desired_wage: string | null
          application_stage:
            | 'New'
            | 'Interview_Scheduled'
            | 'Interviewing'
            | 'Shadow_Pending'
            | 'Shadow_Scheduled'
            | 'Final_Review'
            | 'Offer_Pending'
            | 'Training'
            | 'Employed'
            | 'Rejected'
            | 'Withdrawn'
            | 'Archived'
          hiring_outcome:
            | 'Recommended'
            | 'Rejected'
            | 'Pending_Feedback'
            | 'Candidate_Withdrew'
            | 'Employed'
            | 'In_Training'
            | null
          is_deleted: boolean
          deleted_at: string | null
          deleted_by: string | null
          deletion_batch_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          person_id: string
          position: 'CNA' | 'Nurse'
          desired_shift?: 'Day' | 'Evening' | 'Night'
          referral_source?: string | null
          desired_wage?: string | null
          application_stage?:
            | 'New'
            | 'Interview_Scheduled'
            | 'Interviewing'
            | 'Shadow_Pending'
            | 'Shadow_Scheduled'
            | 'Final_Review'
            | 'Offer_Pending'
            | 'Training'
            | 'Employed'
            | 'Rejected'
            | 'Withdrawn'
            | 'Archived'
          hiring_outcome?:
            | 'Recommended'
            | 'Rejected'
            | 'Pending_Feedback'
            | 'Candidate_Withdrew'
            | 'Employed'
            | 'In_Training'
            | null
          is_deleted?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_batch_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          person_id?: string
          position?: 'CNA' | 'Nurse'
          desired_shift?: 'Day' | 'Evening' | 'Night'
          referral_source?: string | null
          desired_wage?: string | null
          application_stage?:
            | 'New'
            | 'Interview_Scheduled'
            | 'Interviewing'
            | 'Shadow_Pending'
            | 'Shadow_Scheduled'
            | 'Final_Review'
            | 'Offer_Pending'
            | 'Training'
            | 'Employed'
            | 'Rejected'
            | 'Withdrawn'
            | 'Archived'
          hiring_outcome?:
            | 'Recommended'
            | 'Rejected'
            | 'Pending_Feedback'
            | 'Candidate_Withdrew'
            | 'Employed'
            | 'In_Training'
            | null
          is_deleted?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_batch_id?: string | null
          created_at?: string
        }
      }
      application_stage_history: {
        Row: {
          id: string
          application_id: string
          from_stage: string
          to_stage: string
          reason_code: string | null
          notes: string | null
          actor_user_id: string | null
          occurred_at: string
        }
        Insert: {
          id?: string
          application_id: string
          from_stage: string
          to_stage: string
          reason_code?: string | null
          notes?: string | null
          actor_user_id?: string | null
          occurred_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          from_stage?: string
          to_stage?: string
          reason_code?: string | null
          notes?: string | null
          actor_user_id?: string | null
          occurred_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          interviewer_id: string
          application_id: string
          scheduled_start_at: string
          scheduled_end_at: string
          actual_start_at: string | null
          actual_end_at: string | null
          duration_minutes: number | null
          notes: string | null
          status:
            | 'Scheduled'
            | 'Checked_In'
            | 'Ready'
            | 'In_Progress'
            | 'Completed'
            | 'Cancelled'
            | 'No_Show'
            | 'Rescheduled'
          punctuality: 'On Time' | 'Late' | 'No Show' | null
          send_candidate_sms: boolean
          is_deleted: boolean
          deleted_at: string | null
          deleted_by: string | null
          deletion_batch_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          interviewer_id: string
          application_id: string
          scheduled_start_at: string
          scheduled_end_at: string
          actual_start_at?: string | null
          actual_end_at?: string | null
          duration_minutes?: number | null
          notes?: string | null
          status?:
            | 'Scheduled'
            | 'Checked_In'
            | 'Ready'
            | 'In_Progress'
            | 'Completed'
            | 'Cancelled'
            | 'No_Show'
            | 'Rescheduled'
          punctuality?: 'On Time' | 'Late' | 'No Show' | null
          send_candidate_sms?: boolean
          is_deleted?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_batch_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          interviewer_id?: string
          application_id?: string
          scheduled_start_at?: string
          scheduled_end_at?: string
          actual_start_at?: string | null
          actual_end_at?: string | null
          duration_minutes?: number | null
          notes?: string | null
          status?:
            | 'Scheduled'
            | 'Checked_In'
            | 'Ready'
            | 'In_Progress'
            | 'Completed'
            | 'Cancelled'
            | 'No_Show'
            | 'Rescheduled'
          punctuality?: 'On Time' | 'Late' | 'No Show' | null
          send_candidate_sms?: boolean
          is_deleted?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_batch_id?: string | null
          created_at?: string
        }
      }
      schedule_overrides: {
        Row: {
          id: string
          booking_id: string | null
          conflict_type: string
          conflicting_event_id: string | null
          reason_code: string
          reason_text: string
          acknowledged_by: string
          acknowledged_at: string
          conflict_snapshot: Json
        }
        Insert: {
          id?: string
          booking_id?: string | null
          conflict_type: string
          conflicting_event_id?: string | null
          reason_code: string
          reason_text: string
          acknowledged_by: string
          acknowledged_at?: string
          conflict_snapshot: Json
        }
        Update: {
          id?: string
          booking_id?: string | null
          conflict_type?: string
          conflicting_event_id?: string | null
          reason_code?: string
          reason_text?: string
          acknowledged_by?: string
          acknowledged_at?: string
          conflict_snapshot?: Json
        }
      }
      staff_capabilities: {
        Row: {
          staff_member_id: string
          can_interview: boolean
          can_host_shadow: boolean
          can_precept: boolean
          max_concurrent_candidates: number
        }
        Insert: {
          staff_member_id: string
          can_interview?: boolean
          can_host_shadow?: boolean
          can_precept?: boolean
          max_concurrent_candidates?: number
        }
        Update: {
          staff_member_id?: string
          can_interview?: boolean
          can_host_shadow?: boolean
          can_precept?: boolean
          max_concurrent_candidates?: number
        }
      }
      shadow_shifts: {
        Row: {
          id: string
          application_id: string
          floor_staff_id: string | null
          write_in_host_name: string | null
          scheduled_start_at: string
          scheduled_end_at: string
          skills_rating: number | null
          attitude_rating: number | null
          recommend_hire: boolean | null
          notes: string | null
          status: 'Scheduled' | 'Completed' | 'Cancelled'
          double_shadow_acknowledged_by: string | null
          off_duty_override_acknowledged_by: string | null
          is_deleted: boolean
          deleted_at: string | null
          deleted_by: string | null
          deletion_batch_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          floor_staff_id?: string | null
          write_in_host_name?: string | null
          scheduled_start_at: string
          scheduled_end_at: string
          skills_rating?: number | null
          attitude_rating?: number | null
          recommend_hire?: boolean | null
          notes?: string | null
          status?: 'Scheduled' | 'Completed' | 'Cancelled'
          double_shadow_acknowledged_by?: string | null
          off_duty_override_acknowledged_by?: string | null
          is_deleted?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_batch_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          floor_staff_id?: string | null
          write_in_host_name?: string | null
          scheduled_start_at?: string
          scheduled_end_at?: string
          skills_rating?: number | null
          attitude_rating?: number | null
          recommend_hire?: boolean | null
          notes?: string | null
          status?: 'Scheduled' | 'Completed' | 'Cancelled'
          double_shadow_acknowledged_by?: string | null
          off_duty_override_acknowledged_by?: string | null
          is_deleted?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_batch_id?: string | null
          created_at?: string
        }
      }
      training_days: {
        Row: {
          id: string
          application_id: string
          scheduled_start_at: string
          scheduled_end_at: string
          preceptor_staff_id: string | null
          write_in_preceptor_name: string | null
          notes: string | null
          is_deleted: boolean
          deleted_at: string | null
          deleted_by: string | null
          deletion_batch_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          scheduled_start_at: string
          scheduled_end_at: string
          preceptor_staff_id?: string | null
          write_in_preceptor_name?: string | null
          notes?: string | null
          is_deleted?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_batch_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          scheduled_start_at?: string
          scheduled_end_at?: string
          preceptor_staff_id?: string | null
          write_in_preceptor_name?: string | null
          notes?: string | null
          is_deleted?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_batch_id?: string | null
          created_at?: string
        }
      }
      staffing_requirements: {
        Row: {
          id: string
          role: 'CNA' | 'Nurse'
          shift_type: 'Day' | 'Evening' | 'Night'
          required_fte: number
          effective_from: string
          effective_to: string | null
        }
        Insert: {
          id?: string
          role: 'CNA' | 'Nurse'
          shift_type: 'Day' | 'Evening' | 'Night'
          required_fte?: number
          effective_from?: string
          effective_to?: string | null
        }
        Update: {
          id?: string
          role?: 'CNA' | 'Nurse'
          shift_type?: 'Day' | 'Evening' | 'Night'
          required_fte?: number
          effective_from?: string
          effective_to?: string | null
        }
      }
      employment_assignments: {
        Row: {
          id: string
          application_id: string
          role: 'CNA' | 'Nurse'
          shift_type: 'Day' | 'Evening' | 'Night'
          assigned_fte: number
          effective_from: string
          effective_to: string | null
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          role: 'CNA' | 'Nurse'
          shift_type: 'Day' | 'Evening' | 'Night'
          assigned_fte?: number
          effective_from?: string
          effective_to?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          role?: 'CNA' | 'Nurse'
          shift_type?: 'Day' | 'Evening' | 'Night'
          assigned_fte?: number
          effective_from?: string
          effective_to?: string | null
          created_at?: string
        }
      }
      notification_outbox: {
        Row: {
          id: string
          event_type: string
          source_record_id: string
          recipient_contact: string
          channel: 'SMS' | 'Email' | 'Push'
          template_key: string
          payload: Json
          status: 'Pending' | 'Sent' | 'Failed'
          attempt_count: number
          next_attempt_at: string
          provider_message_id: string | null
          last_error: string | null
          sent_at: string | null
          delivered_at: string | null
          acknowledged_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          source_record_id: string
          recipient_contact: string
          channel: 'SMS' | 'Email' | 'Push'
          template_key: string
          payload: Json
          status?: 'Pending' | 'Sent' | 'Failed'
          attempt_count?: number
          next_attempt_at?: string
          provider_message_id?: string | null
          last_error?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          acknowledged_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          source_record_id?: string
          recipient_contact?: string
          channel?: 'SMS' | 'Email' | 'Push'
          template_key?: string
          payload?: Json
          status?: 'Pending' | 'Sent' | 'Failed'
          attempt_count?: number
          next_attempt_at?: string
          provider_message_id?: string | null
          last_error?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          acknowledged_at?: string | null
          created_at?: string
        }
      }
      app_config: {
        Row: {
          config_key: string
          config_value: Json
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value: Json
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          updated_by?: string | null
          updated_at?: string
        }
      }
    }
    Functions: {
      verify_profile_pin: {
        Args: {
          target_user_id: string
          input_pin: string
        }
        Returns: boolean
      }
      restore_deletion_batch: {
        Args: {
          target_batch_id: string
          actor_id: string
        }
        Returns: number
      }
      has_role: {
        Args: {
          target_user_id: string
          required_role: string
        }
        Returns: boolean
      }
    }
  }
}
