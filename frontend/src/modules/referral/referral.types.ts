export interface Ambassador {
  id: string
  display_name: string
  referral_code: string
  referral_link: string
  total_referrals: number
  converted_referrals: number
  is_active: boolean
}

export interface ReferralLead {
  id: string
  full_name: string
  phone_number: string
  current_status: string
  channel: { code: string; label: string; color_hex: string }
  utm_campaign: string | null
  ambassador_display_name: string | null
  ops_synced_at: string
}
