import { http, HttpResponse } from 'msw'
import type { BudgetSummary } from '@/modules/budget/budget.types'

const buildSummary = (monthStart: string): BudgetSummary => {
  const isApril = monthStart === '2026-04-01'

  if (isApril) {
    // April: budget at 83% — triggers warning
    return {
      month_start: '2026-04-01',
      total_allocated_vnd: 100_000_000,
      total_spent_vnd: 83_200_000,
      budget_used_pct: 83.2,
      budget_warning: true,
      total_leads: 462,
      overall_cpl: 180_087,
      by_channel: [
        {
          channel_id: 'fb_ads',
          channel_label: 'Facebook Ads',
          channel_color: '#1877F2',
          allocated_vnd: 50_000_000,
          spend_vnd: 44_500_000,
          lead_count: 258,
          cpl_actual: 172_481,
          cpl_benchmark: 200_000,
          budget_used_pct: 89,
        },
        {
          channel_id: 'tiktok_ads',
          channel_label: 'TikTok Ads',
          channel_color: '#010101',
          allocated_vnd: 30_000_000,
          spend_vnd: 27_800_000,
          lead_count: 142,
          cpl_actual: 195_775,
          cpl_benchmark: 180_000,
          budget_used_pct: 92.7,
        },
        {
          channel_id: 'google_ads',
          channel_label: 'Google Ads',
          channel_color: '#EA4335',
          allocated_vnd: 15_000_000,
          spend_vnd: 9_700_000,
          lead_count: 47,
          cpl_actual: 206_382,
          cpl_benchmark: 180_000,
          budget_used_pct: 64.7,
        },
        {
          channel_id: 'zalo_ads',
          channel_label: 'Zalo Ads',
          channel_color: '#0068FF',
          allocated_vnd: 5_000_000,
          spend_vnd: 1_200_000,
          lead_count: 15,
          cpl_actual: 80_000,
          cpl_benchmark: 150_000,
          budget_used_pct: 24,
        },
      ],
    }
  }

  // Default: previous months with lower spend
  return {
    month_start: monthStart,
    total_allocated_vnd: 100_000_000,
    total_spent_vnd: 58_000_000,
    budget_used_pct: 58,
    budget_warning: false,
    total_leads: 320,
    overall_cpl: 181_250,
    by_channel: [
      {
        channel_id: 'fb_ads',
        channel_label: 'Facebook Ads',
        channel_color: '#1877F2',
        allocated_vnd: 50_000_000,
        spend_vnd: 32_000_000,
        lead_count: 185,
        cpl_actual: 172_973,
        cpl_benchmark: 200_000,
        budget_used_pct: 64,
      },
      {
        channel_id: 'tiktok_ads',
        channel_label: 'TikTok Ads',
        channel_color: '#010101',
        allocated_vnd: 30_000_000,
        spend_vnd: 20_000_000,
        lead_count: 101,
        cpl_actual: 198_020,
        cpl_benchmark: 180_000,
        budget_used_pct: 66.7,
      },
      {
        channel_id: 'google_ads',
        channel_label: 'Google Ads',
        channel_color: '#EA4335',
        allocated_vnd: 15_000_000,
        spend_vnd: 5_000_000,
        lead_count: 28,
        cpl_actual: 178_571,
        cpl_benchmark: 180_000,
        budget_used_pct: 33.3,
      },
      {
        channel_id: 'zalo_ads',
        channel_label: 'Zalo Ads',
        channel_color: '#0068FF',
        allocated_vnd: 5_000_000,
        spend_vnd: 1_000_000,
        lead_count: 6,
        cpl_actual: 166_667,
        cpl_benchmark: 150_000,
        budget_used_pct: 20,
      },
    ],
  }
}

export const budgetHandlers = [
  http.get('/api/v1/marketing/budget/summary', ({ request }) => {
    const url = new URL(request.url)
    const month = url.searchParams.get('month') ?? '2026-04-01'
    return HttpResponse.json(buildSummary(month))
  }),
]
