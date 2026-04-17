import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { PageLayout } from '@/shared/components/PageLayout'
import { Skeleton } from '@/shared/components/ui/Skeleton'
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

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number | string
  emoji: string
  accent: string   // CSS color for accent
  sub?: string
}

function StatCard({ label, value, emoji, accent, sub }: StatCardProps) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 13,
      border: '1px solid rgba(0,0,0,0.09)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      padding: 14,
      cursor: 'pointer',
      transition: 'box-shadow 0.15s, transform 0.15s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 22 }}>{emoji}</div>
        {sub && (
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#fff',
            background: accent,
            borderRadius: 999,
            padding: '2px 6px',
          }}>
            {sub}
          </span>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{label}</div>
    </div>
  )
}

// ── TodayPage ─────────────────────────────────────────────────────────────────

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
  const greeting = new Date().getHours() < 12 ? 'buổi sáng ☀️' : new Date().getHours() < 18 ? 'buổi chiều 🌤' : 'buổi tối 🌙'

  return (
    <PageLayout title="Hôm nay" subtitle={today}>
      <div style={{ maxWidth: 1100 }}>

        {/* Greeting + alert strip */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
            Chào {greeting}!
          </div>
          {!isLoading && data?.alerts && data.alerts.length > 0 && (
            <AlertStrip alerts={data.alerts} onRepNow={handleRepNow} />
          )}
        </div>

        {/* Stat Cards — 4 columns (matching HTML g3/g4 layout) */}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
            <StatCard
              label="Leads chờ phân loại"
              value={data?.leads_pending_count ?? 0}
              emoji="📩"
              accent="#2563eb"
              sub={data?.leads_pending_count ? 'Mới' : undefined}
            />
            <StatCard
              label="Quá SLA"
              value={data?.leads_sla_overdue_count ?? 0}
              emoji="⚠️"
              accent="#ef4444"
              sub={data?.leads_sla_overdue_count ? 'Urgent' : undefined}
            />
            <StatCard
              label="Bài đăng hôm nay"
              value={data?.posts_scheduled_today ?? 0}
              emoji="📅"
              accent="#2d9b6b"
            />
            <StatCard
              label="Chờ duyệt"
              value={data?.posts_pending_review ?? 0}
              emoji="📋"
              accent="#d97706"
            />
          </div>
        )}

        {/* Two-column layout: Quick leads + Today's posts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

          {/* Left: Quick lead classification */}
          <div style={{
            background: '#fff',
            borderRadius: 13,
            border: '1px solid rgba(0,0,0,0.09)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 14px 10px',
              borderBottom: '1px solid rgba(0,0,0,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                📩 Phân loại nhanh
              </span>
              <button
                onClick={() => navigate('/inbox')}
                style={{
                  fontSize: 11,
                  color: '#2d9b6b',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Xem tất cả →
              </button>
            </div>
            <div style={{ padding: 12 }}>
              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} variant="card" />
                  ))}
                </div>
              ) : !data?.quick_leads || data.quick_leads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontSize: 13 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                  Không có lead nào chờ phân loại
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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

          {/* Right: KPI summary */}
          <div style={{
            background: '#fff',
            borderRadius: 13,
            border: '1px solid rgba(0,0,0,0.09)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 14px 10px',
              borderBottom: '1px solid rgba(0,0,0,0.07)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                📊 KPI tuần này
              </span>
            </div>
            <div style={{ padding: 12 }}>
              {isLoading ? (
                <Skeleton variant="card" />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Tổng leads', value: (data?.leads_pending_count ?? 0) + (data?.leads_sla_overdue_count ?? 0), emoji: '👥', color: '#2563eb' },
                    { label: 'Đã push CRM', value: 0, emoji: '🚀', color: '#2d9b6b' },
                    { label: 'Bài đã đăng', value: data?.posts_scheduled_today ?? 0, emoji: '✅', color: '#7C3AED' },
                    { label: 'Chờ review', value: data?.posts_pending_review ?? 0, emoji: '👀', color: '#d97706' },
                  ].map((item) => (
                    <div key={item.label} style={{
                      background: '#f9fafb',
                      borderRadius: 9,
                      padding: '10px 12px',
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{item.emoji}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: item.color, lineHeight: 1 }}>
                        {item.value}
                      </div>
                      <div style={{ fontSize: 10, color: '#6b7280', marginTop: 3 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error state */}
        {isError && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 13,
            padding: 16,
            marginTop: 16,
            textAlign: 'center',
            color: '#b91c1c',
            fontSize: 13,
          }}>
            ⚠️ Không thể tải dữ liệu. Vui lòng thử lại.
          </div>
        )}
      </div>
    </PageLayout>
  )
}
