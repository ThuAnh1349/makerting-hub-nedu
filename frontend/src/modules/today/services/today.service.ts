import { apiClient } from '@/shared/config/api-client'
import type { TodaySummary } from '../today.types'

export const todayService = {
  getSummary: () =>
    apiClient.get<TodaySummary>('/api/v1/marketing/today/summary'),
}
