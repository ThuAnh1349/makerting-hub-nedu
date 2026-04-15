import { Badge } from '@/shared/components/ui/Badge'
import { ChannelBadge } from '@/shared/components/ChannelBadge'
import type { Post, PostStatus } from '../content.types'

interface StatusConfig {
  label: string
  variant: 'gray' | 'yellow' | 'green' | 'blue' | 'red'
  indigo?: boolean
}

const STATUS_CONFIG: Record<PostStatus, StatusConfig> = {
  draft: { label: 'Nháp', variant: 'gray' },
  pending_review: { label: 'Chờ duyệt', variant: 'yellow' },
  approved: { label: 'Đã duyệt', variant: 'green' },
  scheduled: { label: 'Đã lên lịch', variant: 'blue' },
  published: { label: 'Đã đăng', variant: 'blue', indigo: true },
  rejected: { label: 'Từ chối', variant: 'red' },
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'Vừa xong'
  if (diffMin < 60) return `${diffMin} phút trước`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} giờ trước`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD} ngày trước`
  return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })
}

function formatScheduled(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface PostCardProps {
  post: Post
  onClick?: () => void
}

export function PostCard({ post, onClick }: PostCardProps) {
  const statusCfg = STATUS_CONFIG[post.current_status] ?? STATUS_CONFIG.draft
  const isLong = post.caption.length > 120
  const captionDisplay = isLong
    ? post.caption.slice(0, 120).trimEnd() + '...'
    : post.caption

  return (
    <article
      onClick={onClick}
      className={`
        bg-white rounded-xl border border-gray-200 p-4 shadow-sm
        transition-shadow duration-150 hover:shadow-md
        ${onClick ? 'cursor-pointer' : ''}
        flex flex-col gap-3
      `}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick()
            }
          : undefined
      }
      aria-label={`Bài đăng: ${post.caption.slice(0, 60)}`}
    >
      {/* Top row: status + channels */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <span
          className={`
            inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset font-body
            ${
              statusCfg.indigo
                ? 'bg-indigo-100 text-indigo-800 ring-indigo-200'
                : statusCfg.variant === 'gray'
                ? 'bg-gray-100 text-gray-700 ring-gray-200'
                : statusCfg.variant === 'yellow'
                ? 'bg-yellow-100 text-yellow-800 ring-yellow-200'
                : statusCfg.variant === 'green'
                ? 'bg-green-100 text-green-800 ring-green-200'
                : statusCfg.variant === 'blue'
                ? 'bg-blue-100 text-blue-800 ring-blue-200'
                : 'bg-red-100 text-red-800 ring-red-200'
            }
          `}
        >
          {statusCfg.label}
        </span>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {post.channels.slice(0, 3).map((ch) => (
            <ChannelBadge key={ch.code} channel={ch} />
          ))}
          {post.channels.length > 3 && (
            <span className="text-xs text-gray-400 font-body">
              +{post.channels.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Caption */}
      <div>
        <p className="text-sm text-gray-800 font-body leading-relaxed whitespace-pre-wrap break-words">
          {captionDisplay}
        </p>
        {isLong && (
          <span className="text-xs text-nedu-primary font-body cursor-pointer hover:underline">
            Xem thêm
          </span>
        )}
      </div>

      {/* Rejection note */}
      {post.current_status === 'rejected' && post.latest_approval_note && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 flex items-start gap-2">
          <span className="shrink-0 text-sm" aria-hidden="true">
            ❌
          </span>
          <p className="text-xs text-yellow-800 font-body leading-snug">
            <span className="font-semibold">Ghi chú: </span>
            {post.latest_approval_note}
          </p>
        </div>
      )}

      {/* Campaign tag */}
      {post.campaign_title && (
        <div className="flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5 text-gray-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          <span className="text-xs text-gray-500 font-body truncate">
            {post.campaign_title}
          </span>
        </div>
      )}

      {/* Bottom row: author + time */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          {post.author.avatar_url ? (
            <img
              src={post.author.avatar_url}
              alt={post.author.display_name}
              className="w-6 h-6 rounded-full shrink-0 object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full shrink-0 bg-nedu-primary/20 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-nedu-primary font-body">
                {post.author.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-xs text-gray-600 font-body truncate">
            {post.author.display_name}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {post.scheduled_at && (
            <span className="text-xs text-blue-600 font-body flex items-center gap-1">
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
              {formatScheduled(post.scheduled_at)}
            </span>
          )}
          <span className="text-xs text-gray-400 font-body">
            {formatRelativeTime(post.created_at)}
          </span>
        </div>
      </div>
    </article>
  )
}

// Re-export for convenience
export { Badge }
