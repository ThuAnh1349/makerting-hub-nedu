import { useState } from 'react'
import { PageLayout } from '@/shared/components/PageLayout'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Drawer } from '@/shared/components/ui/Drawer'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { ChannelBadge } from '@/shared/components/ChannelBadge'
import { useAuthStore } from '@/shared/stores/auth.store'
import { ROLES } from '@/shared/constants/roles'
import {
  usePosts,
  usePostDetail,
  useCreatePost,
  useUpdatePost,
  usePostAction,
} from '../hooks/useContent'
import { PostCard } from '../components/PostCard'
import { PostForm } from '../components/PostForm'
import { ApprovalQueue } from '../components/ApprovalQueue'
import type { Post, PostStatus, CreatePostBody } from '../content.types'

// ─────────────────────────────────────────────────────────
// Types & helpers
// ─────────────────────────────────────────────────────────

type FilterTab =
  | 'all'
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'scheduled'
  | 'rejected'
  | 'approval_queue'

interface TabConfig {
  key: FilterTab
  label: string
  statusFilter?: PostStatus
  requiresRole?: boolean
}

const TABS: TabConfig[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'draft', label: 'Nháp', statusFilter: 'draft' },
  { key: 'pending_review', label: 'Chờ duyệt', statusFilter: 'pending_review' },
  { key: 'approved', label: 'Đã duyệt', statusFilter: 'approved' },
  { key: 'scheduled', label: 'Đã lên lịch', statusFilter: 'scheduled' },
  { key: 'rejected', label: 'Từ chối', statusFilter: 'rejected' },
  { key: 'approval_queue', label: 'Hàng chờ duyệt', requiresRole: true },
]

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const APPROVAL_EVENT_LABELS: Record<string, string> = {
  submitted_for_review: 'Gửi duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  revision_requested: 'Yêu cầu chỉnh sửa',
}

const APPROVAL_EVENT_COLORS: Record<string, string> = {
  submitted_for_review: 'bg-blue-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  revision_requested: 'bg-orange-500',
}

// ─────────────────────────────────────────────────────────
// Schedule date-time picker (inline)
// ─────────────────────────────────────────────────────────

function SchedulePicker({
  onConfirm,
  onCancel,
  isLoading,
}: {
  onConfirm: (isoString: string) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const now = new Date()
  const [date, setDate] = useState(() => {
    const d = new Date(now.getTime() + 60 * 60 * 1000)
    return d.toISOString().slice(0, 10)
  })
  const [hour, setHour] = useState(() => {
    const d = new Date(now.getTime() + 60 * 60 * 1000)
    return String(d.getHours()).padStart(2, '0')
  })
  const [minute, setMinute] = useState('00')

  const handleConfirm = () => {
    const iso = new Date(`${date}T${hour}:${minute}:00`).toISOString()
    onConfirm(iso)
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-3 gap-2 items-end">
        <div className="col-span-2 space-y-1">
          <label className="block text-xs font-medium text-gray-600 font-body">Ngày</label>
          <input
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-body
              focus:outline-none focus:ring-2 focus:ring-nedu-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600 font-body">Giờ</label>
          <div className="flex items-center gap-1">
            <select
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm font-body
                focus:outline-none focus:ring-2 focus:ring-nedu-primary"
            >
              {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <span className="text-gray-500 font-body">:</span>
            <select
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm font-body
                focus:outline-none focus:ring-2 focus:ring-nedu-primary"
            >
              {['00', '15', '30', '45'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 font-body">
        Lịch đăng: {new Date(`${date}T${hour}:${minute}:00`).toLocaleString('vi-VN', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="primary" isLoading={isLoading} onClick={handleConfirm}>
          Lên lịch
        </Button>
        <Button size="sm" variant="ghost" disabled={isLoading} onClick={onCancel}>
          Huỷ
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Post Detail Drawer
// ─────────────────────────────────────────────────────────

interface PostDetailDrawerProps {
  postId: string | null
  isOpen: boolean
  onClose: () => void
  onEditRequest: (post: Post) => void
}

function PostDetailDrawer({
  postId,
  isOpen,
  onClose,
  onEditRequest,
}: PostDetailDrawerProps) {
  const { user } = useAuthStore()
  const isLeader =
    user?.roles.includes(ROLES.CO_LEADER) ||
    user?.roles.includes(ROLES.MARKETING_LEADER)

  const { data: post, isLoading, isError } = usePostDetail(postId)
  const postAction = usePostAction()
  const [showSchedulePicker, setShowSchedulePicker] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectNotes, setRejectNotes] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const handleAction = async (
    actionType: 'submit_review' | 'approve' | 'reject' | 'schedule',
    extra?: { notes?: string; scheduled_at?: string },
  ) => {
    if (!post) return
    setActionError(null)
    try {
      await postAction.mutateAsync({
        id: post.id,
        body: { action_type: actionType, ...extra },
      })
      if (actionType !== 'schedule') {
        onClose()
      }
      setShowSchedulePicker(false)
      setShowRejectForm(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đã có lỗi xảy ra.'
      setActionError(message)
    }
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Chi tiết bài đăng">
      {isLoading && (
        <div className="space-y-4">
          <Skeleton variant="card" />
          <Skeleton lines={3} />
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700 font-body">Không tải được bài đăng.</p>
        </div>
      )}

      {post && (
        <div className="space-y-5">
          {/* Status + channels */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset font-body bg-gray-100 text-gray-700 ring-gray-200">
              {post.current_status}
            </span>
            {post.channels.map((ch) => (
              <ChannelBadge key={ch.code} channel={ch} />
            ))}
          </div>

          {/* Caption */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
              Caption
            </h3>
            <p className="text-sm text-gray-800 font-body whitespace-pre-wrap leading-relaxed break-words">
              {post.caption}
            </p>
          </div>

          {/* Media */}
          {post.media.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 font-body">
                Media ({post.media.length})
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {post.media.map((m) => (
                  <div
                    key={m.id}
                    className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                  >
                    {m.media_type === 'image' ? (
                      <img
                        src={m.thumbnail_url ?? m.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reference links */}
          {post.reference_links.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                Link tham khảo
              </h3>
              <ul className="space-y-1">
                {post.reference_links.map((l, i) => (
                  <li key={i}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-nedu-primary underline font-body"
                    >
                      {l.label || l.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rejection note */}
          {post.current_status === 'rejected' && post.latest_approval_note && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-yellow-800 font-body mb-1">
                ❌ Ghi chú từ chối
              </p>
              <p className="text-sm text-yellow-800 font-body">
                {post.latest_approval_note}
              </p>
            </div>
          )}

          {/* Campaign */}
          {post.campaign_title && (
            <p className="text-xs text-gray-500 font-body">
              Campaign: <span className="font-medium text-gray-700">{post.campaign_title}</span>
            </p>
          )}

          {/* Scheduled at */}
          {post.scheduled_at && (
            <p className="text-xs text-blue-600 font-body flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Lịch đăng: {formatDate(post.scheduled_at)}
            </p>
          )}

          {/* Approval history */}
          {post.approval_history && post.approval_history.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 font-body">
                Lịch sử duyệt
              </h3>
              <ol className="relative border-l border-gray-200 space-y-4 ml-3">
                {post.approval_history.map((event, i) => (
                  <li key={i} className="ml-4">
                    <span
                      className={`absolute -left-1.5 mt-1 w-3 h-3 rounded-full ${
                        APPROVAL_EVENT_COLORS[event.event_type] ?? 'bg-gray-400'
                      }`}
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-xs font-semibold text-gray-700 font-body">
                        {APPROVAL_EVENT_LABELS[event.event_type] ?? event.event_type}
                        {' '}
                        <span className="font-normal text-gray-500">bởi {event.actor_name}</span>
                      </p>
                      {event.notes && (
                        <p className="text-xs text-gray-600 font-body mt-0.5 italic">
                          "{event.notes}"
                        </p>
                      )}
                      <time className="text-[11px] text-gray-400 font-body">
                        {formatDate(event.created_at)}
                      </time>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Error */}
          {actionError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-xs text-red-700 font-body">{actionError}</p>
            </div>
          )}

          {/* Action buttons based on status + role */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            {/* Staff: draft or rejected → Edit + Submit */}
            {(post.current_status === 'draft' || post.current_status === 'rejected') && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEditRequest(post)}
                >
                  Sửa
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={postAction.isPending}
                  onClick={() => handleAction('submit_review')}
                >
                  Gửi duyệt
                </Button>
              </div>
            )}

            {/* Leader: pending_review → Approve or Reject */}
            {isLeader && post.current_status === 'pending_review' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={postAction.isPending}
                    className="bg-green-600 hover:bg-green-700 focus-visible:ring-green-500"
                    onClick={() => handleAction('approve')}
                  >
                    Duyệt
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={postAction.isPending}
                    onClick={() => setShowRejectForm((v) => !v)}
                  >
                    Từ chối
                  </Button>
                </div>

                {showRejectForm && (
                  <div className="space-y-2">
                    <textarea
                      value={rejectNotes}
                      onChange={(e) => setRejectNotes(e.target.value)}
                      rows={3}
                      placeholder="Lý do từ chối..."
                      className="
                        w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-body
                        focus:outline-none focus:ring-2 focus:ring-red-400
                        resize-none
                      "
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        isLoading={postAction.isPending}
                        disabled={!rejectNotes.trim()}
                        onClick={() => handleAction('reject', { notes: rejectNotes.trim() })}
                      >
                        Xác nhận từ chối
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowRejectForm(false)}
                      >
                        Huỷ
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Approved → Schedule */}
            {post.current_status === 'approved' && (
              <div className="space-y-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowSchedulePicker((v) => !v)}
                >
                  Lên lịch đăng
                </Button>

                {showSchedulePicker && (
                  <SchedulePicker
                    isLoading={postAction.isPending}
                    onConfirm={(iso) =>
                      handleAction('schedule', { scheduled_at: iso })
                    }
                    onCancel={() => setShowSchedulePicker(false)}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  )
}

// ─────────────────────────────────────────────────────────
// ContentPage
// ─────────────────────────────────────────────────────────

export function ContentPage() {
  const { user } = useAuthStore()
  const isLeader =
    user?.roles.includes(ROLES.CO_LEADER) ||
    user?.roles.includes(ROLES.MARKETING_LEADER)

  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)

  const statusFilter: PostStatus | undefined =
    TABS.find((t) => t.key === activeTab)?.statusFilter

  const { data, isLoading, isError, refetch } = usePosts(
    activeTab !== 'approval_queue' && statusFilter
      ? { status: statusFilter }
      : activeTab !== 'approval_queue'
      ? undefined
      : { status: 'pending_review' },
  )

  const createPost = useCreatePost()
  const updatePost = useUpdatePost()
  const postAction = usePostAction()

  const posts = data?.data ?? []

  const handleCreateSubmit = async (formData: CreatePostBody) => {
    await createPost.mutateAsync(formData)
    setIsCreateModalOpen(false)
  }

  const handleEditSubmit = async (formData: CreatePostBody) => {
    if (!editingPost) return
    await updatePost.mutateAsync({
      id: editingPost.id,
      data: {
        caption: formData.caption,
        channel_codes: formData.channel_codes,
        reference_links: formData.reference_links,
        campaign_id: formData.campaign_id,
      },
    })
    setEditingPost(null)
    setSelectedPostId(null)
  }

  const handleApprovalAction = async (
    postId: string,
    action: 'approve' | 'reject',
    notes?: string,
  ) => {
    await postAction.mutateAsync({
      id: postId,
      body: {
        action_type: action,
        ...(notes ? { notes } : {}),
      },
    })
  }

  const visibleTabs = TABS.filter((t) => !t.requiresRole || isLeader)

  return (
    <PageLayout
      title="Nội dung"
      actions={
        <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
          + Tạo bài mới
        </Button>
      }
    >
      {/* Filter tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium font-body
              transition-colors duration-150
              ${
                activeTab === tab.key
                  ? 'bg-nedu-primary text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Approval queue tab */}
      {activeTab === 'approval_queue' && isLeader && (
        <>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="card" />
              ))}
            </div>
          ) : (
            <ApprovalQueue posts={posts} onAction={handleApprovalAction} />
          )}
        </>
      )}

      {/* Regular grid */}
      {activeTab !== 'approval_queue' && (
        <>
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} variant="card" />
              ))}
            </div>
          )}

          {isError && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-sm text-red-700 font-body mb-3">
                Không tải được danh sách bài đăng.
              </p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Thử lại
              </Button>
            </div>
          )}

          {!isLoading && !isError && posts.length === 0 && (
            <EmptyState
              title="Chưa có bài đăng nào"
              description='Nhấn "+ Tạo bài mới" để bắt đầu tạo nội dung cho các kênh marketing.'
              action={{
                label: '+ Tạo bài mới',
                onClick: () => setIsCreateModalOpen(true),
              }}
            />
          )}

          {!isLoading && !isError && posts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onClick={() => setSelectedPostId(post.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Post Detail Drawer */}
      <PostDetailDrawer
        postId={selectedPostId}
        isOpen={!!selectedPostId}
        onClose={() => setSelectedPostId(null)}
        onEditRequest={(post) => {
          setEditingPost(post)
          setSelectedPostId(null)
        }}
      />

      {/* Create post modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tạo bài đăng mới"
        size="lg"
      >
        <PostForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createPost.isPending}
          submitLabel="Lưu nháp"
        />
      </Modal>

      {/* Edit post modal */}
      <Modal
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        title="Chỉnh sửa bài đăng"
        size="lg"
      >
        {editingPost && (
          <PostForm
            initialValues={editingPost}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditingPost(null)}
            isLoading={updatePost.isPending}
            submitLabel="Lưu thay đổi"
          />
        )}
      </Modal>
    </PageLayout>
  )
}
