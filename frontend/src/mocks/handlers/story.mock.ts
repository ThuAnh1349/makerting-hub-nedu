import { http, HttpResponse } from 'msw'
import type { Story } from '@/modules/story/story.types'

const STAFF  = { id: 'person-linh',  display_name: 'Phạm Thị Linh',  avatar_url: null }
const LEADER = { id: 'person-hue',   display_name: 'Huê Co-Leader',   avatar_url: null }

// ── Stories từ học viên thực của Nedu (BaZi, LCM, Retreat, Kinh Doanh…) ─────

const mockStories: Story[] = [
  // ── pending_review (4 mới) ────────────────────────────────────────────────
  {
    id: 'story-1',
    student_name: 'Nguyễn Thị Lan Anh',
    student_avatar_url: null,
    course_name: 'Là Chính Mình Cohort 6',
    pain_point:
      'Trước khi học LCM, tôi là marketing manager nhưng luôn cảm giác mình đang sống theo kỳ vọng của người khác. Mỗi sáng thức dậy đều nặng nề, không biết mình thực sự muốn gì.',
    transformation:
      'Sau 3 tháng học LCM, tôi từ bỏ chức vụ ổn định để theo đuổi con đường coaching. 6 tháng sau tôi có 15 client, thu nhập tăng 40% và quan trọng hơn — mỗi sáng tôi thức dậy với nụ cười.',
    icp_tags: ['burnout', 'career_change'],
    current_status: 'pending_review',
    deployed_to_campaigns: [],
    collected_by: STAFF,
    created_at: '2026-04-14T08:00:00Z',
  },
  {
    id: 'story-2',
    student_name: 'Phạm Minh Đức',
    student_avatar_url: null,
    course_name: 'BaZi 2026',
    pain_point:
      'Tôi là chủ doanh nghiệp SME, thường ra quyết định theo cảm tính và hay sai thời điểm. Năm 2024 tôi mở thêm chi nhánh đúng lúc thị trường xuống — lỗ gần 500 triệu.',
    transformation:
      'Sau khoá BaZi, tôi học cách đọc vận hành theo năm và tháng. Năm 2025 tôi đóng chi nhánh yếu, tập trung vào core — doanh thu tăng 60% so với cùng kỳ.',
    icp_tags: ['entrepreneur', 'salary_raise'],
    current_status: 'pending_review',
    deployed_to_campaigns: [],
    collected_by: LEADER,
    created_at: '2026-04-12T10:30:00Z',
  },
  {
    id: 'story-3',
    student_name: 'Trần Thị Bích Ngọc',
    student_avatar_url: null,
    course_name: 'Retreat Đà Lạt T3/2026',
    pain_point:
      'Sau 7 năm làm việc không nghỉ, tôi bị burnout hoàn toàn — không ngủ được, mất hứng thú với mọi thứ, ngay cả với gia đình. Bác sĩ cảnh báo nguy cơ trầm cảm.',
    transformation:
      '9 ngày retreat tại Đà Lạt là bước ngoặt thực sự. Tôi viết lại giá trị sống, đặt ranh giới với công việc và trở về với gia đình theo nghĩa đầy đủ nhất. 3 tháng sau tôi không còn dùng thuốc ngủ.',
    icp_tags: ['burnout', 'freelancer'],
    current_status: 'pending_review',
    deployed_to_campaigns: [],
    collected_by: STAFF,
    created_at: '2026-04-10T14:00:00Z',
  },
  {
    id: 'story-4',
    student_name: 'Lê Hoàng Nam',
    student_avatar_url: null,
    course_name: 'Kinh Doanh Theo Bản Năng',
    pain_point:
      'Tôi là freelancer 28 tuổi — kiếm được tiền nhưng không có hệ thống, khách đến không ổn định, tháng thì nhiều tháng thì không có gì. Thu nhập dao động khiến tôi rất lo lắng.',
    transformation:
      'Sau khoá KD, tôi build được hệ thống acquisition từ referral và LinkedIn. Từ $0 MRR lên $2K MRR trong 6 tháng. Bây giờ tôi có 3 retainer client ổn định mỗi tháng.',
    icp_tags: ['freelancer', 'entrepreneur'],
    current_status: 'pending_review',
    deployed_to_campaigns: [],
    collected_by: LEADER,
    created_at: '2026-04-08T09:15:00Z',
  },
  // ── approved ──────────────────────────────────────────────────────────────
  {
    id: 'story-5',
    student_name: 'Võ Thị Mai Hương',
    student_avatar_url: null,
    course_name: 'Là Chính Mình Cohort 5',
    pain_point:
      'Tôi là giáo viên 34 tuổi, cả đời sống theo kỳ vọng gia đình. Lần đầu tiên trong cuộc đời tôi khóc vì hạnh phúc chứ không phải vì mệt mỏi — đó là đêm thứ 3 của LCM.',
    transformation:
      'LCM cho tôi dũng cảm để sống thật. Tôi xin nghỉ dạy và mở studio dạy yoga — điều tôi mơ ước 10 năm. 1 năm sau studio đã có 80 học viên cố định.',
    icp_tags: ['career_change', 'burnout'],
    current_status: 'approved',
    deployed_to_campaigns: [],
    collected_by: STAFF,
    created_at: '2026-04-01T10:00:00Z',
  },
  {
    id: 'story-6',
    student_name: 'Nguyễn Hoàng Minh',
    student_avatar_url: null,
    course_name: 'Sao 8 Kinh Dịch 2025',
    pain_point:
      'Là founder startup, tôi hay ra quyết định vội vàng và cảm giác bị cuốn vào vòng xoáy vô tận mà không biết đang đi đúng hướng không.',
    transformation:
      'Sau khoá Sao 8, tôi có framework để nhìn chu kỳ dài hạn. Quyết định pause việc ra mắt sản phẩm mới vào Q3/2025 — thay vào đó focus strengthen core. Kết quả Q4 tăng 3x.',
    icp_tags: ['entrepreneur', 'manager'],
    current_status: 'approved',
    deployed_to_campaigns: [],
    collected_by: LEADER,
    created_at: '2026-03-28T14:00:00Z',
  },
  // ── deployed ──────────────────────────────────────────────────────────────
  {
    id: 'story-7',
    student_name: 'Đỗ Thị Thu Lan',
    student_avatar_url: null,
    course_name: 'Là Chính Mình Cohort 4',
    pain_point:
      'Sau 5 năm làm marketing "giỏi" nhưng trống rỗng bên trong, tôi không biết mình muốn gì. Sợ cả việc trả lời câu hỏi đơn giản: "Bạn thích gì?"',
    transformation:
      'LCM là hành trình đầu tiên tôi thực sự dừng lại và lắng nghe bản thân. Tôi tìm thấy niềm đam mê với phát triển con người và giờ là facilitator full-time — thu nhập không bằng trước nhưng hạnh phúc gấp nhiều lần.',
    icp_tags: ['burnout', 'career_change', 'job_seeker'],
    current_status: 'deployed',
    deployed_to_campaigns: [
      { campaign_id: 'camp-lcm7', campaign_title: 'LCM Cohort 7 Launch' },
      { campaign_id: 'camp-brand-q1', campaign_title: 'Brand Awareness Q1/2026' },
    ],
    collected_by: STAFF,
    created_at: '2026-03-15T14:00:00Z',
  },
  {
    id: 'story-8',
    student_name: 'Bùi Quang Huy',
    student_avatar_url: null,
    course_name: 'BaZi 2025',
    pain_point:
      'Tôi là kế toán trưởng nhưng luôn lo âu về tương lai — sợ mất việc, sợ không đủ tiền cho con học đại học, sợ không về hưu đúng lúc.',
    transformation:
      'BaZi dạy tôi cách nhìn chu kỳ vận hành. Hiểu rằng mỗi giai đoạn đều có mục đích riêng, tôi bớt lo lắng và tập trung vào hiện tại hơn. Con tôi nhận ra tôi đã thay đổi trước khi tôi nhận ra.',
    icp_tags: ['salary_raise', 'manager'],
    current_status: 'deployed',
    deployed_to_campaigns: [
      { campaign_id: 'camp-brand-q1', campaign_title: 'Brand Awareness Q1/2026' },
    ],
    collected_by: LEADER,
    created_at: '2026-03-01T11:00:00Z',
  },
]

export const storyHandlers = [
  http.get('/api/v1/marketing/stories', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const filtered = status ? mockStories.filter(s => s.current_status === status) : mockStories
    return HttpResponse.json(filtered)
  }),

  http.post('/api/v1/marketing/stories', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    const newStory: Story = {
      id: `story-${Date.now()}`,
      student_name: String(body.student_name ?? ''),
      student_avatar_url: null,
      course_name: String(body.course_name ?? ''),
      pain_point: String(body.pain_point ?? ''),
      transformation: String(body.transformation ?? ''),
      icp_tags: Array.isArray(body.icp_tags) ? (body.icp_tags as string[]) : [],
      current_status: 'pending_review',
      deployed_to_campaigns: [],
      collected_by: { id: 'person-current', display_name: 'Phạm Thị Linh', avatar_url: null },
      created_at: new Date().toISOString(),
    }
    mockStories.unshift(newStory)
    return HttpResponse.json(newStory, { status: 201 })
  }),

  http.post('/api/v1/marketing/stories/:id/actions', async ({ request, params }) => {
    const body = await request.json() as { action: string; campaign_id?: string }
    const story = mockStories.find(s => s.id === params.id)
    if (!story) return HttpResponse.json({ error: 'Not found' }, { status: 404 })

    if (body.action === 'approve') {
      story.current_status = 'approved'
    } else if (body.action === 'deploy' && body.campaign_id) {
      story.current_status = 'deployed'
      const campaign = mockCampaigns.find(c => c.id === body.campaign_id)
      if (campaign) {
        story.deployed_to_campaigns.push({ campaign_id: campaign.id, campaign_title: campaign.title })
      }
    }
    return HttpResponse.json(story)
  }),
]

// Export campaign list for deploy reference
const mockCampaigns = [
  { id: 'camp-lcm7',    title: 'LCM Cohort 7 Launch' },
  { id: 'camp-retreat', title: 'Retreat Đà Lạt T5/2026' },
  { id: 'camp-brand-q1',title: 'Brand Awareness Q1/2026' },
  { id: 'camp-30days',  title: '30 Days Challenge T5/2026' },
]
