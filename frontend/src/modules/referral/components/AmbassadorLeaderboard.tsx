import { Badge } from '@/shared/components/ui/Badge'
import type { Ambassador } from '../referral.types'

const MEDALS = ['🥇', '🥈', '🥉']

interface AmbassadorLeaderboardProps {
  ambassadors: Ambassador[]
  selectedId: string | null
  onSelect: (ambassador: Ambassador) => void
}

function ConversionRate({ total, converted }: { total: number; converted: number }) {
  const rate = total > 0 ? Math.round((converted / total) * 100) : 0
  const color = rate >= 50 ? 'text-green-600' : rate >= 25 ? 'text-yellow-600' : 'text-gray-500'
  return <span className={`text-xs font-semibold font-body ${color}`}>{rate}%</span>
}

interface AmbassadorRowProps {
  ambassador: Ambassador
  rank: number
  isSelected: boolean
  onClick: () => void
}

function AmbassadorRow({ ambassador, rank, isSelected, onClick }: AmbassadorRowProps) {
  const medal = MEDALS[rank - 1]
  const isTopThree = rank <= 3

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors rounded-lg ${
        isSelected
          ? 'bg-nedu-primary/10 ring-1 ring-nedu-primary/30'
          : 'hover:bg-gray-50'
      } ${!ambassador.is_active ? 'opacity-60' : ''}`}
    >
      {/* Rank */}
      <div className="w-8 text-center shrink-0">
        {isTopThree ? (
          <span className="text-xl leading-none">{medal}</span>
        ) : (
          <span className="text-sm font-bold text-gray-400 font-body">#{rank}</span>
        )}
      </div>

      {/* Name + code */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 font-body truncate">
            {ambassador.display_name}
          </span>
          {!ambassador.is_active && <Badge variant="gray">Inactive</Badge>}
        </div>
        <span className="text-xs text-gray-400 font-body font-mono">
          {ambassador.referral_code}
        </span>
      </div>

      {/* Stats */}
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-gray-800 font-body">
            {ambassador.total_referrals}
          </span>
          <span className="text-xs text-gray-400 font-body">referral</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 font-body">
            {ambassador.converted_referrals} chuyển đổi
          </span>
          <ConversionRate total={ambassador.total_referrals} converted={ambassador.converted_referrals} />
        </div>
      </div>
    </button>
  )
}

export function AmbassadorLeaderboard({
  ambassadors,
  selectedId,
  onSelect,
}: AmbassadorLeaderboardProps) {
  const sorted = [...ambassadors].sort((a, b) => b.total_referrals - a.total_referrals)
  const top3 = sorted.slice(0, 3)
  const rest = sorted.slice(3)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold font-headline text-gray-900">
          Bảng xếp hạng Ambassador
        </h2>
        <p className="text-xs text-gray-400 font-body mt-0.5">
          Tháng này · {ambassadors.filter((a) => a.is_active).length} đang hoạt động
        </p>
      </div>

      <div className="p-2 space-y-0.5">
        {/* Top 3 with medal highlights */}
        {top3.length > 0 && (
          <div className="space-y-0.5 pb-2 mb-2 border-b border-gray-100">
            {top3.map((amb, i) => (
              <AmbassadorRow
                key={amb.id}
                ambassador={amb}
                rank={i + 1}
                isSelected={selectedId === amb.id}
                onClick={() => onSelect(amb)}
              />
            ))}
          </div>
        )}

        {/* Rank 4+ */}
        {rest.map((amb, i) => (
          <AmbassadorRow
            key={amb.id}
            ambassador={amb}
            rank={i + 4}
            isSelected={selectedId === amb.id}
            onClick={() => onSelect(amb)}
          />
        ))}

        {ambassadors.length === 0 && (
          <p className="text-sm text-gray-400 font-body text-center py-8">
            Chưa có ambassador nào.
          </p>
        )}
      </div>
    </div>
  )
}
