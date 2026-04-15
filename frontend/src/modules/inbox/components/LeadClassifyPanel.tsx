import { useState } from 'react'
import { clsx } from 'clsx'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import type { Lead, LeadStatus } from '../inbox.types'

interface LeadClassifyPanelProps {
  lead: Lead
  onAction: (
    action: string,
    classification?: string,
    reason?: string,
  ) => Promise<void>
  isLoading: boolean
}

type ClassifyAction = 'hot' | 'warm' | 'cold' | 'trash'

const CLASSIFY_BUTTONS: Array<{
  key: ClassifyAction
  label: string
  emoji: string
  variant: 'danger' | 'ghost' | 'secondary' | 'primary'
  className: string
}> = [
  {
    key: 'hot',
    label: 'Hot',
    emoji: '🔥',
    variant: 'danger',
    className: '',
  },
  {
    key: 'warm',
    label: 'Warm',
    emoji: '~',
    variant: 'ghost',
    className:
      'border border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
  },
  {
    key: 'cold',
    label: 'Cold',
    emoji: '❄',
    variant: 'ghost',
    className:
      'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
  },
  {
    key: 'trash',
    label: 'Rác',
    emoji: '🗑',
    variant: 'ghost',
    className: 'border border-gray-200',
  },
]

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Mới',
  hot: 'Hot',
  warm: 'Warm',
  cold: 'Cold',
  pushed: 'Đã đẩy sang TVV',
  returned: 'Trả về',
  archived: 'Lưu trữ',
}

const READ_ONLY_STATUSES: LeadStatus[] = ['pushed', 'archived']

export function LeadClassifyPanel({
  lead,
  onAction,
  isLoading,
}: LeadClassifyPanelProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [returnReason, setReturnReason] = useState('')

  async function handleClassify(key: ClassifyAction, reason?: string) {
    setPendingAction(key)
    try {
      await onAction(key, key, reason)
    } finally {
      setPendingAction(null)
      setReturnReason('')
    }
  }

  async function handlePush() {
    setPendingAction('push')
    try {
      await onAction('push')
    } finally {
      setPendingAction(null)
    }
  }

  const status = lead.current_status

  // Read-only states
  if (READ_ONLY_STATUSES.includes(status)) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
        <p className="text-xs text-gray-500 font-body mb-1">Trạng thái hiện tại</p>
        <Badge variant="gray" className="text-sm px-3 py-1">
          {STATUS_LABEL[status]}
        </Badge>
        <p className="text-xs text-gray-400 font-body mt-2">
          {status === 'pushed'
            ? 'Lead đã được đẩy sang Tư vấn viên. Không thể thay đổi.'
            : 'Lead đã được lưu trữ.'}
        </p>
      </div>
    )
  }

  // Hot → push to consultant
  if (status === 'hot') {
    return (
      <div className="space-y-3">
        <p className="text-xs text-gray-500 font-body">Hành động</p>
        <Button
          variant="primary"
          className="w-full"
          isLoading={isLoading || pendingAction === 'push'}
          onClick={handlePush}
        >
          ➡ Đẩy sang TVV
        </Button>
      </div>
    )
  }

  // Returned → reclassify with optional reason
  if (status === 'returned') {
    return (
      <div className="space-y-3">
        <p className="text-xs text-gray-500 font-body">Phân loại lại</p>
        <textarea
          value={returnReason}
          onChange={(e) => setReturnReason(e.target.value)}
          placeholder="Lý do phân loại lại (tuỳ chọn)..."
          rows={2}
          className="w-full text-sm font-body border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-nedu-primary focus:border-transparent placeholder:text-gray-400"
        />
        <div className="grid grid-cols-2 gap-2">
          {CLASSIFY_BUTTONS.map((btn) => (
            <button
              key={btn.key}
              onClick={() => handleClassify(btn.key, returnReason || undefined)}
              disabled={isLoading || pendingAction !== null}
              className={clsx(
                'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium font-body',
                'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                btn.key === 'hot' &&
                  'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
                btn.key === 'warm' && btn.className,
                btn.key === 'cold' && btn.className,
                btn.key === 'trash' && btn.className,
              )}
            >
              {pendingAction === btn.key ? (
                <svg
                  className="animate-spin h-4 w-4"
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
                <span aria-hidden="true">{btn.emoji}</span>
              )}
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Default: new, warm, cold — show all 4 classify buttons
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 font-body">Phân loại</p>
      <div className="grid grid-cols-2 gap-2">
        {CLASSIFY_BUTTONS.map((btn) => (
          <button
            key={btn.key}
            onClick={() => handleClassify(btn.key)}
            disabled={isLoading || pendingAction !== null}
            className={clsx(
              'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium font-body',
              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              btn.key === 'hot' &&
                'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
              btn.key === 'warm' && btn.className,
              btn.key === 'cold' && btn.className,
              btn.key === 'trash' && btn.className,
            )}
          >
            {pendingAction === btn.key ? (
              <svg
                className="animate-spin h-4 w-4"
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
              <span aria-hidden="true">{btn.emoji}</span>
            )}
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}
