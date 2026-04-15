import { http, HttpResponse } from 'msw'

const mockPosts = [
  {
    id: 'post-001',
    caption: '🎓 Bạn có biết rằng 78% Data Analyst ở Việt Nam đang học tự phát? Cùng Nedu xây lộ trình bài bản từ số 0!',
    reference_links: [{ url: 'https://nedu.vn', label: 'Trang chủ Nedu' }],
    current_status: 'approved',
    scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    published_at: null,
    author: { id: 'person-001', display_name: 'Mai Marketing', avatar_url: null },
    channels: [
      { code: 'tiktok', label: 'TikTok', color_hex: '#000000' },
      { code: 'facebook', label: 'Facebook', color_hex: '#1877F2' },
    ],
    campaign_id: 'campaign-001',
    campaign_title: 'Spring 2026 — Build Phase',
    media: [],
    latest_approval_note: null,
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'post-002',
    caption: 'Học viên Hoàng Nam sau 3 tháng học SQL tại Nedu đã tăng lương 40%. Câu chuyện thật từ cộng đồng!',
    reference_links: [],
    current_status: 'pending_review',
    scheduled_at: null,
    published_at: null,
    author: { id: 'person-001', display_name: 'Mai Marketing', avatar_url: null },
    channels: [{ code: 'facebook', label: 'Facebook', color_hex: '#1877F2' }],
    campaign_id: null,
    campaign_title: null,
    media: [],
    latest_approval_note: null,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'post-003',
    caption: 'Power BI trong 30 ngày — bạn có dám thử?',
    reference_links: [],
    current_status: 'draft',
    scheduled_at: null,
    published_at: null,
    author: { id: 'person-001', display_name: 'Mai Marketing', avatar_url: null },
    channels: [{ code: 'instagram', label: 'Instagram', color_hex: '#E1306C' }],
    campaign_id: null,
    campaign_title: null,
    media: [],
    latest_approval_note: null,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'post-004',
    caption: 'Lớp Data Analytics tháng 4 còn 3 suất cuối — đăng ký ngay!',
    reference_links: [],
    current_status: 'rejected',
    scheduled_at: null,
    published_at: null,
    author: { id: 'person-001', display_name: 'Mai Marketing', avatar_url: null },
    channels: [{ code: 'zalo', label: 'Zalo OA', color_hex: '#0068FF' }],
    campaign_id: 'campaign-001',
    campaign_title: 'Spring 2026 — Build Phase',
    media: [],
    latest_approval_note: 'Caption quá ngắn, cần thêm social proof và CTA rõ ràng hơn.',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
]

export const postHandlers = [
  http.get('/api/v1/marketing/posts', () => {
    return HttpResponse.json({
      data: mockPosts,
      meta: { total: 4, page: 1, per_page: 20, has_next: false, next_cursor: null },
    })
  }),

  http.post('/api/v1/marketing/posts', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json(
      {
        id: `post-${Date.now()}`,
        caption: body.caption,
        reference_links: body.reference_links ?? [],
        current_status: 'draft',
        scheduled_at: body.scheduled_at ?? null,
        published_at: null,
        author: { id: 'person-001', display_name: 'Mai Marketing', avatar_url: null },
        channels: [],
        campaign_id: body.campaign_id ?? null,
        campaign_title: null,
        media: [],
        latest_approval_note: null,
        created_at: new Date().toISOString(),
      },
      { status: 201 },
    )
  }),

  http.get('/api/v1/marketing/posts/:post_id', ({ params }) => {
    const post = mockPosts.find((p) => p.id === params.post_id) ?? mockPosts[0]
    return HttpResponse.json({
      ...post,
      approval_history: [
        {
          event_type: 'submitted_for_review',
          actor_name: 'Mai Marketing',
          notes: null,
          created_at: post.created_at,
        },
      ],
    })
  }),

  http.patch('/api/v1/marketing/posts/:post_id', async ({ request, params }) => {
    const body = await request.json() as Record<string, unknown>
    const post = mockPosts.find((p) => p.id === params.post_id) ?? mockPosts[0]
    return HttpResponse.json({ ...post, ...body })
  }),

  http.post('/api/v1/marketing/posts/:post_id/actions', async ({ request, params }) => {
    const body = await request.json() as { action_type: string; notes?: string; scheduled_at?: string }
    const post = mockPosts.find((p) => p.id === params.post_id) ?? mockPosts[0]
    const statusMap: Record<string, string> = {
      submit_review: 'pending_review',
      approve: 'approved',
      reject: 'rejected',
      schedule: 'scheduled',
    }
    return HttpResponse.json({
      ...post,
      current_status: statusMap[body.action_type] ?? post.current_status,
      latest_approval_note: body.notes ?? post.latest_approval_note,
      scheduled_at: body.scheduled_at ?? post.scheduled_at,
      side_effects: { notifications_queued: [] },
    })
  }),
]
