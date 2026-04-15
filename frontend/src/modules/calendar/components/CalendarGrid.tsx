import PostSlot from './PostSlot'
import type { CalendarPost, CalendarDayMap } from '../calendar.types'

interface CalendarGridProps {
  year: number
  month: number
  dayMap: CalendarDayMap
  onDayClick: (date: Date) => void
  onPostClick: (post: CalendarPost) => void
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function CalendarGrid({ year, month, dayMap, onDayClick, onPostClick }: CalendarGridProps) {
  const today = new Date()
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())

  // First day of month (0=Sun…6=Sat), convert to Mon-based (0=Mon…6=Sun)
  const firstDay = new Date(year, month, 1).getDay()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Build grid cells (leading empty + days)
  const cells: Array<{ day: number | null }> = []
  for (let i = 0; i < startOffset; i++) cells.push({ day: null })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d })
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push({ day: null })

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {wd}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
        {cells.map((cell, idx) => {
          if (!cell.day) {
            return <div key={`empty-${idx}`} className="min-h-[100px] bg-gray-50" />
          }
          const dateStr = toDateStr(year, month, cell.day)
          const isToday = dateStr === todayStr
          const posts = dayMap[dateStr] ?? []
          const visible = posts.slice(0, 3)
          const overflow = posts.length - visible.length

          return (
            <div
              key={dateStr}
              className="min-h-[100px] p-1.5 cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => onDayClick(new Date(year, month, cell.day!))}
            >
              <div className="flex items-center justify-center mb-1">
                <span
                  className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-nedu-primary text-white' : 'text-gray-700'}`}
                >
                  {cell.day}
                </span>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                {visible.map((post) => (
                  <PostSlot key={post.id} post={post} onClick={() => onPostClick(post)} />
                ))}
                {overflow > 0 && (
                  <p className="text-xs text-gray-400 pl-1">+{overflow} bài nữa</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
