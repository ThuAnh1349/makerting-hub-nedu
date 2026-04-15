import { http, HttpResponse } from 'msw'

const now = new Date()

function makePost(id: string, dayOffset: number, hour: number, channelIdx: number, status: 'approved' | 'scheduled' | 'published') {
  const channels = [
    { code: 'facebook', label: 'Facebook', color_hex: '#1877F2' },
    { code: 'tiktok', label: 'TikTok', color_hex: '#000000' },
    { code: 'youtube', label: 'YouTube', color_hex: '#FF0000' },
    { code: 'instagram', label: 'Instagram', color_hex: '#E1306C' },
    { code: 'zalo', label: 'Zalo OA', color_hex: '#0068FF' },
  ]
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour, 0, 0)
  return {
    id,
    caption: `Bài đăng #${id} — Nedu Data Analytics Spring 2026`,
    current_status: status,
    scheduled_at: date.toISOString(),
    channels: [channels[channelIdx % channels.length]],
    author: { id: 'person-001', display_name: 'Mai Marketing', avatar_url: null },
    campaign_id: 'campaign-001',
    campaign_title: 'Spring 2026',
  }
}

export const calendarHandlers = [
  http.get('/api/v1/marketing/calendar', () => {
    return HttpResponse.json({
      data: [
        makePost('cal-1', -2, 9, 0, 'published'),
        makePost('cal-2', -1, 14, 1, 'published'),
        makePost('cal-3', 0, 10, 0, 'scheduled'),
        makePost('cal-4', 0, 17, 2, 'approved'),
        makePost('cal-5', 1, 9, 3, 'approved'),
        makePost('cal-6', 3, 8, 1, 'scheduled'),
        makePost('cal-7', 5, 11, 4, 'approved'),
        makePost('cal-8', 7, 14, 0, 'scheduled'),
        makePost('cal-9', 10, 9, 2, 'approved'),
      ],
    })
  }),
]
