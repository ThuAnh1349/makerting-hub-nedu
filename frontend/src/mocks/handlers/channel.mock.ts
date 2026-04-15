import { http, HttpResponse } from 'msw'

const channels = [
  { id: 'ch-fb', code: 'facebook', label: 'Facebook', color_hex: '#1877F2', icon_name: 'facebook', platform: 'meta', is_active: true },
  { id: 'ch-tt', code: 'tiktok', label: 'TikTok', color_hex: '#000000', icon_name: 'tiktok', platform: 'tiktok', is_active: true },
  { id: 'ch-yt', code: 'youtube', label: 'YouTube', color_hex: '#FF0000', icon_name: 'youtube', platform: 'google', is_active: true },
  { id: 'ch-ig', code: 'instagram', label: 'Instagram', color_hex: '#E1306C', icon_name: 'instagram', platform: 'meta', is_active: true },
  { id: 'ch-zl', code: 'zalo', label: 'Zalo OA', color_hex: '#0068FF', icon_name: 'zalo', platform: 'zalo', is_active: true },
  { id: 'ch-gg', code: 'google', label: 'Google', color_hex: '#4285F4', icon_name: 'google', platform: 'google', is_active: true },
]

export const channelHandlers = [
  http.get('/api/v1/marketing/channels', () => {
    return HttpResponse.json({ data: channels })
  }),
]
