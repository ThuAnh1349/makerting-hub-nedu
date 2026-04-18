// src/shared/types/auth.ts
export type Role = 'marketing_staff' | 'co_leader' | 'marketing_leader' | 'admin' | 'owner'

export interface AuthUser {
  person_id: string           // users.id (local Nedu users table)
  email: string
  full_name: string
  avatar_url?: string
  roles: Role[]
  primary_role: Role
}

export type LeadStatus = 'pending' | 'hot' | 'warm' | 'cold' | 'trash' | 'pushed' | 'returned'
export type LeadChannel = 'facebook' | 'tiktok' | 'zalo' | 'youtube' | 'google' | 'referral' | 'organic'
export type PostStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'scheduled' | 'posted'
export type PostChannel = 'facebook' | 'tiktok' | 'instagram' | 'youtube' | 'blog' | 'zalo'
export type CampaignPhase = 'opening' | 'build' | 'close' | 'cta'
export type StoryStatus = 'pending' | 'approved' | 'deployed'
export type BriefType = 'design' | 'editing'
export type BriefStatus = 'pending' | 'in_progress' | 'review' | 'done'
export type EditingFormat = 'reels' | 'youtube' | 'story' | 'tiktok'
export type NotificationType = 'lead_new' | 'lead_returned' | 'post_approved' | 'post_rejected' | 'brief_done' | 'alumni_graduated'
export type DocType = 'sop' | 'jd' | 'tracker' | 'playbook' | 'template' | 'guideline' | 'report' | 'brief'
export type DocumentStatus = 'done' | 'in_progress' | 'not_started'
