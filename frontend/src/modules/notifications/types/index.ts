// src/modules/notifications/types/index.ts
export type NotificationType = 'lead_new' | 'lead_returned' | 'post_approved' | 'post_rejected' | 'brief_done' | 'alumni_graduated'

export interface Notification {
  id: string
  person_id: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  action_url?: string
  created_at: string
}
