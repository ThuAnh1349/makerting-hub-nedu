// src/modules/leads/types/index.ts
export type LeadStatus = 'pending' | 'hot' | 'warm' | 'cold' | 'trash' | 'pushed' | 'returned'
export type LeadChannel = 'facebook' | 'tiktok' | 'zalo' | 'youtube' | 'google' | 'referral' | 'organic'

export interface Lead {
  id: string
  person_id: string
  lead_name: string
  lead_phone?: string
  lead_email?: string
  channel: LeadChannel
  message_preview: string
  status: LeadStatus
  utm_source?: string
  utm_campaign?: string
  utm_medium?: string
  return_reason?: string
  push_at?: string
  created_at: string
  updated_at: string
}

export interface LeadMessage {
  id: string
  lead_id: string
  person_id: string | null
  direction: 'inbound' | 'outbound'
  content: string
  sent_at: string
}
