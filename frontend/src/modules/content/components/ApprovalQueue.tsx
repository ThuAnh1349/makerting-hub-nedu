import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { ChannelBadge } from '@/shared/components/ChannelBadge'
import type { Post } from '../content.types'

interface ApprovalQueueProps {
  posts: Post[]
  onAction: (
    postId: string,
    action: 'approve' | 'reject',
    notes?: string,
  ) => Promise<void>
}

interface PostRowState {
  isRejecting: boolean
  rejectNotes: string
  isLoading: boolean
  error: string | null
}

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60_000)
  if (diffMin < 1) return 'Vừa xong'
  if (diffMin < 60) return `${diffMin} phút trước`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} giờ trước`
  const diffD = Math.floor(diffH / 24)
  return `${diffD} ngày trước`
}

export function ApprovalQueue({ posts, onAction }: ApprovalQueueProps) {
  const pendingPosts = posts.filter((p) => p.current_status === 'pending_review')

  const [rowStates, setRowStates] = useState<Record<string, PostRowState>>({})

  const getRowState = (id: string): PostRowState =>
    rowStates[id] ?? {
      isRejecting: false,
      rejectNotes: '',
      isLoading: false,
      error: null,
    }

  const updateRow = (id: string, patch: Partial<PostRowState>) => {
    setRowStates((prev) => ({
      ...prev,
      [id]: { ...getRowState(id), ...patch },
    }))
  }

  const handleApprove = async (postId: string) => {
    updateRow(postId, { isLoading: true, error: null })
    try {
      await onAction(postId, 'approve')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đã có lỗi xảy ra.'
      updateRow(postId, { isLoading: false, error: message })
    }
  }

  const handleRejectConfirm = async (postId: string) => {
    const state = getRowState(postId)
    if (!state.rejectNotes.trim()) return
    updateRow(postId, { isLoading: true, error: null })
    try {
      await onAction(postId, 'reject', state.rejectNotes.trim())
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đã có lỗi xảy ra.'
      updateRow(postId, { isLoading: false, error: message })
    }
  }

  if (pendingPosts.length === 0) {
    return (
      <EmptyState
        title="Không có bài nào chờ duyệt"
        description="Khi có bài đăng mới gửi duyệt, chúng sẽ xuất hiện ở đây."
        icon={
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      {pendingPosts.map((post) => {
        const state = getRowState(post.id)

        return (
          <div
            key={post.id}
            className="bg-white rounded-xl border border-yellow-200 shadow-sm overflow-hidden"
          >
            {/* Post preview */}
            <div className="p-4 space-y-3">
              {/* Channels */}
              <div className="flex flex-wrap gap-1.5">
                {post.channels.map((ch) => (
                  <ChannelBadge key={ch.code} channel={ch} />
                ))}
              </div>

              {/* Caption */}
              <p className="text-sm text-gray-800 font-body leading-relaxed line-clamp-4 whitespace-pre-wrap break-words">
                {post.caption}
              </p>

              {/* Reference links */}
              {post.reference_links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.reference_links.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-nedu-primary underline font-body"
                    >
                      {link.label || link.url}
                    </a>
                  ))}
                </div>
              )}

              {/* Author + time */}
              <div className="flex items-center gap-2">
                {post.author.avatar_url ? (
                  <img
                    src={post.author.avatar_url}
                    alt={post.author.display_name}
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full shrink-0 bg-nedu-primary/20 flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-nedu-primary font-body">
                      {post.author.display_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-xs text-gray-600 font-body">
                  {post.author.display_name}
                </span>
                <span className="text-gray-300" aria-hidden="true">·</span>
                <span className="text-xs text-gray-400 font-body">
                  {formatRelative(post.created_at)}
                </span>
              </div>

              {/* Error */}
              {state.error && (
                <p className="text-xs text-red-600 font-body">{state.error}</p>
              )}
            </div>

            {/* Action area */}
            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-3">
              {!state.isRejecting ? (
                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={state.isLoading}
                    disabled={state.isLoading}
                    onClick={() => handleApprove(post.id)}
                    className="bg-green-600 hover:bg-green-700 focus-visible:ring-green-500"
                  >
                    Duyệt
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={state.isLoading}
                    onClick={() => updateRow(post.id, { isRejecting: true })}
                  >
                    Từ chối
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 font-body">
                    Lý do từ chối <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={state.rejectNotes}
                    onChange={(e) => updateRow(post.id, { rejectNotes: e.target.value })}
                    rows={3}
                    placeholder="Nhập ghi chú cho người viết..."
                    className="
                      w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-body
                      focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent
                      resize-none
                    "
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      isLoading={state.isLoading}
                      disabled={state.isLoading || !state.rejectNotes.trim()}
                      onClick={() => handleRejectConfirm(post.id)}
                    >
                      Xác nhận từ chối
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={state.isLoading}
                      onClick={() =>
                        updateRow(post.id, { isRejecting: false, rejectNotes: '' })
                      }
                    >
                      Huỷ
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
