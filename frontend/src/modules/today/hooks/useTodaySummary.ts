import { useQuery } from '@tanstack/react-query'
import { todayService } from '../services/today.service'

export function useTodaySummary() {
  return useQuery({
    queryKey: ['today', 'summary'],
    queryFn: todayService.getSummary,
    refetchInterval: 60_000,
  })
}
