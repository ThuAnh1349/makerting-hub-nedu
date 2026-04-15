export type BriefStatus = 'submitted' | 'in_progress' | 'review' | 'completed' | 'cancelled'

export interface Brief {
  id: string
  brief_type_code: 'design' | 'video_editing'
  brief_type_label: string
  title: string
  description: string
  size_format: string | null
  deadline: string
  current_status: BriefStatus
  deliverable_url: string | null
  requested_by: {
    id: string
    display_name: string
    avatar_url: string | null
  }
  assigned_to: {
    id: string
    display_name: string
    avatar_url: string | null
  } | null
  post_id: string | null
  status_history?: Array<{
    event_type: string
    actor_name: string | null
    notes: string | null
    created_at: string
  }>
  created_at: string
}
