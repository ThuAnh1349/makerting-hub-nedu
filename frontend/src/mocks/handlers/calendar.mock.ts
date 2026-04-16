import { http, HttpResponse } from 'msw'

const STAFF  = { id: 'person-huong', display_name: 'Nguyễn Thị Hương', avatar_url: null }
const LEADER = { id: 'person-hue',   display_name: 'Huê Co-Leader',     avatar_url: null }

const FB  = { code: 'facebook',  label: 'Facebook',  color_hex: '#1877F2' }
const TT  = { code: 'tiktok',    label: 'TikTok',    color_hex: '#010101' }
const YT  = { code: 'youtube',   label: 'YouTube',   color_hex: '#FF0000' }
const IG  = { code: 'instagram', label: 'Instagram', color_hex: '#E1306C' }

// ── Lịch đăng bài T4/2026 từ HTML prototype ──────────────────────────────────

// Ngày cố định (dùng 2026-04 làm base)
function d(dateStr: string, hour = 10) {
  return `${dateStr}T${String(hour).padStart(2,'0')}:00:00+07:00`
}

const mockCalendarPosts = [
  // ── Đã đăng (published) ───────────────────────────────────────────────────
  {
    id: 'cal-p01',
    caption: 'NhiLe System — Giới thiệu toàn bộ framework vận hành cuộc đời 🌟',
    current_status: 'published',
    scheduled_at: d('2026-04-07', 10),
    channels: [YT],
    author: STAFF,
    campaign_id: 'camp-brand-q1',
    campaign_title: 'Brand Awareness Q1/2026',
  },
  {
    id: 'cal-p02',
    caption: 'Bạn đang sống cho ai? — Story viral từ học viên LCM Cohort 6 🥺',
    current_status: 'published',
    scheduled_at: d('2026-04-05', 19),
    channels: [TT],
    author: STAFF,
    campaign_id: 'camp-lcm7',
    campaign_title: 'LCM Cohort 7 Launch',
  },
  {
    id: 'cal-p03',
    caption: '3 lý do học phí Nedu không phải là đắt — so sánh ROI thực tế 💡',
    current_status: 'published',
    scheduled_at: d('2026-04-05', 9),
    channels: [FB],
    author: LEADER,
    campaign_id: 'camp-lcm7',
    campaign_title: 'LCM Cohort 7 Launch',
  },
  {
    id: 'cal-p04',
    caption: 'Behind-the-scenes khai giảng LCM Cohort 7 — Buổi đầu tiên 🎓',
    current_status: 'published',
    scheduled_at: d('2026-04-01', 20),
    channels: [YT],
    author: STAFF,
    campaign_id: 'camp-lcm7',
    campaign_title: 'LCM Cohort 7 Launch',
  },
  // ── Scheduled / Approved hôm nay ──────────────────────────────────────────
  {
    id: 'cal-s01',
    caption: 'Sao 8 #viral 2026 — Khoá học kinh dịch ứng dụng · Comment "SAO8" nhận tài liệu 🔮',
    current_status: 'approved',
    scheduled_at: d('2026-04-07', 14),
    channels: [TT],
    author: STAFF,
    campaign_id: 'camp-lcm7',
    campaign_title: 'LCM Cohort 7 Launch',
  },
  {
    id: 'cal-s02',
    caption: 'BaZi 2026 — Cơ hội vàng khai giảng tháng 4 · Chỉ còn 12 suất cuối! 📲 DM để đăng ký',
    current_status: 'scheduled',
    scheduled_at: d('2026-04-07', 18),
    channels: [FB],
    author: STAFF,
    campaign_id: 'camp-lcm7',
    campaign_title: 'LCM Cohort 7 Launch',
  },
  // ── Tuần này ──────────────────────────────────────────────────────────────
  {
    id: 'cal-s03',
    caption: 'Reels Nedu — Cảm nhận học viên sau 3 tháng học Là Chính Mình · "Lần đầu tôi khóc vì hạnh phúc" 🥺',
    current_status: 'pending_review',
    scheduled_at: d('2026-04-09', 9),
    channels: [IG],
    author: STAFF,
    campaign_id: 'camp-lcm7',
    campaign_title: 'LCM Cohort 7 Launch',
  },
  {
    id: 'cal-s04',
    caption: 'Tại sao cần rời môi trường để thay đổi? — NhiLe chia sẻ về Retreat Đà Lạt T5 🏔',
    current_status: 'scheduled',
    scheduled_at: d('2026-04-10', 20),
    channels: [YT],
    author: LEADER,
    campaign_id: 'camp-retreat',
    campaign_title: 'Retreat Đà Lạt T5/2026',
  },
  // ── Tuần tiếp theo ────────────────────────────────────────────────────────
  {
    id: 'cal-s05',
    caption: 'Founder mindset — Tại sao bạn cần dừng lại để bứt phá? 3 quyết định thay đổi 10 năm.',
    current_status: 'approved',
    scheduled_at: d('2026-04-11', 10),
    channels: [YT],
    author: LEADER,
    campaign_id: 'camp-retreat',
    campaign_title: 'Retreat Đà Lạt T5/2026',
  },
  {
    id: 'cal-s06',
    caption: 'Chỉ còn 8 chỗ · Deadline 12/04 · Nhắn LCM7 để giữ chỗ ngay 🔥',
    current_status: 'draft',
    scheduled_at: d('2026-04-12', 20),
    channels: [TT],
    author: STAFF,
    campaign_id: 'camp-lcm7',
    campaign_title: 'LCM Cohort 7 Launch',
  },
  {
    id: 'cal-s07',
    caption: 'Story Khoảnh khắc đêm thứ 3 Retreat — "Khi người đàn ông 40 tuổi khóc lần đầu trong đời" 🌙',
    current_status: 'draft',
    scheduled_at: d('2026-04-15', 21),
    channels: [TT],
    author: STAFF,
    campaign_id: 'camp-retreat',
    campaign_title: 'Retreat Đà Lạt T5/2026',
  },
  {
    id: 'cal-s08',
    caption: 'Chỉ còn 8 chỗ · 12/20 đã đăng ký Retreat Đà Lạt — Nhắn RETREAT để giữ chỗ',
    current_status: 'draft',
    scheduled_at: d('2026-04-15', 9),
    channels: [FB],
    author: LEADER,
    campaign_id: 'camp-retreat',
    campaign_title: 'Retreat Đà Lạt T5/2026',
  },
  {
    id: 'cal-s09',
    caption: 'BaZi & Nedu — Ứng dụng thực tế trong kinh doanh và đời sống 🌟 (20 phút)',
    current_status: 'draft',
    scheduled_at: d('2026-04-18', 10),
    channels: [YT],
    author: LEADER,
    campaign_id: 'camp-brand-q1',
    campaign_title: 'Brand Awareness Q1/2026',
  },
  {
    id: 'cal-s10',
    caption: '30 ngày thay đổi 30 năm không? — Giới thiệu 30 Days Challenge T5/2026 🚀',
    current_status: 'draft',
    scheduled_at: d('2026-04-22', 19),
    channels: [TT],
    author: STAFF,
    campaign_id: 'camp-30days',
    campaign_title: '30 Days Challenge T5/2026',
  },
]

export const calendarHandlers = [
  http.get('/api/v1/marketing/calendar', ({ request }) => {
    const url = new URL(request.url)
    const dateFrom = url.searchParams.get('date_from')
    const dateTo   = url.searchParams.get('date_to')
    const channel  = url.searchParams.get('channel_code')

    let posts = mockCalendarPosts

    if (dateFrom) {
      posts = posts.filter(p => p.scheduled_at >= dateFrom)
    }
    if (dateTo) {
      posts = posts.filter(p => p.scheduled_at <= dateTo + 'T23:59:59+07:00')
    }
    if (channel) {
      posts = posts.filter(p => p.channels.some(c => c.code === channel))
    }

    return HttpResponse.json({ data: posts })
  }),
]
