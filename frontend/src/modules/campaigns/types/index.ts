// src/modules/campaigns/types/index.ts
export type CampaignPhase = 'opening' | 'build' | 'close' | 'cta'

export interface Campaign {
  id: string
  person_id: string
  name: string
  phase: CampaignPhase
  progress_percent: number
  goal: string
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}
