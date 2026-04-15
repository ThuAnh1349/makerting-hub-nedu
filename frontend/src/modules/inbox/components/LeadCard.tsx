import { clsx } from 'clsx'
import { Badge } from '@/shared/components/ui/Badge'
import { ChannelBadge } from '@/shared/components/ChannelBadge'
import type { Lead, LeadStatus } from '../inbox.types'

interface LeadCardProps {
  lead: Lead
  onClick: () => void
  isSelected?: boolean
}

function maskPhone(phone: string): string {
  if (phone.length < 7) return phone
  const prefix = phone.slice(0, 3)
  const suffix = phone.slice(-4)
  const masked = '•••'
  return `${prefix}${masked}${suffix}`
}

function formatWaitingTime(minutes: number): string {
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (remaining === 0) return `${hours} giờ trước`
  return `${hours} giờ ${remaining} phút trước`
}

const STATUS_BADGE: Record<
  LeadStatus,
  { label: string; variant: 'blue' | 'red' | 'yellow' | 'gray' | 'green' | 'orange' }
> = {
  new: { label: 'Mới', variant: 'blue' },
  hot: { label: 'Hot', variant: 'red' },
  warm: { label: 'Warm', variant: 'yellow' },
  cold: { label: 'Cold', variant: 'gray' },
  pushed: { label: 'Đã push', variant: 'green' },
  returned: { label: 'Trả về', variant: 'orange' },
  archived: { label: 'Lưu trữ', variant: 'gray' },
}

export function LeadCard({ lead, onClick, isSelected = false }: LeadCardProps) {
  const statusConfig = STATUS_BADGE[lead.current_status] ?? STATUS_BADGE.new
  const isReturned = lead.current_status === 'returned'

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left bg-white rounded-xl border p-4 shadow-sm transition-all',
        'hover:shadow-md hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nedu-primary focus-visible:ring-offset-1',
        isSelected && 'ring-2 ring-blue-500 ring-offset-1 border-blue-200',
        isReturned && !isSelected && 'border-yellow-300 bg-yellow-50/30',
        !isSelected && !isReturned && 'border-gray-200',
      )}
      aria-pressed={isSelected}
    >
      {/* Top row: name + status */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-sm font-semibold font-headline text-gray-900 truncate">
          {lead.full_name}
        </p>
        <Badge variant={statusConfig.variant} className="shrink-0">
          {statusConfig.label}
        </Badge>
      </div>

      {/* Phone number */}
      <p className="text-xs text-gray-500 font-body mb-2">
        {maskPhone(lead.phone_number)}
      </p>

      {/* Channel + time row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <ChannelBadge channel={lead.channel} />
        <span className="text-xs text-gray-400 font-body shrink-0">
          {formatWaitingTime(lead.minutes_waiting)}
        </span>
      </div>

      {/* SLA overdue indicator */}
      {lead.sla_overdue && (
        <div className="flex items-center gap-1.5 mt-1">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
          </span>
          <span className="text-xs text-orange-600 font-medium font-body">
            Quá SLA
          </span>
        </div>
      )}
    </button>
  )
}
