import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageLayout } from '@/shared/components/PageLayout'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { apiClient } from '@/shared/config/api-client'
import type { BudgetSummary } from '../budget.types'

async function exportBudgetToXlsx(summary: BudgetSummary, monthLabel: string) {
  const xlsx = await import('xlsx')

  // Summary sheet
  const summaryData = [
    { 'Chỉ số': 'Tổng chi phí', 'Giá trị': summary.total_spent_vnd },
    { 'Chỉ số': 'Tổng ngân sách', 'Giá trị': summary.total_allocated_vnd },
    { 'Chỉ số': 'CPL trung bình', 'Giá trị': summary.overall_cpl ?? '' },
    { 'Chỉ số': 'Tổng lead', 'Giá trị': summary.total_leads },
    { 'Chỉ số': '% Ngân sách dùng', 'Giá trị': `${Math.round(summary.budget_used_pct)}%` },
  ]

  // By channel sheet
  const channelData = summary.by_channel.map((ch) => ({
    'Kênh': ch.channel_label,
    'Chi phí (VND)': ch.spend_vnd ?? '',
    'Ngân sách (VND)': ch.allocated_vnd ?? '',
    '% Dùng': ch.budget_used_pct != null ? `${Math.round(ch.budget_used_pct)}%` : '',
    'Lead': ch.lead_count ?? '',
    'CPL thực (VND)': ch.cpl_actual ?? '',
    'CPL benchmark (VND)': ch.cpl_benchmark ?? '',
    'Trạng thái': ch.cpl_actual != null && ch.cpl_benchmark != null
      ? ch.cpl_actual <= ch.cpl_benchmark ? 'Tốt' : 'Vượt ngưỡng'
      : 'N/A',
  }))

  const wb = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(summaryData), 'Tổng quan')
  xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(channelData), 'Theo kênh')
  xlsx.writeFile(wb, `budget_${monthLabel.replace(/\//g, '-')}.xlsx`)
}

function formatVND(n: number | null | undefined): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('vi-VN').format(n) + ' ₫'
}

function formatVNDShort(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M ₫`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K ₫`
  return formatVND(n)
}

const MONTHS = [
  { label: 'Tháng 1/2026', value: '2026-01-01' },
  { label: 'Tháng 2/2026', value: '2026-02-01' },
  { label: 'Tháng 3/2026', value: '2026-03-01' },
  { label: 'Tháng 4/2026', value: '2026-04-01' },
  { label: 'Tháng 5/2026', value: '2026-05-01' },
]

interface KPICardProps {
  label: string
  value: string
  sub?: string
  accent?: 'red' | 'green' | 'neutral'
  children?: React.ReactNode
}

function KPICard({ label, value, sub, accent = 'neutral', children }: KPICardProps) {
  const valueColor =
    accent === 'red' ? '#ef4444' : accent === 'green' ? '#2d9b6b' : '#111827'

  return (
    <div style={{
      background: '#fff',
      borderRadius: 13,
      border: '1px solid rgba(0,0,0,0.09)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: valueColor, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#9ca3af' }}>{sub}</div>}
      {children}
    </div>
  )
}

function ProgressBar({ pct, warning }: { pct: number; warning?: boolean }) {
  const color = pct >= 80 || warning ? '#ef4444' : pct >= 60 ? '#d97706' : '#2d9b6b'
  return (
    <div style={{ background: '#f3f4f6', borderRadius: 999, height: 5, overflow: 'hidden' }}>
      <div style={{
        height: 5,
        borderRadius: 999,
        width: `${Math.min(pct, 100)}%`,
        background: color,
        transition: 'width 0.3s',
      }} />
    </div>
  )
}

function CPLStatusBadge({
  actual,
  benchmark,
}: {
  actual: number | null
  benchmark: number | null
}) {
  if (actual == null || benchmark == null) {
    return <Badge variant="gray">N/A</Badge>
  }
  if (actual <= benchmark) {
    return <Badge variant="green">Tốt</Badge>
  }
  const overpct = Math.round(((actual - benchmark) / benchmark) * 100)
  return <Badge variant="red">+{overpct}%</Badge>
}

export function BudgetPage() {
  const [monthIdx, setMonthIdx] = useState(3) // Default: Tháng 4/2026
  const [isExporting, setIsExporting] = useState(false)

  const selectedMonth = MONTHS[monthIdx]

  const {
    data: summary,
    isLoading,
    isError,
  } = useQuery<BudgetSummary>({
    queryKey: ['budget-summary', selectedMonth.value],
    queryFn: () =>
      apiClient.get<BudgetSummary>(
        `/api/v1/marketing/budget/summary?month=${selectedMonth.value}`,
      ),
  })

  async function handleExport() {
    if (!summary) return
    setIsExporting(true)
    try {
      await exportBudgetToXlsx(summary, selectedMonth.label)
    } finally {
      setIsExporting(false)
    }
  }

  const sortedChannels = summary
    ? [...summary.by_channel].sort((a, b) => {
        if (a.cpl_actual == null) return 1
        if (b.cpl_actual == null) return -1
        return a.cpl_actual - b.cpl_actual
      })
    : []

  const usedPct = summary?.budget_used_pct ?? 0

  return (
    <PageLayout
      title="Budget & ROI"
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExport}
          isLoading={isExporting}
          disabled={!summary}
        >
          Xuất Excel
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Month selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setMonthIdx((i) => Math.max(0, i - 1))}
            disabled={monthIdx === 0}
            style={{
              background: 'none', border: '1px solid rgba(0,0,0,0.12)',
              borderRadius: 7, padding: '4px 8px', cursor: monthIdx === 0 ? 'not-allowed' : 'pointer',
              color: '#374151', fontSize: 14, opacity: monthIdx === 0 ? 0.3 : 1,
            }}
            aria-label="Tháng trước"
          >
            ‹
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', minWidth: 120, textAlign: 'center' }}>
            {selectedMonth.label}
          </span>
          <button
            onClick={() => setMonthIdx((i) => Math.min(MONTHS.length - 1, i + 1))}
            disabled={monthIdx === MONTHS.length - 1}
            style={{
              background: 'none', border: '1px solid rgba(0,0,0,0.12)',
              borderRadius: 7, padding: '4px 8px', cursor: monthIdx === MONTHS.length - 1 ? 'not-allowed' : 'pointer',
              color: '#374151', fontSize: 14, opacity: monthIdx === MONTHS.length - 1 ? 0.3 : 1,
            }}
            aria-label="Tháng sau"
          >
            ›
          </button>
        </div>

        {/* Budget warning banner */}
        {summary?.budget_warning && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 11,
            padding: '10px 14px',
          }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#b91c1c' }}>
              Đã dùng {Math.round(summary.budget_used_pct)}% ngân sách tháng này.
              Hãy kiểm tra và điều chỉnh phân bổ.
            </span>
          </div>
        )}

        {/* KPI cards */}
        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 13, padding: 16, border: '1px solid rgba(0,0,0,0.09)' }}>
                <Skeleton variant="line" lines={3} />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <EmptyState
            title="Không thể tải dữ liệu"
            description="Đã xảy ra lỗi khi tải ngân sách. Vui lòng thử lại."
          />
        )}

        {summary && !isLoading && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {/* KPI 1: Total budget */}
              <KPICard
                label="Tổng ngân sách"
                value={`${formatVNDShort(summary.total_spent_vnd)} / ${formatVNDShort(summary.total_allocated_vnd)}`}
                accent={usedPct >= 80 ? 'red' : 'neutral'}
              >
                <div className="mt-1">
                  <ProgressBar pct={usedPct} warning={summary.budget_warning} />
                  <p className="text-xs text-gray-400 font-body mt-1">
                    {Math.round(usedPct)}% đã sử dụng
                  </p>
                </div>
              </KPICard>

              {/* KPI 2: CPL */}
              <KPICard
                label="CPL trung bình"
                value={summary.overall_cpl != null ? formatVND(summary.overall_cpl) : '—'}
                sub="VND / lead — benchmark thị trường ~180.000 ₫"
                accent={
                  summary.overall_cpl != null
                    ? summary.overall_cpl <= 180000
                      ? 'green'
                      : 'red'
                    : 'neutral'
                }
              />

              {/* KPI 3: Total leads */}
              <KPICard
                label="Tổng lead"
                value={String(summary.total_leads)}
                sub="Lead từ các kênh trả phí"
                accent="neutral"
              />
            </div>

            {/* CPL comparison table */}
            <div style={{
              background: '#fff',
              borderRadius: 13,
              border: '1px solid rgba(0,0,0,0.09)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                  💰 CPL theo kênh
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Sắp xếp theo CPL thực tế tăng dần</div>
              </div>

              {/* Table header */}
              <div className="hidden md:grid grid-cols-6 gap-4 px-5 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide font-body">
                <span className="col-span-1">Kênh</span>
                <span className="col-span-1 text-right">Chi phí</span>
                <span className="col-span-1 text-right">Lead</span>
                <span className="col-span-1 text-right">CPL thực</span>
                <span className="col-span-1 text-right">CPL benchmark</span>
                <span className="col-span-1 text-center">Trạng thái</span>
              </div>

              <div className="divide-y divide-gray-100">
                {sortedChannels.map((ch) => {
                  const isGood =
                    ch.cpl_actual != null &&
                    ch.cpl_benchmark != null &&
                    ch.cpl_actual <= ch.cpl_benchmark
                  const isOver =
                    ch.cpl_actual != null &&
                    ch.cpl_benchmark != null &&
                    ch.cpl_actual > ch.cpl_benchmark

                  return (
                    <div
                      key={ch.channel_id}
                      className="px-5 py-4 space-y-2"
                    >
                      {/* Mobile + desktop row */}
                      <div className="md:grid md:grid-cols-6 md:gap-4 md:items-center flex flex-wrap gap-2 items-center">
                        {/* Channel label */}
                        <div className="col-span-1 flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: ch.channel_color }}
                          />
                          <span className="text-sm font-medium text-gray-800 font-body">
                            {ch.channel_label}
                          </span>
                        </div>

                        {/* Spend */}
                        <div className="col-span-1 md:text-right">
                          <span className="text-xs text-gray-500 font-body md:hidden">Chi phí: </span>
                          <span
                            className={`text-sm font-body ${
                              ch.budget_used_pct != null && ch.budget_used_pct >= 80
                                ? 'text-red-600 font-semibold'
                                : 'text-gray-700'
                            }`}
                          >
                            {formatVNDShort(ch.spend_vnd)}
                          </span>
                        </div>

                        {/* Leads */}
                        <div className="col-span-1 md:text-right">
                          <span className="text-xs text-gray-500 font-body md:hidden">Lead: </span>
                          <span className="text-sm text-gray-700 font-body">
                            {ch.lead_count ?? '—'}
                          </span>
                        </div>

                        {/* CPL actual */}
                        <div className="col-span-1 md:text-right">
                          <span className="text-xs text-gray-500 font-body md:hidden">CPL thực: </span>
                          <span
                            className={`text-sm font-semibold font-body ${
                              isGood ? 'text-green-600' : isOver ? 'text-red-600' : 'text-gray-700'
                            }`}
                          >
                            {formatVND(ch.cpl_actual)}
                          </span>
                        </div>

                        {/* CPL benchmark */}
                        <div className="col-span-1 md:text-right">
                          <span className="text-xs text-gray-500 font-body md:hidden">Benchmark: </span>
                          <span className="text-sm text-gray-500 font-body">
                            {formatVND(ch.cpl_benchmark)}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="col-span-1 md:flex md:justify-center">
                          <CPLStatusBadge actual={ch.cpl_actual} benchmark={ch.cpl_benchmark} />
                        </div>
                      </div>

                      {/* Budget progress bar per row */}
                      {ch.budget_used_pct != null && (
                        <div>
                          <div className="flex justify-between text-xs text-gray-400 font-body mb-0.5">
                            <span>Ngân sách đã dùng</span>
                            <span>{Math.round(ch.budget_used_pct)}%</span>
                          </div>
                          <ProgressBar
                            pct={ch.budget_used_pct}
                            warning={ch.budget_used_pct >= 80}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  )
}
