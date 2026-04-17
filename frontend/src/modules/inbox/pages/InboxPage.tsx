import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
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

// ── Filter config ─────────────────────────────────────────────────────────────

type FilterId = 'all' | 'hot' | 'warm' | 'cold' | 'trash' | 'pushed' | 'returned'

interface FilterChip {
  id: FilterId
  label: string
  statuses: LeadStatus[]
  color: string
  activeColor: string
}

const FILTER_CHIPS: FilterChip[] = [
  { id: 'all',      label: 'Tất cả',  statuses: [],          color: '#374151', activeColor: '#111827' },
  { id: 'hot',      label: '🔥 Hot',  statuses: ['hot'],     color: '#b91c1c', activeColor: '#ef4444' },
  { id: 'warm',     label: '☀️ Warm', statuses: ['warm'],    color: '#92400e', activeColor: '#d97706' },
  { id: 'cold',     label: '❄️ Cold', statuses: ['cold'],    color: '#1d4ed8', activeColor: '#2563eb' },
  { id: 'pushed',   label: '✅ Đã push', statuses: ['pushed'], color: '#1a5c46', activeColor: '#2d9b6b' },
  { id: 'returned', label: '↩ Trả về', statuses: ['returned'], color: '#9a3412', activeColor: '#ea580c' },
  { id: 'trash',    label: '🗑 Rác',  statuses: ['new'],     color: '#6b7280', activeColor: '#4b5563' },
]

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

// ── Inline Lead Detail ────────────────────────────────────────────────────────

interface InlineLeadDetailProps {
  lead: Lead
  onAction: (action: string, classification?: string, reason?: string) => Promise<void>
  isActioning: boolean
}

function InlineLeadDetail({ lead, onAction, isActioning }: InlineLeadDetailProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Returned banner */}
      {lead.current_status === 'returned' && lead.return_reason && (
        <div style={{ padding: '0 16px', paddingTop: 14 }}>
          <ReturnedLeadBanner reason={lead.return_reason} />
        </div>
      )}

      {/* Basic info card */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{
          background: '#f9fafb',
          borderRadius: 11,
          border: '1px solid rgba(0,0,0,0.07)',
          padding: 14,
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 10 }}>
            {lead.full_name}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
            <div>
              <div style={{ color: '#9ca3af', marginBottom: 2 }}>Số điện thoại</div>
              <div style={{ color: '#111827', fontWeight: 600 }}>{lead.phone_number}</div>
            </div>
            <div>
              <div style={{ color: '#9ca3af', marginBottom: 2 }}>Kênh</div>
              <ChannelBadge channel={lead.channel} />
            </div>
            {lead.utm_source && (
              <div>
                <div style={{ color: '#9ca3af', marginBottom: 2 }}>utm_source</div>
                <div style={{ color: '#374151', fontWeight: 500 }}>{lead.utm_source}</div>
              </div>
            )}
            {lead.utm_campaign && (
              <div>
                <div style={{ color: '#9ca3af', marginBottom: 2 }}>utm_campaign</div>
                <div style={{ color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.utm_campaign}</div>
              </div>
            )}
          </div>
          {lead.assigned_to && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <div style={{ color: '#9ca3af' }}>Phụ trách:</div>
              <div style={{ color: '#111827', fontWeight: 600 }}>{lead.assigned_to.display_name}</div>
            </div>
          )}
        </div>
      </div>

      {/* Message preview */}
      {lead.message_preview && (
        <div style={{ padding: '10px 16px 0' }}>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Tin nhắn</div>
          <div style={{
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.09)',
            borderRadius: 9,
            padding: '10px 12px',
            fontSize: 12,
            color: '#374151',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}>
            "{lead.message_preview}"
          </div>
        </div>
      )}

      {/* Sync time */}
      <div style={{ padding: '6px 16px 0', fontSize: 10, color: '#9ca3af' }}>
        Đồng bộ: {formatTimeAgo(lead.ops_synced_at)}
      </div>

      {/* Classify panel */}
      <div style={{ padding: '14px 16px 0', borderTop: '1px solid rgba(0,0,0,0.07)', marginTop: 10 }}>
        <LeadClassifyPanel lead={lead} onAction={onAction} isLoading={isActioning} />
      </div>

      {/* Action history */}
      {lead.action_history && lead.action_history.length > 0 && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(0,0,0,0.07)', marginTop: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Lịch sử hoạt động</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...lead.action_history]
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .map((event, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 11 }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: '50%', background: '#f3f4f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: 13,
                  }}>📝</span>
                  <div>
                    <div style={{ color: '#374151', fontWeight: 600 }}>{event.event_type.replace(/_/g, ' ')}</div>
                    {event.actor_name && <div style={{ color: '#9ca3af' }}>{event.actor_name}</div>}
                    <div style={{ color: '#9ca3af' }}>{new Date(event.created_at).toLocaleString('vi-VN')}</div>
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  useEffect(() => {
    const paramLeadId = searchParams.get('lead_id')
    if (paramLeadId) {
      setSelectedLeadId(paramLeadId)
      setMobileDrawerOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentChip = FILTER_CHIPS.find((c) => c.id === activeFilter)!
  const apiFilter = currentChip.statuses.length > 0 ? { status: currentChip.statuses } : undefined

  const { data, isLoading } = useInboxLeads(apiFilter)
  const leads = data?.data ?? []

  const countByFilter = useMemo(() => {
    const counts: Record<FilterId, number> = { all: 0, hot: 0, warm: 0, cold: 0, trash: 0, pushed: 0, returned: 0 }
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

  const selectedLead = leads.find((l) => l.id === selectedLeadId) ?? null

  function handleSelectLead(id: string) {
    setSelectedLeadId(id)
    setMobileDrawerOpen(true)
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

  async function handleAction(action: string, _classification?: string, reason?: string) {
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
    <PageLayout title="Inbox & Lead" noHeader>
      {/* Full-height panel matching HTML .ill layout */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 44px)',
        margin: -20,
        background: '#fff',
      }}>
        {/* Page header */}
        <div style={{
          height: 52,
          borderBottom: '1px solid rgba(0,0,0,0.09)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 12,
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', flex: 1 }}>
            📩 Inbox & Lead
          </div>
          {/* Status pills */}
          <div style={{ display: 'flex', gap: 6 }}>
            {FILTER_CHIPS.map((chip) => {
              const isActive = activeFilter === chip.id
              const count = countByFilter[chip.id]
              return (
                <button
                  key={chip.id}
                  onClick={() => { setActiveFilter(chip.id); setSelectedLeadId(null) }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: isActive ? 'none' : '1px solid rgba(0,0,0,0.12)',
                    background: isActive ? chip.activeColor : 'transparent',
                    color: isActive ? '#fff' : chip.color,
                    transition: 'all 0.15s',
                  }}
                >
                  {chip.label}
                  {!isLoading && count > 0 && (
                    <span style={{
                      background: isActive ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.08)',
                      borderRadius: 999,
                      padding: '0 5px',
                      fontSize: 10,
                      fontWeight: 700,
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Split panel — matches HTML .ill (2-column grid) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, minHeight: 0 }}>
          {/* Left: Inbox list */}
          <div style={{
            borderRight: '1px solid rgba(0,0,0,0.09)',
            overflowY: 'auto',
            background: '#f9fafb',
            display: mobileDrawerOpen && selectedLeadId ? 'none' : 'block',
          }}
            className="md:block"
          >
            <InboxList
              leads={leads}
              isLoading={isLoading}
              selectedLeadId={selectedLeadId}
              onSelectLead={handleSelectLead}
            />
          </div>

          {/* Right: Lead detail */}
          <div style={{ overflowY: 'auto', background: '#fff' }}>
            {selectedLead ? (
              <>
                {/* Detail header */}
                <div style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  background: '#fff',
                  borderBottom: '1px solid rgba(0,0,0,0.07)',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedLead.full_name}
                  </div>
                  <button
                    onClick={handleCloseDrawer}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      fontSize: 18,
                      padding: 4,
                      borderRadius: 6,
                    }}
                  >
                    ✕
                  </button>
                </div>
                <InlineLeadDetail lead={selectedLead} onAction={handleAction} isActioning={isActioning} />
              </>
            ) : isLoading ? (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Skeleton variant="card" />
                <Skeleton variant="line" lines={4} />
              </div>
            ) : (
              <EmptyState
                title="Chọn một lead để xem chi tiết"
                description="Nhấp vào một lead từ danh sách bên trái để xem thông tin và phân loại."
                icon="👈"
              />
            )}
          </div>
        </div>

        {/* Mobile drawer */}
        <div className="md:hidden">
          <LeadDetailDrawer
            leadId={mobileDrawerOpen ? selectedLeadId : null}
            onClose={handleCloseDrawer}
          />
        </div>
      </div>
    </PageLayout>
  )
}
