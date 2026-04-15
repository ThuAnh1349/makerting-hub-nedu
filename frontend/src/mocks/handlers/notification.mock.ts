import { http, HttpResponse } from 'msw'

const mockNotifications = [
  {
    id: 'notif-001',
    notification_type: 'lead_sla_overdue',
    priority: 'alert',
    title: 'Khách chờ rep hơn 15 phút',
    body: 'Nguyễn Văn An (TikTok) đang chờ phản hồi từ 23 phút trước',
    entity_type: 'lead',
    entity_id: 'lead-001',
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-002',
    notification_type: 'post_approved',
    priority: 'normal',
    title: 'Bài viết đã được duyệt',
    body: 'Co-Leader đã duyệt bài "Bạn có biết rằng 78% Data Analyst..."',
    entity_type: 'post',
    entity_id: 'post-001',
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-003',
    notification_type: 'lead_returned',
    priority: 'normal',
    title: 'Lead bị trả về',
    body: 'Hoàng Anh Tú đã bị Tư vấn viên trả về: "Chưa đủ budget"',
    entity_type: 'lead',
    entity_id: 'lead-005',
    is_read: true,
    read_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
]

export const notificationHandlers = [
  http.get('/api/v1/marketing/notifications', () => {
    return HttpResponse.json({
      data: mockNotifications,
      meta: { total: 3, page: 1, per_page: 20, has_next: false, next_cursor: null },
      unread_count: 2,
    })
  }),

  http.patch('/api/v1/marketing/notifications/:notification_id/read', ({ params }) => {
    const notif = mockNotifications.find((n) => n.id === params.notification_id)
    if (!notif) return HttpResponse.json({ code: 'RESOURCE_NOT_FOUND', message: 'Not found', request_id: 'mock' }, { status: 404 })
    return HttpResponse.json({ ...notif, is_read: true, read_at: new Date().toISOString() })
  }),
]
