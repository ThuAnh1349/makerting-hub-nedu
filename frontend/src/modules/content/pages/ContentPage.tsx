import { useState, useRef } from 'react'
import { PageLayout } from '@/shared/components/PageLayout'
import { Drawer } from '@/shared/components/ui/Drawer'
import { ChannelBadge } from '@/shared/components/ChannelBadge'
import { useAuthStore } from '@/shared/stores/auth.store'
import { ROLES } from '@/shared/constants/roles'
import { usePosts, usePostDetail, useCreatePost, usePostAction } from '../hooks/useContent'
import type { Post, PostStatus, CreatePostBody } from '../content.types'

// ── Styles ────────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: '#fff', borderRadius: 13,
  border: '1px solid rgba(0,0,0,0.09)',
  padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
}
const secLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#6B7280',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700,
  color: '#6B7280', textTransform: 'uppercase',
  letterSpacing: '0.06em', marginBottom: 4,
}
const inp: React.CSSProperties = {
  width: '100%', background: '#F9FAFB',
  border: '1px solid rgba(0,0,0,0.09)', borderRadius: 9,
  padding: '8px 11px', fontSize: 12, fontWeight: 500,
  color: '#111827', outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box',
}

// ── Channel config ────────────────────────────────────────────────────────────
const CHANNELS = [
  { code: 'tiktok',    label: 'TikTok',    bg: '#010101', short: 'TK' },
  { code: 'youtube',   label: 'YouTube',   bg: '#FF0000', short: 'YT' },
  { code: 'facebook',  label: 'Facebook',  bg: '#1877F2', short: 'FB' },
  { code: 'instagram', label: 'Instagram', bg: '#E1306C', short: 'IG' },
  { code: 'linkedin',  label: 'LinkedIn',  bg: '#0A66C2', short: 'LI' },
  { code: 'website',   label: 'Website',   bg: '#6366F1', short: 'WB' },
]

// ── Templates ─────────────────────────────────────────────────────────────────
const TEMPLATES: Record<string, string> = {
  bazi: `🔮 BaZi 2026 — Đọc vận mệnh từ ngày sinh

Bạn có biết rằng ngày sinh của mình chứa đựng toàn bộ bản đồ cuộc đời?

BaZi — Tứ Trụ Mệnh Lý — không phải mê tín, mà là hệ thống phân tích cổ đại đã giúp hàng triệu người:
✅ Biết năm nào nên ra quyết định lớn
✅ Hiểu điểm mạnh cốt lõi của bản thân
✅ Tránh sai lầm theo chu kỳ vận hành

Comment "BAZI" để nhận tài liệu miễn phí 🎁`,
  personal: `✨ Bạn đang sống cho ai?

3 năm trước, tôi có tất cả theo tiêu chuẩn xã hội — công việc ổn định, thu nhập tốt, gia đình hài lòng.

Nhưng mỗi sáng thức dậy, tôi cảm thấy... trống rỗng.

Đó là lúc tôi nhận ra: tôi đang sống theo kịch bản của người khác.

Hành trình tìm lại bản thân không dễ. Nhưng nó thay đổi mọi thứ.

Bạn đã bao giờ cảm thấy như vậy chưa? 💬`,
  founder: `💼 Founder mindset — Tại sao bạn cần dừng lại để bứt phá?

Sau 5 năm xây dựng doanh nghiệp, tôi học được 1 điều:
Làm nhiều hơn ≠ Kết quả tốt hơn

3 quyết định thay đổi trajectory của tôi:
1️⃣ Dừng nhận thêm client — focus vào hệ thống
2️⃣ Đầu tư vào bản thân trước khi đầu tư vào marketing
3️⃣ Đọc chu kỳ vận hành thay vì reactive

Kết quả Q4: tăng 3x doanh thu với ít effort hơn.`,
  event: `🌿 Retreat Đà Lạt T5/2026 — 9 ngày thay đổi 9 năm?

Không phải du lịch. Không phải khoá học thông thường.

Đây là 9 ngày bạn dừng lại hoàn toàn — để nghe lại bản thân mình.

Chương trình bao gồm:
🌄 Thiền buổi sáng giữa thiên nhiên Đà Lạt
✍️ Workshop viết lại giá trị sống cốt lõi
🤝 Cộng đồng những người cùng hành trình
💫 1:1 coaching với NhiLe

Chỉ còn 8 chỗ · Nhắn RETREAT để giữ chỗ`,
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  draft:          { label: 'Nháp',       bg: '#f3f4f6', color: '#6B7280' },
  pending_review: { label: 'Chờ duyệt',  bg: '#fef3c7', color: '#92400E' },
  approved:       { label: 'Đã duyệt',   bg: '#dcfce7', color: '#166534' },
  scheduled:      { label: 'Đã lên lịch',bg: '#dbeafe', color: '#1e40af' },
  published:      { label: 'Đã đăng',    bg: '#f0fdf4', color: '#166534' },
  rejected:       { label: 'Từ chối',    bg: '#fee2e2', color: '#991b1b' },
}

type FilterTab = 'all' | 'draft' | 'pending_review' | 'approved' | 'scheduled' | 'published' | 'rejected'
const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',           label: 'Tất cả' },
  { key: 'draft',         label: 'Nháp' },
  { key: 'pending_review',label: 'Chờ duyệt' },
  { key: 'approved',      label: 'Đã duyệt' },
  { key: 'scheduled',     label: 'Đã lên lịch' },
  { key: 'published',     label: 'Đã đăng' },
  { key: 'rejected',      label: 'Từ chối' },
]

// ── Post Detail Drawer ────────────────────────────────────────────────────────
function PostDetailDrawer({ postId, isOpen, onClose }: { postId: string | null; isOpen: boolean; onClose: () => void }) {
  const { user } = useAuthStore()
  const isLeader = user?.roles.some(r => [ROLES.CO_LEADER, ROLES.MARKETING_LEADER].includes(r))
  const { data: post, isLoading } = usePostDetail(postId)
  const postAction = usePostAction()
  const [rejectNote, setRejectNote] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [schedDate, setSchedDate] = useState('')
  const [schedHour, setSchedHour] = useState('10')
  const [showSched, setShowSched] = useState(false)

  async function doAction(type: string, extra?: Record<string, unknown>) {
    if (!post) return
    await postAction.mutateAsync({ id: post.id, body: { action_type: type, ...extra } })
    onClose()
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={post?.caption?.slice(0, 40) ?? 'Chi tiết bài'} subtitle="Bài đăng nội dung">
      {isLoading && <div style={{ padding: 16, color: '#9CA3AF', fontSize: 12 }}>Đang tải...</div>}
      {post && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Status + channels */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {(() => {
              const s = STATUS_CONFIG[post.current_status] ?? { label: post.current_status, bg: '#f3f4f6', color: '#374151' }
              return <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>{s.label}</span>
            })()}
            {post.channels.map((ch: any) => <ChannelBadge key={ch.code} channel={ch} />)}
          </div>

          {/* Caption */}
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
            {post.caption}
          </div>

          {/* Rejection note */}
          {post.current_status === 'rejected' && post.latest_approval_note && (
            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 9, padding: '8px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#92400E', marginBottom: 3 }}>❌ Lý do từ chối</div>
              <div style={{ fontSize: 12, color: '#92400E' }}>{post.latest_approval_note}</div>
            </div>
          )}

          {/* Scheduled at */}
          {post.scheduled_at && (
            <div style={{ fontSize: 11, color: '#2563eb' }}>
              🕐 Lịch đăng: {new Date(post.scheduled_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}

          {/* Campaign */}
          {post.campaign_title && (
            <div style={{ fontSize: 11, color: '#6B7280' }}>🎯 Campaign: <strong>{post.campaign_title}</strong></div>
          )}

          {/* Actions */}
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(post.current_status === 'draft' || post.current_status === 'rejected') && (
              <button onClick={() => doAction('submit_review')} disabled={postAction.isPending}
                style={{ padding: '9px 0', borderRadius: 9, fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#2d9b6b,#22c575)', color: '#fff', width: '100%' }}>
                ✈ Gửi Co-Leader duyệt
              </button>
            )}
            {isLeader && post.current_status === 'pending_review' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => doAction('approve')} style={{ flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#fff' }}>✅ Duyệt</button>
                  <button onClick={() => setShowReject(v => !v)} style={{ flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 12, fontWeight: 700, border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', background: 'rgba(239,68,68,0.06)', color: '#dc2626' }}>❌ Từ chối</button>
                </div>
                {showReject && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} rows={2}
                      style={{ ...inp, resize: 'none' }} placeholder="Lý do từ chối..." />
                    <button onClick={() => doAction('reject', { notes: rejectNote })} disabled={!rejectNote}
                      style={{ padding: '7px 0', borderRadius: 9, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: '#ef4444', color: '#fff' }}>
                      Xác nhận từ chối
                    </button>
                  </div>
                )}
              </div>
            )}
            {post.current_status === 'approved' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={() => setShowSched(v => !v)} style={{ padding: '8px 0', borderRadius: 9, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#2563eb,#3b82f6)', color: '#fff' }}>
                  📅 Lên lịch đăng
                </button>
                {showSched && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 6 }}>
                      <input type="date" style={inp} value={schedDate} onChange={e => setSchedDate(e.target.value)} />
                      <select style={inp} value={schedHour} onChange={e => setSchedHour(e.target.value)}>
                        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => <option key={h} value={h}>{h}:00</option>)}
                      </select>
                    </div>
                    <button onClick={() => doAction('schedule', { scheduled_at: new Date(`${schedDate}T${schedHour}:00:00`).toISOString() })}
                      disabled={!schedDate}
                      style={{ padding: '7px 0', borderRadius: 9, fontSize: 12, fontWeight: 700, border: 'none', cursor: schedDate ? 'pointer' : 'not-allowed', background: schedDate ? '#2563eb' : '#e5e7eb', color: schedDate ? '#fff' : '#9CA3AF' }}>
                      Xác nhận lên lịch
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  )
}

// ── Main ContentPage ──────────────────────────────────────────────────────────
export function ContentPage() {
  const createPost = useCreatePost()
  const postAction = usePostAction()

  // Form state
  const [hook, setHook]         = useState('')
  const [caption, setCaption]   = useState('')
  const [channels, setChannels] = useState<string[]>([])
  const [hashtags, setHashtags] = useState('')
  const [links, setLinks]       = useState<string[]>([])
  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [showAlert, setShowAlert]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // List state
  const [tab, setTab]               = useState<FilterTab>('all')
  const [selectedPostId, setPost]   = useState<string | null>(null)

  const statusFilter = tab !== 'all' ? tab as PostStatus : undefined
  const { data } = usePosts(statusFilter ? { status: statusFilter } : undefined)
  const posts: Post[] = (data?.data ?? data ?? []) as Post[]

  function toggleChannel(code: string) {
    setChannels(p => p.includes(code) ? p.filter(c => c !== code) : [...p, code])
  }
  function applyTemplate(key: string) {
    const t = TEMPLATES[key]
    if (t) setCaption(t)
  }
  function addLink() { setLinks(p => [...p, '']) }
  function updateLink(i: number, v: string) { setLinks(p => p.map((l, idx) => idx === i ? v : l)) }
  function removeLink(i: number) { setLinks(p => p.filter((_, idx) => idx !== i)) }
  function handleFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach(f => {
      if (f.type.startsWith('image/')) setPreviews(p => [...p, { name: f.name, url: URL.createObjectURL(f) }])
    })
  }

  async function handleSubmit() {
    if (!caption || channels.length === 0) return
    setSubmitting(true)
    try {
      const fullCaption = hook ? `${hook}\n\n${caption}${hashtags ? '\n\n' + hashtags : ''}` : `${caption}${hashtags ? '\n\n' + hashtags : ''}`
      await createPost.mutateAsync({
        caption: fullCaption,
        channel_codes: channels,
        reference_links: links.filter(Boolean).map(url => ({ url, label: '' })),
      } as CreatePostBody)
      // Reset form
      setHook(''); setCaption(''); setChannels([]); setHashtags(''); setLinks([]); setPreviews([])
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 8000)
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = caption.trim().length > 0 && channels.length > 0

  return (
    <PageLayout
      title="✍️ Tạo bài mới"
      subtitle="Nedu Marketing · Tháng 4, 2026"
      actions={
        <div style={{ display: 'flex', gap: 7 }}>
          <button style={{ padding: '6px 12px', borderRadius: 9, fontSize: 11, fontWeight: 700, border: '1px solid rgba(0,0,0,0.09)', background: '#fff', color: '#374151', cursor: 'pointer' }}>
            📅 Xem lịch
          </button>
          <button onClick={handleSubmit} disabled={!canSubmit || submitting}
            style={{ padding: '6px 12px', borderRadius: 9, fontSize: 11, fontWeight: 700, border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed', background: 'linear-gradient(135deg,#2d9b6b,#22c575)', color: '#fff', boxShadow: '0 2px 8px rgba(45,155,107,0.3)', opacity: canSubmit ? 1 : 0.5 }}>
            + Thêm vào lịch
          </button>
        </div>
      }
    >

      {/* ── Approval alert ─────────────────────────────────────────────────── */}
      {showAlert && (
        <div style={{ background: 'rgba(240,180,41,0.1)', border: '0.5px solid rgba(240,180,41,0.35)', borderRadius: 12, padding: '12px 14px', marginBottom: 11, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>⏳</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#92400E' }}>Đang chờ Co-Leader duyệt</div>
            <div style={{ fontSize: 11, color: '#B45309' }}>Bài đã gửi · Co-Leader và Leader đã được thông báo</div>
          </div>
          <button onClick={() => setShowAlert(false)} style={{ padding: '4px 8px', borderRadius: 7, border: '1px solid rgba(0,0,0,0.09)', background: '#fff', fontSize: 11, cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* ── Hint ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 11px', background: '#f0fdf4', border: '1px solid rgba(45,155,107,0.2)', borderRadius: 10, marginBottom: 14, fontSize: 11, color: '#1a5c46' }}>
        <span>💡</span>
        <span><strong>Quy trình:</strong> Soạn bài → Upload media → Thêm link → Gửi Co-Leader duyệt → Leader approve → Set lịch đăng</span>
      </div>

      {/* ── 2-col form grid ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>

        {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Card: Nội dung bài */}
          <div style={card}>
            <div style={secLabel}>📝 Nội dung bài</div>

            {/* Hook */}
            <div style={{ marginBottom: 8 }}>
              <label style={lbl}>Chủ đề / Hook <span style={{ color: '#ef4444' }}>*</span></label>
              <input style={inp} value={hook} onChange={e => setHook(e.target.value)}
                placeholder="VD: Sao 8 năm 2026 — cơ hội đỉnh cao chưa từng có..." />
            </div>

            {/* Templates */}
            <div style={{ marginBottom: 8 }}>
              <label style={lbl}>Template nhanh</label>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {[
                  { key: 'bazi', label: 'BaZi' },
                  { key: 'personal', label: 'Phát triển' },
                  { key: 'founder', label: 'Founder' },
                  { key: 'event', label: 'Sự kiện' },
                ].map(t => (
                  <button key={t.key} type="button" onClick={() => applyTemplate(t.key)}
                    style={{ padding: '4px 9px', borderRadius: 7, border: '1px dashed rgba(45,155,107,0.4)', background: '#f0fdf4', color: '#1a5c46', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Caption */}
            <div>
              <label style={lbl}>Caption / Kịch bản <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea style={{ ...inp, minHeight: 160, resize: 'vertical' }}
                value={caption} onChange={e => setCaption(e.target.value)}
                placeholder="Viết caption thu hút đúng voice Nedu..." />
            </div>
          </div>

          {/* Card: Kênh & Hashtag */}
          <div style={card}>
            <div style={secLabel}>📡 Kênh & Hashtag</div>

            <div style={{ marginBottom: 8 }}>
              <label style={lbl}>Kênh đăng (chọn nhiều) <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 4 }}>
                {CHANNELS.map(ch => {
                  const active = channels.includes(ch.code)
                  return (
                    <button key={ch.code} type="button" onClick={() => toggleChannel(ch.code)}
                      style={{ padding: '6px 4px', borderRadius: 7, fontSize: 10, fontWeight: 700, cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit', transition: 'all 0.15s', border: active ? `1.5px solid ${ch.bg}` : '1.5px solid rgba(0,0,0,0.09)', background: active ? `${ch.bg}15` : '#F9FAFB', color: active ? ch.bg : '#374151' }}>
                      <span style={{ display: 'flex', width: 22, height: 22, borderRadius: 6, background: ch.bg, color: '#fff', fontSize: 9, fontWeight: 800, alignItems: 'center', justifyContent: 'center', margin: '0 auto 2px' }}>{ch.short}</span>
                      {ch.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label style={lbl}>Hashtags</label>
              <input style={inp} value={hashtags} onChange={e => setHashtags(e.target.value)}
                placeholder="#nedu #nhile #phattrienbantan #bazi..." />
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Card: Media */}
          <div style={card}>
            <div style={secLabel}>🖼 Hình / Video đính kèm</div>

            {/* Dropzone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
              style={{ border: `2px dashed ${dragOver ? '#2d9b6b' : 'rgba(45,155,107,0.35)'}`, borderRadius: 10, padding: '13px 10px', textAlign: 'center', background: dragOver ? '#f0fdf4' : '#F9FAFB', transition: 'all 0.2s', cursor: 'pointer', position: 'relative', marginBottom: 5 }}>
              <input ref={fileRef} type="file" multiple accept="image/*,video/*"
                style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
              <div style={{ fontSize: 20, marginBottom: 3 }}>🖼</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>Kéo thả hình / video vào đây</div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>hoặc nhấn để chọn · JPG, PNG, GIF, MP4, MOV</div>
            </div>

            {/* Thumbnails */}
            {previews.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                {previews.map((p, i) => (
                  <div key={i} style={{ width: 54, height: 54, borderRadius: 7, border: '1px solid rgba(0,0,0,0.09)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={p.url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => setPreviews(p => p.filter((_, idx) => idx !== i))}
                      style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Link file duyệt */}
          <div style={card}>
            <div style={secLabel}>🔗 Link file duyệt</div>
            <div style={{ fontSize: 10.5, color: '#6B7280', marginBottom: 8 }}>Drive, Canva, Figma, YouTube... Co-Leader click trực tiếp</div>

            {links.map((link, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                <input style={{ ...inp, flex: 1, padding: '6px 9px', fontSize: 11 }}
                  value={link} onChange={e => updateLink(i, e.target.value)} placeholder="https://drive.google.com/..." />
                <button type="button" onClick={() => removeLink(i)}
                  style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid rgba(0,0,0,0.09)', background: '#F9FAFB', cursor: 'pointer', fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ×
                </button>
              </div>
            ))}

            <button type="button" onClick={addLink}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 7, border: '1px dashed rgba(45,155,107,0.4)', background: 'transparent', fontSize: 10.5, fontWeight: 700, color: '#1a5c46', cursor: 'pointer', fontFamily: 'inherit' }}>
              ＋ Thêm link
            </button>
          </div>

          {/* CTA: Gửi Co-Leader */}
          <div style={{ background: 'linear-gradient(135deg,#1e3a2f,#2d9b6b)', borderRadius: 13, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a7f3d0', marginBottom: 3 }}>✅ Gửi Co-Leader (Huê) duyệt</div>
            <div style={{ fontSize: 10.5, color: '#d1fae5', marginBottom: 12, lineHeight: 1.5 }}>
              Bài chỉ được đăng sau khi duyệt. Đừng tự đăng khi chưa qua bước này.
            </div>
            <button onClick={handleSubmit} disabled={!canSubmit || submitting}
              style={{ width: '100%', padding: 11, background: '#fff', color: '#166534', fontSize: 12, fontWeight: 800, borderRadius: 9, border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed', opacity: canSubmit ? 1 : 0.6, fontFamily: 'inherit' }}>
              {submitting ? '⏳ Đang gửi...' : '✈ Gửi Co-Leader duyệt'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Danh sách bài đã tạo ───────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 12 }}>📋 Bài đã tạo</div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: '4px 11px', borderRadius: 99, fontSize: 11, fontWeight: 700, border: '1px solid', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', borderColor: tab === t.key ? '#1a5c46' : 'rgba(0,0,0,0.09)', background: tab === t.key ? '#f0fdf4' : '#fff', color: tab === t.key ? '#1a5c46' : '#6B7280' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Post rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {posts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 12 }}>
              Chưa có bài đăng nào
            </div>
          )}
          {posts.map((post: Post) => {
            const s = STATUS_CONFIG[post.current_status] ?? { label: post.current_status, bg: '#f3f4f6', color: '#374151' }
            return (
              <div key={post.id} onClick={() => setPost(post.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fff', borderRadius: 10, border: '1px solid rgba(0,0,0,0.09)', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                {/* Channels */}
                <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                  {post.channels.slice(0, 2).map((ch: any) => (
                    <div key={ch.code} style={{ width: 20, height: 20, borderRadius: 5, background: ch.color_hex, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontWeight: 800 }}>
                      {ch.code.slice(0, 2).toUpperCase()}
                    </div>
                  ))}
                </div>
                {/* Caption preview */}
                <div style={{ flex: 1, fontSize: 12, color: '#111827', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {post.caption}
                </div>
                {/* Scheduled */}
                {post.scheduled_at && (
                  <div style={{ fontSize: 10, color: '#6B7280', flexShrink: 0 }}>
                    {new Date(post.scheduled_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                  </div>
                )}
                {/* Status badge */}
                <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, flexShrink: 0 }}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail drawer */}
      <PostDetailDrawer postId={selectedPostId} isOpen={!!selectedPostId} onClose={() => setPost(null)} />
    </PageLayout>
  )
}
