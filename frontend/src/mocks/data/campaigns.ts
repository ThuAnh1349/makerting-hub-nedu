// src/mocks/data/campaigns.ts
import type { Campaign } from '@modules/campaigns/types'
import { MOCK_PERSONS } from './persons'

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-0001-aaaa-bbbb-cccc-dddddddddddd',
    person_id: MOCK_PERSONS[1].id,
    name: 'Spring Launch 2026',
    phase: 'build',
    progress_percent: 55,
    goal: '200 enrolled students trong Q2 2026',
    start_date: '2026-04-01T00:00:00.000Z',
    end_date: '2026-06-30T00:00:00.000Z',
    created_at: '2026-03-28T00:00:00.000Z',
    updated_at: '2026-04-07T00:00:00.000Z',
  },
  {
    id: 'camp-0002-aaaa-bbbb-cccc-dddddddddddd',
    person_id: MOCK_PERSONS[1].id,
    name: 'Alumni Referral Q2',
    phase: 'opening',
    progress_percent: 10,
    goal: '50 referral leads từ alumni network',
    start_date: '2026-04-07T00:00:00.000Z',
    end_date: '2026-05-31T00:00:00.000Z',
    created_at: '2026-04-07T00:00:00.000Z',
    updated_at: '2026-04-07T00:00:00.000Z',
  },
  {
    id: 'camp-0003-aaaa-bbbb-cccc-dddddddddddd',
    person_id: MOCK_PERSONS[0].id,
    name: 'Q1 Closing Push',
    phase: 'cta',
    progress_percent: 92,
    goal: 'Đóng 30 deals cuối Q1',
    start_date: '2026-03-15T00:00:00.000Z',
    end_date: '2026-04-10T00:00:00.000Z',
    created_at: '2026-03-15T00:00:00.000Z',
    updated_at: '2026-04-06T00:00:00.000Z',
  },
]
