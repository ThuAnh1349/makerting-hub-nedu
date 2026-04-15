import { http, HttpResponse } from 'msw'

const mockLeads = [
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
    assigned_to: { id: 'person-001', display_name: 'Mai Marketing', avatar_url: null },
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
    current_status: 'hot',
    return_reason: null,
    assigned_to: { id: 'person-001', display_name: 'Mai Marketing', avatar_url: null },
    minutes_waiting: 0,
    sla_overdue: false,
    ops_synced_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    last_action_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'lead-003',
    full_name: 'Lê Minh Châu',
    phone_number: '0923456789',
    message_preview: 'Anh ơi khóa Power BI có chứng chỉ không?',
    channel: { code: 'zalo', label: 'Zalo OA', color_hex: '#0068FF' },
    utm_source: 'zalo',
    utm_medium: 'organic',
    utm_campaign: null,
    current_status: 'warm',
    return_reason: null,
    assigned_to: { id: 'person-001', display_name: 'Mai Marketing', avatar_url: null },
    minutes_waiting: 0,
    sla_overdue: false,
    ops_synced_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    last_action_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lead-004',
    full_name: 'Phạm Quốc Dũng',
    phone_number: '0934567890',
    message_preview: 'Shop có khoá học cho người đi làm ban đêm không?',
    channel: { code: 'instagram', label: 'Instagram', color_hex: '#E1306C' },
    utm_source: 'instagram',
    utm_medium: 'paid',
    utm_campaign: 'influencer_q1',
    current_status: 'pushed',
    return_reason: null,
    assigned_to: { id: 'person-001', display_name: 'Mai Marketing', avatar_url: null },
    minutes_waiting: 0,
    sla_overdue: false,
    ops_synced_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    last_action_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lead-005',
    full_name: 'Hoàng Anh Tú',
    phone_number: '0945678901',
    message_preview: 'Tư vấn cho em xem nên học gì với background kế toán',
    channel: { code: 'facebook', label: 'Facebook', color_hex: '#1877F2' },
    utm_source: 'facebook',
    utm_medium: 'organic',
    utm_campaign: null,
    current_status: 'returned',
    return_reason: 'Khách chưa đủ budget, cần follow up sau 1 tháng',
    assigned_to: { id: 'person-001', display_name: 'Mai Marketing', avatar_url: null },
    minutes_waiting: 0,
    sla_overdue: false,
    ops_synced_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    last_action_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
]

export const leadHandlers = [
  http.get('/api/v1/marketing/leads', () => {
    return HttpResponse.json({
      data: mockLeads,
      meta: { total: 5, page: 1, per_page: 20, has_next: false, next_cursor: null },
    })
  }),

  http.get('/api/v1/marketing/leads/:lead_id', ({ params }) => {
    const lead = mockLeads.find((l) => l.id === params.lead_id) ?? mockLeads[0]
    return HttpResponse.json({
      ...lead,
      action_history: [
        {
          event_type: 'synced_from_ops',
          actor_name: null,
          payload: { from_status: null, to_status: 'new' },
          created_at: lead.ops_synced_at,
        },
        {
          event_type: 'assigned',
          actor_name: 'System',
          payload: { assigned_to: 'Mai Marketing' },
          created_at: lead.ops_synced_at,
        },
      ],
    })
  }),

  http.post('/api/v1/marketing/leads/:lead_id/actions', async ({ request, params }) => {
    const body = await request.json() as { action_type: string; classification?: string }
    const lead = mockLeads.find((l) => l.id === params.lead_id) ?? mockLeads[0]
    const statusMap: Record<string, string> = {
      classify_hot: 'hot',
      classify_warm: 'warm',
      classify_cold: 'cold',
      classify_trash: 'archived',
      push: 'pushed',
    }
    const newStatus = body.action_type === 'classify' && body.classification
      ? statusMap[`classify_${body.classification}`] ?? lead.current_status
      : body.action_type === 'push' ? 'pushed' : lead.current_status
    return HttpResponse.json({
      ...lead,
      current_status: newStatus,
      side_effects: { events_fired: [body.action_type], ops_push_queued: body.action_type === 'push', notifications_queued: [] },
    })
  }),
]
