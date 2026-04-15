import { useState } from 'react'
import { clsx } from 'clsx'
import { ChannelBadge } from '@/shared/components/ChannelBadge'
import { useToast } from '@/shared/components/ui/Toast'
import type { Lead } from '../today.types'

interface LeadQuickActionsProps {
  lead: Lead
  onAction: (
    leadId: string,
    action: 'hot' | 'warm' | 'cold' | 'trash',
  ) => Promise<void>
}

type ActionKey = 'hot' | 'warm' | 'cold' | 'trash'

const ACTION_CONFIG: Array<{
  key: ActionKey
  label: string
  emoji: string
  className: string
}> = [
  {
    key: 'hot',
    label: 'Hot',
    emoji: '🔥',
    className:
      'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-400',
  },
  {
    key: 'warm',
    label: 'Warm',
    emoji: '~',
    className:
      'border border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 focus-visible:ring-yellow-400',
  },
  {
    key: 'cold',
    label: 'Cold',
    emoji: '❄',
    className:
      'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 focus-visible:ring-blue-400',
  },
  {
    key: 'trash',
    label: 'Rác',
    emoji: '🗑',
    className:
      'border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-400',
  },
]

export function LeadQuickActions({ lead, onAction }: LeadQuickActionsProps) {
  const [loadingAction, setLoadingAction] = useState<ActionKey | null>(null)
  const [isDone, setIsDone] = useState(false)
  const { showToast } = useToast()

  const truncated =
    lead.message_preview && lead.message_preview.length > 80
      ? lead.message_preview.slice(0, 80) + '...'
      : (lead.message_preview ?? '')

  async function handleAction(action: ActionKey) {
    if (loadingAction) return
    setLoadingAction(action)
    try {
      await onAction(lead.id, action)
      if (action === 'hot') {
        showToast(
          `Lead "${lead.full_name}" đã được đánh dấu Hot và sẽ tự động đẩy sang Tư vấn viên.`,
          'success',
        )
      }
      setIsDone(true)
    } catch {
      showToast('Có lỗi xảy ra. Vui lòng thử lại.', 'error')
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div
      className={clsx(
        'bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-opacity duration-500',
        isDone && 'opacity-0 pointer-events-none',
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold font-headline text-gray-900 truncate">
            {lead.full_name}
          </p>
          <p className="mt-0.5 text-xs text-gray-500 font-body">{lead.phone_number}</p>
        </div>
        <ChannelBadge channel={lead.channel} />
      </div>

      {/* Message preview */}
      {truncated && (
        <p className="text-xs text-gray-500 font-body mb-3 leading-relaxed line-clamp-2">
          {truncated}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        {ACTION_CONFIG.map((cfg) => {
          const isThisLoading = loadingAction === cfg.key
          const isAnyLoading = loadingAction !== null

          return (
            <button
              key={cfg.key}
              onClick={() => handleAction(cfg.key)}
              disabled={isAnyLoading}
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-body',
                'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                cfg.className,
              )}
            >
              {isThisLoading ? (
                <svg
                  className="animate-spin h-3 w-3 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  />
                </svg>
              ) : (
                <span aria-hidden="true">{cfg.emoji}</span>
              )}
              {cfg.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
