import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageLayout } from '@/shared/components/PageLayout'
import { Badge } from '@/shared/components/ui/Badge'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { apiClient } from '@/shared/config/api-client'
import { AmbassadorLeaderboard } from '../components/AmbassadorLeaderboard'
import { ReferralLinkPanel } from '../components/ReferralLinkPanel'
import type { Ambassador, ReferralLead } from '../referral.types'

const STATUS_CONFIG: Record<string, { label: string; variant: 'yellow' | 'green' | 'blue' | 'red' | 'gray' }> = {
  new: { label: 'Mới', variant: 'blue' },
  contacted: { label: 'Đã liên hệ', variant: 'yellow' },
  qualified: { label: 'Qualified', variant: 'green' },
  enrolled: { label: 'Đã đăng ký', variant: 'green' },
  lost: { label: 'Không chuyển', variant: 'red' },
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, variant: 'gray' as const }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
      <p className="text-xs font-medium text-gray-500 font-body uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold font-headline text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 font-body mt-0.5">{sub}</p>}
    </div>
  )
}

export function ReferralPage() {
  const [selectedAmbassador, setSelectedAmbassador] = useState<Ambassador | null>(null)

  const {
    data: ambassadors = [],
    isLoading: loadingAmb,
  } = useQuery<Ambassador[]>({
    queryKey: ['referral-ambassadors'],
    queryFn: () => apiClient.get<Ambassador[]>('/api/v1/marketing/referral/ambassadors'),
    onSuccess: (data) => {
      if (data.length > 0 && !selectedAmbassador) {
        const sorted = [...data].sort((a, b) => b.total_referrals - a.total_referrals)
        setSelectedAmbassador(sorted[0])
      }
    },
  } as Parameters<typeof useQuery>[0])

  const {
    data: leads = [],
    isLoading: loadingLeads,
  } = useQuery<ReferralLead[]>({
    queryKey: ['referral-leads'],
    queryFn: () => apiClient.get<ReferralLead[]>('/api/v1/marketing/referral/leads'),
  })

  // Derived stats
  const totalReferrals = ambassadors.reduce((sum, a) => sum + a.total_referrals, 0)
  const totalConverted = ambassadors.reduce((sum, a) => sum + a.converted_referrals, 0)
  const conversionRate = totalReferrals > 0 ? Math.round((totalConverted / totalReferrals) * 100) : 0
  const bestAmbassador = [...ambassadors].sort((a, b) => b.total_referrals - a.total_referrals)[0]

  // Leads filtered to selected ambassador
  const visibleLeads = selectedAmbassador
    ? leads.filter((l) => l.ambassador_display_name === selectedAmbassador.display_name)
    : leads

  return (
    <PageLayout title="Referral Loop">
      <div className="space-y-6">
        {/* Top stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Referral leads tháng này"
            value={totalReferrals}
            sub="Từ tất cả ambassador"
          />
          <StatCard
            label="Tỉ lệ chuyển đổi"
            value={`${conversionRate}%`}
            sub={`${totalConverted} / ${totalReferrals} leads`}
          />
          <StatCard
            label="Ambassador tốt nhất"
            value={bestAmbassador?.display_name ?? '—'}
            sub={bestAmbassador ? `${bestAmbassador.total_referrals} referrals` : undefined}
          />
        </div>

        {/* Main content: leaderboard + panel */}
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Leaderboard — 60% */}
          <div className="lg:w-[60%]">
            {loadingAmb ? (
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} variant="line" lines={2} />
                ))}
              </div>
            ) : ambassadors.length === 0 ? (
              <EmptyState
                title="Chưa có ambassador"
                description="Chưa có ambassador nào được thiết lập trong hệ thống."
              />
            ) : (
              <AmbassadorLeaderboard
                ambassadors={ambassadors}
                selectedId={selectedAmbassador?.id ?? null}
                onSelect={setSelectedAmbassador}
              />
            )}
          </div>

          {/* Right column — 40% */}
          <div className="lg:w-[40%] space-y-4">
            {/* Ambassador panel */}
            {selectedAmbassador ? (
              <ReferralLinkPanel ambassador={selectedAmbassador} />
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-center h-40">
                <p className="text-sm text-gray-400 font-body">
                  Chọn ambassador để xem chi tiết
                </p>
              </div>
            )}

            {/* Recent referral leads */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold font-headline text-gray-900">
                  Lead gần đây
                  {selectedAmbassador && (
                    <span className="ml-1 font-normal text-gray-500">
                      — {selectedAmbassador.display_name}
                    </span>
                  )}
                </h3>
                {selectedAmbassador && (
                  <button
                    onClick={() => setSelectedAmbassador(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 font-body transition-colors"
                  >
                    Xem tất cả
                  </button>
                )}
              </div>

              {loadingLeads ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} variant="line" lines={2} />
                  ))}
                </div>
              ) : visibleLeads.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-400 font-body">Chưa có lead nào</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {visibleLeads.slice(0, 8).map((lead) => {
                    const statusCfg = getStatusConfig(lead.current_status)
                    return (
                      <div
                        key={lead.id}
                        className="px-4 py-3 flex items-center gap-3"
                      >
                        {/* Channel dot */}
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: lead.channel.color_hex }}
                          title={lead.channel.label}
                        />

                        {/* Lead info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 font-body truncate">
                            {lead.full_name}
                          </p>
                          <p className="text-xs text-gray-400 font-body">
                            {lead.ambassador_display_name ?? 'N/A'} · {timeAgo(lead.ops_synced_at)}
                          </p>
                        </div>

                        {/* Status */}
                        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
