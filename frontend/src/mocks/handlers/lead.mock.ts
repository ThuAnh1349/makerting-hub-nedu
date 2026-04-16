import { http, HttpResponse } from 'msw'

// ── Shared data ───────────────────────────────────────────────────────────────

const STAFF = { id: 'person-linh', display_name: 'Phạm Thị Linh', avatar_url: null }
const LEADER = { id: 'person-hue', display_name: 'Huê Co-Leader', avatar_url: null }

// ── 9 leads từ HTML prototype ─────────────────────────────────────────────────

const mockLeads = [
  {
    id: 'lead-001',
    full_name: 'Nguyễn Thị Mai',
    phone_number: '0901234567',
    message_preview: 'Chị ơi cho em hỏi khóa học phân tích vận mệnh BaZi giá bao nhiêu ạ? Em quan tâm từ lâu rồi',
    channel: { code: 'facebook', label: 'Facebook', color_hex: '#1877F2' },
    utm_source: 'facebook',
    utm_medium: 'comment',
    utm_campaign: 'bazi-2026',
    current_status: 'new',
    return_reason: null,
    assigned_to: STAFF,
    minutes_waiting: 25,
    sla_overdue: true,
    ops_synced_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    last_action_at: null,
    action_history: [
      { event_type: 'synced_from_ops', actor_name: null, payload: {}, created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 'lead-002',
    full_name: 'Trần Văn Hùng',
    phone_number: '0912345678',
    message_preview: 'Em muốn biết thêm về chương trình Nedu, có thể tư vấn không ạ?',
    channel: { code: 'tiktok', label: 'TikTok', color_hex: '#010101' },
    utm_source: 'tiktok',
    utm_medium: 'dm',
    utm_campaign: 'sao-8-2026',
    current_status: 'hot',
    return_reason: null,
    assigned_to: STAFF,
    minutes_waiting: 0,
    sla_overdue: false,
    ops_synced_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    last_action_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    action_history: [
      { event_type: 'synced_from_ops', actor_name: null, payload: {}, created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString() },
      { event_type: 'classified_hot', actor_name: 'Phạm Thị Linh', payload: { to_status: 'hot' }, created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 'lead-003',
    full_name: 'Lê Thị Thu',
    phone_number: '0923456789',
    message_preview: 'Mình đang tìm khóa học phát triển bản thân, bên mình có không? Đăng ký thế nào ạ?',
    channel: { code: 'instagram', label: 'Instagram', color_hex: '#E1306C' },
    utm_source: 'instagram',
    utm_medium: 'comment',
    utm_campaign: 'reels-lcm',
    current_status: 'hot',
    return_reason: null,
    assigned_to: STAFF,
    minutes_waiting: 0,
    sla_overdue: false,
    ops_synced_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    last_action_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    action_history: [
      { event_type: 'synced_from_ops', actor_name: null, payload: {}, created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString() },
      { event_type: 'classified_hot', actor_name: 'Phạm Thị Linh', payload: { to_status: 'hot' }, created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 'lead-004',
    full_name: 'Phạm Minh Tuấn',
    phone_number: '0934567890',
    message_preview: 'Video này hay quá! Sub liền rồi ae ơi 🔥🔥',
    channel: { code: 'youtube', label: 'YouTube', color_hex: '#FF0000' },
    utm_source: 'youtube',
    utm_medium: 'comment',
    utm_campaign: 'ai-video',
    current_status: 'cold',
    return_reason: null,
    assigned_to: STAFF,
    minutes_waiting: 0,
    sla_overdue: false,
    ops_synced_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    last_action_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    action_history: [
      { event_type: 'synced_from_ops', actor_name: null, payload: {}, created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { event_type: 'classified_cold', actor_name: 'Phạm Thị Linh', payload: { to_status: 'cold' }, created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 'lead-005',
    full_name: 'Hoàng Thị Lan',
    phone_number: '0945678901',
    message_preview: 'Hi, tôi là HR startup 30 người, muốn hỏi chương trình đào tạo team không?',
    channel: { code: 'linkedin', label: 'LinkedIn', color_hex: '#0A66C2' },
    utm_source: 'linkedin',
    utm_medium: 'message',
    utm_campaign: 'founder-post',
    current_status: 'new',
    return_reason: null,
    assigned_to: LEADER,
    minutes_waiting: 32,
    sla_overdue: true,
    ops_synced_at: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    last_action_at: null,
    action_history: [
      { event_type: 'synced_from_ops', actor_name: null, payload: {}, created_at: new Date(Date.now() - 32 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 'lead-006',
    full_name: 'Võ Văn An',
    phone_number: '0956789012',
    message_preview: null,
    channel: { code: 'facebook', label: 'Facebook', color_hex: '#1877F2' },
    utm_source: 'facebook',
    utm_medium: 'comment',
    utm_campaign: 'nedu-awareness',
    current_status: 'archived',
    return_reason: null,
    assigned_to: STAFF,
    minutes_waiting: 0,
    sla_overdue: false,
    ops_synced_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    last_action_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    action_history: [
      { event_type: 'synced_from_ops', actor_name: null, payload: {}, created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
      { event_type: 'classified_trash', actor_name: 'Phạm Thị Linh', payload: { to_status: 'archived' }, created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 'lead-007',
    full_name: 'Đinh Thị Bình',
    phone_number: '0967890123',
    message_preview: 'Sale 50% không ạ 😂 em sinh viên không có tiền',
    channel: { code: 'tiktok', label: 'TikTok', color_hex: '#010101' },
    utm_source: 'tiktok',
    utm_medium: 'dm',
    utm_campaign: 'bazi-tips',
    current_status: 'archived',
    return_reason: null,
    assigned_to: STAFF,
    minutes_waiting: 0,
    sla_overdue: false,
    ops_synced_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    last_action_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    action_history: [
      { event_type: 'synced_from_ops', actor_name: null, payload: {}, created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
      { event_type: 'classified_trash', actor_name: 'Phạm Thị Linh', payload: { to_status: 'archived' }, created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 'lead-008',
    full_name: 'Nguyễn Minh Khoa',
    phone_number: '0978901234',
    message_preview: 'Họ tên: Nguyễn Minh Khoa | Nhu cầu: Tìm hiểu khóa học BaZi | SĐT: 0978xxx',
    channel: { code: 'website', label: 'Website', color_hex: '#2d9b6b' },
    utm_source: 'website',
    utm_medium: 'form',
    utm_campaign: 'landing-page',
    current_status: 'warm',
    return_reason: null,
    assigned_to: STAFF,
    minutes_waiting: 0,
    sla_overdue: false,
    ops_synced_at: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    last_action_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    action_history: [
      { event_type: 'synced_from_ops', actor_name: null, payload: {}, created_at: new Date(Date.now() - 9 * 60 * 1000).toISOString() },
      { event_type: 'classified_warm', actor_name: 'Phạm Thị Linh', payload: { to_status: 'warm' }, created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 'lead-009',
    full_name: 'Trần Thị Hoa',
    phone_number: '0989012345',
    message_preview: 'Em muốn đăng ký khoá LCM tháng 5, tư vấn giúp em với ạ!',
    channel: { code: 'tiktok', label: 'TikTok', color_hex: '#010101' },
    utm_source: 'tiktok',
    utm_medium: 'dm',
    utm_campaign: 'la-chinh-minh',
    current_status: 'returned',
    return_reason: 'Khách chưa đủ thông tin, cần gọi lại để tư vấn thêm',
    assigned_to: STAFF,
    minutes_waiting: 0,
    sla_overdue: false,
    ops_synced_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    last_action_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    action_history: [
      { event_type: 'synced_from_ops', actor_name: null, payload: {}, created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
      { event_type: 'pushed_to_crm', actor_name: 'Phạm Thị Linh', payload: {}, created_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString() },
      { event_type: 'returned_from_crm', actor_name: 'Nguyễn Thị Hương', payload: { reason: 'thiếu_data' }, created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    ],
  },
]

export const leadHandlers = [
  http.get('/api/v1/marketing/leads', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.getAll('status')

    const filtered = status.length > 0
      ? mockLeads.filter(l => status.includes(l.current_status))
      : mockLeads

    return HttpResponse.json({
      data: filtered,
      meta: { total: filtered.length, page: 1, per_page: 20, has_next: false, next_cursor: null },
    })
  }),

  http.get('/api/v1/marketing/leads/:lead_id', ({ params }) => {
    const lead = mockLeads.find(l => l.id === params.lead_id) ?? mockLeads[0]
    return HttpResponse.json(lead)
  }),

  http.post('/api/v1/marketing/leads/:lead_id/actions', async ({ request, params }) => {
    const body = await request.json() as { action_type: string; classification?: string }
    const lead = mockLeads.find(l => l.id === params.lead_id) ?? mockLeads[0]
    const statusMap: Record<string, string> = {
      hot: 'hot', warm: 'warm', cold: 'cold', trash: 'archived', push: 'pushed',
    }
    const newStatus = statusMap[body.action_type] ?? lead.current_status
    return HttpResponse.json({
      ...lead,
      current_status: newStatus,
      side_effects: {
        events_fired: [body.action_type],
        ops_push_queued: body.action_type === 'push',
        notifications_queued: [],
      },
    })
  }),
]
