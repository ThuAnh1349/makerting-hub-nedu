import { http, HttpResponse } from 'msw'

// ── Notifications từ HTML prototype (ws-topbar badge = 9 unread) ──────────────

const mockNotifications = [
  // ── ALERT: SLA overdue leads ───────────────────────────────────────────────
  {
    id: 'notif-001',
    notification_type: 'lead_sla_overdue',
    priority: 'alert',
    title: 'Khách chờ rep hơn 15 phút',
    body: 'Nguyễn Thị Mai (Facebook · BaZi 2026) đang chờ phản hồi từ 25 phút trước',
    entity_type: 'lead',
    entity_id: 'lead-001',
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-002',
    notification_type: 'lead_sla_overdue',
    priority: 'alert',
    title: 'Khách chờ rep hơn 15 phút',
    body: 'Hoàng Thị Lan (LinkedIn · Founder post) đang chờ phản hồi từ 32 phút trước',
    entity_type: 'lead',
    entity_id: 'lead-005',
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-003',
    notification_type: 'lead_sla_overdue',
    priority: 'alert',
    title: 'Khách chờ rep hơn 15 phút',
    body: 'Trần Văn Hùng (TikTok DM · Sao 8) đang chờ phản hồi từ 18 phút trước',
    entity_type: 'lead',
    entity_id: 'lead-002',
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  },
  // ── Post approved ──────────────────────────────────────────────────────────
  {
    id: 'notif-004',
    notification_type: 'post_approved',
    priority: 'normal',
    title: 'Bài viết đã được duyệt',
    body: 'Huê Co-Leader đã duyệt bài "Sao 8 #viral 2026 — Khoá học kinh dịch ứng dụng"',
    entity_type: 'post',
    entity_id: 'post-002',
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 41 * 60 * 1000).toISOString(),
  },
  // ── Post pending review (scheduled 14:00 hôm nay) ─────────────────────────
  {
    id: 'notif-005',
    notification_type: 'post_pending_review',
    priority: 'normal',
    title: 'Bài lên lịch 14:00 chờ duyệt',
    body: 'Bài TikTok "Sao 8 #viral 2026" lên lịch lúc 14:00 hôm nay — cần duyệt trước 30 phút',
    entity_type: 'post',
    entity_id: 'post-002',
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
  },
  // ── Lead returned from CRM ─────────────────────────────────────────────────
  {
    id: 'notif-006',
    notification_type: 'lead_returned',
    priority: 'normal',
    title: 'Lead bị trả về từ CRM',
    body: 'Trần Thị Hoa (TikTok DM · LCM) bị trả về: thiếu số điện thoại hợp lệ',
    entity_type: 'lead',
    entity_id: 'lead-009',
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
  },
  // ── Brief submitted ────────────────────────────────────────────────────────
  {
    id: 'notif-007',
    notification_type: 'brief_submitted',
    priority: 'normal',
    title: 'Brief thiết kế mới',
    body: 'Nguyễn Thị Hương gửi brief "Story Instagram series Retreat Đà Lạt" — cần nhận việc',
    entity_type: 'brief',
    entity_id: 'brief-002',
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  // ── Campaign budget warning ────────────────────────────────────────────────
  {
    id: 'notif-008',
    notification_type: 'budget_warning',
    priority: 'alert',
    title: 'Ngân sách sắp hết',
    body: 'Campaign "LCM Cohort 7 Launch" đã dùng 87% ngân sách — còn 1.04tr / 8tr',
    entity_type: 'campaign',
    entity_id: 'camp-lcm7',
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  // ── Story approved (read) ──────────────────────────────────────────────────
  {
    id: 'notif-009',
    notification_type: 'story_approved',
    priority: 'normal',
    title: 'Story học viên được duyệt',
    body: 'Story của Võ Thị Mai Hương (LCM Cohort 5) đã được duyệt — sẵn sàng deploy vào campaign',
    entity_type: 'story',
    entity_id: 'story-5',
    is_read: true,
    read_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  // ── Lead new hot (read) ────────────────────────────────────────────────────
  {
    id: 'notif-010',
    notification_type: 'lead_new',
    priority: 'normal',
    title: 'Lead mới — hot',
    body: 'Lê Thị Thu (Instagram · Reels LCM) quan tâm đến "Là Chính Mình Cohort 7" — đánh dấu hot',
    entity_type: 'lead',
    entity_id: 'lead-003',
    is_read: true,
    read_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  // ── Brand health alert (read) ──────────────────────────────────────────────
  {
    id: 'notif-011',
    notification_type: 'brand_health_drop',
    priority: 'normal',
    title: 'Điểm sức khỏe thương hiệu giảm',
    body: 'Instagram health giảm còn 52 (-3 điểm so với tuần trước) — cần theo dõi',
    entity_type: 'brand_health',
    entity_id: 'bh-1',
    is_read: true,
    read_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
]

export const notificationHandlers = [
  http.get('/api/v1/marketing/notifications', () => {
    return HttpResponse.json({
      data: mockNotifications,
      meta: { total: mockNotifications.length, page: 1, per_page: 20, has_next: false, next_cursor: null },
      unread_count: 9,
    })
  }),

  http.patch('/api/v1/marketing/notifications/:notification_id/read', ({ params }) => {
    const notif = mockNotifications.find((n) => n.id === params.notification_id)
    if (!notif) return HttpResponse.json({ code: 'RESOURCE_NOT_FOUND', message: 'Not found', request_id: 'mock' }, { status: 404 })
    notif.is_read = true
    notif.read_at = new Date().toISOString()
    return HttpResponse.json({ ...notif })
  }),

  http.patch('/api/v1/marketing/notifications/read-all', () => {
    mockNotifications.forEach(n => {
      n.is_read = true
      n.read_at = new Date().toISOString()
    })
    return HttpResponse.json({ success: true, updated_count: mockNotifications.length })
  }),
]
