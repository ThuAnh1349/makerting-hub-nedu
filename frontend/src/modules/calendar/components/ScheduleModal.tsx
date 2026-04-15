import { useState } from 'react'
import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'
import type { CalendarPost } from '../calendar.types'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  defaultDate?: Date
  post?: CalendarPost
  onSchedule: (postId: string, scheduledAt: string) => Promise<void>
  onCreateNew?: (scheduledAt: string) => void
}

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function ScheduleModal({
  isOpen,
  onClose,
  defaultDate,
  post,
  onSchedule,
  onCreateNew,
}: ScheduleModalProps) {
  const initial = defaultDate ?? new Date()
  const [datetimeValue, setDatetimeValue] = useState(toLocalDatetimeValue(initial))
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit() {
    const iso = new Date(datetimeValue).toISOString()
    setIsLoading(true)
    try {
      if (post) {
        await onSchedule(post.id, iso)
      } else {
        onCreateNew?.(iso)
      }
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const displayTime = datetimeValue
    ? new Date(datetimeValue).toLocaleString('vi-VN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={post ? 'Lên lịch bài đăng' : 'Tạo bài mới'} size="sm">
      <div className="space-y-4">
        {post && (
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 border border-gray-200">
            <p className="font-medium mb-1 line-clamp-2">{post.caption}</p>
            <div className="flex gap-1 flex-wrap">
              {post.channels.map((ch) => (
                <span
                  key={ch.code}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white font-medium"
                  style={{ backgroundColor: ch.color_hex }}
                >
                  {ch.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày &amp; Giờ đăng
          </label>
          <input
            type="datetime-local"
            value={datetimeValue}
            onChange={(e) => setDatetimeValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nedu-primary"
          />
          {displayTime && (
            <p className="text-xs text-gray-500 mt-1">📅 {displayTime}</p>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!datetimeValue}
          >
            {post ? 'Lên lịch' : 'Tạo & Lên lịch'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
