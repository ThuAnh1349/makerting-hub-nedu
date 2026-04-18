// src/modules/briefs/types/index.ts
export type BriefType = 'design' | 'editing'
export type BriefStatus = 'pending' | 'in_progress' | 'review' | 'done'
export type EditingFormat = 'reels' | 'youtube' | 'story' | 'tiktok'

export interface Brief {
  id: string
  person_id: string
  brief_type: BriefType
  description: string
  dimensions?: string
  editing_format?: EditingFormat
  deadline: string
  status: BriefStatus
  deliverable_url?: string
  notes?: string
  created_at: string
  updated_at: string
}
