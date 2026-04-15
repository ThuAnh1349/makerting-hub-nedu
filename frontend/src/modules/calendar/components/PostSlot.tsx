import type { CalendarPost } from '../calendar.types'

interface PostSlotProps {
  post: CalendarPost
  onClick: () => void
}

const statusDot: Record<CalendarPost['current_status'], string> = {
  published: 'bg-green-500',
  scheduled: 'bg-blue-500',
  approved: 'bg-yellow-400',
}

export default function PostSlot({ post, onClick }: PostSlotProps) {
  const primaryChannel = post.channels[0]
  const borderColor = primaryChannel?.color_hex ?? '#6B7280'
  const time = new Date(post.scheduled_at).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const caption = post.caption.length > 30 ? post.caption.slice(0, 30) + '…' : post.caption

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-md px-1.5 py-1 text-xs bg-white hover:bg-gray-50 transition-colors border-l-2 shadow-sm mb-0.5 flex items-start gap-1 group"
      style={{ borderLeftColor: borderColor }}
    >
      <span
        className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[post.current_status]}`}
      />
      <span className="flex-1 min-w-0">
        <span className="font-medium text-gray-700">{time}</span>
        <span className="text-gray-500 ml-1 truncate block">{caption}</span>
      </span>
    </button>
  )
}
