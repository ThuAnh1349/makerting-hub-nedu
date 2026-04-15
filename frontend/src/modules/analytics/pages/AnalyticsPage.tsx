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
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
      {/* Channel header */}
      <div className="flex items-center gap-2">
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: channel.channel_color || '#6B7280' }}
        />
        <span className="font-semibold text-gray-900 font-headline text-sm">
          {channel.channel_label}
        </span>
        <span className="ml-auto">
          <Badge variant="gray" className="text-xs capitalize">
            {channel.data_source.replace(/_/g, ' ')}
          </Badge>
        </span>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500 text-xs mb-0.5">Reach</p>
          <p className="font-semibold text-gray-800">{formatReach(channel.reach)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-0.5">Engagement Rate</p>
          <p className={`font-semibold ${erColor(channel.engagement_rate_pct)}`}>
            {channel.engagement_rate_pct !== null
              ? `${channel.engagement_rate_pct.toFixed(1)}%`
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-0.5">Lead</p>
          <p className="font-semibold text-gray-800">
            {channel.lead_count !== null ? channel.lead_count.toLocaleString() : '—'}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-0.5">CPL</p>
          <p
            className={`font-semibold ${
              channel.cpl_actual !== null &&
              channel.cpl_benchmark !== null &&
              channel.cpl_actual > channel.cpl_benchmark
                ? 'text-red-600'
                : 'text-gray-800'
            }`}
          >
            {formatVnd(channel.cpl_actual)}
            {channel.cpl_benchmark !== null && (
              <span className="text-gray-400 text-xs font-normal ml-1">
                / {formatVnd(channel.cpl_benchmark)}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Budget bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Ngân sách dùng</span>
          <span className={budgetDanger ? 'text-red-600 font-semibold' : ''}>
            {channel.budget_used_pct !== null ? `${channel.budget_used_pct.toFixed(0)}%` : '—'}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${budgetDanger ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${Math.min(budgetPct, 100)}%` }}
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
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium font-body transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {channels.map((ch) => (
            <KpiCard key={ch.channel_id} channel={ch} />
          ))}
        </div>
      )}
    </PageLayout>
  )
}
