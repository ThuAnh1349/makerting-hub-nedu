import { useQuery } from '@tanstack/react-query'
import { calendarService } from '../services/calendar.service'
import type { CalendarDayMap, CalendarPost } from '../calendar.types'

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getMonthRange(year: number, month: number) {
  const dateFrom = new Date(year, month, 1)
  const dateTo = new Date(year, month + 1, 0) // last day of month
  return { dateFrom: toDateStr(dateFrom), dateTo: toDateStr(dateTo) }
}

export function useCalendarPosts(year: number, month: number, channelCode?: string) {
  const { dateFrom, dateTo } = getMonthRange(year, month)

  return useQuery({
    queryKey: ['calendar', year, month, channelCode],
    queryFn: async () => {
      const res = await calendarService.getPosts(dateFrom, dateTo, channelCode)
      const posts: CalendarPost[] = res.data ?? []

      // Group by date string
      const map: CalendarDayMap = {}
      for (const post of posts) {
        const day = post.scheduled_at.slice(0, 10)
        if (!map[day]) map[day] = []
        map[day].push(post)
      }
      return { posts, map }
    },
    staleTime: 60_000,
  })
}
