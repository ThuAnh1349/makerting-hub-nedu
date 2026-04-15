import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageLayout } from '@/shared/components/PageLayout'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { Modal } from '@/shared/components/ui/Modal'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { apiClient } from '@/shared/config/api-client'
import { useAuthStore } from '@/shared/stores/auth.store'
import { ROLES } from '@/shared/constants/roles'
import { CampaignKanban } from '../components/CampaignKanban'
import type { Campaign, CampaignPhase } from '../campaign.types'

// --- Create Campaign Form ---
interface CreateFormData {
  title: string
  description: string
  start_date: string
  end_date: string
}

function CreateCampaignForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (data: CreateFormData) => void
  isSubmitting: boolean
}) {
  const [form, setForm] = useState<CreateFormData>({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 font-body mb-1">
          Tên chiến dịch <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="VD: Khai giảng tháng 5/2026"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-nedu-primary focus:border-transparent"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 font-body mb-1">
          Mô tả
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Mô tả ngắn về chiến dịch..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-nedu-primary focus:border-transparent resize-none"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 font-body mb-1">
            Ngày bắt đầu
          </label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-nedu-primary focus:border-transparent"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 font-body mb-1">
            Ngày kết thúc
          </label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-nedu-primary focus:border-transparent"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" size="sm" isLoading={isSubmitting}>
          Tạo chiến dịch
        </Button>
      </div>
    </form>
  )
}

// --- Campaign Detail Modal ---
function CampaignDetailModal({
  campaign,
  isOpen,
  onClose,
}: {
  campaign: Campaign | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!campaign) return null

  const phaseVariants: Record<CampaignPhase, 'gray' | 'blue' | 'orange' | 'red' | 'green'> = {
    opening: 'gray',
    build: 'blue',
    close: 'orange',
    cta: 'red',
    completed: 'green',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={campaign.title} size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={phaseVariants[campaign.current_phase]}>
            {campaign.current_phase}
          </Badge>
          {(campaign.start_date || campaign.end_date) && (
            <span className="text-xs text-gray-400 font-body">
              {campaign.start_date
                ? new Date(campaign.start_date).toLocaleDateString('vi-VN')
                : '?'}{' '}
              —{' '}
              {campaign.end_date
                ? new Date(campaign.end_date).toLocaleDateString('vi-VN')
                : '?'}
            </span>
          )}
        </div>

        {campaign.description && (
          <p className="text-sm text-gray-600 font-body">{campaign.description}</p>
        )}

        {/* Post counts */}
        <div className="grid grid-cols-4 gap-3 text-center">
          {[
            { label: 'Tổng', value: campaign.post_counts.total, color: 'text-gray-700' },
            { label: 'Đã đăng', value: campaign.post_counts.published, color: 'text-green-600' },
            { label: 'Đã lên lịch', value: campaign.post_counts.scheduled, color: 'text-blue-600' },
            { label: 'Nháp', value: campaign.post_counts.draft, color: 'text-gray-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-50 rounded-lg p-3">
              <p className={`text-2xl font-bold font-headline ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 font-body mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Posts list */}
        {campaign.posts && campaign.posts.length > 0 ? (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 font-headline mb-2">Bài đăng</h3>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {campaign.posts.map((post: any) => (
                <li key={post.id} className="text-sm text-gray-600 font-body border border-gray-100 rounded-lg px-3 py-2">
                  <span className="font-medium">{post.current_status}</span>
                  {' · '}
                  <span className="line-clamp-1">{post.caption}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-gray-400 font-body text-center py-4">
            Chưa có bài đăng nào trong chiến dịch này.
          </p>
        )}

        <p className="text-xs text-gray-400 font-body">
          Tạo bởi {campaign.created_by.display_name} ·{' '}
          {new Date(campaign.created_at).toLocaleDateString('vi-VN')}
        </p>
      </div>
    </Modal>
  )
}

// --- Main Page ---
export function CampaignPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const { hasAnyRole } = useAuthStore()
  const queryClient = useQueryClient()

  const canCreate = hasAnyRole([ROLES.CO_LEADER, ROLES.MARKETING_LEADER])

  const { data, isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: () => apiClient.get('/api/v1/marketing/campaigns'),
  })

  const createMutation = useMutation({
    mutationFn: (payload: object) => apiClient.post('/api/v1/marketing/campaigns', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      setCreateOpen(false)
    },
  })

  const movePhaseMutation = useMutation({
    mutationFn: ({ id, phase }: { id: string; phase: CampaignPhase }) =>
      apiClient.patch(`/api/v1/marketing/campaigns/${id}/phase`, { new_phase: phase }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })

  async function handleMovePhase(id: string, newPhase: CampaignPhase) {
    await movePhaseMutation.mutateAsync({ id, phase: newPhase })
  }

  const campaigns: Campaign[] = data ?? []

  return (
    <PageLayout
      title="Chiến dịch"
      actions={
        canCreate ? (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            + Tạo chiến dịch
          </Button>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton variant="line" />
              {Array.from({ length: 2 }).map((__, j) => (
                <Skeleton key={j} variant="card" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <CampaignKanban
          campaigns={campaigns}
          onMovePhase={handleMovePhase}
          onCampaignClick={setSelectedCampaign}
        />
      )}

      {/* Create Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Tạo chiến dịch mới" size="md">
        <CreateCampaignForm
          onSubmit={(data) => createMutation.mutate(data)}
          isSubmitting={createMutation.isPending}
        />
      </Modal>

      {/* Detail Modal */}
      <CampaignDetailModal
        campaign={selectedCampaign}
        isOpen={!!selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
      />
    </PageLayout>
  )
}
