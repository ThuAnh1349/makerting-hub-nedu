import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageLayout } from '@/shared/components/PageLayout'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { apiClient } from '@/shared/config/api-client'
import { useAuthStore } from '@/shared/stores/auth.store'
import { ROLES } from '@/shared/constants/roles'
import { NPSCard } from '../components/NPSCard'
import { SentimentChart } from '../components/SentimentChart'
import { CrisisModal } from '../components/CrisisModal'
import type { BrandHealthEntry } from '../brand-health.types'

export function BrandHealthPage() {
  const [crisisOpen, setCrisisOpen] = useState(false)
  const { hasRole } = useAuthStore()
  const queryClient = useQueryClient()

  const isLeader = hasRole(ROLES.MARKETING_LEADER)

  const { data, isLoading } = useQuery<BrandHealthEntry[]>({
    queryKey: ['brand-health'],
    queryFn: () => apiClient.get('/api/v1/marketing/brand-health'),
  })

  const crisisMutation = useMutation({
    mutationFn: (payload: { title: string; description?: string }) =>
      apiClient.post('/api/v1/marketing/brand-health/crisis', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-health'] })
    },
  })

  async function handleActivateCrisis(title: string, desc?: string) {
    await crisisMutation.mutateAsync({ title, description: desc })
  }

  const entries: BrandHealthEntry[] = data ?? []
  const latest = entries[0] ?? null

  const totalSentiment =
    (latest?.sentiment_positive ?? 0) +
    (latest?.sentiment_neutral ?? 0) +
    (latest?.sentiment_negative ?? 0)

  return (
    <PageLayout
      title="Brand Health"
      actions={
        isLeader ? (
          <Button variant="danger" size="sm" onClick={() => setCrisisOpen(true)}>
            Kích hoạt Crisis Mode
          </Button>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
          <Skeleton variant="card" className="h-32" />
        </div>
      ) : !latest ? (
        <EmptyState
          title="Chưa có dữ liệu Brand Health"
          description="Dữ liệu sẽ xuất hiện sau khi được nhập thủ công hoặc đồng bộ từ Brand24."
        />
      ) : (
        <div className="space-y-6">
          {/* Top KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <NPSCard npsScore={latest.nps_score} />

            {/* Share of Voice */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-3">
              <p className="text-xs font-medium text-gray-500 font-body uppercase tracking-wide">
                Share of Voice
              </p>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold font-headline text-gray-900">
                  {latest.share_of_voice_pct !== null
                    ? `${latest.share_of_voice_pct.toFixed(1)}`
                    : '—'}
                </span>
                {latest.share_of_voice_pct !== null && (
                  <span className="text-lg text-gray-400 mb-0.5">%</span>
                )}
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-blue-500"
                  style={{ width: `${Math.min(latest.share_of_voice_pct ?? 0, 100)}%` }}
                />
              </div>
            </div>

            {/* Brand Mentions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-3">
              <p className="text-xs font-medium text-gray-500 font-body uppercase tracking-wide">
                Brand Mentions
              </p>
              <p className="text-3xl font-bold font-headline text-gray-900">
                {latest.brand_mentions !== null
                  ? latest.brand_mentions.toLocaleString()
                  : '—'}
              </p>
              <p className="text-xs text-gray-400 font-body">
                Tuần {new Date(latest.week_start).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>

          {/* Sentiment Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold font-headline text-gray-900">
              Phân tích Sentiment
            </h2>
            {totalSentiment > 0 ? (
              <SentimentChart
                positive={latest.sentiment_positive ?? 0}
                neutral={latest.sentiment_neutral ?? 0}
                negative={latest.sentiment_negative ?? 0}
              />
            ) : (
              <p className="text-sm text-gray-400 font-body">Chưa có dữ liệu sentiment.</p>
            )}
          </div>

          {/* Negative Topics */}
          {latest.negative_topics && latest.negative_topics.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
              <h2 className="text-base font-semibold font-headline text-gray-900">
                Chủ đề tiêu cực nổi bật
              </h2>
              <ul className="space-y-2">
                {latest.negative_topics.map((t) => (
                  <li key={t.topic} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700 font-body">{t.topic}</span>
                    <Badge variant="red">{t.mention_count} lượt</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Historical data */}
          {entries.length > 1 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold font-headline text-gray-900">
                  Lịch sử theo tuần
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-body">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium text-gray-600">Tuần</th>
                      <th className="text-right px-5 py-3 font-medium text-gray-600">NPS</th>
                      <th className="text-right px-5 py-3 font-medium text-gray-600">SoV %</th>
                      <th className="text-right px-5 py-3 font-medium text-gray-600">Mentions</th>
                      <th className="text-right px-5 py-3 font-medium text-gray-600">Nguồn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-gray-700">
                          {new Date(entry.week_start).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {entry.nps_score !== null ? (
                            <span
                              className={
                                entry.nps_score >= 50
                                  ? 'text-green-600 font-semibold'
                                  : entry.nps_score >= 30
                                  ? 'text-yellow-600 font-semibold'
                                  : 'text-red-600 font-semibold'
                              }
                            >
                              {entry.nps_score}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-700">
                          {entry.share_of_voice_pct !== null
                            ? `${entry.share_of_voice_pct}%`
                            : '—'}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-700">
                          {entry.brand_mentions?.toLocaleString() ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Badge variant="gray">{entry.data_source}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <CrisisModal
        isOpen={crisisOpen}
        onClose={() => setCrisisOpen(false)}
        onActivate={handleActivateCrisis}
      />
    </PageLayout>
  )
}
