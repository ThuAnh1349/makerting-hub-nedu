import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Drawer } from '@/shared/components/ui/Drawer'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { BriefTimeline } from './BriefTimeline'
import { apiClient } from '@/shared/config/api-client'
import { useAuthStore } from '@/shared/stores/auth.store'
import type { Brief, BriefStatus } from '../brief.types'

interface BriefDrawerProps {
  isOpen: boolean
  onClose: () => void
  briefId?: string
  onCreateNew?: () => void
}

const STATUS_BADGE: Record<BriefStatus, React.ComponentProps<typeof Badge>['variant']> = {
  submitted: 'yellow', in_progress: 'blue', review: 'yellow',
  completed: 'green', cancelled: 'gray',
}
const STATUS_LABEL: Record<BriefStatus, string> = {
  submitted: 'Đã gửi', in_progress: 'Đang làm', review: 'Đang duyệt',
  completed: 'Hoàn thành', cancelled: 'Đã huỷ',
}

// ── Create form ───────────────────────────────────────────────────────────────
function CreateBriefForm({ onSubmit, onCancel }: { onSubmit: (data: Record<string, unknown>) => Promise<void>, onCancel: () => void }) {
  const [form, setForm] = useState({ brief_type_code: 'design', title: '', description: '', size_format: '', deadline: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try { await onSubmit({ ...form, size_format: form.size_format || undefined }) }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Loại brief</label>
        <div className="flex gap-3">
          {(['design', 'video_editing'] as const).map(t => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="type" value={t} checked={form.brief_type_code === t}
                onChange={() => setForm(f => ({ ...f, brief_type_code: t }))} />
              <span className="text-sm">{t === 'design' ? '🎨 Thiết kế' : '🎬 Dựng video'}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
        <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nedu-primary"
          placeholder="VD: Banner Facebook khai giảng tháng 5" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả yêu cầu *</label>
        <textarea required rows={4} value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nedu-primary resize-none"
          placeholder="Mô tả chi tiết yêu cầu, phong cách, màu sắc, nội dung cần có..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kích thước</label>
          <input value={form.size_format} onChange={e => setForm(f => ({ ...f, size_format: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nedu-primary"
            placeholder="1200x628, 1080x1080" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deadline *</label>
          <input type="datetime-local" required value={form.deadline}
            onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nedu-primary" />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" variant="primary" size="sm" isLoading={loading}
          disabled={!form.title || !form.description || !form.deadline}>
          Gửi brief
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Huỷ</Button>
      </div>
    </form>
  )
}

// ── View mode ─────────────────────────────────────────────────────────────────
function BriefDetail({ briefId, onClose }: { briefId: string, onClose: () => void }) {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [deliverUrl, setDeliverUrl] = useState('')
  const [revisionNote, setRevisionNote] = useState('')

  const { data: brief, isLoading } = useQuery<Brief>({
    queryKey: ['brief', briefId],
    queryFn: () => apiClient.get(`/api/v1/marketing/briefs/${briefId}`),
  })

  const actionMut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiClient.post(`/api/v1/marketing/briefs/${briefId}/actions`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['briefs'] })
      qc.invalidateQueries({ queryKey: ['brief', briefId] })
    },
  })

  if (isLoading) return (
    <div className="space-y-3">
      <Skeleton variant="line" />
      <Skeleton variant="line" />
      <Skeleton variant="card" />
    </div>
  )
  if (!brief) return <p className="text-sm text-gray-500">Không tìm thấy brief.</p>

  const isDesign = user?.roles.some(r => ['design_member', 'video_editor'].includes(r))
  const isLeader = user?.roles.some(r => ['co_leader', 'marketing_leader'].includes(r))
  const isRequester = user?.id === brief.requested_by.id

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-400 mb-1">{brief.brief_type_label}</p>
          <h3 className="font-semibold text-gray-900">{brief.title}</h3>
        </div>
        <Badge variant={STATUS_BADGE[brief.current_status] ?? 'gray'}>
          {STATUS_LABEL[brief.current_status]}
        </Badge>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-2">
        <p>{brief.description}</p>
        {brief.size_format && <p className="text-xs text-gray-500">📐 {brief.size_format}</p>}
        <p className="text-xs text-gray-500">
          ⏰ Deadline: {new Date(brief.deadline).toLocaleString('vi-VN', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {brief.deliverable_url && (
        <a href={brief.deliverable_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
          📎 Xem file giao nộp →
        </a>
      )}

      {/* Action buttons */}
      <div className="space-y-3 border-t border-gray-100 pt-4">
        {isDesign && brief.current_status === 'submitted' && (
          <Button variant="primary" size="sm" isLoading={actionMut.isPending}
            onClick={() => actionMut.mutate({ action_type: 'acknowledge' })}>
            ✅ Nhận brief
          </Button>
        )}
        {isDesign && brief.current_status === 'in_progress' && (
          <div className="space-y-2">
            <input value={deliverUrl} onChange={e => setDeliverUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Link file Google Drive / Cloudflare..." />
            <Button variant="primary" size="sm" disabled={!deliverUrl} isLoading={actionMut.isPending}
              onClick={() => actionMut.mutate({ action_type: 'deliver', deliverable_url: deliverUrl })}>
              📤 Giao nộp
            </Button>
          </div>
        )}
        {(isLeader || (!isDesign && isRequester)) && brief.current_status === 'review' && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button variant="primary" size="sm" isLoading={actionMut.isPending}
                onClick={() => actionMut.mutate({ action_type: 'complete' })}>
                ✅ Hoàn thành
              </Button>
              <Button variant="secondary" size="sm"
                onClick={() => actionMut.mutate({ action_type: 'request_revision', notes: revisionNote || 'Cần chỉnh sửa' })}>
                🔄 Yêu cầu chỉnh sửa
              </Button>
            </div>
            <textarea rows={2} value={revisionNote} onChange={e => setRevisionNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              placeholder="Ghi chú chỉnh sửa (nếu có)..." />
          </div>
        )}
        {(isRequester || isLeader) && !['completed', 'cancelled'].includes(brief.current_status) && (
          <Button variant="danger" size="sm" isLoading={actionMut.isPending}
            onClick={() => { if (confirm('Xác nhận huỷ brief này?')) actionMut.mutate({ action_type: 'cancel' }) }}>
            Huỷ brief
          </Button>
        )}
      </div>

      {brief.status_history && brief.status_history.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Lịch sử</p>
          <BriefTimeline history={brief.status_history} />
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BriefDrawer({ isOpen, onClose, briefId }: BriefDrawerProps) {
  const qc = useQueryClient()

  const createMut = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.post('/api/v1/marketing/briefs', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['briefs'] })
      onClose()
    },
  })

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={briefId ? 'Chi tiết brief' : 'Gửi brief mới'}>
      {briefId
        ? <BriefDetail briefId={briefId} onClose={onClose} />
        : <CreateBriefForm
            onSubmit={async (data) => { await createMut.mutateAsync(data) }}
            onCancel={onClose}
          />
      }
    </Drawer>
  )
}
