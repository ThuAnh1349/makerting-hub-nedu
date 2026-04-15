import { useQuery } from '@tanstack/react-query'
import { PageLayout } from '@/shared/components/PageLayout'
import { Badge } from '@/shared/components/ui/Badge'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { apiClient } from '@/shared/config/api-client'

type DocStatus = 'completed' | 'in_progress' | 'not_started'

interface Doc {
  id: string
  title: string
  status: DocStatus
  file_url: string | null
  version: string | null
  updated_at: string | null
}

const STATUS_CONFIG: Record<DocStatus, { label: string; variant: 'green' | 'orange' | 'gray' }> = {
  completed: { label: 'Hoàn thành', variant: 'green' },
  in_progress: { label: 'Đang làm', variant: 'orange' },
  not_started: { label: 'Chưa làm', variant: 'gray' },
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function DocCard({ doc }: { doc: Doc }) {
  const status = STATUS_CONFIG[doc.status]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold font-headline text-gray-900 leading-snug">
          {doc.title}
        </h3>
        <Badge variant={status.variant} className="shrink-0">
          {status.label}
        </Badge>
      </div>

      {(doc.version || doc.updated_at) && (
        <p className="text-xs text-gray-400 font-body">
          {doc.version && <span>v{doc.version}</span>}
          {doc.version && doc.updated_at && <span> · </span>}
          {doc.updated_at && <span>Cập nhật {formatDate(doc.updated_at)}</span>}
        </p>
      )}

      {doc.file_url && (
        <a
          href={doc.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-nedu-primary hover:text-nedu-primary-600 font-medium font-body transition-colors w-fit"
        >
          Mở tài liệu
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      )}
    </div>
  )
}

export function DocsPage() {
  const { data, isLoading } = useQuery<Doc[]>({
    queryKey: ['docs'],
    queryFn: () => apiClient.get('/api/v1/marketing/docs'),
  })

  const docs: Doc[] = data ?? []
  const completedCount = docs.filter((d) => d.status === 'completed').length
  const totalCount = docs.length || 8
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <PageLayout title="Hệ thống tài liệu">
      {/* Progress bar */}
      <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-gray-700 font-body">
            {completedCount}/{totalCount} tài liệu hoàn thành
          </span>
          <span className="text-green-600 font-semibold font-body">
            {progressPct.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-green-500 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <EmptyState
          title="Chưa có tài liệu"
          description="Danh sách tài liệu vận hành sẽ xuất hiện tại đây."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {docs.map((doc) => (
            <DocCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </PageLayout>
  )
}
