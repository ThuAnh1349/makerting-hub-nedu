export type LeadStatus =
  | 'new'
  | 'hot'
  | 'warm'
  | 'cold'
  | 'pushed'
  | 'returned'
  | 'archived'

export interface Lead {
  id: string
  full_name: string
  phone_number: string
  message_preview: string | null
  channel: { code: string; label: string; color_hex: string }
  utm_source: string
  utm_medium: string | null
  utm_campaign: string | null
  current_status: LeadStatus
  return_reason: string | null
  assigned_to: {
    id: string
    display_name: string
    avatar_url: string | null
  } | null
  minutes_waiting: number
  sla_overdue: boolean
  ops_synced_at: string
  last_action_at: string | null
  action_history?: LeadActionEvent[]
}

export interface LeadActionEvent {
  event_type: string
  actor_name: string | null
  payload: object
  created_at: string
}

export interface TodaySummary {
  leads_pending_count: number
  leads_sla_overdue_count: number
  posts_scheduled_today: number
  posts_pending_review: number
  unread_notification_count: number
  alerts: Array<{
    alert_type: 'lead_sla_overdue' | 'post_unscheduled_soon'
    message: string
    entity_type: 'lead' | 'post'
    entity_id: string
    minutes_overdue: number | null
  }>
  quick_leads: Lead[]
}
