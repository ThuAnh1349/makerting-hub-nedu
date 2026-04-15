import { http, HttpResponse } from 'msw'
import type { Story } from '@/modules/story/story.types'

const collector = { id: 'person-staff-1', display_name: 'Minh Marketing', avatar_url: null }
const leaderCollector = { id: 'person-leader', display_name: 'Hue Co-Leader', avatar_url: null }

const mockStories: Story[] = [
  {
    id: 'story-1',
    student_name: 'Nguyễn Thị Lan',
    student_avatar_url: null,
    course_name: 'SQL for Data Analysis',
    pain_point:
      'Trước khi học, tôi làm kế toán nhưng mỗi lần cần báo cáo đều phải nhờ IT. Mất 3–5 ngày chờ đợi, rất bị động và không thể ra quyết định nhanh.',
    transformation:
      'Sau 6 tuần học SQL, tôi tự làm được báo cáo trong 30 phút. Sếp ấn tượng và tôi được tăng lương 15% sau 2 tháng.',
    icp_tags: ['salary_raise', 'career_change'],
    current_status: 'pending_review',
    deployed_to_campaigns: [],
    collected_by: collector,
    created_at: '2026-04-12T08:00:00Z',
  },
  {
    id: 'story-2',
    student_name: 'Trần Văn Hùng',
    student_avatar_url: null,
    course_name: 'Power BI Dashboard',
    pain_point:
      'Tôi là sales manager nhưng không biết dùng dữ liệu để theo dõi team. Excel cồng kềnh, mỗi tháng mất cả ngày làm báo cáo thủ công.',
    transformation:
      'Giờ tôi có dashboard real-time cho cả team. Meeting weekly hiệu quả hơn, team hiểu mục tiêu rõ hơn và revenue tháng 3 tăng 22%.',
    icp_tags: ['manager', 'salary_raise'],
    current_status: 'approved',
    deployed_to_campaigns: [],
    collected_by: leaderCollector,
    created_at: '2026-04-10T10:30:00Z',
  },
  {
    id: 'story-3',
    student_name: 'Lê Thị Thu',
    student_avatar_url: null,
    course_name: 'Python for Data',
    pain_point:
      'Bị burnout sau 5 năm làm marketing truyền thống. Muốn chuyển sang data nhưng không biết bắt đầu từ đâu, sợ quá muộn vì đã 30 tuổi.',
    transformation:
      'Chỉ sau 3 tháng, tôi chuyển sang vị trí Data Analyst với mức lương cao hơn 40%. Không bao giờ là quá muộn để bắt đầu!',
    icp_tags: ['burnout', 'career_change', 'job_seeker'],
    current_status: 'deployed',
    deployed_to_campaigns: [
      { campaign_id: 'camp-5', campaign_title: 'Testimonial Series' },
      { campaign_id: 'camp-2', campaign_title: 'Power BI tháng 4' },
    ],
    collected_by: collector,
    created_at: '2026-03-28T14:00:00Z',
  },
  {
    id: 'story-4',
    student_name: 'Phạm Minh Tuấn',
    student_avatar_url: null,
    course_name: 'SQL for Data Analysis',
    pain_point:
      'Là sinh viên năm 4, tôi không có kinh nghiệm thực tế và rất khó xin việc. Các nhà tuyển dụng đều yêu cầu biết SQL nhưng trường không dạy.',
    transformation:
      'Sau khoá học, tôi thêm SQL vào CV và được nhận vào vị trí Data Intern tại công ty startup. Đây là bước ngoặt lớn trong sự nghiệp.',
    icp_tags: ['student', 'job_seeker'],
    current_status: 'pending_review',
    deployed_to_campaigns: [],
    collected_by: leaderCollector,
    created_at: '2026-04-14T09:15:00Z',
  },
]

export const storyHandlers = [
  http.get('/api/v1/marketing/stories', () => {
    return HttpResponse.json(mockStories)
  }),

  http.post('/api/v1/marketing/stories', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    const newStory: Story = {
      id: `story-${Date.now()}`,
      student_name: String(body.student_name ?? ''),
      student_avatar_url: body.student_avatar_url ? String(body.student_avatar_url) : null,
      course_name: String(body.course_name ?? ''),
      pain_point: String(body.pain_point ?? ''),
      transformation: String(body.transformation ?? ''),
      icp_tags: Array.isArray(body.icp_tags) ? (body.icp_tags as string[]) : [],
      current_status: 'pending_review',
      deployed_to_campaigns: [],
      collected_by: { id: 'person-current', display_name: 'Current User', avatar_url: null },
      created_at: new Date().toISOString(),
    }
    mockStories.unshift(newStory)
    return HttpResponse.json(newStory, { status: 201 })
  }),

  http.post('/api/v1/marketing/stories/:id/actions', async ({ request, params }) => {
    const body = await request.json() as { action: string; campaign_id?: string }
    const story = mockStories.find((s) => s.id === params.id)
    if (!story) return HttpResponse.json({ error: 'Not found' }, { status: 404 })

    if (body.action === 'approve') {
      story.current_status = 'approved'
    } else if (body.action === 'deploy' && body.campaign_id) {
      story.current_status = 'deployed'
      const campaigns = [
        { id: 'camp-1', title: 'Khai giảng tháng 5 — SQL Bootcamp' },
        { id: 'camp-2', title: 'Power BI tháng 4' },
        { id: 'camp-4', title: 'Data Analytics Summer' },
        { id: 'camp-5', title: 'Testimonial Series' },
      ]
      const campaign = campaigns.find((c) => c.id === body.campaign_id)
      if (campaign) {
        story.deployed_to_campaigns.push({
          campaign_id: campaign.id,
          campaign_title: campaign.title,
        })
      }
    }

    return HttpResponse.json(story)
  }),
]
