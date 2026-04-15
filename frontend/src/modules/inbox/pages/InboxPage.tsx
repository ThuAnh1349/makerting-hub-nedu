import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { PageLayout } from '@/shared/components/PageLayout'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { useToast } from '@/shared/components/ui/Toast'
import { inboxService } from '../services/inbox.service'
import { useInboxLeads } from '../hooks/useInboxLeads'
import { InboxList } from '../components/InboxList'
import { LeadDetailDrawer } from '../components/LeadDetailDrawer'
import { ReturnedLeadBanner } from '../components/ReturnedLeadBanner'
import { LeadClassifyPanel } from '../components/LeadClassifyPanel'
import { ChannelBadge } from '@/shared/components/ChannelBadge'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import type { LeadStatus, Lead } from '../inbox.types'

// ── Filter configuration ──────────────────────────────────────────────────────

type FilterId =
  | 'all'
  | 'hot'
  | 'warm'
  | 'cold'
  | 'trash'
  | 'pushed'
  | 'returned'

interface FilterChip {
  id: FilterId
  label: string
  statuses: LeadStatus[]
}

const FILTER_CHIPS: FilterChip[] = [
  { id: 'all', label: 'Tất cả', statuses: [] },
  { id: 'hot', label: 'Hot', statuses: ['hot'] },
  { id: 'warm', label: 'Warm', statuses: ['warm'] },
  { id: 'cold', label: 'Cold', statuses: ['cold'] },
  { id: 'trash', label: 'Rác', statuses: ['new'] },
  { id: 'pushed', label: 'Đã push', statuses: ['pushed'] },
  { id: 'returned', label: 'Trả về', statuses: ['returned'] },
]

const CHIP_ACTIVE_CLASSES: Record<FilterId, string> = {
  all: 'bg-gray-800 text-white border-gray-800',
  hot: 'bg-red-600 text-white border-red-600',
  warm: 'bg-yellow-500 text-white border-yellow-500',
  cold: 'bg-blue-500 text-white border-blue-500',
  trash: 'bg-gray-500 text-white border-gray-500',
  pushed: 'bg-green-600 text-white border-green-600',
  returned: 'bg-orange-500 text-white border-orange-500',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

// ── Inline Lead Detail Panel (used on desktop) ────────────────────────────────

interface InlineLeadDetailProps {
  lead: Lead
  onAction: (action: string, classification?: string, reason?: string) => Promise<void>
  isActioning: boolean
}

function InlineLeadDetail({ lead, onAction, isActioning }: InlineLeadDetailProps) {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 space-y-5">
      {/* Returned banner */}
      {lead.current_status === 'returned' && lead.return_reason && (
        <ReturnedLeadBanner reason={lead.return_reason} />
      )}

      {/* Basic info */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
        <div>
          <p className="text-xs text-gray-400 font-body">Họ và tên</p>
          <p className="text-base font-semibold text-gray-900 font-headline mt-0.5">
            {lead.full_name}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 font-body">Số điện thoại</p>
          <p className="text-sm text-gray-900 font-body mt-0.5">{lead.phone_number}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 font-body mb-1">Kênh</p>
          <ChannelBadge channel={lead.channel} />
        </div>
        {lead.assigned_to && (
          <div>
            <p className="text-xs text-gray-400 font-body">Phụ trách</p>
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

      {/* Message + UTM */}
      <div className="space-y-3">
        {lead.message_preview && (
          <div>
            <p className="text-xs text-gray-400 font-body mb-1">Tin nhắn</p>
            <p className="text-sm text-gray-700 font-body bg-gray-50 rounded-lg p-3 border border-gray-200 italic">
              &ldquo;{lead.message_preview}&rdquo;
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 text-xs">
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
          onAction={onAction}
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
                <div key={i} className="flex gap-2 items-start text-xs">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                    📝
                  </span>
                  <div>
                    <p className="text-gray-700 font-body font-medium">
                      {event.event_type.replace(/_/g, ' ')}
                    </p>
                    {event.actor_name && (
                      <p className="text-gray-400 font-body">{event.actor_name}</p>
                    )}
                    <p className="text-gray-400 font-body">
                      {new Date(event.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── InboxPage ─────────────────────────────────────────────────────────────────

export function InboxPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [activeFilter, setActiveFilter] = useState<FilterId>('all')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [isActioning, setIsActioning] = useState(false)
  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  // Respect ?lead_id= URL param on mount
  useEffect(() => {
    const paramLeadId = searchParams.get('lead_id')
    if (paramLeadId) {
      setSelectedLeadId(paramLeadId)
      setMobileDrawerOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Build filter for API
  const currentChip = FILTER_CHIPS.find((c) => c.id === activeFilter)!
  const apiFilter =
    currentChip.statuses.length > 0
      ? { status: currentChip.statuses }
      : undefined

  const { data, isLoading } = useInboxLeads(apiFilter)
  const leads = data?.data ?? []

  // Count per status for badge display
  const countByFilter = useMemo(() => {
    const counts: Record<FilterId, number> = {
      all: 0,
      hot: 0,
      warm: 0,
      cold: 0,
      trash: 0,
      pushed: 0,
      returned: 0,
    }
    // We need full data for counts — re-fetch without filter for counts
    // We approximate using current loaded leads for now
    leads.forEach((lead) => {
      counts.all++
      if (lead.current_status === 'hot') counts.hot++
      if (lead.current_status === 'warm') counts.warm++
      if (lead.current_status === 'cold') counts.cold++
      if (lead.current_status === 'new') counts.trash++
      if (lead.current_status === 'pushed') counts.pushed++
      if (lead.current_status === 'returned') counts.returned++
    })
    return counts
  }, [leads])

  // Find selected lead object from loaded list
  const selectedLead = leads.find((l) => l.id === selectedLeadId) ?? null

  function handleSelectLead(id: string) {
    setSelectedLeadId(id)
    setMobileDrawerOpen(true)
    // Update URL param without re-mount
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('lead_id', id)
      return next
    })
  }

  function handleCloseDrawer() {
    setSelectedLeadId(null)
    setMobileDrawerOpen(false)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('lead_id')
      return next
    })
  }

  async function handleAction(
    action: string,
    _classification?: string,
    reason?: string,
  ) {
    if (!selectedLeadId) return
    setIsActioning(true)
    try {
      await inboxService.performAction(selectedLeadId, {
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
    <PageLayout title="Inbox & Lead">
      <div className="flex flex-col h-[calc(100vh-120px)] -mx-4 sm:-mx-6 lg:-mx-8">
        {/* Filter bar */}
        <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-gray-200 bg-white shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FILTER_CHIPS.map((chip) => {
              const isActive = activeFilter === chip.id
              const count = isLoading ? null : countByFilter[chip.id]

              return (
                <button
                  key={chip.id}
                  onClick={() => {
                    setActiveFilter(chip.id)
                    setSelectedLeadId(null)
                    setMobileDrawerOpen(false)
                  }}
                  className={clsx(
                    'shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium font-body border transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-400',
                    isActive
                      ? CHIP_ACTIVE_CLASSES[chip.id]
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
                  )}
                  aria-pressed={isActive}
                >
                  {chip.label}
                  {count !== null && count > 0 && (
                    <span
                      className={clsx(
                        'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold',
                        isActive
                          ? 'bg-white/30 text-white'
                          : 'bg-gray-100 text-gray-600',
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Main split panel */}
        <div className="flex flex-1 min-h-0">
          {/* Lead list — fixed width on desktop, full width on mobile */}
          <div
            className={clsx(
              'shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto',
              // On mobile, hide list when drawer is open
              'w-full md:w-96',
              mobileDrawerOpen && selectedLeadId ? 'hidden md:block' : 'block',
            )}
          >
            <InboxList
              leads={leads}
              isLoading={isLoading}
              selectedLeadId={selectedLeadId}
              onSelectLead={handleSelectLead}
            />
          </div>

          {/* Detail panel — desktop inline, mobile as drawer */}
          {/* Desktop detail panel */}
          <div className="hidden md:flex flex-1 min-h-0 overflow-hidden">
            {selectedLead ? (
              <div className="flex-1 overflow-y-auto bg-white">
                {/* Detail header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold font-headline text-gray-900 truncate">
                    {selectedLead.full_name}
                  </h2>
                  <button
                    onClick={handleCloseDrawer}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Đóng"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <InlineLeadDetail
                  lead={selectedLead}
                  onAction={handleAction}
                  isActioning={isActioning}
                />
              </div>
            ) : isLoading ? (
              <div className="flex-1 p-6 space-y-4">
                <Skeleton variant="card" />
                <Skeleton variant="line" lines={4} />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState
                  title="Chọn một lead để xem chi tiết"
                  description="Nhấp vào một lead từ danh sách bên trái để xem thông tin và phân loại."
                />
              </div>
            )}
          </div>

          {/* Mobile: full-screen slide-in detail using Drawer component */}
          <div className="md:hidden">
            <LeadDetailDrawer
              leadId={mobileDrawerOpen ? selectedLeadId : null}
              onClose={handleCloseDrawer}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
