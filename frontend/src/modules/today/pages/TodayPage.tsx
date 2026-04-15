import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { PageLayout } from '@/shared/components/PageLayout'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { apiClient } from '@/shared/config/api-client'
import { useTodaySummary } from '../hooks/useTodaySummary'
import { AlertStrip } from '../components/AlertStrip'
import { LeadQuickActions } from '../components/LeadQuickActions'

function formatDate(date: Date): string {
  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

interface StatCardProps {
  label: string
  value: number
  colorClass: string
  icon: React.ReactNode
}

function StatCard({ label, value, colorClass, icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
      <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 font-body uppercase tracking-wide">
          {label}
        </p>
        <p className={`mt-0.5 text-2xl font-bold font-headline ${colorClass.includes('red') ? 'text-red-600' : colorClass.includes('orange') ? 'text-orange-600' : colorClass.includes('blue') ? 'text-blue-600' : 'text-gray-800'}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

export function TodayPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useTodaySummary()

  function handleRepNow(entityId: string) {
    navigate(`/inbox?lead_id=${entityId}`)
  }

  async function handleLeadAction(
    leadId: string,
    action: 'hot' | 'warm' | 'cold' | 'trash',
  ): Promise<void> {
    await apiClient.post(`/api/v1/marketing/leads/${leadId}/actions`, {
      action_type: action,
    })
    await queryClient.invalidateQueries({ queryKey: ['today', 'summary'] })
  }

  const today = formatDate(new Date())

  if (isError) {
    return (
      <PageLayout title="Hôm nay">
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <p className="text-gray-500 font-body">
              Không thể tải dữ liệu. Vui lòng thử lại.
            </p>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title={`Hôm nay · ${today}`}>
      <div className="space-y-6">
        {/* Alert Strip */}
        {isLoading ? null : data && data.alerts.length > 0 ? (
          <AlertStrip alerts={data.alerts} onRepNow={handleRepNow} />
        ) : null}

        {/* Stats Row */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Leads chờ"
              value={data?.leads_pending_count ?? 0}
              colorClass="bg-blue-50 text-blue-600"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            <StatCard
              label="Quá SLA"
              value={data?.leads_sla_overdue_count ?? 0}
              colorClass="bg-red-50 text-red-600"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
            <StatCard
              label="Bài hôm nay"
              value={data?.posts_scheduled_today ?? 0}
              colorClass="bg-green-50 text-green-600"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <StatCard
              label="Chờ duyệt"
              value={data?.posts_pending_review ?? 0}
              colorClass="bg-orange-50 text-orange-600"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              }
            />
          </div>
        )}

        {/* Quick Lead Classification */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold font-headline text-gray-900 mb-4">
            Phân loại nhanh
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="card" />
              ))}
            </div>
          ) : !data?.quick_leads || data.quick_leads.length === 0 ? (
            <EmptyState
              title="Không có lead nào cần phân loại"
              description="Khi có lead mới từ các kênh, chúng sẽ xuất hiện tại đây để bạn phân loại nhanh."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.quick_leads.map((lead) => (
                <LeadQuickActions
                  key={lead.id}
                  lead={lead}
                  onAction={handleLeadAction}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
