export type BriefStatus = 'submitted' | 'in_progress' | 'review' | 'completed' | 'cancelled'
export type BriefActionType = 'acknowledge' | 'deliver' | 'complete' | 'request_revision' | 'cancel'

export interface BriefStatusEvent {
  event_type: BriefStatus
  actor_name: string | null
  notes: string | null
  created_at: string
}

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
  requested_by: { id: string; display_name: string; avatar_url: string | null }
  assigned_to: { id: string; display_name: string; avatar_url: string | null } | null
  post_id: string | null
  status_history?: BriefStatusEvent[]
  created_at: string
}

export interface BriefListResult {
  data: Brief[]
  meta: { total: number; page: number; per_page: number; has_next: boolean; next_cursor: string | null }
}

export interface BriefFilters {
  status?: BriefStatus[]
  brief_type?: 'design' | 'video_editing'
  page?: number
  per_page?: number
}
