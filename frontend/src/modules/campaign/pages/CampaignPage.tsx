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

// ── Shared styles ─────────────────────────────────────────────────────────────

const minp: React.CSSProperties = {
  width: '100%', padding: '8px 11px', borderRadius: 9,
  border: '1px solid rgba(0,0,0,0.09)', background: '#F9FAFB',
  fontSize: 12, fontWeight: 500, color: '#111827',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.06em',
  color: '#6B7280', marginBottom: 4,
}
const mfld: React.CSSProperties = { marginBottom: 10 }

// ── Step indicator ────────────────────────────────────────────────────────────

function StepPill({ n, label, state }: { n: number; label: string; state: 'active' | 'done' | 'idle' }) {
  const styles: Record<string, React.CSSProperties> = {
    active: { background: '#7C3AED', color: '#fff', borderColor: '#7C3AED' },
    done:   { background: '#dcfce7', color: '#166534', borderColor: '#86efac' },
    idle:   { background: '#F9FAFB', color: '#9CA3AF', borderColor: 'rgba(0,0,0,0.09)' },
  }
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 600, padding: '4px 10px',
      borderRadius: 99, border: '1px solid', ...styles[state],
    }}>
      {state === 'done' ? '✓ ' : `${n} · `}{label}
    </span>
  )
}

// ── 3-step Create Campaign form ───────────────────────────────────────────────

const CAMP_TYPES = [
  { key: 'launch',    icon: '🚀', name: 'Khai giảng khoá học', desc: 'Launch cohort mới hoặc ra mắt khoá mới' },
  { key: 'awareness', icon: '📣', name: 'Brand Awareness',      desc: 'Tăng nhận biết thương hiệu, không bán trực tiếp' },
  { key: 'event',     icon: '🌿', name: 'Sự kiện / Retreat',    desc: 'Quảng bá retreat, workshop, offline event' },
  { key: 'nurture',   icon: '💧', name: 'Nurture Alumni',       desc: 'Upsell, tái kích hoạt học viên cũ, referral' },
]

const KPIS = [
  { key: 'lead',     label: '🎯 Lead mới' },
  { key: 'reach',    label: '📣 Reach / Views' },
  { key: 'enroll',   label: '✅ Enrollment' },
  { key: 'nps',      label: '💬 NPS / Trust' },
  { key: 'referral', label: '🔄 Referral' },
  { key: 'brand',    label: '✨ Brand lift' },
]

const PRODUCTS = [
  '🟣 Là Chính Mình — Cohort 8',
  '🟠 30 Days Challenge',
  '🌿 Retreat Đà Lạt T5/2026',
  '🤝 Coaching 1:1 Package',
  '💼 Kinh Doanh Từ Bên Trong',
  '📣 Brand Awareness (không bán khoá cụ thể)',
]

const CHANNELS = ['TikTok', 'YouTube', 'Facebook', 'Instagram', 'LinkedIn', 'Website']

const ARC_PHASES = [
  { key: 'open',  label: '🟣 OPENING (2–3 bài)', color: '#7C3AED',
    placeholder: 'Hook bằng pain point gì? Tone đồng cảm hay provocative? Kết thúc với câu hỏi gì dẫn vào Build?' },
  { key: 'build', label: '🔵 BUILD (3–5 bài)',   color: '#2563eb',
    placeholder: 'Story học viên nào dùng? Giá trị gì cho đi miễn phí? Behind-the-scenes gì?' },
  { key: 'close', label: '🟠 CLOSE (2–3 bài)',   color: '#ea580c',
    placeholder: 'Urgency thật (deadline/slots)? Objection cần xử lý? Testimonial mạnh nhất?' },
  { key: 'cta',   label: '🟢 CTA (1–2 bài)',     color: '#16a34a',
    placeholder: '1 CTA duy nhất là gì? Cụ thể đến mức nào? Link/hành động cụ thể?' },
]

const POST_PHASES = ['opening', 'build', 'close', 'cta']
const POST_CHANNELS = ['TikTok', 'YouTube', 'Facebook', 'Instagram', 'LinkedIn']
const ASSIGNEES = [
  'Phạm Thị Linh (Marketing)',
  'Nguyễn Thị Hương (Content)',
  'Trần Văn An (Design)',
  'Team marketing (tất cả)',
]

interface PostRow { id: number; phase: string; title: string; channel: string; date: string }

function CreateCampaignModal({
  onSubmit,
  onClose,
  isSubmitting,
}: {
  onSubmit: (data: Record<string, unknown>) => void
  onClose: () => void
  isSubmitting: boolean
}) {
  const [step, setStep] = useState(1)

  // Step 1
  const [name, setName]       = useState('')
  const [type, setType]       = useState('launch')
  const [startDate, setStart] = useState('')
  const [endDate, setEnd]     = useState('')
  const [product, setProduct] = useState(PRODUCTS[0])
  const [kpis, setKpis]       = useState<string[]>(['lead'])
  const [target, setTarget]   = useState('')
  const [budget, setBudget]   = useState('')
  const [icp, setIcp]         = useState('')

  // Step 2
  const [arcOpen, setArcOpen]   = useState('')
  const [arcBuild, setArcBuild] = useState('')
  const [arcClose, setArcClose] = useState('')
  const [arcCta, setArcCta]     = useState('')
  const [channels, setChannels] = useState<string[]>(['TikTok', 'YouTube', 'Facebook'])

  // Step 3
  const [posts, setPosts]     = useState<PostRow[]>([])
  const [assignee, setAssign] = useState(ASSIGNEES[0])
  const [postSeq, setSeq]     = useState(0)

  function toggleKpi(k: string) {
    setKpis(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k])
  }
  function toggleChannel(c: string) {
    setChannels(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])
  }
  function addPost() {
    setSeq(n => n + 1)
    setPosts(p => [...p, { id: postSeq + 1, phase: 'opening', title: '', channel: 'TikTok', date: '' }])
  }
  function updatePost(id: number, field: keyof PostRow, val: string) {
    setPosts(p => p.map(r => r.id === id ? { ...r, [field]: val } : r))
  }
  function removePost(id: number) { setPosts(p => p.filter(r => r.id !== id)) }

  function nav(dir: number) {
    const next = step + dir
    if (next < 1) return
    if (next > 3) {
      onSubmit({
        title: name, campaign_type: type,
        start_date: startDate || undefined, end_date: endDate || undefined,
        product, kpis, target_description: target, budget_total: budget ? parseInt(budget.replace(/\D/g, '')) : undefined,
        icp_description: icp,
        arc: { open: arcOpen, build: arcBuild, close: arcClose, cta: arcCta },
        channels, posts: posts.filter(p => p.title),
        assigned_to_name: assignee,
      })
      return
    }
    setStep(next)
  }

  const stepState = (n: number) => n < step ? 'done' : n === step ? 'active' : 'idle'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        padding: '14px 16px 10px', borderBottom: '1px solid rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>🎯 Tạo chiến dịch mới</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Xây narrative trước khi viết bài đầu tiên</div>
        </div>
        <button onClick={onClose} style={{
          width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(0,0,0,0.09)',
          background: '#F9FAFB', cursor: 'pointer', fontSize: 14, color: '#9CA3AF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', maxHeight: '68vh' }}>

        {/* Step pills */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 16 }}>
          <StepPill n={1} label="Chiến dịch"    state={stepState(1)} />
          <span style={{ fontSize: 11, color: '#D1D5DB' }}>›</span>
          <StepPill n={2} label="Arc Narrative" state={stepState(2)} />
          <span style={{ fontSize: 11, color: '#D1D5DB' }}>›</span>
          <StepPill n={3} label="Bài viết & Lịch" state={stepState(3)} />
        </div>

        {/* ════════════════ STEP 1 ════════════════ */}
        {step === 1 && (
          <div>
            {/* Tên chiến dịch */}
            <div style={mfld}>
              <label style={lbl}>Tên chiến dịch <span style={{ color: '#ef4444' }}>*</span></label>
              <input style={minp} value={name} onChange={e => setName(e.target.value)}
                placeholder="VD: Retreat Đà Lạt tháng 5 · LCM Cohort 7 Launch" />
            </div>

            {/* Loại chiến dịch — 2×2 cards */}
            <div style={mfld}>
              <label style={lbl}>Loại chiến dịch</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {CAMP_TYPES.map(t => (
                  <button key={t.key} type="button" onClick={() => setType(t.key)}
                    style={{
                      padding: '12px 10px', borderRadius: 10, textAlign: 'left',
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
                      border: type === t.key ? '1.5px solid #ea580c' : '1.5px solid rgba(0,0,0,0.09)',
                      background: type === t.key ? '#fff7ed' : '#F9FAFB',
                      boxShadow: type === t.key ? '0 0 0 3px rgba(234,88,12,0.12)' : 'none',
                    }}>
                    <span style={{ fontSize: 22, display: 'block', marginBottom: 5 }}>{t.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', display: 'block' }}>{t.name}</span>
                    <span style={{ fontSize: 10, color: '#6B7280', display: 'block', marginTop: 2 }}>{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ngày bắt đầu + kết thúc */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={lbl}>Ngày bắt đầu <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="date" style={minp} value={startDate} onChange={e => setStart(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Ngày kết thúc / Launch date</label>
                <input type="date" style={minp} value={endDate} onChange={e => setEnd(e.target.value)} />
              </div>
            </div>

            {/* Sản phẩm */}
            <div style={mfld}>
              <label style={lbl}>Khoá học / Sản phẩm đang promote</label>
              <select style={{ ...minp, cursor: 'pointer' }} value={product} onChange={e => setProduct(e.target.value)}>
                {PRODUCTS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            {/* KPI chips */}
            <div style={mfld}>
              <label style={lbl}>KPI chính của chiến dịch</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginTop: 5 }}>
                {KPIS.map(k => {
                  const active = kpis.includes(k.key)
                  return (
                    <button key={k.key} type="button" onClick={() => toggleKpi(k.key)}
                      style={{
                        padding: '5px 4px', borderRadius: 8, fontSize: 10.5, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                        border: active ? '1px solid #1a5c46' : '1px solid rgba(0,0,0,0.09)',
                        background: active ? '#f0fdf4' : '#fff',
                        color: active ? '#1a5c46' : '#6B7280',
                      }}>
                      {k.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Target + Budget */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={lbl}>Target số cụ thể</label>
                <input style={minp} value={target} onChange={e => setTarget(e.target.value)}
                  placeholder="VD: 30 lead mới, 500K reach..." />
              </div>
              <div>
                <label style={lbl}>Budget chiến dịch</label>
                <input style={minp} value={budget} onChange={e => setBudget(e.target.value)}
                  placeholder="VD: 5,000,000 VND" />
              </div>
            </div>

            {/* ICP */}
            <div style={mfld}>
              <label style={lbl}>ICP — Đối tượng mục tiêu của chiến dịch này</label>
              <input style={minp} value={icp} onChange={e => setIcp(e.target.value)}
                placeholder="VD: Phụ nữ 30–45, đang burnout, có nghề nghiệp ổn định, TP.HCM/HN" />
            </div>
          </div>
        )}

        {/* ════════════════ STEP 2 ════════════════ */}
        {step === 2 && (
          <div>
            {/* Hint */}
            <div style={{
              display: 'flex', gap: 7, padding: '8px 10px', borderRadius: 9, marginBottom: 12,
              background: 'rgba(45,155,107,0.06)', border: '1px solid rgba(45,155,107,0.15)',
              fontSize: 11, color: '#374151',
            }}>
              <span>✍️</span>
              <span><strong>Viết narrative trước khi viết caption.</strong> Mỗi ô = brief tổng quan cho từng giai đoạn — không phải caption cụ thể.</span>
            </div>

            {/* 2×2 Arc grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 12 }}>
              {[
                { key: 'open',  data: arcOpen,  set: setArcOpen,  ...ARC_PHASES[0] },
                { key: 'build', data: arcBuild, set: setArcBuild, ...ARC_PHASES[1] },
                { key: 'close', data: arcClose, set: setArcClose, ...ARC_PHASES[2] },
                { key: 'cta',   data: arcCta,   set: setArcCta,   ...ARC_PHASES[3] },
              ].map(p => (
                <div key={p.key} style={{
                  border: '1px solid rgba(0,0,0,0.09)', borderRadius: 9,
                  padding: 10, background: '#F9FAFB',
                  borderTop: `3px solid ${p.color}`,
                }}>
                  <div style={{
                    fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase',
                    letterSpacing: '0.07em', marginBottom: 5, color: p.color,
                  }}>
                    {p.label}
                  </div>
                  <textarea
                    value={p.data}
                    onChange={e => p.set(e.target.value)}
                    placeholder={p.placeholder}
                    style={{
                      width: '100%', border: 'none', background: 'transparent',
                      fontSize: 11, color: '#374151', resize: 'none',
                      outline: 'none', minHeight: 55, fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Kênh chips */}
            <div style={mfld}>
              <label style={lbl}>Kênh chính cho chiến dịch này</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, marginTop: 5 }}>
                {CHANNELS.map(c => {
                  const active = channels.includes(c)
                  return (
                    <button key={c} type="button" onClick={() => toggleChannel(c)}
                      style={{
                        padding: '6px 4px', borderRadius: 7, fontSize: 10, fontWeight: 700,
                        cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit',
                        transition: 'all 0.15s',
                        border: active ? '1.5px solid #1a5c46' : '1.5px solid rgba(0,0,0,0.09)',
                        background: active ? '#f0fdf4' : '#F9FAFB',
                        color: active ? '#1a5c46' : '#374151',
                      }}>
                      {c}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ STEP 3 ════════════════ */}
        {step === 3 && (
          <div>
            {/* Hint */}
            <div style={{
              display: 'flex', gap: 7, padding: '8px 10px', borderRadius: 9, marginBottom: 10,
              background: 'rgba(45,155,107,0.06)', border: '1px solid rgba(45,155,107,0.15)',
              fontSize: 11, color: '#374151',
            }}>
              <span>📅</span>
              <span>Tạo danh sách bài theo arc. Mỗi bài gán vào đúng giai đoạn — team content biết bài đó nhiệm vụ gì trong narrative tổng.</span>
            </div>

            {/* Post rows */}
            <div style={{ marginBottom: 10 }}>
              {posts.map(row => (
                <div key={row.id} style={{
                  display: 'grid', gridTemplateColumns: '80px 1fr 70px 100px 28px',
                  gap: 5, marginBottom: 5, alignItems: 'center',
                }}>
                  <select value={row.phase} onChange={e => updatePost(row.id, 'phase', e.target.value)}
                    style={{ ...minp, padding: '6px 6px', fontSize: 10 }}>
                    {POST_PHASES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                  <input value={row.title} onChange={e => updatePost(row.id, 'title', e.target.value)}
                    style={{ ...minp, padding: '6px 8px' }} placeholder="Tiêu đề bài..." />
                  <select value={row.channel} onChange={e => updatePost(row.id, 'channel', e.target.value)}
                    style={{ ...minp, padding: '6px 4px', fontSize: 10 }}>
                    {POST_CHANNELS.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input type="date" value={row.date} onChange={e => updatePost(row.id, 'date', e.target.value)}
                    style={{ ...minp, padding: '6px 6px', fontSize: 10 }} />
                  <button type="button" onClick={() => removePost(row.id)}
                    style={{
                      width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(0,0,0,0.09)',
                      background: '#F9FAFB', cursor: 'pointer', color: '#9CA3AF', fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>×</button>
                </div>
              ))}
            </div>

            <button type="button" onClick={addPost}
              style={{
                width: '100%', padding: '8px 0', borderRadius: 9, marginBottom: 12,
                border: '1px solid rgba(0,0,0,0.09)', background: '#fff',
                fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer',
                fontFamily: 'inherit',
              }}>
              + Thêm bài vào chiến dịch
            </button>

            {/* Assign */}
            <div style={mfld}>
              <label style={lbl}>Assign cho</label>
              <select style={{ ...minp, cursor: 'pointer' }} value={assignee} onChange={e => setAssign(e.target.value)}>
                {ASSIGNEES.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div style={{
        padding: '10px 16px', borderTop: '1px solid rgba(0,0,0,0.06)',
        background: '#F9FAFB', borderRadius: '0 0 18px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <button type="button" onClick={() => nav(-1)}
          style={{
            padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600,
            border: '1px solid rgba(0,0,0,0.09)', background: '#fff',
            color: '#374151', cursor: 'pointer', fontFamily: 'inherit',
            visibility: step === 1 ? 'hidden' : 'visible',
          }}>
          ‹ Quay lại
        </button>

        <span style={{ fontSize: 11, color: '#9CA3AF' }}>Bước {step} / 3</span>

        <button type="button" onClick={() => nav(1)} disabled={isSubmitting || (step === 1 && !name)}
          style={{
            padding: '8px 18px', borderRadius: 9, fontSize: 12, fontWeight: 700,
            border: 'none', cursor: (step === 1 && !name) || isSubmitting ? 'not-allowed' : 'pointer',
            background: (step === 1 && !name) ? '#e5e7eb' : 'linear-gradient(135deg,#2d9b6b,#22c575)',
            color: (step === 1 && !name) ? '#9CA3AF' : '#fff',
            fontFamily: 'inherit', opacity: isSubmitting ? 0.7 : 1,
          }}>
          {step === 3
            ? (isSubmitting ? '⏳ Đang tạo…' : '🚀 Tạo chiến dịch')
            : 'Tiếp theo ›'}
        </button>
      </div>
    </div>
  )
}

// ── Campaign Detail Modal ─────────────────────────────────────────────────────

function CampaignDetailModal({ campaign, isOpen, onClose }: {
  campaign: Campaign | null; isOpen: boolean; onClose: () => void
}) {
  if (!campaign) return null

  const phaseVariants: Record<CampaignPhase, 'gray' | 'blue' | 'orange' | 'red' | 'green'> = {
    opening: 'gray', build: 'blue', close: 'orange', cta: 'red', completed: 'green',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={campaign.title} size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={phaseVariants[campaign.current_phase]}>{campaign.current_phase}</Badge>
          {(campaign.start_date || campaign.end_date) && (
            <span className="text-xs text-gray-400">
              {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString('vi-VN') : '?'}
              {' — '}
              {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString('vi-VN') : '?'}
            </span>
          )}
        </div>

        {campaign.description && (
          <p className="text-sm text-gray-600">{campaign.description}</p>
        )}

        <div className="grid grid-cols-4 gap-3 text-center">
          {[
            { label: 'Tổng', value: campaign.post_counts.total, color: 'text-gray-700' },
            { label: 'Đã đăng', value: campaign.post_counts.published, color: 'text-green-600' },
            { label: 'Lên lịch', value: campaign.post_counts.scheduled, color: 'text-blue-600' },
            { label: 'Nháp', value: campaign.post_counts.draft, color: 'text-gray-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-lg p-3">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {campaign.posts?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Bài đăng</h3>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {campaign.posts.map((post: any) => (
                <li key={post.id} className="text-sm text-gray-600 border border-gray-100 rounded-lg px-3 py-2">
                  <span className="font-medium">{post.current_status}</span> · <span className="line-clamp-1">{post.caption}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-gray-400">
          Tạo bởi {campaign.created_by.display_name} · {new Date(campaign.created_at).toLocaleDateString('vi-VN')}
        </p>
      </div>
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function CampaignPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const { hasAnyRole } = useAuthStore()
  const queryClient = useQueryClient()

  const canCreate = hasAnyRole([ROLES.CO_LEADER, ROLES.MARKETING_LEADER])

  const { data, isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await apiClient.get<Campaign[] | { data: Campaign[] }>('/api/v1/marketing/campaigns')
      return Array.isArray(res) ? res : (res as { data: Campaign[] }).data
    },
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  })

  const campaigns: Campaign[] = data ?? []

  return (
    <PageLayout
      title="Chiến dịch"
      actions={canCreate ? (
        <Button size="sm" onClick={() => setCreateOpen(true)}>+ Tạo chiến dịch</Button>
      ) : undefined}
    >
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton variant="line" />
              {[0, 1].map(j => <Skeleton key={j} variant="card" />)}
            </div>
          ))}
        </div>
      ) : (
        <CampaignKanban
          campaigns={campaigns}
          onMovePhase={(id, phase) => movePhaseMutation.mutate({ id, phase })}
          onCampaignClick={setSelectedCampaign}
        />
      )}

      {/* Create Modal — 3-step wizard, noPadding so form owns layout */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} size="md" noPadding>
        <CreateCampaignModal
          onSubmit={(data) => createMutation.mutate(data)}
          onClose={() => setCreateOpen(false)}
          isSubmitting={createMutation.isPending}
        />
      </Modal>

      <CampaignDetailModal
        campaign={selectedCampaign}
        isOpen={!!selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
      />
    </PageLayout>
  )
}
