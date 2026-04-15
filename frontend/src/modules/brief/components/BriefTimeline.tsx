import type { Brief } from '../brief.types'

interface BriefTimelineProps {
  history: Brief['status_history']
}

const EVENT_ICONS: Record<string, string> = {
  submitted: '📝',
  in_progress: '🔧',
  review: '👁',
  completed: '✅',
  cancelled: '❌',
  acknowledged: '🔧',
  delivered: '📦',
  revision_requested: '🔄',
}

function getIcon(eventType: string): string {
  return EVENT_ICONS[eventType] ?? '📌'
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function BriefTimeline({ history }: BriefTimelineProps) {
  if (!history || history.length === 0) {
    return <p className="text-sm text-gray-400 font-body">Chưa có lịch sử.</p>
  }

  return (
    <ol className="relative space-y-4 border-l-2 border-gray-100 ml-3">
      {history.map((event, idx) => (
        <li key={idx} className="relative pl-6">
          {/* Dot */}
          <span className="absolute -left-3.5 top-0 flex items-center justify-center w-7 h-7 bg-white rounded-full border-2 border-gray-200 text-sm">
            {getIcon(event.event_type)}
          </span>

          <div className="space-y-0.5">
            <p className="text-sm font-medium text-gray-800 font-body capitalize">
              {event.event_type.replace(/_/g, ' ')}
              {event.actor_name && (
                <span className="font-normal text-gray-500"> · {event.actor_name}</span>
              )}
            </p>
            <p className="text-xs text-gray-400 font-body">{formatTime(event.created_at)}</p>
            {event.notes && (
              <p className="text-xs text-gray-600 font-body bg-gray-50 rounded-lg px-3 py-2 mt-1">
                {event.notes}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
