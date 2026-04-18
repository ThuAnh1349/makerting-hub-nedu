// src/mocks/data/dashboard.ts
import type { DashboardSummary } from '@modules/dashboard/types'
import { MOCK_PERSONS } from './persons'

export const MOCK_DASHBOARD: Record<string, DashboardSummary> = {
  // Happy path — Staff 01 có nhiều việc cần làm
  [MOCK_PERSONS[3].id]: {
    leads_pending: 8,
    messages_unread: 5,
    posts_today: 2,
    kpis: {
      task_completion_rate: 87,
      response_rate: 93,
      on_time_post_rate: 100,
    },
    alerts: [
      { type: 'urgent',  message: '5 khách chờ rep hơn 15 phút', action: 'go_leads' },
      { type: 'warning', message: 'Bài TikTok 14:00 chưa được duyệt caption', action: 'go_content' },
    ],
  },
  // Leader — ít cảnh báo hơn
  [MOCK_PERSONS[1].id]: {
    leads_pending: 3,
    messages_unread: 1,
    posts_today: 4,
    kpis: {
      task_completion_rate: 95,
      response_rate: 98,
      on_time_post_rate: 100,
    },
    alerts: [
      { type: 'warning', message: '2 bài chờ bạn duyệt', action: 'go_content' },
    ],
  },
  // Edge — Staff 02 không có gì cần xử lý
  [MOCK_PERSONS[4].id]: {
    leads_pending: 0,
    messages_unread: 0,
    posts_today: 1,
    kpis: {
      task_completion_rate: 100,
      response_rate: 100,
      on_time_post_rate: 100,
    },
    alerts: [],
  },
}
