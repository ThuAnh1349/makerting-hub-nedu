import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Drawer } from '@/shared/components/ui/Drawer'
import { Badge } from '@/shared/components/ui/Badge'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { BriefTimeline } from './BriefTimeline'
import { apiClient } from '@/shared/config/api-client'
import type { Brief, BriefStatus } from '../brief.types'

// ── Constants ─────────────────────────────────────────────────────────────────

const CHANNELS = ['TikTok', 'YouTube', 'Facebook', 'Instagram', 'LinkedIn', 'Website', 'Đa kênh']

const FORMAT_CHIPS: Record<string, string[]> = {
  design: ['1:1 (1080×1080)', '4:5 (1080×1350)', '9:16 (1080×1920)', '16:9 (1920×1080)', '1200×628', '1280×720', 'Story 1080×1920', 'Banner Web'],
  video_editing: ['9:16 · Reels/TikTok', '16:9 · YouTube', '1:1 · IG Feed', '4:5 · IG Portrait', 'Shorts 60s', 'Reels 30s', 'YouTube 10–20min'],
}

const STATUS_BADGE: Record<BriefStatus, React.ComponentProps<typeof Badge>['variant']> = {
  submitted: 'yellow', in_progress: 'blue', review: 'yellow', completed: 'green', cancelled: 'gray',
}
const STATUS_LABEL: Record<BriefStatus, string> = {
  submitted: 'Đã gửi', in_progress: 'Đang làm', review: 'Đang duyệt', completed: 'Hoàn thành', cancelled: 'Đã huỷ',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 9,
  border: '1px solid rgba(0,0,0,0.09)', background: '#F9FAFB',
  fontSize: 12, color: '#111827', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.05em',
  color: '#6B7280', marginBottom: 4,
}
const fld: React.CSSProperties = { marginBottom: 10 }

// ── Create form ───────────────────────────────────────────────────────────────

function CreateBriefForm({
  typeCode,
  onSubmit,
  onCancel,
}: {
  typeCode: 'design' | 'video_editing'
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}) {
  const [title, setTitle]           = useState('')
  const [desc, setDesc]             = useState('')
  const [channel, setChannel]       = useState('')
  const [deadline, setDeadline]     = useState('')
  const [formats, setFormats]       = useState<string[]>([])
  const [priority, setPriority]     = useState<'normal' | 'urgent' | 'critical'>('normal')
  const [links, setLinks]           = useState<string[]>([])
  const [note, setNote]             = useState('')
  const [loading, setLoading]       = useState(false)
  const [dragOver, setDragOver]     = useState(false)
  const [previews, setPreviews]     = useState<{ name: string; url: string }[]>([])
  const fileRef                     = useRef<HTMLInputElement>(null)

  // Progress: 4 required fields
  const filled = [title, desc, channel, deadline].filter(Boolean).length
  const progress = (filled / 4) * 100
  const canSubmit = filled === 4

  function toggleFormat(f: string) {
    setFormats(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  function addLink() { setLinks(prev => [...prev, '']) }
  function updateLink(i: number, v: string) { setLinks(prev => prev.map((l, idx) => idx === i ? v : l)) }
  function removeLink(i: number) { setLinks(prev => prev.filter((_, idx) => idx !== i)) }

  function handleFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file)
      setPreviews(prev => [...prev, { name: file.name, url }])
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    try {
      await onSubmit({
        brief_type_code: typeCode,
        title, description: desc, channel,
        deadline: new Date(deadline).toISOString(),
        size_format: formats.join(', ') || undefined,
        priority,
        notes: note || undefined,
        ref_links: links.filter(Boolean),
      })
    } finally { setLoading(false) }
  }

  const chips = FORMAT_CHIPS[typeCode] ?? FORMAT_CHIPS.design

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      <div style={{ padding: '10px 15px', borderBottom: '1px solid rgba(0,0,0,0.07)', background: '#F9FAFB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Điền đủ thông tin để gửi brief
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#2d9b6b' }}>{filled}/4 trường</span>
        </div>
        <div style={{ height: 3, background: 'rgba(0,0,0,0.07)', borderRadius: 99 }}>
          <div style={{
            height: '100%', borderRadius: 99, transition: 'width 0.3s',
            background: 'linear-gradient(90deg,#2d9b6b,#56d49a)',
            width: `${progress}%`,
          }} />
        </div>
      </div>

      {/* ── Form body ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '13px 15px' }}>
        {/* Hint */}
        <div style={{
          display: 'flex', gap: 7, padding: '8px 10px', borderRadius: 9,
          background: 'rgba(45,155,107,0.06)', border: '1px solid rgba(45,155,107,0.15)',
          marginBottom: 12, fontSize: 11, color: '#374151',
        }}>
          <span>💡</span>
          <span>Điền đủ 4 trường bắt buộc <span style={{ color: '#ef4444' }}>*</span> để mở nút gửi brief</span>
        </div>

        {/* 1. Tiêu đề */}
        <div style={fld}>
          <label style={lbl}>Tiêu đề <span style={{ color: '#ef4444' }}>*</span></label>
          <input style={inp} value={title} onChange={e => setTitle(e.target.value)}
            placeholder="VD: Cover BaZi tháng 4 · TikTok 9:16" />
        </div>

        {/* 2. Mô tả */}
        <div style={fld}>
          <label style={lbl}>Mô tả chi tiết <span style={{ color: '#ef4444' }}>*</span></label>
          <textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }}
            value={desc} onChange={e => setDesc(e.target.value)}
            placeholder={'Phong cách, màu sắc, feel cần đạt...\nVD: Tone tối, chuyên nghiệp, font lớn, màu teal-navy...'} />
        </div>

        {/* 3+4. Kênh + Deadline (2 cols) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 10 }}>
          <div>
            <label style={lbl}>Kênh <span style={{ color: '#ef4444' }}>*</span></label>
            <select style={{ ...inp, cursor: 'pointer' }} value={channel} onChange={e => setChannel(e.target.value)}>
              <option value="">— Chọn kênh —</option>
              {CHANNELS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Deadline <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="date" style={inp} value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
        </div>

        {/* 5. Định dạng chips */}
        <div style={fld}>
          <label style={lbl}>
            Định dạng cần làm{' '}
            <span style={{ fontWeight: 400, color: '#9CA3AF', textTransform: 'none' }}>(chọn nhiều)</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
            {chips.map(f => {
              const active = formats.includes(f)
              return (
                <button key={f} type="button" onClick={() => toggleFormat(f)}
                  style={{
                    padding: '5px 6px', borderRadius: 7, fontSize: 10, fontWeight: 600,
                    border: active ? '1.5px solid #2d9b6b' : '1px solid rgba(0,0,0,0.09)',
                    background: active ? 'rgba(45,155,107,0.1)' : '#F9FAFB',
                    color: active ? '#1a5c46' : '#374151',
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                  }}>
                  {f}
                </button>
              )
            })}
          </div>
          {formats.length > 0 && (
            <div style={{ fontSize: 10, color: '#2d9b6b', marginTop: 5, fontWeight: 600 }}>
              ✅ Đã chọn: {formats.join(', ')}
            </div>
          )}
        </div>

        {/* 6. Mức độ ưu tiên */}
        <div style={fld}>
          <label style={lbl}>Mức độ ưu tiên</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {([
              { key: 'normal',   label: 'Thường',  color: '#2563eb' },
              { key: 'urgent',   label: '⚡ Gấp',  color: '#d97706' },
              { key: 'critical', label: '🔥 Khẩn', color: '#ef4444' },
            ] as const).map(({ key, label, color }) => (
              <button key={key} type="button" onClick={() => setPriority(key)}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 11, fontWeight: 700,
                  border: priority === key ? `1.5px solid ${color}` : '1px solid rgba(0,0,0,0.09)',
                  background: priority === key ? `${color}18` : '#F9FAFB',
                  color: priority === key ? color : '#6B7280',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 7. Tham khảo — Link */}
        <div style={fld}>
          <label style={lbl}>
            Tham khảo — Link &amp; File{' '}
            <span style={{ fontWeight: 400, color: '#9CA3AF', textTransform: 'none' }}>(không giới hạn)</span>
          </label>
          {links.map((link, i) => (
            <div key={i} style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
              <input style={{ ...inp, flex: 1 }} value={link}
                onChange={e => updateLink(i, e.target.value)}
                placeholder="https://pinterest.com/..." />
              <button type="button" onClick={() => removeLink(i)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16, padding: '0 4px' }}>
                ×
              </button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <button type="button" onClick={addLink}
              style={{
                padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                border: '1.5px dashed rgba(45,155,107,0.4)', background: 'transparent',
                color: '#2d9b6b', cursor: 'pointer',
              }}>
              ＋ Thêm link
            </button>
          </div>
        </div>

        {/* 8. Dropzone hình/video mẫu */}
        <div style={fld}>
          <label style={lbl}>Hình / video mẫu (kéo thả hoặc click chọn)</label>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
            style={{
              border: `2px dashed ${dragOver ? '#2d9b6b' : 'rgba(0,0,0,0.12)'}`,
              borderRadius: 11, padding: '18px 12px', textAlign: 'center',
              cursor: 'pointer', background: dragOver ? 'rgba(45,155,107,0.04)' : '#F9FAFB',
              transition: 'all 0.15s',
            }}>
            <div style={{ fontSize: 20, marginBottom: 5 }}>📎</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>Kéo thả hình / video mẫu vào đây</div>
            <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>hoặc nhấn để chọn từ máy tính · PNG, JPG, MP4</div>
            <input ref={fileRef} type="file" multiple accept="image/*,video/*"
              style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
          </div>
          {/* Previews */}
          {previews.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {previews.map((p, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={p.url} alt={p.name}
                    style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 7, border: '1px solid rgba(0,0,0,0.09)' }} />
                  <button type="button"
                    onClick={() => setPreviews(prev => prev.filter((_, idx) => idx !== i))}
                    style={{
                      position: 'absolute', top: -4, right: -4,
                      width: 16, height: 16, borderRadius: '50%',
                      background: '#ef4444', border: 'none', color: '#fff',
                      fontSize: 10, cursor: 'pointer', lineHeight: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 9. Ghi chú thêm */}
        <div style={fld}>
          <label style={lbl}>Ghi chú thêm (màu không dùng, yêu cầu đặc biệt…)</label>
          <textarea style={{ ...inp, minHeight: 52, resize: 'vertical' }}
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="VD: Không dùng màu đỏ, font chữ phải là Be Vietnam Pro, không text quá nhiều..." />
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div style={{ padding: '10px 15px', borderTop: '1px solid rgba(0,0,0,0.07)', background: '#F9FAFB' }}>
        <div style={{ display: 'flex', gap: 7 }}>
          <button type="button" onClick={onCancel}
            style={{
              padding: '8px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600,
              border: '1px solid rgba(0,0,0,0.09)', background: '#fff',
              color: '#374151', cursor: 'pointer',
            }}>
            Huỷ
          </button>
          <button type="submit" disabled={!canSubmit || loading}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 12, fontWeight: 700,
              border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed',
              background: canSubmit ? 'linear-gradient(135deg,#2d9b6b,#22c575)' : '#e5e7eb',
              color: canSubmit ? '#fff' : '#9CA3AF',
              opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
            {loading ? '⏳ Đang gửi…' : '📤 Gửi brief cho team'}
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 6, fontSize: 10, color: '#9CA3AF' }}>
          Team nhận ngay qua Telegram · Phản hồi trong 1h làm việc
        </div>
      </div>
    </form>
  )
}

// ── Brief Detail (view existing) ──────────────────────────────────────────────

function BriefDetail({ briefId, onClose }: { briefId: string; onClose: () => void }) {
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
    <div style={{ padding: 15 }}>
      <Skeleton variant="line" /><br />
      <Skeleton variant="line" /><br />
      <Skeleton variant="card" />
    </div>
  )
  if (!brief) return <p style={{ padding: 15, fontSize: 13, color: '#6B7280' }}>Không tìm thấy brief.</p>

  return (
    <div style={{ padding: '13px 15px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <p style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 3 }}>{brief.brief_type_label}</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{brief.title}</p>
        </div>
        <Badge variant={STATUS_BADGE[brief.current_status] ?? 'gray'}>
          {STATUS_LABEL[brief.current_status]}
        </Badge>
      </div>

      {/* Info card */}
      <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
        <p>{brief.description}</p>
        {brief.size_format && <p style={{ marginTop: 6, fontSize: 11, color: '#6B7280' }}>📐 {brief.size_format}</p>}
        <p style={{ marginTop: 4, fontSize: 11, color: '#6B7280' }}>
          ⏰ Deadline: {new Date(brief.deadline).toLocaleString('vi-VN', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
        </p>
        {brief.priority === 'urgent' && <p style={{ marginTop: 4, fontSize: 11, color: '#d97706', fontWeight: 700 }}>⚡ Ưu tiên: Gấp</p>}
        {brief.priority === 'critical' && <p style={{ marginTop: 4, fontSize: 11, color: '#ef4444', fontWeight: 700 }}>🔥 Ưu tiên: Khẩn</p>}
      </div>

      {/* Deliverable */}
      {brief.deliverable_url && (
        <a href={brief.deliverable_url} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
          📎 Xem file giao nộp →
        </a>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
        {brief.current_status === 'submitted' && (
          <button onClick={() => actionMut.mutate({ action_type: 'acknowledge' })}
            disabled={actionMut.isPending}
            style={{ padding: '8px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#2d9b6b,#22c575)', color: '#fff' }}>
            ✅ Nhận brief
          </button>
        )}
        {brief.current_status === 'in_progress' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input value={deliverUrl} onChange={e => setDeliverUrl(e.target.value)}
              style={inp} placeholder="Link file Google Drive / Cloudflare..." />
            <button onClick={() => actionMut.mutate({ action_type: 'deliver', deliverable_url: deliverUrl })}
              disabled={!deliverUrl || actionMut.isPending}
              style={{ padding: '8px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, border: 'none', cursor: deliverUrl ? 'pointer' : 'not-allowed', background: deliverUrl ? 'linear-gradient(135deg,#2d9b6b,#22c575)' : '#e5e7eb', color: deliverUrl ? '#fff' : '#9CA3AF' }}>
              📤 Giao nộp
            </button>
          </div>
        )}
        {brief.current_status === 'review' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => actionMut.mutate({ action_type: 'complete' })} disabled={actionMut.isPending}
                style={{ flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#2d9b6b,#22c575)', color: '#fff' }}>
                ✅ Hoàn thành
              </button>
              <button onClick={() => actionMut.mutate({ action_type: 'request_revision', notes: revisionNote || 'Cần chỉnh sửa' })}
                style={{ flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 12, fontWeight: 700, border: '1px solid rgba(0,0,0,0.09)', cursor: 'pointer', background: '#fff', color: '#374151' }}>
                🔄 Cần chỉnh sửa
              </button>
            </div>
            <textarea rows={2} value={revisionNote} onChange={e => setRevisionNote(e.target.value)}
              style={{ ...inp, resize: 'none' }} placeholder="Ghi chú chỉnh sửa (nếu có)..." />
          </div>
        )}
        {!['completed', 'cancelled'].includes(brief.current_status) && (
          <button onClick={() => { if (confirm('Xác nhận huỷ brief này?')) actionMut.mutate({ action_type: 'cancel' }) }}
            style={{ padding: '7px 14px', borderRadius: 9, fontSize: 11, fontWeight: 600, border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', background: 'rgba(239,68,68,0.06)', color: '#dc2626' }}>
            Huỷ brief
          </button>
        )}
      </div>

      {/* Timeline */}
      {brief.status_history && brief.status_history.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            📦 Tiến độ làm việc
          </p>
          <BriefTimeline history={brief.status_history} />
        </div>
      )}
    </div>
  )
}

// ── Main Drawer ───────────────────────────────────────────────────────────────

interface BriefDrawerProps {
  isOpen: boolean
  onClose: () => void
  briefId?: string
  defaultType?: 'design' | 'video_editing'
}

export default function BriefDrawer({ isOpen, onClose, briefId, defaultType = 'design' }: BriefDrawerProps) {
  const qc = useQueryClient()

  const typeLabel = defaultType === 'design' ? 'Design team' : 'Editing team'
  const typeEmoji = defaultType === 'design' ? '🎨' : '🎬'

  const createMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post('/api/v1/marketing/briefs', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['briefs'] }); onClose() },
  })

  const drawerTitle = briefId
    ? 'Chi tiết brief'
    : `Đặt ${defaultType === 'design' ? 'hình' : 'video'} · ${typeLabel}`

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={drawerTitle}
      icon={<div style={{
        width: 36, height: 36, borderRadius: 10, fontSize: 17,
        background: defaultType === 'design' ? 'linear-gradient(135deg,#fce7f3,#ede9fe)' : 'linear-gradient(135deg,#fff7ed,#ffedd5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{typeEmoji}</div>}
      subtitle="Quản lý đơn hàng nội bộ"
      noPadding
    >
      {briefId
        ? <BriefDetail briefId={briefId} onClose={onClose} />
        : <CreateBriefForm
            typeCode={defaultType}
            onSubmit={async (data) => { await createMut.mutateAsync(data) }}
            onCancel={onClose}
          />
      }
    </Drawer>
  )
}
