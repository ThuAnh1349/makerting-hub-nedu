import { http, HttpResponse } from 'msw'
import type { BudgetSummary } from '@/modules/budget/budget.types'

// ── Budget data từ HTML prototype ─────────────────────────────────────────────
// CPL từ HTML: Referral 45k · TikTok 112k · YouTube 156k · Facebook 234k · LinkedIn 412k
// Tháng 4/2026: 42.6tr / 59tr budget (72% used)

const buildSummary = (monthStart: string): BudgetSummary => {
  // ── Tháng 4/2026 (tháng hiện tại) ──────────────────────────────────────────
  if (monthStart === '2026-04-01') {
    return {
      month_start: '2026-04-01',
      total_allocated_vnd: 59_000_000,
      total_spent_vnd: 42_600_000,
      budget_used_pct: 72.2,
      budget_warning: false,
      total_leads: 104,
      overall_cpl: 184_615,
      by_channel: [
        {
          channel_id: 'tiktok',
          channel_label: 'TikTok',
          channel_color: '#010101',
          allocated_vnd: 15_000_000,
          spend_vnd: 7_840_000,
          lead_count: 70,
          cpl_actual: 112_000,
          cpl_benchmark: 150_000,
          budget_used_pct: 52.3,
        },
        {
          channel_id: 'facebook',
          channel_label: 'Facebook',
          channel_color: '#1877F2',
          allocated_vnd: 18_000_000,
          spend_vnd: 16_848_000,
          lead_count: 72,
          cpl_actual: 234_000,
          cpl_benchmark: 200_000,
          budget_used_pct: 93.6,
        },
        {
          channel_id: 'youtube',
          channel_label: 'YouTube',
          channel_color: '#FF0000',
          allocated_vnd: 12_000_000,
          spend_vnd: 9_360_000,
          lead_count: 60,
          cpl_actual: 156_000,
          cpl_benchmark: 180_000,
          budget_used_pct: 78.0,
        },
        {
          channel_id: 'instagram',
          channel_label: 'Instagram',
          channel_color: '#E1306C',
          allocated_vnd: 6_000_000,
          spend_vnd: 3_402_000,
          lead_count: 18,
          cpl_actual: 189_000,
          cpl_benchmark: 170_000,
          budget_used_pct: 56.7,
        },
        {
          channel_id: 'linkedin',
          channel_label: 'LinkedIn',
          channel_color: '#0A66C2',
          allocated_vnd: 8_000_000,
          spend_vnd: 5_150_000,
          lead_count: 12,
          cpl_actual: 412_000,
          cpl_benchmark: 500_000,
          budget_used_pct: 64.4,
        },
      ],
    }
  }

  // ── Tháng 3/2026 (Brand Awareness Q1 — 93% used, near warning) ──────────────
  if (monthStart === '2026-03-01') {
    return {
      month_start: '2026-03-01',
      total_allocated_vnd: 64_000_000,
      total_spent_vnd: 59_520_000,
      budget_used_pct: 93.0,
      budget_warning: true,
      total_leads: 416,
      overall_cpl: 143_077,
      by_channel: [
        {
          channel_id: 'tiktok',
          channel_label: 'TikTok',
          channel_color: '#010101',
          allocated_vnd: 20_000_000,
          spend_vnd: 15_904_000,
          lead_count: 142,
          cpl_actual: 112_000,
          cpl_benchmark: 150_000,
          budget_used_pct: 79.5,
        },
        {
          channel_id: 'facebook',
          channel_label: 'Facebook',
          channel_color: '#1877F2',
          allocated_vnd: 15_000_000,
          spend_vnd: 13_572_000,
          lead_count: 58,
          cpl_actual: 234_000,
          cpl_benchmark: 200_000,
          budget_used_pct: 90.5,
        },
        {
          channel_id: 'youtube',
          channel_label: 'YouTube',
          channel_color: '#FF0000',
          allocated_vnd: 30_000_000,
          spend_vnd: 26_676_000,
          lead_count: 171,
          cpl_actual: 156_000,
          cpl_benchmark: 180_000,
          budget_used_pct: 88.9,
        },
        {
          channel_id: 'instagram',
          channel_label: 'Instagram',
          channel_color: '#E1306C',
          allocated_vnd: 10_000_000,
          spend_vnd: 9_639_000,
          lead_count: 51,
          cpl_actual: 189_000,
          cpl_benchmark: 170_000,
          budget_used_pct: 96.4,
        },
        {
          channel_id: 'linkedin',
          channel_label: 'LinkedIn',
          channel_color: '#0A66C2',
          allocated_vnd: 14_000_000,
          spend_vnd: 14_000_000,
          lead_count: 34,
          cpl_actual: 412_000,
          cpl_benchmark: 500_000,
          budget_used_pct: 100.0,
        },
      ],
    }
  }

  // ── Tháng 2/2026 ─────────────────────────────────────────────────────────────
  if (monthStart === '2026-02-01') {
    return {
      month_start: '2026-02-01',
      total_allocated_vnd: 45_000_000,
      total_spent_vnd: 27_360_000,
      budget_used_pct: 60.8,
      budget_warning: false,
      total_leads: 186,
      overall_cpl: 147_097,
      by_channel: [
        { channel_id: 'tiktok',    channel_label: 'TikTok',    channel_color: '#010101', allocated_vnd: 12_000_000, spend_vnd: 6_720_000,  lead_count: 60,  cpl_actual: 112_000, cpl_benchmark: 150_000, budget_used_pct: 56.0 },
        { channel_id: 'facebook',  channel_label: 'Facebook',  channel_color: '#1877F2', allocated_vnd: 12_000_000, spend_vnd: 7_488_000,  lead_count: 32,  cpl_actual: 234_000, cpl_benchmark: 200_000, budget_used_pct: 62.4 },
        { channel_id: 'youtube',   channel_label: 'YouTube',   channel_color: '#FF0000', allocated_vnd: 15_000_000, spend_vnd: 9_360_000,  lead_count: 60,  cpl_actual: 156_000, cpl_benchmark: 180_000, budget_used_pct: 62.4 },
        { channel_id: 'instagram', channel_label: 'Instagram', channel_color: '#E1306C', allocated_vnd: 6_000_000,  spend_vnd: 4_158_000,  lead_count: 22,  cpl_actual: 189_000, cpl_benchmark: 170_000, budget_used_pct: 69.3 },
      ],
    }
  }

  // ── Tháng 1/2026 ─────────────────────────────────────────────────────────────
  if (monthStart === '2026-01-01') {
    return {
      month_start: '2026-01-01',
      total_allocated_vnd: 40_000_000,
      total_spent_vnd: 19_040_000,
      budget_used_pct: 47.6,
      budget_warning: false,
      total_leads: 124,
      overall_cpl: 153_548,
      by_channel: [
        { channel_id: 'tiktok',    channel_label: 'TikTok',    channel_color: '#010101', allocated_vnd: 10_000_000, spend_vnd: 4_480_000,  lead_count: 40,  cpl_actual: 112_000, cpl_benchmark: 150_000, budget_used_pct: 44.8 },
        { channel_id: 'facebook',  channel_label: 'Facebook',  channel_color: '#1877F2', allocated_vnd: 12_000_000, spend_vnd: 5_616_000,  lead_count: 24,  cpl_actual: 234_000, cpl_benchmark: 200_000, budget_used_pct: 46.8 },
        { channel_id: 'youtube',   channel_label: 'YouTube',   channel_color: '#FF0000', allocated_vnd: 12_000_000, spend_vnd: 6_240_000,  lead_count: 40,  cpl_actual: 156_000, cpl_benchmark: 180_000, budget_used_pct: 52.0 },
        { channel_id: 'instagram', channel_label: 'Instagram', channel_color: '#E1306C', allocated_vnd: 6_000_000,  spend_vnd: 2_835_000,  lead_count: 15,  cpl_actual: 189_000, cpl_benchmark: 170_000, budget_used_pct: 47.3 },
      ],
    }
  }

  // ── Tháng 5/2026 (forecast — 30 Days Challenge) ───────────────────────────
  return {
    month_start: monthStart,
    total_allocated_vnd: 50_000_000,
    total_spent_vnd: 0,
    budget_used_pct: 0,
    budget_warning: false,
    total_leads: 0,
    overall_cpl: null,
    by_channel: [
      { channel_id: 'tiktok',    channel_label: 'TikTok',    channel_color: '#010101', allocated_vnd: 12_000_000, spend_vnd: 0, lead_count: 0, cpl_actual: null, cpl_benchmark: 150_000, budget_used_pct: 0 },
      { channel_id: 'facebook',  channel_label: 'Facebook',  channel_color: '#1877F2', allocated_vnd: 16_000_000, spend_vnd: 0, lead_count: 0, cpl_actual: null, cpl_benchmark: 200_000, budget_used_pct: 0 },
      { channel_id: 'youtube',   channel_label: 'YouTube',   channel_color: '#FF0000', allocated_vnd: 14_000_000, spend_vnd: 0, lead_count: 0, cpl_actual: null, cpl_benchmark: 180_000, budget_used_pct: 0 },
      { channel_id: 'instagram', channel_label: 'Instagram', channel_color: '#E1306C', allocated_vnd: 8_000_000,  spend_vnd: 0, lead_count: 0, cpl_actual: null, cpl_benchmark: 170_000, budget_used_pct: 0 },
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
