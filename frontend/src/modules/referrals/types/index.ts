// src/modules/referrals/types/index.ts
export interface Ambassador {
  id: string
  person_id: string
  full_name: string
  referral_count: number
  conversion_count: number
  commission_total: number
  care_checklist: Array<{
    task: string
    done: boolean
  }>
  created_at: string
  updated_at: string
}

export interface ReferralLead {
  id: string
  lead_id: string
  ambassador_id: string
  referral_link: string
  converted: boolean
  created_at: string
}
