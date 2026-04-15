import { Skeleton } from '@/shared/components/ui/Skeleton'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { LeadCard } from './LeadCard'
import type { Lead } from '../inbox.types'

interface InboxListProps {
  leads: Lead[]
  isLoading: boolean
  selectedLeadId: string | null
  onSelectLead: (id: string) => void
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-2 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="h-5 bg-gray-200 rounded-full w-14" />
      </div>
      <div className="h-3 bg-gray-200 rounded w-24" />
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded-full w-20" />
        <div className="h-3 bg-gray-200 rounded w-16" />
      </div>
    </div>
  )
}

export function InboxList({
  leads,
  isLoading,
  selectedLeadId,
  onSelectLead,
}: InboxListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <EmptyState
        title="Không có lead nào"
        description="Thay đổi bộ lọc để xem các lead khác."
      />
    )
  }

  return (
    <div className="space-y-2 p-2 overflow-y-auto">
      {leads.map((lead) => (
        <LeadCard
          key={lead.id}
          lead={lead}
          onClick={() => onSelectLead(lead.id)}
          isSelected={lead.id === selectedLeadId}
        />
      ))}
    </div>
  )
}
