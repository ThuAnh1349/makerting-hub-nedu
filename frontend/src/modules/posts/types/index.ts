// src/modules/posts/types/index.ts
export type PostStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'scheduled' | 'posted'
export type PostChannel = 'facebook' | 'tiktok' | 'instagram' | 'youtube' | 'blog' | 'zalo'

export interface Post {
  id: string
  person_id: string
  caption: string
  channels: PostChannel[]
  media_urls: string[]
  reference_links: string[]
  status: PostStatus
  scheduled_at?: string
  campaign_id?: string
  rejection_note?: string
  reviewer_id?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}
