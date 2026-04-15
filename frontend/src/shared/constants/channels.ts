export interface Channel {
  code: string
  label: string
  color_hex: string
}

export const CHANNELS_FALLBACK: Channel[] = [
  { code: 'facebook', label: 'Facebook', color_hex: '#1877F2' },
  { code: 'instagram', label: 'Instagram', color_hex: '#E1306C' },
  { code: 'tiktok', label: 'TikTok', color_hex: '#010101' },
  { code: 'youtube', label: 'YouTube', color_hex: '#FF0000' },
  { code: 'zalo', label: 'Zalo', color_hex: '#0068FF' },
  { code: 'website', label: 'Website', color_hex: '#1B4332' },
]
