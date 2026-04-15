import { http, HttpResponse } from 'msw'

const requester = { id: 'person-001', display_name: 'Mai Marketing', avatar_url: null }
const designer  = { id: 'person-des', display_name: 'An Design', avatar_url: null }

const mockBriefs = [
  { id: 'brief-1', brief_type_code: 'design', brief_type_label: 'Thiết kế', title: 'Banner Facebook khai giảng tháng 5', description: 'Cần banner 1200x628 và 1080x1080 cho chiến dịch khai giảng tháng 5. Màu sắc theo brand guideline Nedu.', size_format: '1200x628, 1080x1080', deadline: new Date(Date.now() + 2 * 86400000).toISOString(), current_status: 'in_progress', deliverable_url: null, requested_by: requester, assigned_to: designer, post_id: null, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'brief-2', brief_type_code: 'video_editing', brief_type_label: 'Dựng video', title: 'Reels TikTok testimonial học viên Hoàng Nam', description: 'Dựng video 30-60 giây từ raw footage interview. Format Reels dọc 9:16.', size_format: '1080x1920 (9:16)', deadline: new Date(Date.now() + 3 * 86400000).toISOString(), current_status: 'review', deliverable_url: 'https://drive.google.com/file/example', requested_by: requester, assigned_to: designer, post_id: 'post-002', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'brief-3', brief_type_code: 'design', brief_type_label: 'Thiết kế', title: 'Story Instagram series tháng 4', description: '5 story templates cho series content tháng 4. Phong cách tối giản, chữ to rõ.', size_format: '1080x1920', deadline: new Date(Date.now() + 86400000).toISOString(), current_status: 'submitted', deliverable_url: null, requested_by: requester, assigned_to: null, post_id: null, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'brief-4', brief_type_code: 'video_editing', brief_type_label: 'Dựng video', title: 'YouTube intro mới cho channel Nedu', description: 'Intro 10 giây, professional, dùng logo animation và nhạc hiệu.', size_format: '1920x1080 (16:9)', deadline: new Date(Date.now() - 86400000).toISOString(), current_status: 'completed', deliverable_url: 'https://stream.cloudflare.com/example', requested_by: requester, assigned_to: designer, post_id: null, created_at: new Date(Date.now() - 7 * 86400000).toISOString() },
]

export const briefHandlers = [
  http.get('/api/v1/marketing/briefs', () => {
    return HttpResponse.json({ data: mockBriefs, meta: { total: 4, page: 1, per_page: 20, has_next: false, next_cursor: null } })
  }),

  http.post('/api/v1/marketing/briefs', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({ id: `brief-${Date.now()}`, ...body, brief_type_label: body.brief_type_code === 'design' ? 'Thiết kế' : 'Dựng video', current_status: 'submitted', deliverable_url: null, requested_by: requester, assigned_to: null, post_id: null, created_at: new Date().toISOString() }, { status: 201 })
  }),

  http.get('/api/v1/marketing/briefs/:id', ({ params }) => {
    const b = mockBriefs.find(b => b.id === params.id) ?? mockBriefs[0]
    return HttpResponse.json({ ...b, status_history: [
      { event_type: 'submitted', actor_name: requester.display_name, notes: null, created_at: b.created_at },
      ...(b.current_status !== 'submitted' ? [{ event_type: 'in_progress', actor_name: designer.display_name, notes: null, created_at: new Date(Date.now() - 3600000).toISOString() }] : []),
    ]})
  }),

  http.post('/api/v1/marketing/briefs/:id/actions', async ({ request, params }) => {
    const body = await request.json() as { action_type: string; deliverable_url?: string }
    const b = mockBriefs.find(b => b.id === params.id) ?? mockBriefs[0]
    const statusMap: Record<string, string> = { acknowledge: 'in_progress', deliver: 'review', complete: 'completed', request_revision: 'in_progress', cancel: 'cancelled' }
    return HttpResponse.json({ ...b, current_status: statusMap[body.action_type] ?? b.current_status, deliverable_url: body.deliverable_url ?? b.deliverable_url })
  }),
]
