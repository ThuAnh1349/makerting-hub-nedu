import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Drawer } from '@/shared/components/ui/Drawer'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { useToast } from '@/shared/components/ui/Toast'
import { ChannelBadge } from '@/shared/components/ChannelBadge'
import { inboxService } from '../services/inbox.service'
import { useLeadDetail } from '../hooks/useInboxLeads'
import { ReturnedLeadBanner } from './ReturnedLeadBanner'
import { LeadClassifyPanel } from './LeadClassifyPanel'
import type { LeadActionEvent } from '../inbox.types'

interface LeadDetailDrawerProps {
  leadId: string | null
  onClose: () => void
}

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

const EVENT_ICON: Record<string, string> = {
  synced: '🔄',
  assigned: '👤',
  hot: '🔥',
  warm: '~',
  cold: '❄',
  pushed: '➡',
  returned: '↩',
  trash: '🗑',
  archived: '📦',
}

function getEventIcon(eventType: string): string {
  const key = Object.keys(EVENT_ICON).find((k) =>
    eventType.toLowerCase().includes(k),
  )
  return key ? EVENT_ICON[key] : '📝'
}

function formatEventLabel(eventType: string): string {
  const map: Record<string, string> = {
    lead_synced: 'Lead được đồng bộ',
    lead_assigned: 'Phân công nhân viên',
    status_changed_hot: 'Đánh dấu Hot',
    status_changed_warm: 'Đánh dấu Warm',
    status_changed_cold: 'Đánh dấu Cold',
    status_changed_pushed: 'Đẩy sang TVV',
    status_changed_returned: 'TVV trả về',
    status_changed_archived: 'Lưu trữ',
    status_changed_trash: 'Đánh dấu Rác',
  }
  return map[eventType] ?? eventType.replace(/_/g, ' ')
}

function ActionHistoryItem({ event }: { event: LeadActionEvent }) {
  return (
    <div className="flex gap-3 items-start">
      <span
        className="shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm"
        aria-hidden="true"
      >
        {getEventIcon(event.event_type)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 font-body">
          {formatEventLabel(event.event_type)}
        </p>
        {event.actor_name && (
          <p className="text-xs text-gray-500 font-body">{event.actor_name}</p>
        )}
        <p className="text-xs text-gray-400 font-body">
          {formatDatetime(event.created_at)}
        </p>
      </div>
    </div>
  )
}

export function LeadDetailDrawer({ leadId, onClose }: LeadDetailDrawerProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [isActioning, setIsActioning] = useState(false)

  const { data: lead, isLoading, isError } = useLeadDetail(leadId)

  async function handleAction(
    action: string,
    _classification?: string,
    reason?: string,
  ) {
    if (!leadId) return
    setIsActioning(true)
    try {
      await inboxService.performAction(leadId, {
        action_type: action,
        ...(reason ? { reason } : {}),
      })
      await queryClient.invalidateQueries({ queryKey: ['inbox'] })
      await queryClient.invalidateQueries({ queryKey: ['today', 'summary'] })
      showToast('Cập nhật lead thành công.', 'success')
    } catch {
      showToast('Có lỗi xảy ra. Vui lòng thử lại.', 'error')
      throw new Error('Action failed')
    } finally {
      setIsActioning(false)
    }
  }

  return (
    <Drawer isOpen={!!leadId} onClose={onClose} title="Chi tiết lead">
      {isLoading && (
        <div className="space-y-4">
          <Skeleton variant="card" />
          <Skeleton variant="line" lines={4} />
          <Skeleton variant="card" />
        </div>
      )}

      {isError && (
        <div className="py-8 text-center">
          <p className="text-gray-500 font-body text-sm">
            Không thể tải chi tiết lead.
          </p>
        </div>
      )}

      {lead && (
        <div className="space-y-6">
          {/* Returned banner */}
          {lead.current_status === 'returned' && lead.return_reason && (
            <ReturnedLeadBanner reason={lead.return_reason} />
          )}

          {/* Basic info */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
            <div>
              <p className="text-xs text-gray-500 font-body">Họ và tên</p>
              <p className="text-sm font-semibold text-gray-900 font-headline mt-0.5">
                {lead.full_name}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-body">Số điện thoại</p>
              <p className="text-sm text-gray-900 font-body mt-0.5">
                {lead.phone_number}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-body mb-1">Kênh</p>
              <ChannelBadge channel={lead.channel} />
            </div>
            {lead.assigned_to && (
              <div>
                <p className="text-xs text-gray-500 font-body">Phụ trách</p>
                <div className="flex items-center gap-2 mt-1">
                  {lead.assigned_to.avatar_url ? (
                    <img
                      src={lead.assigned_to.avatar_url}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 shrink-0">
                      {lead.assigned_to.display_name.charAt(0)}
                    </span>
                  )}
                  <span className="text-sm text-gray-800 font-body">
                    {lead.assigned_to.display_name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* UTM & message */}
          <div className="space-y-3">
            {lead.message_preview && (
              <div>
                <p className="text-xs text-gray-500 font-body mb-1">Tin nhắn</p>
                <p className="text-sm text-gray-700 font-body bg-gray-50 rounded-lg p-3 border border-gray-200 italic">
                  &ldquo;{lead.message_preview}&rdquo;
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-400 font-body">utm_source</p>
                <p className="text-gray-700 font-body font-medium truncate">
                  {lead.utm_source || '—'}
                </p>
              </div>
              {lead.utm_medium && (
                <div>
                  <p className="text-gray-400 font-body">utm_medium</p>
                  <p className="text-gray-700 font-body font-medium truncate">
                    {lead.utm_medium}
                  </p>
                </div>
              )}
              {lead.utm_campaign && (
                <div className="col-span-2">
                  <p className="text-gray-400 font-body">utm_campaign</p>
                  <p className="text-gray-700 font-body font-medium truncate">
                    {lead.utm_campaign}
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400 font-body">
              Đồng bộ lần cuối: {formatTimeAgo(lead.ops_synced_at)}
            </p>
          </div>

          {/* Classify panel */}
          <div className="border-t border-gray-200 pt-4">
            <LeadClassifyPanel
              lead={lead}
              onAction={handleAction}
              isLoading={isActioning}
            />
          </div>

          {/* Action history */}
          {lead.action_history && lead.action_history.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold font-headline text-gray-800 mb-3">
                Lịch sử hoạt động
              </h3>
              <div className="space-y-3">
                {[...lead.action_history]
                  .sort(
                    (a, b) =>
                      new Date(a.created_at).getTime() -
                      new Date(b.created_at).getTime(),
                  )
                  .map((event, i) => (
                    <ActionHistoryItem key={i} event={event} />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  )
}
