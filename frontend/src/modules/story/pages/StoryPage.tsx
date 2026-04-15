import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageLayout } from '@/shared/components/PageLayout'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { Modal } from '@/shared/components/ui/Modal'
import { useToast } from '@/shared/components/ui/Toast'
import { useAuthStore } from '@/shared/stores/auth.store'
import { apiClient } from '@/shared/config/api-client'
import { ROLES } from '@/shared/constants/roles'
import { StoryCreateStepper } from '../components/StoryCreateStepper'
import type { Story } from '../story.types'

type FilterTab = 'all' | 'pending_review' | 'approved' | 'deployed'

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending_review', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'deployed', label: 'Đã dùng' },
]

const STATUS_BADGE: Record<Story['current_status'], { label: string; variant: 'yellow' | 'green' | 'blue' }> = {
  pending_review: { label: 'Chờ duyệt', variant: 'yellow' },
  approved: { label: 'Đã duyệt', variant: 'green' },
  deployed: { label: 'Đã dùng', variant: 'blue' },
}

const ICP_LABEL: Record<string, string> = {
  freelancer: 'Freelancer',
  burnout: 'Burnout',
  career_change: 'Chuyển ngành',
  salary_raise: 'Tăng lương',
  job_seeker: 'Tìm việc',
  student: 'Sinh viên',
  manager: 'Quản lý',
  entrepreneur: 'Khởi nghiệp',
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + '…' : text
}

function AvatarOrInitials({
  name,
  url,
}: {
  name: string
  url: string | null
}) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="w-10 h-10 rounded-full object-cover shrink-0"
        onError={(e) => {
          const img = e.target as HTMLImageElement
          img.style.display = 'none'
        }}
      />
    )
  }
  return (
    <div className="w-10 h-10 rounded-full bg-nedu-primary flex items-center justify-center text-white text-sm font-bold font-headline shrink-0">
      {initials}
    </div>
  )
}

interface DeployModalProps {
  story: Story | null
  onClose: () => void
  onDeploy: (storyId: string, campaignId: string) => Promise<void>
}

const MOCK_CAMPAIGNS = [
  { id: 'camp-1', title: 'Khai giảng tháng 5 — SQL Bootcamp' },
  { id: 'camp-2', title: 'Power BI tháng 4' },
  { id: 'camp-4', title: 'Data Analytics Summer' },
  { id: 'camp-5', title: 'Testimonial Series' },
]

function DeployModal({ story, onClose, onDeploy }: DeployModalProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  const [isDeploying, setIsDeploying] = useState(false)

  const handleDeploy = async () => {
    if (!story || !selectedCampaignId) return
    setIsDeploying(true)
    try {
      await onDeploy(story.id, selectedCampaignId)
      onClose()
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <Modal isOpen={!!story} onClose={onClose} title="Deploy story vào chiến dịch" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 font-body">
          Chọn chiến dịch để gắn story của{' '}
          <span className="font-semibold">{story?.student_name}</span>:
        </p>
        <div className="space-y-2">
          {MOCK_CAMPAIGNS.map((c) => (
            <label
              key={c.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedCampaignId === c.id
                  ? 'border-nedu-primary bg-nedu-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="campaign"
                value={c.id}
                checked={selectedCampaignId === c.id}
                onChange={() => setSelectedCampaignId(c.id)}
                className="text-nedu-primary"
              />
              <span className="text-sm font-body text-gray-800">{c.title}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Huỷ</Button>
          <Button
            variant="primary"
            onClick={handleDeploy}
            disabled={!selectedCampaignId}
            isLoading={isDeploying}
          >
            Deploy →
          </Button>
        </div>
      </div>
    </Modal>
  )
}

interface StoryCardProps {
  story: Story
  canApprove: boolean
  onApprove: (id: string) => void
  onDeploy: (story: Story) => void
  isApproving: boolean
}

function StoryCard({ story, canApprove, onApprove, onDeploy, isApproving }: StoryCardProps) {
  const status = STATUS_BADGE[story.current_status]
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <AvatarOrInitials name={story.student_name} url={story.student_avatar_url} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 font-body truncate">
              {story.student_name}
            </p>
            <Badge variant="blue" className="mt-0.5">
              {story.course_name}
            </Badge>
          </div>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {/* Pain point */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-body mb-0.5">
          Khó khăn
        </p>
        <p className="text-sm text-gray-700 font-body leading-relaxed">
          {truncate(story.pain_point, 80)}
        </p>
      </div>

      {/* Transformation */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-body mb-0.5">
          Kết quả
        </p>
        <p className="text-sm text-gray-700 font-body leading-relaxed">
          {truncate(story.transformation, 80)}
        </p>
      </div>

      {/* ICP tags */}
      {story.icp_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {story.icp_tags.map((tag) => (
            <Badge key={tag} variant="gray">
              {ICP_LABEL[tag] ?? tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Deployed campaigns */}
      {story.current_status === 'deployed' && story.deployed_to_campaigns.length > 0 && (
        <div className="border-t border-gray-100 pt-2">
          <p className="text-xs text-gray-500 font-body mb-1">Đã dùng trong:</p>
          <div className="flex flex-col gap-0.5">
            {story.deployed_to_campaigns.map((c) => (
              <p key={c.campaign_id} className="text-xs text-blue-600 font-body">
                • {c.campaign_title}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-400 font-body">
          Thu thập bởi {story.collected_by.display_name}
        </p>
        <div className="flex gap-2">
          {story.current_status === 'pending_review' && canApprove && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onApprove(story.id)}
              isLoading={isApproving}
            >
              Duyệt
            </Button>
          )}
          {story.current_status === 'approved' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onDeploy(story)}
            >
              Deploy →
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function StoryPage() {
  const { showToast } = useToast()
  const { hasAnyRole } = useAuthStore()
  const queryClient = useQueryClient()

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deployTarget, setDeployTarget] = useState<Story | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const canApprove = hasAnyRole([ROLES.CO_LEADER, ROLES.MARKETING_LEADER])

  const { data: stories = [], isLoading, isError } = useQuery<Story[]>({
    queryKey: ['stories'],
    queryFn: () => apiClient.get<Story[]>('/api/v1/marketing/stories'),
  })

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiClient.post('/api/v1/marketing/stories', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] })
      showToast('Story đã được lưu thành công!', 'success')
    },
    onError: () => showToast('Lưu story thất bại. Vui lòng thử lại.', 'error'),
  })

  const actionMutation = useMutation({
    mutationFn: ({ id, action, payload }: { id: string; action: string; payload?: unknown }) =>
      apiClient.post(`/api/v1/marketing/stories/${id}/actions`, { action, ...((payload as object) ?? {}) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] })
    },
    onError: () => showToast('Thao tác thất bại. Vui lòng thử lại.', 'error'),
  })

  const handleApprove = async (storyId: string) => {
    setApprovingId(storyId)
    try {
      await actionMutation.mutateAsync({ id: storyId, action: 'approve' })
      showToast('Story đã được duyệt!', 'success')
    } finally {
      setApprovingId(null)
    }
  }

  const handleDeploy = async (storyId: string, campaignId: string) => {
    await actionMutation.mutateAsync({
      id: storyId,
      action: 'deploy',
      payload: { campaign_id: campaignId },
    })
    showToast('Story đã được deploy vào chiến dịch!', 'success')
  }

  const filtered =
    activeFilter === 'all'
      ? stories
      : stories.filter((s) => s.current_status === activeFilter)

  return (
    <PageLayout
      title="Story Pipeline"
      actions={
        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          + Thu thập story mới
        </Button>
      }
    >
      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {FILTER_TABS.map((tab) => {
          const count = tab.key === 'all' ? stories.length : stories.filter((s) => s.current_status === tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium font-body transition-colors ${
                activeFilter === tab.key
                  ? 'bg-white text-nedu-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    activeFilter === tab.key
                      ? 'bg-nedu-primary/10 text-nedu-primary'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          title="Không thể tải dữ liệu"
          description="Đã xảy ra lỗi khi tải danh sách story. Vui lòng thử lại."
          action={{ label: 'Thử lại', onClick: () => queryClient.invalidateQueries({ queryKey: ['stories'] }) }}
        />
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          title="Chưa có story nào"
          description={
            activeFilter === 'all'
              ? 'Bắt đầu thu thập câu chuyện chuyển hoá từ học viên.'
              : `Không có story nào ở trạng thái "${FILTER_TABS.find((t) => t.key === activeFilter)?.label}".`
          }
          action={
            activeFilter === 'all'
              ? { label: '+ Thu thập story mới', onClick: () => setIsCreateOpen(true) }
              : undefined
          }
        />
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              canApprove={canApprove}
              onApprove={handleApprove}
              onDeploy={setDeployTarget}
              isApproving={approvingId === story.id}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <StoryCreateStepper
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={async (data) => {
          await createMutation.mutateAsync(data as Record<string, unknown>)
        }}
      />

      {/* Deploy modal */}
      <DeployModal
        story={deployTarget}
        onClose={() => setDeployTarget(null)}
        onDeploy={handleDeploy}
      />
    </PageLayout>
  )
}
