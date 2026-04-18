// src/mocks/data/budget.ts
import type { BudgetSummary } from '@modules/budget/types'

export const MOCK_BUDGET: BudgetSummary[] = [
  {
    id: 'budget-0001-aaaa-bbbb-cccc-dddddddddddd',
    period_label: '2026-04',
    total_budget: 40000000,
    total_spent: 23800000,
    cpl: 185937,
    roi: 248,
    channel_breakdown: [
      { channel: 'facebook', spend: 14000000, lead_count: 89, cpl: 157303,  benchmark_cpl: 150000 },
      { channel: 'tiktok',   spend: 5600000,  lead_count: 62, cpl: 90323,   benchmark_cpl: 100000 },
      { channel: 'google',   spend: 3600000,  lead_count: 18, cpl: 200000,  benchmark_cpl: 180000 },
      { channel: 'referral', spend: 600000,   lead_count: 9,  cpl: 66667,   benchmark_cpl: 80000  },
    ],
    created_at: '2026-04-07T00:00:00.000Z',
  },
  {
    id: 'budget-0002-aaaa-bbbb-cccc-dddddddddddd',
    period_label: '2026-03',
    total_budget: 35000000,
    total_spent: 34100000,
    cpl: 202381,
    roi: 187,
    channel_breakdown: [
      { channel: 'facebook', spend: 20000000, lead_count: 95, cpl: 210526,  benchmark_cpl: 150000 },
      { channel: 'tiktok',   spend: 8000000,  lead_count: 50, cpl: 160000,  benchmark_cpl: 100000 },
      { channel: 'google',   spend: 6100000,  lead_count: 23, cpl: 265217,  benchmark_cpl: 180000 },
    ],
    created_at: '2026-04-01T00:00:00.000Z',
  },
  {
    id: 'budget-0003-aaaa-bbbb-cccc-dddddddddddd',
    period_label: '2026-02',
    total_budget: 20000000,
    total_spent: 15000000,
    cpl: 214286,
    roi: 0,
    channel_breakdown: [
      { channel: 'facebook', spend: 15000000, lead_count: 70, cpl: 214286, benchmark_cpl: 150000 },
    ],
    created_at: '2026-03-01T00:00:00.000Z',
  },
]
