// src/mocks/data/brand-health.ts
import type { BrandHealth } from '@modules/brand-health/types'

export const MOCK_BRAND_HEALTH: BrandHealth[] = [
  {
    id: 'bh-0001-aaaa-bbbb-cccc-dddddddddddd',
    period_label: '2026-W14',
    nps_score: 52,
    share_of_voice: 34,
    mention_count: 183,
    sentiment_positive: 72,
    sentiment_neutral: 20,
    sentiment_negative: 8,
    negative_topics: [
      { topic: 'Giá khóa học', mention_count: 7, suggestion: 'Tạo content so sánh ROI học phí vs thu nhập sau khoá học' },
      { topic: 'Lịch học dày', mention_count: 4, suggestion: 'Đăng video giải thích cấu trúc học linh hoạt' },
    ],
    crisis_active: false,
    created_at: '2026-04-07T00:00:00.000Z',
  },
  {
    id: 'bh-0002-aaaa-bbbb-cccc-dddddddddddd',
    period_label: '2026-04',
    nps_score: 28,
    share_of_voice: 21,
    mention_count: 720,
    sentiment_positive: 55,
    sentiment_neutral: 25,
    sentiment_negative: 20,
    negative_topics: [
      { topic: 'Hỗ trợ sau khoá chậm', mention_count: 42, suggestion: 'Tăng tần suất alumni check-in, cải thiện response time support' },
    ],
    crisis_active: false,
    created_at: '2026-04-07T00:00:00.000Z',
  },
  {
    id: 'bh-0003-aaaa-bbbb-cccc-dddddddddddd',
    period_label: '2026-W13',
    nps_score: 12,
    share_of_voice: 18,
    mention_count: 940,
    sentiment_positive: 30,
    sentiment_neutral: 15,
    sentiment_negative: 55,
    negative_topics: [],
    crisis_active: true,
    created_at: '2026-03-31T00:00:00.000Z',
  },
]
