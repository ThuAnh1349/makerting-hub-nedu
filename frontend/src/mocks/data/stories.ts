// src/mocks/data/stories.ts
import type { Story } from '@modules/stories/types'
import { MOCK_PERSONS } from './persons'

export const MOCK_STORIES: Story[] = [
  {
    id: 'story-0001-aaaa-bbbb-cccc-dddddddddddd',
    person_id: MOCK_PERSONS[3].id,
    learner_name: 'Học viên 01',
    course_name: 'Leadership Foundations',
    pain_point: 'Không biết cách quản lý team, hay bị conflict',
    transformation: 'Sau 3 tháng, tự tin lead team 8 người, giảm conflict 70%',
    icp_tags: ['team-leader', 'mid-career', 'female'],
    status: 'approved',
    created_at: '2026-04-01T00:00:00.000Z',
    updated_at: '2026-04-05T00:00:00.000Z',
  },
  {
    id: 'story-0002-aaaa-bbbb-cccc-dddddddddddd',
    person_id: MOCK_PERSONS[3].id,
    learner_name: 'Học viên 02',
    course_name: 'Personal Branding',
    pain_point: 'Không có chỗ đứng trên mạng xã hội, không ai biết đến',
    transformation: 'Tăng từ 200 lên 5000 followers, nhận được 2 job offer mới',
    icp_tags: ['freelancer', 'early-career'],
    status: 'pending',
    created_at: '2026-04-06T00:00:00.000Z',
    updated_at: '2026-04-06T00:00:00.000Z',
  },
  {
    id: 'story-0003-aaaa-bbbb-cccc-dddddddddddd',
    person_id: MOCK_PERSONS[1].id,
    learner_name: 'Học viên 03',
    course_name: 'Leadership Foundations',
    pain_point: 'Sợ nói trước đám đông, thiếu tự tin',
    transformation: 'Đã thuyết trình trước 100 người, được thăng chức trưởng phòng',
    icp_tags: ['team-leader', 'female'],
    status: 'deployed',
    deployed_campaign_id: 'camp-0001-aaaa-bbbb-cccc-dddddddddddd',
    created_at: '2026-03-20T00:00:00.000Z',
    updated_at: '2026-04-01T00:00:00.000Z',
  },
]
