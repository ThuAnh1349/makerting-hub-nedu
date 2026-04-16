import { http, HttpResponse } from 'msw'
import type { Ambassador, ReferralLead } from '@/modules/referral/referral.types'

const BASE = 'https://nedu.vn'

// ── Ambassadors từ HTML prototype ─────────────────────────────────────────────
// Lan Anh top 8 referrals · Phạm Anh Tuấn 5 · Trần Văn Hùng 3

const mockAmbassadors: Ambassador[] = [
  {
    id: 'amb-1',
    display_name: 'Nguyễn Thị Lan Anh',
    referral_code: 'LANANH26',
    referral_link: `${BASE}/?utm_source=referral&utm_medium=referral&utm_campaign=ambassador-amb-1&ref=LANANH26`,
    total_referrals: 8,
    converted_referrals: 5,
    is_active: true,
  },
  {
    id: 'amb-2',
    display_name: 'Phạm Anh Tuấn',
    referral_code: 'PKTUAN26',
    referral_link: `${BASE}/?utm_source=referral&utm_medium=referral&utm_campaign=ambassador-amb-2&ref=PKTUAN26`,
    total_referrals: 5,
    converted_referrals: 3,
    is_active: true,
  },
  {
    id: 'amb-3',
    display_name: 'Trần Văn Hùng',
    referral_code: 'TVHUNG26',
    referral_link: `${BASE}/?utm_source=referral&utm_medium=referral&utm_campaign=ambassador-amb-3&ref=TVHUNG26`,
    total_referrals: 3,
    converted_referrals: 1,
    is_active: true,
  },
  {
    id: 'amb-4',
    display_name: 'Đỗ Thị Thu Lan',
    referral_code: 'DTTLAN26',
    referral_link: `${BASE}/?utm_source=referral&utm_medium=referral&utm_campaign=ambassador-amb-4&ref=DTTLAN26`,
    total_referrals: 6,
    converted_referrals: 4,
    is_active: true,
  },
  {
    id: 'amb-5',
    display_name: 'Võ Thị Mai Hương',
    referral_code: 'VTMHUONG',
    referral_link: `${BASE}/?utm_source=referral&utm_medium=referral&utm_campaign=ambassador-amb-5&ref=VTMHUONG`,
    total_referrals: 4,
    converted_referrals: 2,
    is_active: true,
  },
  {
    id: 'amb-6',
    display_name: 'Bùi Quang Huy',
    referral_code: 'BQHUY26',
    referral_link: `${BASE}/?utm_source=referral&utm_medium=referral&utm_campaign=ambassador-amb-6&ref=BQHUY26`,
    total_referrals: 2,
    converted_referrals: 1,
    is_active: false,
  },
]

const REF_CHANNEL = { code: 'referral', label: 'Referral', color_hex: '#7C3AED' }

// ── Referral leads từ HTML prototype ─────────────────────────────────────────

const mockLeads: ReferralLead[] = [
  {
    id: 'rl-1',
    full_name: 'Bùi Thị Ngọc Anh',
    phone_number: '0901111222',
    current_status: 'qualified',
    channel: REF_CHANNEL,
    utm_campaign: 'ambassador-amb-1',
    ambassador_display_name: 'Nguyễn Thị Lan Anh',
    ops_synced_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rl-2',
    full_name: 'Phạm Thị Liễu',
    phone_number: '0912233445',
    current_status: 'enrolled',
    channel: REF_CHANNEL,
    utm_campaign: 'ambassador-amb-1',
    ambassador_display_name: 'Nguyễn Thị Lan Anh',
    ops_synced_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rl-3',
    full_name: 'Nguyễn Thị Bích',
    phone_number: '0923344556',
    current_status: 'enrolled',
    channel: REF_CHANNEL,
    utm_campaign: 'ambassador-amb-1',
    ambassador_display_name: 'Nguyễn Thị Lan Anh',
    ops_synced_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rl-4',
    full_name: 'Đỗ Văn Hải',
    phone_number: '0934455667',
    current_status: 'contacted',
    channel: REF_CHANNEL,
    utm_campaign: 'ambassador-amb-2',
    ambassador_display_name: 'Phạm Anh Tuấn',
    ops_synced_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rl-5',
    full_name: 'Vũ Thị Thanh',
    phone_number: '0945566778',
    current_status: 'enrolled',
    channel: REF_CHANNEL,
    utm_campaign: 'ambassador-amb-2',
    ambassador_display_name: 'Phạm Anh Tuấn',
    ops_synced_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rl-6',
    full_name: 'Hoàng Minh Đức',
    phone_number: '0956677889',
    current_status: 'new',
    channel: REF_CHANNEL,
    utm_campaign: 'ambassador-amb-3',
    ambassador_display_name: 'Trần Văn Hùng',
    ops_synced_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rl-7',
    full_name: 'Lê Thị Thanh Vân',
    phone_number: '0967788990',
    current_status: 'enrolled',
    channel: REF_CHANNEL,
    utm_campaign: 'ambassador-amb-4',
    ambassador_display_name: 'Đỗ Thị Thu Lan',
    ops_synced_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rl-8',
    full_name: 'Trần Minh Khánh',
    phone_number: '0978899001',
    current_status: 'qualified',
    channel: REF_CHANNEL,
    utm_campaign: 'ambassador-amb-4',
    ambassador_display_name: 'Đỗ Thị Thu Lan',
    ops_synced_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rl-9',
    full_name: 'Ngô Thị Hà Linh',
    phone_number: '0989900112',
    current_status: 'lost',
    channel: REF_CHANNEL,
    utm_campaign: 'ambassador-amb-5',
    ambassador_display_name: 'Võ Thị Mai Hương',
    ops_synced_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rl-10',
    full_name: 'Đinh Văn Sơn',
    phone_number: '0901122334',
    current_status: 'enrolled',
    channel: REF_CHANNEL,
    utm_campaign: 'ambassador-amb-5',
    ambassador_display_name: 'Võ Thị Mai Hương',
    ops_synced_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rl-11',
    full_name: 'Phạm Thị Lan',
    phone_number: '0912233000',
    current_status: 'new',
    channel: REF_CHANNEL,
    utm_campaign: 'ambassador-amb-1',
    ambassador_display_name: 'Nguyễn Thị Lan Anh',
    ops_synced_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'rl-12',
    full_name: 'Lê Văn Tuấn',
    phone_number: '0923344000',
    current_status: 'new',
    channel: REF_CHANNEL,
    utm_campaign: 'ambassador-amb-1',
    ambassador_display_name: 'Nguyễn Thị Lan Anh',
    ops_synced_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
]

export const referralHandlers = [
  http.get('/api/v1/marketing/referral/ambassadors', () => {
    return HttpResponse.json(mockAmbassadors)
  }),

  http.get('/api/v1/marketing/referral/leads', () => {
    return HttpResponse.json(mockLeads)
  }),
]
