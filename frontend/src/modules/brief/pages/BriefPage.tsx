import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageLayout } from '@/shared/components/PageLayout'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import BriefDrawer from '../components/BriefDrawer'
import { apiClient } from '@/shared/config/api-client'
import type { Brief, BriefStatus } from '../brief.types'

const STATUS_BADGE: Record<BriefStatus, React.ComponentProps<typeof Badge>['variant']> = {
  submitted: 'yellow', in_progress: 'blue', review: 'yellow',
  completed: 'green', cancelled: 'gray',
}
const STATUS_LABEL: Record<BriefStatus, string> = {
  submitted: 'Đã gửi', in_progress: 'Đang làm', review: 'Đang duyệt',
  completed: 'Hoàn thành', cancelled: 'Đã huỷ',
}
const TYPE_ICON: Record<string, string> = { design: '🎨', video_editing: '🎬' }

type TabFilter = 'all' | 'active' | 'review' | 'completed'
const TABS: { key: TabFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang xử lý' },
  { key: 'review', label: 'Đang duyệt' },
  { key: 'completed', label: 'Hoàn thành' },
]

function filterBriefs(briefs: Brief[], tab: TabFilter): Brief[] {
  if (tab === 'all') return briefs
  if (tab === 'active') return briefs.filter(b => ['submitted', 'in_progress'].includes(b.current_status))
  if (tab === 'review') return briefs.filter(b => b.current_status === 'review')
  if (tab === 'completed') return briefs.filter(b => ['completed', 'cancelled'].includes(b.current_status))
  return briefs
}

export function BriefPage() {
  const [tab, setTab] = useState<TabFilter>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedBriefId, setSelectedBriefId] = useState<string | undefined>()

  const { data, isLoading } = useQuery<{ data: Brief[] }>({
    queryKey: ['briefs'],
    queryFn: () => apiClient.get('/api/v1/marketing/briefs'),
    refetchInterval: 30_000,
  })

  const allBriefs = data?.data ?? []
  const filtered = filterBriefs(allBriefs, tab)

  function openCreate() { setSelectedBriefId(undefined); setDrawerOpen(true) }
  function openDetail(id: string) { setSelectedBriefId(id); setDrawerOpen(true) }

  return (
    <PageLayout
      title="Đặt việc"
      actions={<Button size="sm" onClick={openCreate}>+ Gửi brief mới</Button>}
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => {
          const count = filterBriefs(allBriefs, t.key).length
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5
                ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-gray-100' : 'bg-gray-200'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} variant="card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Không có brief nào"
          description='Nhấn "+ Gửi brief mới" để gửi yêu cầu cho Design/Editing team.'
          action={tab === 'all' ? { label: '+ Gửi brief mới', onClick: openCreate } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(brief => (
            <div key={brief.id} onClick={() => openDetail(brief.id)}
              className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-xl mt-0.5">{TYPE_ICON[brief.brief_type_code]}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{brief.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {brief.brief_type_label} · {brief.requested_by.display_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      ⏰ {new Date(brief.deadline).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <Badge variant={STATUS_BADGE[brief.current_status]}>{STATUS_LABEL[brief.current_status]}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <BriefDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        briefId={selectedBriefId}
      />
    </PageLayout>
  )
}
