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
    accent === 'red'
      ? 'text-red-600'
      : accent === 'green'
      ? 'text-green-600'
      : 'text-gray-900'

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-2">
      <p className="text-xs font-medium text-gray-500 font-body uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold font-headline ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 font-body">{sub}</p>}
      {children}
    </div>
  )
}

function ProgressBar({
  pct,
  warning,
}: {
  pct: number
  warning?: boolean
}) {
  const color =
    pct >= 80 || warning ? 'bg-red-500' : pct >= 60 ? 'bg-yellow-400' : 'bg-green-500'
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
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
      <div className="space-y-6">
        {/* Month selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMonthIdx((i) => Math.max(0, i - 1))}
            disabled={monthIdx === 0}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Tháng trước"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-800 font-body min-w-[110px] text-center">
            {selectedMonth.label}
          </span>
          <button
            onClick={() => setMonthIdx((i) => Math.min(MONTHS.length - 1, i + 1))}
            disabled={monthIdx === MONTHS.length - 1}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Tháng sau"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Budget warning banner */}
        {summary?.budget_warning && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <span className="text-lg">⚠️</span>
            <p className="text-sm font-medium text-red-700 font-body">
              Đã dùng {Math.round(summary.budget_used_pct)}% ngân sách tháng này.
              Hãy kiểm tra và điều chỉnh phân bổ.
            </p>
          </div>
        )}

        {/* KPI cards */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold font-headline text-gray-900">
                  CPL theo kênh
                </h2>
                <p className="text-xs text-gray-400 font-body mt-0.5">Sắp xếp theo CPL thực tế tăng dần</p>
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
