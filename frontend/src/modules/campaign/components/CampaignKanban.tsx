import { useState } from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { CampaignCard } from './CampaignCard'
import type { Campaign, CampaignPhase } from '../campaign.types'

interface CampaignKanbanProps {
  campaigns: Campaign[]
  onMovePhase: (id: string, newPhase: CampaignPhase) => Promise<void>
  onCampaignClick: (campaign: Campaign) => void
}

const COLUMNS: { key: CampaignPhase; label: string; variant: 'gray' | 'blue' | 'orange' | 'red' }[] = [
  { key: 'opening', label: 'Opening', variant: 'gray' },
  { key: 'build', label: 'Build', variant: 'blue' },
  { key: 'close', label: 'Close', variant: 'orange' },
  { key: 'cta', label: 'CTA', variant: 'red' },
]

export function CampaignKanban({ campaigns, onMovePhase, onCampaignClick }: CampaignKanbanProps) {
  const [completedExpanded, setCompletedExpanded] = useState(false)

  const active = campaigns.filter((c) => c.current_phase !== 'completed')
  const completed = campaigns.filter((c) => c.current_phase === 'completed')

  function getByPhase(phase: CampaignPhase): Campaign[] {
    return active.filter((c) => c.current_phase === phase)
  }

  return (
    <div className="space-y-6">
      {/* Active Kanban */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const items = getByPhase(col.key)
          return (
            <div key={col.key} className="bg-gray-50 rounded-xl p-3 space-y-3">
              {/* Column header */}
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-semibold font-headline text-gray-700">
                  {col.label}
                </span>
                <Badge variant={col.variant}>{items.length}</Badge>
              </div>

              {/* Cards */}
              {items.length === 0 ? (
                <div className="bg-white rounded-lg border border-dashed border-gray-200 py-8 flex items-center justify-center">
                  <span className="text-xs text-gray-400 font-body">Không có chiến dịch</span>
                </div>
              ) : (
                items.map((c) => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    onMovePhase={onMovePhase}
                    onClick={() => onCampaignClick(c)}
                  />
                ))
              )}
            </div>
          )
        })}
      </div>

      {/* Completed campaigns (collapsible) */}
      {completed.length > 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200">
          <button
            onClick={() => setCompletedExpanded((p) => !p)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-600 font-body hover:bg-gray-100 rounded-xl transition-colors"
          >
            <span className="flex items-center gap-2">
              <Badge variant="green">{completed.length}</Badge>
              Chiến dịch đã hoàn thành
            </span>
            <span className="text-gray-400">{completedExpanded ? '▲' : '▼'}</span>
          </button>

          {completedExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-3 pt-0">
              {completed.map((c) => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  onMovePhase={onMovePhase}
                  onClick={() => onCampaignClick(c)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {campaigns.length === 0 && (
        <EmptyState
          title="Chưa có chiến dịch nào"
          description="Tạo chiến dịch đầu tiên để bắt đầu quản lý nội dung theo phase."
        />
      )}
    </div>
  )
}
