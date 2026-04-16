import { http, HttpResponse } from 'msw'

// ── Channel definitions ────────────────────────────────────────────────────────
const CHANNELS = [
  { id: 'ch-tt',  label: 'TikTok',    color: '#010101' },
  { id: 'ch-fb',  label: 'Facebook',  color: '#1877F2' },
  { id: 'ch-yt',  label: 'YouTube',   color: '#FF0000' },
  { id: 'ch-ig',  label: 'Instagram', color: '#E1306C' },
  { id: 'ch-li',  label: 'LinkedIn',  color: '#0A66C2' },
]

// ── Data per period (từ HTML prototype) ───────────────────────────────────────

// Tuần này (07/04/2026) — week 14
const weekData = [
  { reach: 1400,  er: 8.2,  leads: 1,  cpl: 112000,  bench: 150000, spend: 112000,   alloc: 2000000,  pct: 5.6  },
  { reach: 3200,  er: 2.4,  leads: 0,  cpl: null,    bench: 200000, spend: 0,        alloc: 3000000,  pct: 0    },
  { reach: 600,   er: 1.8,  leads: 0,  cpl: null,    bench: 180000, spend: 0,        alloc: 1500000,  pct: 0    },
  { reach: 400,   er: 7.0,  leads: 0,  cpl: null,    bench: 170000, spend: 0,        alloc: 1000000,  pct: 0    },
  { reach: 280,   er: 3.1,  leads: 1,  cpl: 412000,  bench: 500000, spend: 412000,   alloc: 1000000,  pct: 41.2 },
]

// Tháng này (T4/2026) — chiến dịch LCM7 + Retreat
const monthData = [
  { reach: 178000,  er: 9.4,  leads: 22,  cpl: 112000,  bench: 150000, spend: 2464000,  alloc: 8000000,  pct: 30.8 },
  { reach: 124000,  er: 3.2,  leads: 34,  cpl: 234000,  bench: 200000, spend: 7956000,  alloc: 18000000, pct: 44.2 },
  { reach: 88000,   er: 2.1,  leads: 28,  cpl: 156000,  bench: 180000, spend: 4368000,  alloc: 12000000, pct: 36.4 },
  { reach: 34000,   er: 7.8,  leads: 9,   cpl: 189000,  bench: 170000, spend: 1701000,  alloc: 6000000,  pct: 28.4 },
  { reach: 8400,    er: 4.2,  leads: 11,  cpl: 412000,  bench: 500000, spend: 4532000,  alloc: 8000000,  pct: 56.7 },
]

// Tháng trước (T3/2026) — Brand Awareness Q1
const lastMonthData = [
  { reach: 1120000, er: 11.2, leads: 142, cpl: 112000,  bench: 150000, spend: 15904000, alloc: 20000000, pct: 79.5 },
  { reach: 390000,  er: 2.8,  leads: 58,  cpl: 234000,  bench: 200000, spend: 13572000, alloc: 15000000, pct: 90.5 },
  { reach: 556000,  er: 1.9,  leads: 171, cpl: 156000,  bench: 180000, spend: 26676000, alloc: 30000000, pct: 88.9 },
  { reach: 208000,  er: 6.8,  leads: 51,  cpl: 189000,  bench: 170000, spend: 9639000,  alloc: 10000000, pct: 96.4 },
  { reach: 21000,   er: 3.9,  leads: 34,  cpl: 412000,  bench: 500000, spend: 14008000, alloc: 14000000, pct: 100  },
]

function buildAnalytics(
  periodType: string,
  periodStart: string,
  rows: typeof weekData,
) {
  return CHANNELS.map((ch, i) => ({
    channel_id: ch.id,
    channel_label: ch.label,
    channel_color: ch.color,
    period_type: periodType,
    period_start: periodStart,
    period_end: periodStart,
    reach: rows[i].reach,
    engagement_rate_pct: rows[i].er,
    lead_count: rows[i].leads,
    conversion_count: Math.round(rows[i].leads * 0.18),
    spend_vnd: rows[i].spend,
    allocated_vnd: rows[i].alloc,
    cpl_actual: rows[i].cpl,
    cpl_benchmark: rows[i].bench,
    budget_used_pct: rows[i].pct,
    data_source: 'manual',
  }))
}

export const analyticsHandlers = [
  http.get('/api/v1/marketing/analytics/summary', ({ request }) => {
    const url = new URL(request.url)
    const periodType = url.searchParams.get('period_type') ?? 'monthly'
    const periodStart = url.searchParams.get('period_start') ?? '2026-04-01'

    let rows = monthData
    if (periodType === 'weekly') rows = weekData
    else if (periodStart < '2026-04-01') rows = lastMonthData

    const data = buildAnalytics(periodType, periodStart, rows)
    return HttpResponse.json(data)
  }),

  http.post('/api/v1/marketing/analytics/entries', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({ ...body, id: `entry-${Date.now()}` }, { status: 201 })
  }),
]
