import { http, HttpResponse } from 'msw'

const LEADER = { id: 'person-hue', display_name: 'Huê Co-Leader', avatar_url: null }

// ── 4 chiến dịch từ HTML prototype ────────────────────────────────────────────

const mockCampaigns = [
  {
    id: 'camp-lcm7',
    title: 'LCM Cohort 7 Launch',
    description: 'Chiến dịch ra mắt khoá Là Chính Mình Cohort 7 — mục tiêu 30 học viên, deadline 12/04',
    current_phase: 'cta',
    start_date: '2026-03-24',
    end_date: '2026-04-14',
    budget_vnd: 8_000_000,
    spend_vnd: 4_200_000,
    reach_total: 142000,
    lead_count: 23,
    cpl_actual: 183_000,
    created_by: LEADER,
    post_counts: { total: 7, published: 4, scheduled: 2, draft: 1 },
    created_at: '2026-03-20T00:00:00Z',
  },
  {
    id: 'camp-retreat',
    title: 'Retreat Đà Lạt T5/2026',
    description: '9 ngày retreat chuyển hoá tại Đà Lạt — mục tiêu 20 người · 12/20 đã đặt chỗ',
    current_phase: 'build',
    start_date: '2026-04-01',
    end_date: '2026-04-28',
    budget_vnd: 12_000_000,
    spend_vnd: 2_800_000,
    reach_total: 67000,
    lead_count: 11,
    cpl_actual: 255_000,
    created_by: LEADER,
    post_counts: { total: 6, published: 2, scheduled: 2, draft: 2 },
    created_at: '2026-03-28T00:00:00Z',
  },
  {
    id: 'camp-brand-q1',
    title: 'Brand Awareness Q1/2026',
    description: 'Nâng cao nhận thức thương hiệu Nedu — "Bạn đang sống cho ai?" series viral',
    current_phase: 'completed',
    start_date: '2026-01-06',
    end_date: '2026-02-28',
    budget_vnd: 5_000_000,
    spend_vnd: 4_800_000,
    reach_total: 1_340_000,
    lead_count: 34,
    cpl_actual: 141_000,
    created_by: LEADER,
    post_counts: { total: 6, published: 6, scheduled: 0, draft: 0 },
    created_at: '2026-01-02T00:00:00Z',
  },
  {
    id: 'camp-30days',
    title: '30 Days Challenge T5/2026',
    description: '30 ngày thay đổi — challenge cộng đồng · 30 slots · early bird hết 01/05',
    current_phase: 'opening',
    start_date: '2026-04-15',
    end_date: '2026-05-10',
    budget_vnd: 4_000_000,
    spend_vnd: 0,
    reach_total: 0,
    lead_count: 0,
    cpl_actual: null,
    created_by: LEADER,
    post_counts: { total: 5, published: 0, scheduled: 0, draft: 5 },
    created_at: '2026-04-10T00:00:00Z',
  },
]

// ── Posts per campaign ─────────────────────────────────────────────────────────

const campPosts: Record<string, unknown[]> = {
  'camp-lcm7': [
    { id: 'cp-1', title: 'Bạn đang sống cho ai?', channel: 'TikTok', date: '24/03', views: '89K', status: 'published' },
    { id: 'cp-2', title: 'Dấu hiệu burnout mà không biết', channel: 'Facebook', date: '26/03', views: '34K', status: 'published' },
    { id: 'cp-3', title: 'Story: GM 34 tuổi khóc lần đầu', channel: 'TikTok', date: '28/03', views: '1.2M', status: 'published' },
    { id: 'cp-4', title: 'Behind-the-scenes khai giảng', channel: 'YouTube', date: '01/04', views: '12K', status: 'published' },
    { id: 'cp-5', title: '3 lý do học phí không phải đắt', channel: 'Facebook', date: '05/04', views: null, status: 'scheduled' },
    { id: 'cp-6', title: 'Chỉ còn 8 chỗ · Deadline 12/04', channel: 'TikTok', date: '08/04', views: null, status: 'scheduled' },
    { id: 'cp-7', title: '[CTA] Nhắn LCM7 giữ chỗ ngay', channel: 'All', date: '12/04', views: null, status: 'draft' },
  ],
  'camp-retreat': [
    { id: 'cr-1', title: 'Tại sao cần rời môi trường để thay đổi', channel: 'Instagram', date: '01/04', views: '28K', status: 'published' },
    { id: 'cr-2', title: '9 ngày Đà Lạt thay đổi 9 năm không?', channel: 'Facebook', date: '03/04', views: '19K', status: 'published' },
    { id: 'cr-3', title: 'Story: Khoảnh khắc đêm thứ 3', channel: 'TikTok', date: '07/04', views: null, status: 'scheduled' },
    { id: 'cr-4', title: 'Methodology: Retreat khác khoá online', channel: 'YouTube', date: '10/04', views: null, status: 'scheduled' },
    { id: 'cr-5', title: 'Chỉ còn 8 chỗ · 12/20 đã đăng ký', channel: 'All', date: '15/04', views: null, status: 'draft' },
    { id: 'cr-6', title: '[CTA] Nhắn RETREAT để giữ chỗ', channel: 'All', date: '20/04', views: null, status: 'draft' },
  ],
}

export const campaignHandlers = [
  http.get('/api/v1/marketing/campaigns', () => {
    return HttpResponse.json({
      data: mockCampaigns,
      meta: { total: mockCampaigns.length, page: 1, per_page: 20, has_next: false, next_cursor: null },
    })
  }),

  http.post('/api/v1/marketing/campaigns', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id: `camp-${Date.now()}`,
      ...body,
      current_phase: 'opening',
      spend_vnd: 0,
      reach_total: 0,
      lead_count: 0,
      cpl_actual: null,
      created_by: LEADER,
      post_counts: { total: 0, published: 0, scheduled: 0, draft: 0 },
      created_at: new Date().toISOString(),
    }, { status: 201 })
  }),

  http.get('/api/v1/marketing/campaigns/:id', ({ params }) => {
    const c = mockCampaigns.find(c => c.id === params.id) ?? mockCampaigns[0]
    return HttpResponse.json({ ...c, posts: campPosts[c.id] ?? [] })
  }),

  http.patch('/api/v1/marketing/campaigns/:id/phase', async ({ request, params }) => {
    const body = await request.json() as { new_phase: string }
    const c = mockCampaigns.find(c => c.id === params.id) ?? mockCampaigns[0]
    return HttpResponse.json({ ...c, current_phase: body.new_phase })
  }),
]
