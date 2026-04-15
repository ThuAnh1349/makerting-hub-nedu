import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PageLayout } from '@/shared/components/PageLayout'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { CHANNELS_FALLBACK } from '@/shared/constants/channels'
import { useCalendarPosts } from '../hooks/useCalendar'
import CalendarGrid from '../components/CalendarGrid'
import ScheduleModal from '../components/ScheduleModal'
import type { CalendarPost } from '../calendar.types'

const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
]

export function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [channelFilter, setChannelFilter] = useState<string | undefined>(undefined)
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null)
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useCalendarPosts(year, month, channelFilter)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  async function handleSchedule(postId: string, scheduledAt: string) {
    await fetch(`/api/v1/marketing/posts/${postId}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_type: 'schedule', scheduled_at: scheduledAt }),
    })
    queryClient.invalidateQueries({ queryKey: ['calendar', year, month] })
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  }

  return (
    <PageLayout
      title="Lịch đăng bài"
      actions={
        <Button size="sm" onClick={() => setScheduleDate(new Date())}>
          + Lên lịch
        </Button>
      }
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold text-gray-900 font-headline">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
        >
          →
        </button>
      </div>

      {/* Channel filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setChannelFilter(undefined)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
            ${!channelFilter ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
        >
          Tất cả kênh
        </button>
        {CHANNELS_FALLBACK.map((ch) => (
          <button
            key={ch.code}
            onClick={() => setChannelFilter(channelFilter === ch.code ? undefined : ch.code)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
              ${channelFilter === ch.code ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
            style={channelFilter === ch.code ? { backgroundColor: ch.color_hex, borderColor: ch.color_hex } : {}}
          >
            <span
              className="inline-block w-2 h-2 rounded-full mr-1"
              style={{ backgroundColor: ch.color_hex }}
            />
            {ch.label}
          </button>
        ))}
      </div>

      {/* Calendar */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton variant="card" />
        </div>
      ) : (
        <CalendarGrid
          year={year}
          month={month}
          dayMap={data?.map ?? {}}
          onDayClick={(date) => setScheduleDate(date)}
          onPostClick={(post) => setSelectedPost(post)}
        />
      )}

      {/* Schedule modal — new */}
      {scheduleDate && !selectedPost && (
        <ScheduleModal
          isOpen={true}
          onClose={() => setScheduleDate(null)}
          defaultDate={scheduleDate}
          onSchedule={handleSchedule}
          onCreateNew={(scheduledAt) => {
            console.log('Create new with scheduledAt:', scheduledAt)
            setScheduleDate(null)
          }}
        />
      )}

      {/* Post detail modal */}
      {selectedPost && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPost(null)}
          title="Chi tiết bài đăng"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1">
              {selectedPost.channels.map((ch) => (
                <span
                  key={ch.code}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white font-medium"
                  style={{ backgroundColor: ch.color_hex }}
                >
                  {ch.label}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">{selectedPost.caption}</p>
            <p className="text-xs text-gray-500">
              🕐 {new Date(selectedPost.scheduled_at).toLocaleString('vi-VN', {
                weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
              })}
            </p>
            <p className="text-xs text-gray-400">
              Tác giả: {selectedPost.author.display_name}
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setScheduleDate(new Date(selectedPost.scheduled_at))
                  setSelectedPost(null)
                }}
              >
                Đổi lịch
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPost(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageLayout>
  )
}
