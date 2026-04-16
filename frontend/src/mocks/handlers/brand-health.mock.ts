import { http, HttpResponse } from 'msw'

function monday(weeksAgo: number) {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) - weeksAgo * 7
  return new Date(new Date(d).setDate(diff)).toISOString().slice(0, 10)
}

// ── Brand Health data — Nedu Vietnam ─────────────────────────────────────────
// Từ HTML: TikTok health 91 (+5%), YouTube 86 (+2%), Instagram 52
// Mentions tập trung vào: học phí, chất lượng giảng viên, community

export const brandHealthHandlers = [
  http.get('/api/v1/marketing/brand-health', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'bh-1',
          week_start: monday(0),
          nps_score: 62,
          share_of_voice_pct: 28.4,
          brand_mentions: 418,
          sentiment_positive: 312,
          sentiment_neutral: 74,
          sentiment_negative: 32,
          negative_topics: [
            { topic: 'Học phí cao so với thu nhập trung bình', mention_count: 18 },
            { topic: 'Chờ support lâu cuối tuần', mention_count: 8 },
            { topic: 'Lịch học dày, khó theo kịp', mention_count: 6 },
          ],
          channel_health: [
            { channel: 'TikTok',    score: 91, change: +5 },
            { channel: 'YouTube',   score: 86, change: +2 },
            { channel: 'Instagram', score: 52, change: -3 },
            { channel: 'Facebook',  score: 74, change: +1 },
          ],
          data_source: 'manual',
          recorded_by_name: 'Phạm Thị Linh',
          created_at: new Date().toISOString(),
        },
        {
          id: 'bh-2',
          week_start: monday(1),
          nps_score: 58,
          share_of_voice_pct: 25.1,
          brand_mentions: 374,
          sentiment_positive: 280,
          sentiment_neutral: 68,
          sentiment_negative: 26,
          negative_topics: [
            { topic: 'Muốn thêm buổi Q&A trực tiếp', mention_count: 14 },
            { topic: 'Học phí cao', mention_count: 12 },
          ],
          channel_health: [
            { channel: 'TikTok',    score: 86, change: +8 },
            { channel: 'YouTube',   score: 84, change: +4 },
            { channel: 'Instagram', score: 55, change: +2 },
            { channel: 'Facebook',  score: 73, change: 0 },
          ],
          data_source: 'manual',
          recorded_by_name: 'Phạm Thị Linh',
          created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        },
        {
          id: 'bh-3',
          week_start: monday(2),
          // Tuần viral — Story GM 34 tuổi khóc lần đầu (1.2M views)
          nps_score: 71,
          share_of_voice_pct: 34.7,
          brand_mentions: 892,
          sentiment_positive: 742,
          sentiment_neutral: 98,
          sentiment_negative: 52,
          negative_topics: [
            { topic: 'Lo ngại tính riêng tư trong sharing', mention_count: 28 },
            { topic: 'Video quá xúc cảm — không thực tế', mention_count: 14 },
            { topic: 'Giá vẫn ngoài tầm với sinh viên', mention_count: 10 },
          ],
          channel_health: [
            { channel: 'TikTok',    score: 97, change: +18 },
            { channel: 'YouTube',   score: 80, change: 0 },
            { channel: 'Instagram', score: 53, change: -1 },
            { channel: 'Facebook',  score: 72, change: -1 },
          ],
          data_source: 'manual',
          recorded_by_name: 'Huê Co-Leader',
          created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
        },
        {
          id: 'bh-4',
          week_start: monday(3),
          nps_score: 44,
          share_of_voice_pct: 19.8,
          brand_mentions: 256,
          sentiment_positive: 168,
          sentiment_neutral: 58,
          sentiment_negative: 30,
          negative_topics: [
            { topic: 'Thiếu case study thực tế hơn', mention_count: 16 },
            { topic: 'Support chậm', mention_count: 9 },
          ],
          channel_health: [
            { channel: 'TikTok',    score: 79, change: -2 },
            { channel: 'YouTube',   score: 80, change: +3 },
            { channel: 'Instagram', score: 54, change: +4 },
            { channel: 'Facebook',  score: 73, change: +2 },
          ],
          data_source: 'manual',
          recorded_by_name: 'Phạm Thị Linh',
          created_at: new Date(Date.now() - 21 * 86400000).toISOString(),
        },
      ],
    })
  }),

  http.post('/api/v1/marketing/brand-health', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json(
      { id: `bh-${Date.now()}`, ...body, recorded_by_name: 'Phạm Thị Linh', created_at: new Date().toISOString() },
      { status: 201 },
    )
  }),

  http.post('/api/v1/marketing/brand-health/crisis', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id: `crisis-${Date.now()}`,
      ...body,
      activated_by_name: 'Huê Co-Leader',
      steps_status: [
        { step: 1, label: 'Dừng tất cả quảng cáo đang chạy trên mọi kênh', completed: false, completed_at: null },
        { step: 2, label: 'Soạn thảo phản hồi chính thức — xác nhận sự việc, thể hiện trách nhiệm', completed: false, completed_at: null },
        { step: 3, label: 'Publish phản hồi + theo dõi sentiment 24h', completed: false, completed_at: null },
        { step: 4, label: 'Báo cáo nội bộ và hành động khắc phục', completed: false, completed_at: null },
      ],
      is_resolved: false,
      resolved_at: null,
      created_at: new Date().toISOString(),
    }, { status: 201 })
  }),
]
