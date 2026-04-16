import { http, HttpResponse } from 'msw'

// ── Nhân vật từ HTML prototype ────────────────────────────────────────────────
const HUONG   = { id: 'person-huong',  display_name: 'Nguyễn Thị Hương',  avatar_url: null } // Content
const MINH    = { id: 'person-minh',   display_name: 'Trần Văn Minh',      avatar_url: null } // Designer
const TU      = { id: 'person-tu',     display_name: 'Lê Thị Tú',          avatar_url: null } // Designer
const KHOA    = { id: 'person-khoa',   display_name: 'Anh Khoa',           avatar_url: null } // Editor
const THAO    = { id: 'person-thao',   display_name: 'Thảo',               avatar_url: null } // Editor

// ── 3 briefs từ HTML: br001, br002, br003 ─────────────────────────────────────

const mockBriefs = [
  // br001 — Cover BaZi T4 TikTok 9:16 (urgent)
  {
    id: 'brief-001',
    brief_type_code: 'design',
    brief_type_label: 'Thiết kế',
    title: 'Cover BaZi T4 · TikTok 9:16',
    description: 'Thumbnail/cover cho series BaZi tháng 4. Format dọc 9:16 cho TikTok. Màu chủ đạo xanh đậm + vàng gold. Có chữ "BaZi 2026" nổi bật và ảnh NhiLe.',
    size_format: '1080x1920 (9:16)',
    deadline: '2026-04-08T18:00:00+07:00',
    current_status: 'in_progress',
    deliverable_url: null,
    requested_by: HUONG,
    assigned_to: MINH,
    post_id: 'post-002',
    file_mb: 2.4,
    priority: 'urgent',
    created_at: '2026-04-06T10:00:00Z',
  },
  // br002 — Instagram Story template
  {
    id: 'brief-002',
    brief_type_code: 'design',
    brief_type_label: 'Thiết kế',
    title: 'Story Instagram series Retreat Đà Lạt',
    description: '5 story templates cho series Retreat Đà Lạt T5. Tone: nature, calm, mindful. Palette: xanh lá nhạt + kem. Font: Cormorant Garamond.',
    size_format: '1080x1920',
    deadline: '2026-04-09T18:00:00+07:00',
    current_status: 'submitted',
    deliverable_url: null,
    requested_by: HUONG,
    assigned_to: TU,
    post_id: null,
    file_mb: null,
    priority: 'normal',
    created_at: '2026-04-07T08:00:00Z',
  },
  // br003 — Thumbnail YouTube BaZi 2026 (đã xong)
  {
    id: 'brief-003',
    brief_type_code: 'design',
    brief_type_label: 'Thiết kế',
    title: 'Thumbnail YouTube · BaZi 2026',
    description: 'Thumbnail 1280x720 cho video "BaZi & Nedu Ứng dụng thực tế". Tông màu tối, text "BẠN ĐÃ BIẾT VẬN MỆNH CÓ THỂ ĐỌC ĐƯỢC KHÔNG?" nổi bật.',
    size_format: '1280x720 (16:9)',
    deadline: '2026-04-05T18:00:00+07:00',
    current_status: 'completed',
    deliverable_url: 'https://drive.google.com/file/bazi-yt-thumb-final',
    requested_by: HUONG,
    assigned_to: MINH,
    post_id: 'post-008',
    file_mb: 1.8,
    priority: 'normal',
    created_at: '2026-04-03T09:00:00Z',
  },
  // br004 — Reels dựng video LCM story
  {
    id: 'brief-004',
    brief_type_code: 'video_editing',
    brief_type_label: 'Dựng video',
    title: 'Reels TikTok/IG · Story GM 34 tuổi',
    description: 'Dựng Reels 60 giây từ raw interview của học viên Võ Thị Mai Hương. Format 9:16. Subtitle tiếng Việt. Nhạc nền: lo-fi emotional. Cut theo cảm xúc.',
    size_format: '1080x1920 (9:16)',
    deadline: '2026-04-11T18:00:00+07:00',
    current_status: 'review',
    deliverable_url: 'https://drive.google.com/file/story-reels-v1',
    requested_by: HUONG,
    assigned_to: KHOA,
    post_id: 'post-004',
    file_mb: 128.5,
    priority: 'normal',
    created_at: '2026-04-05T14:00:00Z',
  },
  // br005 — YouTube video Founder mindset
  {
    id: 'brief-005',
    brief_type_code: 'video_editing',
    brief_type_label: 'Dựng video',
    title: 'YouTube 20min · BaZi Ứng Dụng Kinh Doanh',
    description: 'Dựng video dài 20-25 phút cho YouTube từ raw footage quay tại văn phòng. Intro + outro animation. Chapters. Subtitle. Màu LUT: warm cinematic.',
    size_format: '1920x1080 (16:9)',
    deadline: '2026-04-16T18:00:00+07:00',
    current_status: 'submitted',
    deliverable_url: null,
    requested_by: HUONG,
    assigned_to: THAO,
    post_id: 'post-008',
    file_mb: null,
    priority: 'normal',
    created_at: '2026-04-07T11:00:00Z',
  },
]

export const briefHandlers = [
  http.get('/api/v1/marketing/briefs', () => {
    return HttpResponse.json({
      data: mockBriefs,
      meta: { total: mockBriefs.length, page: 1, per_page: 20, has_next: false, next_cursor: null },
    })
  }),

  http.post('/api/v1/marketing/briefs', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id: `brief-${Date.now()}`,
      ...body,
      brief_type_label: body.brief_type_code === 'design' ? 'Thiết kế' : 'Dựng video',
      current_status: 'submitted',
      deliverable_url: null,
      requested_by: HUONG,
      assigned_to: null,
      post_id: null,
      file_mb: null,
      priority: 'normal',
      created_at: new Date().toISOString(),
    }, { status: 201 })
  }),

  http.get('/api/v1/marketing/briefs/:id', ({ params }) => {
    const b = mockBriefs.find(b => b.id === params.id) ?? mockBriefs[0]
    return HttpResponse.json({
      ...b,
      status_history: [
        { event_type: 'submitted', actor_name: b.requested_by.display_name, notes: null, created_at: b.created_at },
        ...(b.current_status !== 'submitted'
          ? [{ event_type: 'acknowledged', actor_name: b.assigned_to?.display_name ?? 'Designer', notes: 'Đã nhận, đang thực hiện', created_at: new Date(new Date(b.created_at).getTime() + 3600000).toISOString() }]
          : []),
        ...(b.current_status === 'completed'
          ? [{ event_type: 'completed', actor_name: b.assigned_to?.display_name ?? 'Designer', notes: 'Đã hoàn thành và upload lên Drive', created_at: b.deadline }]
          : []),
      ],
    })
  }),

  http.post('/api/v1/marketing/briefs/:id/actions', async ({ request, params }) => {
    const body = await request.json() as { action_type: string; deliverable_url?: string; notes?: string }
    const b = mockBriefs.find(b => b.id === params.id) ?? mockBriefs[0]
    const statusMap: Record<string, string> = {
      acknowledge: 'in_progress',
      deliver: 'review',
      complete: 'completed',
      request_revision: 'in_progress',
      cancel: 'cancelled',
    }
    return HttpResponse.json({
      ...b,
      current_status: statusMap[body.action_type] ?? b.current_status,
      deliverable_url: body.deliverable_url ?? b.deliverable_url,
    })
  }),
]
