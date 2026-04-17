import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageLayout } from '@/shared/components/PageLayout'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { apiClient } from '@/shared/config/api-client'
import type { AnalyticsByChannel } from '../analytics.types'

type PeriodTab = 'week' | 'month' | 'last_month'

function getMondayOfCurrentWeek(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.getFullYear(), now.getMonth(), diff)
  return monday.toISOString().slice(0, 10)
}

function getFirstDayOfCurrentMonth(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
}

function getFirstDayOfLastMonth(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
}

function getPeriodParams(tab: PeriodTab): { period_type: string; period_start: string } {
  switch (tab) {
    case 'week':
      return { period_type: 'weekly', period_start: getMondayOfCurrentWeek() }
    case 'month':
      return { period_type: 'monthly', period_start: getFirstDayOfCurrentMonth() }
    case 'last_month':
      return { period_type: 'monthly', period_start: getFirstDayOfLastMonth() }
  }
}

function formatReach(n: number | null): string {
  if (n === null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function formatVnd(n: number | null): string {
  if (n === null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString('vi-VN')
}

function erColor(pct: number | null): string {
  if (pct === null) return 'text-gray-400'
  if (pct >= 3) return 'text-green-600'
  if (pct >= 1) return 'text-yellow-600'
  return 'text-red-600'
}

async function exportToXlsx(rows: AnalyticsByChannel[]) {
  const xlsx = await import('xlsx')
  const data = rows.map((r) => ({
    'Kênh': r.channel_label,
    'Reach': r.reach ?? '',
    'ER%': r.engagement_rate_pct !== null ? `${r.engagement_rate_pct}%` : '',
    'Lead': r.lead_count ?? '',
    'CPL': r.cpl_actual !== null ? r.cpl_actual : '',
    'Chi phí': r.spend_vnd ?? '',
    'Ngân sách': r.allocated_vnd ?? '',
  }))
  const ws = xlsx.utils.json_to_sheet(data)
  const wb = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(wb, ws, 'Analytics')
  xlsx.writeFile(wb, 'analytics.xlsx')
}

function KpiCard({ channel }: { channel: AnalyticsByChannel }) {
  const budgetPct = channel.budget_used_pct ?? 0
  const budgetDanger = budgetPct >= 80

  return (
    <div style={{
      background: '#fff',
      borderRadius: 13,
      border: '1px solid rgba(0,0,0,0.09)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      padding: 14,
    }}>
      {/* Channel header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <span
          style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            backgroundColor: channel.channel_color || '#6B7280',
          }}
        />
        <span style={{ fontWeight: 700, color: '#111827', fontSize: 13, flex: 1 }}>
          {channel.channel_label}
        </span>
        <Badge variant="gray">
          {channel.data_source.replace(/_/g, ' ')}
        </Badge>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {[
          { label: 'Reach', value: formatReach(channel.reach), color: undefined },
          {
            label: 'ER%',
            value: channel.engagement_rate_pct !== null ? `${channel.engagement_rate_pct.toFixed(1)}%` : '—',
            color: channel.engagement_rate_pct !== null
              ? channel.engagement_rate_pct >= 3 ? '#16a34a' : channel.engagement_rate_pct >= 1 ? '#d97706' : '#ef4444'
              : undefined,
          },
          {
            label: 'Lead',
            value: channel.lead_count !== null ? channel.lead_count.toLocaleString() : '—',
            color: undefined,
          },
          {
            label: 'CPL',
            value: formatVnd(channel.cpl_actual),
            color: channel.cpl_actual !== null && channel.cpl_benchmark !== null && channel.cpl_actual > channel.cpl_benchmark
              ? '#ef4444' : '#111827',
          },
        ].map((item) => (
          <div key={item.label}>
            <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: item.color ?? '#111827', lineHeight: 1.2 }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Budget bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: budgetDanger ? '#ef4444' : '#9ca3af', marginBottom: 4 }}>
          <span>Ngân sách đã dùng</span>
          <span style={{ fontWeight: budgetDanger ? 700 : 400 }}>
            {channel.budget_used_pct !== null ? `${channel.budget_used_pct.toFixed(0)}%` : '—'}
          </span>
        </div>
        <div style={{ background: '#f3f4f6', borderRadius: 999, height: 5, overflow: 'hidden' }}>
          <div
            style={{
              height: 5,
              borderRadius: 999,
              width: `${Math.min(budgetPct, 100)}%`,
              background: budgetDanger ? '#ef4444' : '#2d9b6b',
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>
    </div>
  )
}

const TABS: { key: PeriodTab; label: string }[] = [
  { key: 'week', label: 'Tuần này' },
  { key: 'month', label: 'Tháng này' },
  { key: 'last_month', label: 'Tháng trước' },
]

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<PeriodTab>('week')
  const [isExporting, setIsExporting] = useState(false)

  const { period_type, period_start } = getPeriodParams(activeTab)

  const { data, isLoading } = useQuery<AnalyticsByChannel[]>({
    queryKey: ['analytics', period_type, period_start],
    queryFn: () =>
      apiClient.get(
        `/api/v1/marketing/analytics/summary?period_type=${period_type}&period_start=${period_start}`,
      ),
  })

  const channels: AnalyticsByChannel[] = data ?? []

  async function handleExport() {
    if (!channels.length) return
    setIsExporting(true)
    try {
      await exportToXlsx(channels)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <PageLayout
      title="Kết quả & KPI"
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExport}
          isLoading={isExporting}
          disabled={!channels.length}
        >
          Xuất Excel
        </Button>
      }
    >
      {/* Period tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 20,
        background: 'rgba(0,0,0,0.05)',
        borderRadius: 10,
        padding: 4,
        width: 'fit-content',
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '5px 14px',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: activeTab === tab.key ? '#fff' : 'transparent',
              color: activeTab === tab.key ? '#111827' : '#6b7280',
              boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      ) : channels.length === 0 ? (
        <EmptyState
          title="Chưa có dữ liệu"
          description="Không có dữ liệu analytics cho kỳ này."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
          {channels.map((ch) => (
            <KpiCard key={ch.channel_id} channel={ch} />
          ))}
        </div>
      )}
    </PageLayout>
  )
}
