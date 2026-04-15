import { http, HttpResponse } from 'msw'

const author = { id: 'person-leader', display_name: 'Hue Co-Leader', avatar_url: null }

const mockCampaigns = [
  { id: 'camp-1', title: 'Khai giảng tháng 5 — SQL Bootcamp', description: 'Chiến dịch chính tháng 5 cho khoá SQL', current_phase: 'build', start_date: '2026-05-01', end_date: '2026-05-31', created_by: author, post_counts: { total: 12, published: 4, scheduled: 3, draft: 5 }, created_at: '2026-04-01T00:00:00Z' },
  { id: 'camp-2', title: 'Power BI tháng 4', description: null, current_phase: 'cta', start_date: '2026-04-01', end_date: '2026-04-30', created_by: author, post_counts: { total: 20, published: 16, scheduled: 2, draft: 2 }, created_at: '2026-03-25T00:00:00Z' },
  { id: 'camp-3', title: 'Brand Awareness Q1', description: 'Nâng cao nhận thức thương hiệu Q1', current_phase: 'completed', start_date: '2026-01-01', end_date: '2026-03-31', created_by: author, post_counts: { total: 45, published: 45, scheduled: 0, draft: 0 }, created_at: '2025-12-20T00:00:00Z' },
  { id: 'camp-4', title: 'Data Analytics Summer', description: 'Chiến dịch hè cho Data Analytics', current_phase: 'opening', start_date: '2026-06-01', end_date: '2026-07-31', created_by: author, post_counts: { total: 2, published: 0, scheduled: 0, draft: 2 }, created_at: '2026-04-10T00:00:00Z' },
  { id: 'camp-5', title: 'Testimonial Series', description: 'Series câu chuyện học viên', current_phase: 'close', start_date: '2026-04-15', end_date: '2026-04-25', created_by: author, post_counts: { total: 8, published: 5, scheduled: 2, draft: 1 }, created_at: '2026-04-05T00:00:00Z' },
]

export const campaignHandlers = [
  http.get('/api/v1/marketing/campaigns', () => {
    return HttpResponse.json({ data: mockCampaigns, meta: { total: 5, page: 1, per_page: 20, has_next: false, next_cursor: null } })
  }),

  http.post('/api/v1/marketing/campaigns', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({ id: `camp-${Date.now()}`, ...body, current_phase: 'opening', created_by: author, post_counts: { total: 0, published: 0, scheduled: 0, draft: 0 }, created_at: new Date().toISOString() }, { status: 201 })
  }),

  http.get('/api/v1/marketing/campaigns/:id', ({ params }) => {
    const c = mockCampaigns.find(c => c.id === params.id) ?? mockCampaigns[0]
    return HttpResponse.json({ ...c, posts: [] })
  }),

  http.patch('/api/v1/marketing/campaigns/:id/phase', async ({ request, params }) => {
    const body = await request.json() as { new_phase: string }
    const c = mockCampaigns.find(c => c.id === params.id) ?? mockCampaigns[0]
    return HttpResponse.json({ ...c, current_phase: body.new_phase })
  }),
]
