// src/mocks/data/posts.ts
import type { Post } from '@modules/posts/types'
import { MOCK_PERSONS } from './persons'

export const MOCK_POSTS: Post[] = [
  // Happy path — bài đã đăng
  {
    id: 'post-0001-aaaa-bbbb-cccc-dddddddddddd',
    person_id: MOCK_PERSONS[3].id,
    caption: 'NhiLe System — Giới thiệu hệ thống học online Nedu',
    channels: ['youtube'],
    media_urls: ['https://cdn.nedu.vn/media/intro-video.mp4'],
    reference_links: [],
    status: 'posted',
    scheduled_at: '2026-04-07T10:00:00.000Z',
    created_at: '2026-04-06T08:00:00.000Z',
    updated_at: '2026-04-07T10:01:00.000Z',
  },
  // Pending review — bài chờ duyệt
  {
    id: 'post-0002-aaaa-bbbb-cccc-dddddddddddd',
    person_id: MOCK_PERSONS[3].id,
    caption: 'Sao 8 viral 2026 — tip nhỏ về tư duy phát triển bản thân',
    channels: ['tiktok'],
    media_urls: ['https://cdn.nedu.vn/media/sao8-tiktok.mp4'],
    reference_links: ['https://nedu.vn/blog/tu-duy'],
    status: 'pending_review',
    scheduled_at: '2026-04-07T14:00:00.000Z',
    created_at: '2026-04-06T15:00:00.000Z',
    updated_at: '2026-04-06T16:00:00.000Z',
  },
  // Rejected
  {
    id: 'post-0003-aaaa-bbbb-cccc-dddddddddddd',
    person_id: MOCK_PERSONS[3].id,
    caption: 'KHUYẾN MÃI GIẢM 50% ĐẶC BIỆT!!!',
    channels: ['facebook', 'instagram'],
    media_urls: [],
    reference_links: [],
    status: 'rejected',
    rejection_note: 'Giọng quá hoa mỹ, không đúng tone Nedu. Viết lại theo hướng "người thật chuyện thật".',
    reviewer_id: MOCK_PERSONS[2].id,
    reviewed_at: '2026-04-06T17:00:00.000Z',
    created_at: '2026-04-06T14:00:00.000Z',
    updated_at: '2026-04-06T17:00:00.000Z',
  },
  // Draft — Leader
  {
    id: 'post-0004-aaaa-bbbb-cccc-dddddddddddd',
    person_id: MOCK_PERSONS[1].id,
    caption: 'Câu chuyện học viên tháng 4 — Hành trình từ 0 đến leader',
    channels: ['facebook', 'blog'],
    media_urls: ['https://cdn.nedu.vn/media/testimonial-april.jpg'],
    reference_links: [],
    status: 'draft',
    created_at: '2026-04-07T09:00:00.000Z',
    updated_at: '2026-04-07T09:00:00.000Z',
  },
  // Edge — bài không có media
  {
    id: 'post-0005-aaaa-bbbb-cccc-dddddddddddd',
    person_id: MOCK_PERSONS[3].id,
    caption: 'Quick tip: 3 câu hỏi giúp bạn ra quyết định nhanh hơn',
    channels: ['facebook'],
    media_urls: [],
    reference_links: [],
    status: 'approved',
    reviewer_id: MOCK_PERSONS[2].id,
    reviewed_at: '2026-04-05T14:00:00.000Z',
    scheduled_at: '2026-04-08T08:00:00.000Z',
    created_at: '2026-04-05T10:00:00.000Z',
    updated_at: '2026-04-05T14:00:00.000Z',
  },
]
