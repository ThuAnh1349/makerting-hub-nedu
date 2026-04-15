import { http, HttpResponse } from 'msw'
import type { Ambassador, ReferralLead } from '@/modules/referral/referral.types'

const BASE_URL = 'https://nedu.vn'

const mockAmbassadors: Ambassador[] = [
  {
    id: 'amb-1',
    display_name: 'Trần Thị Bích',
    referral_code: 'BICH2026',
    referral_link: `${BASE_URL}/?utm_source=referral&utm_medium=referral&utm_campaign=ambassador-amb-1&ref=BICH2026`,
    total_referrals: 42,
    converted_referrals: 24,
    is_active: true,
  },
  {
    id: 'amb-2',
    display_name: 'Nguyễn Hoàng Nam',
    referral_code: 'HNAM2026',
    referral_link: `${BASE_URL}/?utm_source=referral&utm_medium=referral&utm_campaign=ambassador-amb-2&ref=HNAM2026`,
    total_referrals: 35,
    converted_referrals: 18,
    is_active: true,
  },
  {
    id: 'amb-3',
    display_name: 'Lê Văn Cường',
    referral_code: 'LCUONG26',
    referral_link: `${BASE_URL}/?utm_source=referral&utm_medium=referral&utm_campaign=ambassador-amb-3&ref=LCUONG26`,
    total_referrals: 28,
    converted_referrals: 15,
    is_active: true,
  },
  {
    id: 'amb-4',
    display_name: 'Phạm Thị Dung',
    referral_code: 'PDUNG26',
    referral_link: `${BASE_URL}/?utm_source=referral&utm_medium=referral&utm_campaign=ambassador-amb-4&ref=PDUNG26`,
    total_referrals: 19,
    converted_referrals: 7,
    is_active: true,
  },
  {
    id: 'amb-5',
    display_name: 'Vũ Minh Khôi',
    referral_code: 'VKHOI26',
    referral_link: `${BASE_URL}/?utm_source=referral&utm_medium=referral&utm_campaign=ambassador-amb-5&ref=VKHOI26`,
    total_referrals: 11,
    converted_referrals: 3,
    is_active: false,
  },
  {
    id: 'amb-6',
    display_name: 'Đỗ Thị Hương',
    referral_code: 'DHUONG26',
    referral_link: `${BASE_URL}/?utm_source=referral&utm_medium=referral&utm_campaign=ambassador-amb-6&ref=DHUONG26`,
    total_referrals: 7,
    converted_referrals: 4,
    is_active: true,
  },
]

const mockLeads: ReferralLead[] = [
  {
    id: 'rl-1',
    full_name: 'Hoàng Thị Mai',
    phone_number: '0901234567',
    current_status: 'enrolled',
    channel: { code: 'referral', label: 'Referral', color_hex: '#8B5CF6' },
    utm_campaign: 'ambassador-amb-1',
    ambassador_display_name: 'Trần Thị Bích',
    ops_synced_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rl-2',
    full_name: 'Nguyễn Văn Bình',
    phone_number: '0912345678',
    current_status: 'qualified',
    channel: { code: 'referral', label: 'Referral', color_hex: '#8B5CF6' },
    utm_campaign: 'ambassador-amb-1',
    ambassador_display_name: 'Trần Thị Bích',
    ops_synced_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rl-3',
    full_name: 'Trần Minh Hưng',
    phone_number: '0923456789',
    current_status: 'contacted',
    channel: { code: 'referral', label: 'Referral', color_hex: '#8B5CF6' },
    utm_campaign: 'ambassador-amb-2',
    ambassador_display_name: 'Nguyễn Hoàng Nam',
    ops_synced_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rl-4',
    full_name: 'Lê Thị Phương',
    phone_number: '0934567890',
    current_status: 'new',
    channel: { code: 'referral', label: 'Referral', color_hex: '#8B5CF6' },
    utm_campaign: 'ambassador-amb-2',
    ambassador_display_name: 'Nguyễn Hoàng Nam',
    ops_synced_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rl-5',
    full_name: 'Phạm Văn Tuấn',
    phone_number: '0945678901',
    current_status: 'lost',
    channel: { code: 'referral', label: 'Referral', color_hex: '#8B5CF6' },
    utm_campaign: 'ambassador-amb-3',
    ambassador_display_name: 'Lê Văn Cường',
    ops_synced_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rl-6',
    full_name: 'Vũ Thị Hoa',
    phone_number: '0956789012',
    current_status: 'enrolled',
    channel: { code: 'referral', label: 'Referral', color_hex: '#8B5CF6' },
    utm_campaign: 'ambassador-amb-3',
    ambassador_display_name: 'Lê Văn Cường',
    ops_synced_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rl-7',
    full_name: 'Đỗ Minh Quân',
    phone_number: '0967890123',
    current_status: 'qualified',
    channel: { code: 'referral', label: 'Referral', color_hex: '#8B5CF6' },
    utm_campaign: 'ambassador-amb-1',
    ambassador_display_name: 'Trần Thị Bích',
    ops_synced_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'rl-8',
    full_name: 'Bùi Thị Lan',
    phone_number: '0978901234',
    current_status: 'new',
    channel: { code: 'referral', label: 'Referral', color_hex: '#8B5CF6' },
    utm_campaign: 'ambassador-amb-4',
    ambassador_display_name: 'Phạm Thị Dung',
    ops_synced_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
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
