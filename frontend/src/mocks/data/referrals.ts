// src/mocks/data/referrals.ts
import type { Ambassador, ReferralLead } from '@modules/referrals/types'
import { MOCK_PERSONS } from './persons'

export const MOCK_AMBASSADORS: Ambassador[] = [
  {
    id: 'amb-0001-aaaa-bbbb-cccc-dddddddddddd',
    person_id: MOCK_PERSONS[0].id,
    full_name: 'Alumni 01',
    referral_count: 12,
    conversion_count: 8,
    commission_total: 4800000,
    care_checklist: [
      { task: 'Gửi link referral mới', done: true },
      { task: 'Check-in tháng 4', done: false },
      { task: 'Cảm ơn khi có người convert', done: true },
    ],
    created_at: '2026-01-15T00:00:00.000Z',
    updated_at: '2026-04-07T00:00:00.000Z',
  },
  {
    id: 'amb-0002-aaaa-bbbb-cccc-dddddddddddd',
    person_id: MOCK_PERSONS[1].id,
    full_name: 'Alumni 02',
    referral_count: 3,
    conversion_count: 1,
    commission_total: 600000,
    care_checklist: [
      { task: 'Gửi link referral mới', done: false },
      { task: 'Check-in tháng 4', done: false },
    ],
    created_at: '2026-03-01T00:00:00.000Z',
    updated_at: '2026-04-01T00:00:00.000Z',
  },
  {
    id: 'amb-0003-aaaa-bbbb-cccc-dddddddddddd',
    person_id: MOCK_PERSONS[4].id,
    full_name: 'Alumni 03',
    referral_count: 0,
    conversion_count: 0,
    commission_total: 0,
    care_checklist: [],
    created_at: '2026-04-01T00:00:00.000Z',
    updated_at: '2026-04-01T00:00:00.000Z',
  },
]

export const MOCK_REFERRAL_LEADS: ReferralLead[] = [
  {
    id: 'refl-0001-aaaa-bbbb-cccc-dddddddddddd',
    lead_id: 'lead-0005-aaaa-bbbb-cccc-dddddddddddd',
    ambassador_id: 'amb-0001-aaaa-bbbb-cccc-dddddddddddd',
    referral_link: 'https://nedu.vn?utm_source=referral&utm_campaign=ambassador-ref-001',
    converted: true,
    created_at: '2026-04-07T09:00:00.000Z',
  },
  {
    id: 'refl-0002-aaaa-bbbb-cccc-dddddddddddd',
    lead_id: 'lead-0001-aaaa-bbbb-cccc-dddddddddddd',
    ambassador_id: 'amb-0001-aaaa-bbbb-cccc-dddddddddddd',
    referral_link: 'https://nedu.vn?utm_source=referral&utm_campaign=ambassador-ref-001',
    converted: false,
    created_at: '2026-04-06T14:00:00.000Z',
  },
  {
    id: 'refl-0003-aaaa-bbbb-cccc-dddddddddddd',
    lead_id: 'lead-0007-aaaa-bbbb-cccc-dddddddddddd',
    ambassador_id: 'amb-0002-aaaa-bbbb-cccc-dddddddddddd',
    referral_link: 'https://nedu.vn?utm_source=referral&utm_campaign=ambassador-ref-002',
    converted: false,
    created_at: '2026-04-05T10:00:00.000Z',
  },
]
