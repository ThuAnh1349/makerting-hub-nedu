import { Badge } from '@/shared/components/ui/Badge'
import type { Campaign, CampaignPhase } from '../campaign.types'

interface CampaignCardProps {
  campaign: Campaign
  onMovePhase: (id: string, newPhase: CampaignPhase) => Promise<void>
  onClick: () => void
}

const PHASE_CONFIG: Record<
  CampaignPhase,
  { label: string; variant: 'gray' | 'blue' | 'orange' | 'red' | 'green'; next: CampaignPhase | null; nextLabel: string }
> = {
  opening: { label: 'Opening', variant: 'gray', next: 'build', nextLabel: 'Build' },
  build: { label: 'Build', variant: 'blue', next: 'close', nextLabel: 'Close' },
  close: { label: 'Close', variant: 'orange', next: 'cta', nextLabel: 'CTA' },
  cta: { label: 'CTA', variant: 'red', next: 'completed', nextLabel: 'Hoàn thành' },
  completed: { label: 'Hoàn thành', variant: 'green', next: null, nextLabel: '' },
}

export function CampaignCard({ campaign, onMovePhase, onClick }: CampaignCardProps) {
  const phaseConfig = PHASE_CONFIG[campaign.current_phase]

  function handleMovePhase(e: React.MouseEvent) {
    e.stopPropagation()
    if (!phaseConfig.next) return
    onMovePhase(campaign.id, phaseConfig.next)
  }

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer space-y-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold font-headline text-gray-900 leading-snug line-clamp-2 flex-1">
          {campaign.title}
        </h3>
        <Badge variant={phaseConfig.variant} className="shrink-0">
          {phaseConfig.label}
        </Badge>
      </div>

      {/* Description */}
      {campaign.description && (
        <p className="text-xs text-gray-500 font-body line-clamp-2">{campaign.description}</p>
      )}

      {/* Dates */}
      {(campaign.start_date || campaign.end_date) && (
        <p className="text-xs text-gray-400 font-body">
          {campaign.start_date
            ? new Date(campaign.start_date).toLocaleDateString('vi-VN')
            : '?'}
          {' — '}
          {campaign.end_date
            ? new Date(campaign.end_date).toLocaleDateString('vi-VN')
            : '?'}
        </p>
      )}

      {/* Post counts */}
      <div className="flex items-center justify-between text-xs font-body">
        <span className="text-gray-500">
          {campaign.post_counts.total} bài /{' '}
          <span className="text-green-600 font-medium">
            {campaign.post_counts.published} đã đăng
          </span>
        </span>
        <span className="text-gray-400">by {campaign.created_by.display_name}</span>
      </div>

      {/* Move phase button */}
      {phaseConfig.next && (
        <button
          onClick={handleMovePhase}
          className="w-full text-xs text-center py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors font-body"
        >
          → Chuyển sang {phaseConfig.nextLabel}
        </button>
      )}
    </div>
  )
}
