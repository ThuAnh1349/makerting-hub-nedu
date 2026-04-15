import { http, HttpResponse } from 'msw'

const channels = [
  { id: 'ch-fb', label: 'Facebook', color: '#1877F2' },
  { id: 'ch-tt', label: 'TikTok', color: '#000000' },
  { id: 'ch-yt', label: 'YouTube', color: '#FF0000' },
  { id: 'ch-ig', label: 'Instagram', color: '#E1306C' },
  { id: 'ch-gg', label: 'Google', color: '#4285F4' },
]

const now = new Date()
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

export const analyticsHandlers = [
  http.get('/api/v1/marketing/analytics/summary', () => {
    return HttpResponse.json({
      data: channels.map((ch, i) => ({
        channel_id: ch.id,
        channel_label: ch.label,
        channel_color: ch.color,
        period_type: 'monthly',
        period_start: monthStart,
        period_end: monthEnd,
        reach: [45000, 128000, 22000, 31000, 8500][i],
        engagement_rate_pct: [3.2, 5.8, 2.1, 4.1, 1.4][i],
        lead_count: [120, 310, 45, 88, 22][i],
        conversion_count: [18, 52, 6, 14, 3][i],
        spend_vnd: [12000000, 25000000, 8000000, 10000000, 5000000][i],
        allocated_vnd: [15000000, 30000000, 10000000, 12000000, 8000000][i],
        cpl_actual: [100000, 80645, 177778, 113636, 227273][i],
        cpl_benchmark: [120000, 100000, 150000, 130000, 200000][i],
        budget_used_pct: [80, 83.3, 80, 83.3, 62.5][i],
        data_source: 'manual',
      })),
      meta: { period_type: 'monthly', period_start: monthStart, period_end: monthEnd },
    })
  }),

  http.post('/api/v1/marketing/analytics/entries', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({ ...body, id: `entry-${Date.now()}` }, { status: 201 })
  }),
]
