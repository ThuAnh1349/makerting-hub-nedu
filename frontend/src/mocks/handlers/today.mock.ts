import { http, HttpResponse } from 'msw'

export const todayHandlers = [
  http.get('/api/v1/marketing/today/summary', () => {
    return HttpResponse.json({
      leads_pending_count: 3,
      leads_sla_overdue_count: 1,
      posts_scheduled_today: 2,
      posts_pending_review: 1,
      unread_notification_count: 4,
      alerts: [
        {
          alert_type: 'lead_sla_overdue',
          message: 'Nguyễn Văn An (TikTok) chờ rep hơn 15 phút',
          entity_type: 'lead',
          entity_id: 'lead-001',
          minutes_overdue: 23,
        },
        {
          alert_type: 'post_unscheduled_soon',
          message: 'Bài TikTok 14:00 chưa lên lịch',
          entity_type: 'post',
          entity_id: 'post-001',
          minutes_overdue: null,
        },
      ],
      quick_leads: [
        {
          id: 'lead-001',
          full_name: 'Nguyễn Văn An',
          phone_number: '0901234567',
          message_preview: 'Cho hỏi khóa học data analytics bao nhiêu tiền vậy ạ?',
          channel: { code: 'tiktok', label: 'TikTok', color_hex: '#000000' },
          utm_source: 'tiktok',
          utm_medium: 'social',
          utm_campaign: 'spring2026',
          current_status: 'new',
          return_reason: null,
          assigned_to: null,
          minutes_waiting: 23,
          sla_overdue: true,
          ops_synced_at: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
          last_action_at: null,
        },
        {
          id: 'lead-002',
          full_name: 'Trần Thị Bình',
          phone_number: '0912345678',
          message_preview: 'Em muốn học SQL nhưng chưa biết bắt đầu từ đâu',
          channel: { code: 'facebook', label: 'Facebook', color_hex: '#1877F2' },
          utm_source: 'facebook',
          utm_medium: 'paid',
          utm_campaign: null,
          current_status: 'new',
          return_reason: null,
          assigned_to: null,
          minutes_waiting: 8,
          sla_overdue: false,
          ops_synced_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
          last_action_at: null,
        },
      ],
    })
  }),
]
