import { http, HttpResponse } from 'msw'

const STAFF = { id: 'person-huong', display_name: 'Nguyễn Thị Hương', avatar_url: null }
const LEADER = { id: 'person-hue', display_name: 'Huê Co-Leader', avatar_url: null }

const FB  = { code: 'facebook',  label: 'Facebook',  color_hex: '#1877F2' }
const TT  = { code: 'tiktok',    label: 'TikTok',    color_hex: '#010101' }
const YT  = { code: 'youtube',   label: 'YouTube',   color_hex: '#FF0000' }
const IG  = { code: 'instagram', label: 'Instagram', color_hex: '#E1306C' }

const mockPosts = [
  // ── Posted today ────────────────────────────────────────────────────────────
  {
    id: 'post-001',
    caption: 'NhiLe System — Hệ thống vận hành cuộc đời bạn 🌟 Giới thiệu toàn bộ framework Nedu đang dùng để coaching hơn 2.000 học viên.',
    reference_links: [{ url: 'https://nedu.vn', label: 'Nedu.vn' }],
    current_status: 'published',
    scheduled_at: '2026-04-07T10:00:00+07:00',
    published_at: '2026-04-07T10:02:00+07:00',
    author: STAFF,
    channels: [YT],
    campaign_id: 'camp-brand-q1',
    campaign_title: 'Brand Awareness Q1',
    media: [],
    latest_approval_note: null,
    created_at: '2026-04-05T09:00:00Z',
  },
  // ── Scheduled today ──────────────────────────────────────────────────────────
  {
    id: 'post-002',
    caption: 'Sao 8 — Khoá học kinh dịch ứng dụng 2026 🔮 Bạn đã biết Sao 8 có thể giúp bạn ra quyết định kinh doanh chính xác hơn?\n\n👉 Comment "SAO8" để nhận tài liệu miễn phí',
    reference_links: [],
    current_status: 'approved',
    scheduled_at: '2026-04-07T14:00:00+07:00',
    published_at: null,
    author: STAFF,
    channels: [TT],
    campaign_id: 'camp-lcm7',
    campaign_title: 'LCM Cohort 7 Launch',
    media: [],
    latest_approval_note: null,
    created_at: '2026-04-06T14:00:00Z',
  },
  {
    id: 'post-003',
    caption: 'BaZi 2026 — Đọc vận mệnh hay định hướng cuộc đời? ✨\n\nCơ hội vàng khai giảng tháng 4 — chỉ còn 12 suất cuối!\n\n📲 DM để đăng ký · Link bio',
    reference_links: [{ url: 'https://nedu.vn/bazi', label: 'Đăng ký BaZi 2026' }],
    current_status: 'scheduled',
    scheduled_at: '2026-04-07T18:00:00+07:00',
    published_at: null,
    author: STAFF,
    channels: [FB],
    campaign_id: 'camp-lcm7',
    campaign_title: 'LCM Cohort 7 Launch',
    media: [],
    latest_approval_note: null,
    created_at: '2026-04-06T10:00:00Z',
  },
  // ── Pending review ───────────────────────────────────────────────────────────
  {
    id: 'post-004',
    caption: 'Reels Nedu — Khi học viên chia sẻ cảm nhận sau 3 tháng học Là Chính Mình 🥺💚\n\n"Lần đầu tiên trong 34 năm, tôi khóc vì hạnh phúc chứ không phải vì đau"\n\n#NeduVietnam #LàChínhMình',
    reference_links: [],
    current_status: 'pending_review',
    scheduled_at: '2026-04-09T09:00:00+07:00',
    published_at: null,
    author: STAFF,
    channels: [IG],
    campaign_id: 'camp-lcm7',
    campaign_title: 'LCM Cohort 7 Launch',
    media: [],
    latest_approval_note: null,
    created_at: '2026-04-07T08:00:00Z',
  },
  {
    id: 'post-005',
    caption: 'Founder mindset — Tại sao bạn cần dừng lại để bứt phá?\n\n3 quyết định đúng thay đổi 10 năm. NhiLe chia sẻ hành trình từ startup thất bại đến 2.000 học viên.',
    reference_links: [],
    current_status: 'pending_review',
    scheduled_at: '2026-04-11T10:00:00+07:00',
    published_at: null,
    author: LEADER,
    channels: [YT],
    campaign_id: 'camp-retreat',
    campaign_title: 'Retreat Đà Lạt T5/2026',
    media: [],
    latest_approval_note: null,
    created_at: '2026-04-07T07:00:00Z',
  },
  // ── Drafts ───────────────────────────────────────────────────────────────────
  {
    id: 'post-006',
    caption: 'Duet trend TikTok — Bạn đang sống cho ai? 🤔\n\nCau hoi nay da thay doi cuoc doi cua 200+ hoc vien Nedu.\n\n👇 Duet voi video nay va ke cho chung minh nghe!',
    reference_links: [],
    current_status: 'draft',
    scheduled_at: '2026-04-12T20:00:00+07:00',
    published_at: null,
    author: STAFF,
    channels: [TT],
    campaign_id: 'camp-lcm7',
    campaign_title: 'LCM Cohort 7 Launch',
    media: [],
    latest_approval_note: null,
    created_at: '2026-04-07T06:00:00Z',
  },
  {
    id: 'post-007',
    caption: 'Tips team building cho HR và Founder 💼\n\n5 cách Nedu đang dùng để build team gắn kết — không cần offsite đắt tiền.',
    reference_links: [],
    current_status: 'draft',
    scheduled_at: '2026-04-15T09:00:00+07:00',
    published_at: null,
    author: STAFF,
    channels: [FB],
    campaign_id: null,
    campaign_title: null,
    media: [],
    latest_approval_note: null,
    created_at: '2026-04-06T16:00:00Z',
  },
  {
    id: 'post-008',
    caption: 'BaZi & Nedu — Ứng dụng thực tế trong kinh doanh và đời sống 🌟\n\nVideo dài 20 phút — NhiLe giải thích cách dùng BaZi để chọn thời điểm ra quyết định.',
    reference_links: [{ url: 'https://nedu.vn/bazi-ung-dung', label: 'Xem thêm' }],
    current_status: 'draft',
    scheduled_at: '2026-04-18T10:00:00+07:00',
    published_at: null,
    author: LEADER,
    channels: [YT],
    campaign_id: 'camp-brand-q1',
    campaign_title: 'Brand Awareness Q1',
    media: [],
    latest_approval_note: null,
    created_at: '2026-04-05T11:00:00Z',
  },
  // ── Rejected ─────────────────────────────────────────────────────────────────
  {
    id: 'post-009',
    caption: 'Chỉ còn 8 chỗ · Deadline 12/04 · Đăng ký ngay!',
    reference_links: [],
    current_status: 'rejected',
    scheduled_at: null,
    published_at: null,
    author: STAFF,
    channels: [FB, TT],
    campaign_id: 'camp-lcm7',
    campaign_title: 'LCM Cohort 7 Launch',
    media: [],
    latest_approval_note: 'Caption quá ngắn, thiếu context và social proof. Cần viết lại với câu chuyện cụ thể hơn.',
    created_at: '2026-04-04T10:00:00Z',
  },
]

export const postHandlers = [
  http.get('/api/v1/marketing/posts', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const filtered = status ? mockPosts.filter(p => p.current_status === status) : mockPosts
    return HttpResponse.json({
      data: filtered,
      meta: { total: filtered.length, page: 1, per_page: 20, has_next: false, next_cursor: null },
    })
  }),

  http.post('/api/v1/marketing/posts', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id: `post-${Date.now()}`,
      caption: body.caption,
      reference_links: body.reference_links ?? [],
      current_status: 'draft',
      scheduled_at: body.scheduled_at ?? null,
      published_at: null,
      author: STAFF,
      channels: [],
      campaign_id: body.campaign_id ?? null,
      campaign_title: null,
      media: [],
      latest_approval_note: null,
      created_at: new Date().toISOString(),
    }, { status: 201 })
  }),

  http.get('/api/v1/marketing/posts/:post_id', ({ params }) => {
    const post = mockPosts.find(p => p.id === params.post_id) ?? mockPosts[0]
    return HttpResponse.json({
      ...post,
      approval_history: [
        { event_type: 'created', actor_name: post.author.display_name, notes: null, created_at: post.created_at },
        ...(post.current_status !== 'draft' ? [{ event_type: 'submitted_for_review', actor_name: post.author.display_name, notes: null, created_at: post.created_at }] : []),
        ...(post.latest_approval_note ? [{ event_type: 'rejected', actor_name: 'Huê Co-Leader', notes: post.latest_approval_note, created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() }] : []),
      ],
    })
  }),

  http.patch('/api/v1/marketing/posts/:post_id', async ({ request, params }) => {
    const body = await request.json() as Record<string, unknown>
    const post = mockPosts.find(p => p.id === params.post_id) ?? mockPosts[0]
    return HttpResponse.json({ ...post, ...body })
  }),

  http.post('/api/v1/marketing/posts/:post_id/actions', async ({ request, params }) => {
    const body = await request.json() as { action_type: string; notes?: string; scheduled_at?: string }
    const post = mockPosts.find(p => p.id === params.post_id) ?? mockPosts[0]
    const statusMap: Record<string, string> = {
      submit_review: 'pending_review',
      approve: 'approved',
      reject: 'rejected',
      schedule: 'scheduled',
      publish: 'published',
    }
    return HttpResponse.json({
      ...post,
      current_status: statusMap[body.action_type] ?? post.current_status,
      latest_approval_note: body.notes ?? post.latest_approval_note,
      scheduled_at: body.scheduled_at ?? post.scheduled_at,
    })
  }),
]
