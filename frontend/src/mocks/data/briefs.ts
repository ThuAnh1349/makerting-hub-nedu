// src/mocks/data/briefs.ts
import type { Brief } from '@modules/briefs/types'
import { MOCK_PERSONS } from './persons'

export const MOCK_BRIEFS: Brief[] = [
  {
    id: 'brief-0001-aaaa-bbbb-cccc-dddddddddddd',
    person_id: MOCK_PERSONS[3].id,
    brief_type: 'design',
    description: 'Banner Facebook quảng bá khóa học Spring 2026 — tone màu xanh emerald, có CTA "Đăng ký ngay"',
    dimensions: '1200x628px + 1080x1080px',
    deadline: '2026-04-09T17:00:00.000Z',
    status: 'in_progress',
    created_at: '2026-04-07T08:00:00.000Z',
    updated_at: '2026-04-07T08:00:00.000Z',
  },
  {
    id: 'brief-0002-aaaa-bbbb-cccc-dddddddddddd',
    person_id: MOCK_PERSONS[3].id,
    brief_type: 'editing',
    description: 'Edit video testimonial học viên Leadership tháng 4 — cut 10 phút, thêm caption tiếng Việt',
    editing_format: 'youtube',
    deadline: '2026-04-10T17:00:00.000Z',
    status: 'pending',
    created_at: '2026-04-07T09:00:00.000Z',
    updated_at: '2026-04-07T09:00:00.000Z',
  },
  {
    id: 'brief-0003-aaaa-bbbb-cccc-dddddddddddd',
    person_id: MOCK_PERSONS[1].id,
    brief_type: 'design',
    description: 'Story Instagram — template 5 slides giới thiệu lịch khai giảng tháng 5',
    dimensions: '1080x1920px',
    deadline: '2026-04-08T12:00:00.000Z',
    status: 'done',
    deliverable_url: 'https://drive.google.com/file/d/brief-done-001',
    created_at: '2026-04-05T10:00:00.000Z',
    updated_at: '2026-04-07T11:00:00.000Z',
  },
]
