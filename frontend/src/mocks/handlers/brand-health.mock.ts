import { http, HttpResponse } from 'msw'

function monday(weeksAgo: number) {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) - weeksAgo * 7
  return new Date(d.setDate(diff)).toISOString().slice(0, 10)
}

export const brandHealthHandlers = [
  http.get('/api/v1/marketing/brand-health', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'bh-1', week_start: monday(0), nps_score: 45,
          share_of_voice_pct: 23.5, brand_mentions: 312,
          sentiment_positive: 198, sentiment_neutral: 78, sentiment_negative: 36,
          negative_topics: [
            { topic: 'Học phí cao', mention_count: 18 },
            { topic: 'Lịch học dày', mention_count: 12 },
          ],
          data_source: 'manual', recorded_by_name: 'Mai Marketing',
          created_at: new Date().toISOString(),
        },
        {
          id: 'bh-2', week_start: monday(1), nps_score: 52,
          share_of_voice_pct: 21.8, brand_mentions: 287,
          sentiment_positive: 210, sentiment_neutral: 55, sentiment_negative: 22,
          negative_topics: [{ topic: 'Thiếu mentor', mention_count: 9 }],
          data_source: 'manual', recorded_by_name: 'Mai Marketing',
          created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        },
        {
          id: 'bh-3', week_start: monday(2), nps_score: 28,
          share_of_voice_pct: 18.2, brand_mentions: 195,
          sentiment_positive: 88, sentiment_neutral: 60, sentiment_negative: 47,
          negative_topics: [
            { topic: 'Chất lượng video kém', mention_count: 22 },
            { topic: 'Support chậm', mention_count: 15 },
          ],
          data_source: 'manual', recorded_by_name: 'Mai Marketing',
          created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
        },
        {
          id: 'bh-4', week_start: monday(3), nps_score: 38,
          share_of_voice_pct: 20.1, brand_mentions: 241,
          sentiment_positive: 145, sentiment_neutral: 62, sentiment_negative: 34,
          negative_topics: [{ topic: 'Tài liệu ít', mention_count: 11 }],
          data_source: 'manual', recorded_by_name: 'Hue Co-Leader',
          created_at: new Date(Date.now() - 21 * 86400000).toISOString(),
        },
      ],
    })
  }),

  http.post('/api/v1/marketing/brand-health', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({ id: `bh-${Date.now()}`, ...body, recorded_by_name: 'Mai Marketing', created_at: new Date().toISOString() }, { status: 201 })
  }),

  http.post('/api/v1/marketing/brand-health/crisis', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id: `crisis-${Date.now()}`, ...body,
      activated_by_name: 'Marketing Leader',
      steps_status: [
        { step: 1, label: 'Dừng tất cả quảng cáo đang chạy', completed: false, completed_at: null },
        { step: 2, label: 'Soạn thảo phản hồi chính thức', completed: false, completed_at: null },
        { step: 3, label: 'Publish phản hồi và theo dõi', completed: false, completed_at: null },
      ],
      is_resolved: false, resolved_at: null, created_at: new Date().toISOString(),
    }, { status: 201 })
  }),
]
