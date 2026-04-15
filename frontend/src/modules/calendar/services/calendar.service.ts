import { apiClient } from '@/shared/config/api-client'
import type { CalendarPost } from '../calendar.types'

export const calendarService = {
  getPosts: (dateFrom: string, dateTo: string, channelCode?: string) => {
    const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo })
    if (channelCode) params.set('channel_code', channelCode)
    return apiClient.get<{ data: CalendarPost[] }>(`/api/v1/marketing/calendar?${params}`)
  },
}
