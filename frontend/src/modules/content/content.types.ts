export type PostStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'rejected'

export interface PostMedia {
  id: string
  media_type: 'image' | 'video'
  url: string
  thumbnail_url: string | null
  duration_seconds: number | null
  sort_order: number
}

export interface PostApprovalEvent {
  event_type:
    | 'submitted_for_review'
    | 'approved'
    | 'rejected'
    | 'revision_requested'
  actor_name: string
  notes: string | null
  created_at: string
}

export interface Post {
  id: string
  caption: string
  reference_links: Array<{ url: string; label: string }>
  current_status: PostStatus
  scheduled_at: string | null
  published_at: string | null
  author: { id: string; display_name: string; avatar_url: string | null }
  channels: Array<{ code: string; label: string; color_hex: string }>
  campaign_id: string | null
  campaign_title: string | null
  media: PostMedia[]
  latest_approval_note: string | null
  approval_history?: PostApprovalEvent[]
  created_at: string
}

export interface Channel {
  id: string
  code: string
  label: string
  color_hex: string
  icon_name: string
  platform: string
  is_active: boolean
}

export interface CreatePostBody {
  caption: string
  channel_codes: string[]
  reference_links?: Array<{ url: string; label: string }>
  campaign_id?: string | null
  scheduled_at?: string | null
}

export interface UpdatePostBody {
  caption?: string
  channel_codes?: string[]
  reference_links?: Array<{ url: string; label: string }>
  campaign_id?: string | null
  scheduled_at?: string | null
}

export interface PostActionBody {
  action_type: 'submit_review' | 'approve' | 'reject' | 'schedule'
  notes?: string
  scheduled_at?: string
}

export interface PostsResponse {
  data: Post[]
  meta: {
    total: number
    page: number
    per_page: number
    has_next: boolean
    next_cursor: string | null
  }
}

export interface PostFilters {
  status?: PostStatus
  channel_code?: string
  campaign_id?: string
  page?: number
  per_page?: number
}
