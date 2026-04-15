# CLAUDE.md — Marketing Hub (space.nedu.vn)
**NL-CLAUDE-MARKETING-HUB-001 v1.0 · NhiLe Holdings · Tháng 4/2026**

> **⚠️ Lưu ý cho developer:** Phần UI/Layout được đánh dấu `[UI: cập nhật sau]` — prototype HTML đang được finalize.
> Tất cả phần Architecture, API Contract, Database Schema, và User Stories là **FROZEN** — không thay đổi khi build.

---

## 1. Mục đích

Marketing Hub (`space.nedu.vn`) là **bàn làm việc số hóa** cho đội Marketing Nedu — thay thế hoàn toàn Zalo nhóm + Google Sheets + nhắn tay. Mọi việc từ lọc lead, duyệt nội dung, lên lịch đăng bài, đo kết quả, đến phối hợp với Design/Editing đều xảy ra trong một giao diện duy nhất.

**Đối tượng:** Marketing Staff, Co-Leader (Huê), Marketing Leader.

**Cluster:** N-EDU (cùng Supabase project với ops.nedu.vn, data.nedu.vn).

---

## 2. Tech Stack

### Cố định — không thay đổi

| Layer | Tech |
|---|---|
| Frontend | React + TypeScript + TailwindCSS |
| Backend | Bun + TypeScript (Modular Monolith) |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (JWT) |
| Media | Cloudflare Stream |
| Notification realtime | Supabase Realtime (WebSocket) |
| Mock-first dev | MSW (Mock Service Worker) |
| Deploy | Vercel |
| Font | Playfair Display (headlines) + Inter (body) |

### Frontend — cụ thể

```
React SPA (không Next.js — portal nội bộ sau login, không cần SEO)
React Query — server state
Zustand — auth store, notification store
React Router v6 — client-side routing
```

### Backend — cụ thể

```
Bun runtime
Modular Monolith — namespace /api/v1/marketing/*
JWT verify bằng Supabase JWT secret — stateless, không gọi Supabase per-request
postgres / pg — kết nối DB trực tiếp, KHÔNG qua Supabase client wrapper
Zod — validation
```

### Environment Variables

```bash
# Required — fail fast khi khởi động nếu thiếu
DATABASE_URL=
JWT_SECRET=                          # Supabase JWT secret
SUPABASE_URL=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=

# Optional — tắt feature liên quan nếu thiếu, không crash
OPTIONAL_TELEGRAM_BOT_TOKEN=
OPTIONAL_TELEGRAM_CHAT_ID=
OPTIONAL_SMTP_HOST=
CLOUDFLARE_STREAM_WATERMARK_UID=

# Webhook secret (ops.nedu.vn → Marketing Hub)
OPS_WEBHOOK_SECRET=
```

> **Exception:** `OPTIONAL_TELEGRAM_BOT_TOKEN` là **REQUIRED** cho Crisis Protocol (`POST /brand-health/crisis`). Endpoint này throw 503 nếu thiếu token.

---

## 3. Architecture (6 Tầng — không bỏ qua tầng nào)

### Tầng 1 — Governance (Ai có quyền làm gì)

**Role Hierarchy:**
```
Marketing Leader
  └── Co-Leader (Huê)
        └── Marketing Staff
```

**Permission Matrix:**

| Dữ liệu | Marketing Staff | Co-Leader | Marketing Leader |
|---|---|---|---|
| Lead (inbox) | Chỉ lead được assign cho mình | Tất cả lead của team | Tất cả |
| Post drafts | Bài của mình | Tất cả (để duyệt) | Tất cả |
| Analytics | KPI cá nhân | KPI team | KPI tổng + budget |
| Budget & ROI | ❌ Không thấy | ❌ Không thấy | ✅ Toàn bộ |
| Brand Health | ❌ Không thấy | ✅ Xem được | ✅ Toàn bộ + Crisis |

**3 Tầng phân quyền (tất cả phải implement):**
1. **RLS (database):** PostgreSQL chỉ trả row phù hợp với user_id / role
2. **API middleware:** Backend kiểm tra role trước khi xử lý → unauthorized → 403
3. **Route guard (frontend):** React Router redirect nếu không có quyền

**Off-boarding:** Admin vào NQuoc Portal → deactivate account → Supabase revoke refresh token. Access token còn hiệu lực tối đa 1 giờ (JWT TTL).

### Tầng 2 — Data Model (Single Source of Truth)

Xem Section 4 — Database Schema.

**Nguyên tắc:**
- PostgreSQL là Single Source of Truth
- Frontend KHÔNG bao giờ kết nối trực tiếp PostgreSQL
- Tất cả qua Backend API
- Person ≠ User Account — 1 người, nhiều roles theo thời gian
- Mọi hành động là Event — INSERT-only cho audit tables, không UPDATE/DELETE history
- metadata JSONB là escape valve — field query thường xuyên thì promote lên column

**Portals là Views:**
```
PostgreSQL (Single Source of Truth)
       │
  ─────┼──────────────────────────────────
  READ+WRITE    READ+WRITE    READ only
       │              │            │
 Marketing Hub   ops.nedu.vn  data.nedu.vn
```

### Tầng 3 — API / Rules

Xem Section 5 — API Contract (full OpenAPI 3.0).

Namespace: `/api/v1/marketing/*`
Base URL prod: `https://api.nedu.vn`

### Tầng 4 — AI Layer

Không có AI features trong v1 của Marketing Hub.

### Tầng 5 — UI (React Portals)

Xem Section 7 — Pages & Components.
> `[UI: cập nhật sau khi prototype HTML finalized]`

### Tầng 6 — Human Workflow (SOPs)

**Automation Map — Events & Side Effects:**

| Event | Nguồn trigger | Hành động tự động | Kênh |
|---|---|---|---|
| Lead mới, chưa classify trong 15 phút | Marketing Hub (timer) | Alert "khách chờ rep hơn 15 phút" | In-app + Telegram (optional) |
| Bài "Đã duyệt" chưa set lịch, <4h trước giờ đăng | Backend cron | Alert "Bài TikTok 14:00 chưa lên lịch" | In-app |
| Lead bị Consultant trả về | ops.nedu.vn → webhook | Lead xuất hiện đầu inbox với banner vàng + lý do | In-app cho Staff |
| Staff nhấn "Push sang Tư vấn" | Marketing Hub | Lead status → "Đã push", timestamp ghi log | ops.nedu.vn API call (async) |
| Brief Design được tạo | Marketing Hub | Thông báo đến Design team | In-app + Telegram (optional) |
| Co-Leader duyệt bài | Marketing Hub | Bài chuyển "Đã duyệt" | In-app cho Staff |
| Co-Leader từ chối bài | Marketing Hub | Bài chuyển "Từ chối", ghi chú hiển thị | In-app cho Staff |
| NPS < 30 | Brand Health module | Cảnh báo đỏ trên dashboard Leader | In-app (Leader view) |
| Crisis Protocol kích hoạt | Leader nhấn nút | Gửi thông báo tất cả Leader | In-app + Telegram (REQUIRED) |
| Budget vượt 80% | Budget module | Alert cảnh báo cho Leader | In-app |

**SLA không tắt được:** Alert "lead chờ rep hơn 15 phút" là business rule, không phải feature — ngay cả khi Telegram tắt, vẫn phải hiển thị in-app.

---

## 4. Database Schema

### Nguyên tắc Audit Trail

Các bảng append-only (KHÔNG UPDATE, KHÔNG DELETE):

| Bảng | Ghi khi nào |
|---|---|
| `lead_actions` | Mỗi lần phân loại, push, trả về |
| `post_approvals` | Mỗi lần duyệt / từ chối |
| `brief_status_log` | Mỗi lần brief đổi trạng thái |
| `notification_log` | Mỗi notification gửi đi |

### Schema SQL

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- CORE: Persons & Roles (borrow từ NQuoc cluster / persons table chung)
-- ─────────────────────────────────────────────────────────────────────────────

-- persons — đã có trong cluster N-EDU (không tạo lại)
-- person_roles — đã có trong cluster N-EDU (không tạo lại)
-- Role codes cho Marketing Hub: marketing_leader, co_leader, marketing_staff,
--                                design_member, video_editor

-- ─────────────────────────────────────────────────────────────────────────────
-- CHANNELS — Kênh Marketing
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE channels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,          -- 'facebook', 'tiktok', 'youtube', 'instagram', 'zalo', 'google'
  label       TEXT NOT NULL,                  -- 'Facebook', 'TikTok'
  color_hex   TEXT NOT NULL,                  -- '#1877F2'
  icon_name   TEXT NOT NULL,                  -- icon key cho frontend
  platform    TEXT NOT NULL,                  -- 'meta', 'tiktok', 'google', 'zalo'
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data
INSERT INTO channels (code, label, color_hex, icon_name, platform) VALUES
  ('facebook',  'Facebook',  '#1877F2', 'facebook',  'meta'),
  ('tiktok',    'TikTok',    '#000000', 'tiktok',    'tiktok'),
  ('youtube',   'YouTube',   '#FF0000', 'youtube',   'google'),
  ('instagram', 'Instagram', '#E1306C', 'instagram', 'meta'),
  ('zalo',      'Zalo OA',   '#0068FF', 'zalo',      'zalo'),
  ('google',    'Google',    '#4285F4', 'google',    'google');

-- ─────────────────────────────────────────────────────────────────────────────
-- LEADS — Inbox & Lead Management
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ops_lead_id     UUID NOT NULL UNIQUE,         -- ID gốc từ ops.nedu.vn (idempotency)
  full_name       TEXT NOT NULL,
  phone_number    TEXT NOT NULL,
  message_preview TEXT,                          -- Tối đa 500 ký tự
  channel_id      UUID NOT NULL REFERENCES channels(id),
  utm_source      TEXT NOT NULL,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  current_status  TEXT NOT NULL DEFAULT 'new'
                    CHECK (current_status IN ('new','hot','warm','cold','pushed','returned','archived')),
  return_reason   TEXT,                          -- Chỉ có giá trị khi status = 'returned'
  assigned_to     UUID REFERENCES persons(id),   -- Marketing Staff được assign
  ops_synced_at   TIMESTAMPTZ NOT NULL,
  last_action_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_status ON leads(current_status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_ops_synced_at ON leads(ops_synced_at DESC);

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Staff chỉ thấy lead được assign cho mình
CREATE POLICY leads_staff_select ON leads FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM person_roles pr
      WHERE pr.person_id = auth.uid()
        AND pr.role_code IN ('co_leader', 'marketing_leader')
        AND pr.valid_until IS NULL
    )
  );

-- Staff chỉ update lead của mình; Leader update tất cả
CREATE POLICY leads_staff_update ON leads FOR UPDATE
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM person_roles pr
      WHERE pr.person_id = auth.uid()
        AND pr.role_code IN ('co_leader', 'marketing_leader')
        AND pr.valid_until IS NULL
    )
  );

-- Backend INSERT (qua service role)
CREATE POLICY leads_service_insert ON leads FOR INSERT
  WITH CHECK (TRUE);  -- Backend dùng service role key

-- ─────────────────────────────────────────────────────────────────────────────
-- LEAD_ACTIONS — Audit Trail (append-only)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE lead_actions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES leads(id),
  event_type  TEXT NOT NULL
                CHECK (event_type IN (
                  'synced_from_ops', 'assigned', 'classified_hot', 'classified_warm',
                  'classified_cold', 'classified_trash', 'pushed_to_consultant',
                  'returned_by_consultant', 'reclassified', 'archived'
                )),
  actor_id    UUID REFERENCES persons(id),  -- NULL khi system action
  payload     JSONB,                         -- {from_status, to_status, reason, ...}
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- KHÔNG có UPDATE / DELETE policy — append-only
ALTER TABLE lead_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY lead_actions_select ON lead_actions FOR SELECT USING (TRUE);
CREATE POLICY lead_actions_insert ON lead_actions FOR INSERT WITH CHECK (TRUE);

-- ─────────────────────────────────────────────────────────────────────────────
-- CAMPAIGNS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  current_phase   TEXT NOT NULL DEFAULT 'opening'
                    CHECK (current_phase IN ('opening','build','close','cta','completed')),
  start_date      DATE,
  end_date        DATE,
  created_by      UUID NOT NULL REFERENCES persons(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
-- Tất cả roles đọc được
CREATE POLICY campaigns_select ON campaigns FOR SELECT USING (TRUE);
-- Chỉ Leader và Co-Leader tạo/update
CREATE POLICY campaigns_write ON campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM person_roles pr
      WHERE pr.person_id = auth.uid()
        AND pr.role_code IN ('co_leader', 'marketing_leader')
        AND pr.valid_until IS NULL
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- POSTS — Tạo & Duyệt Nội dung
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE posts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caption              TEXT NOT NULL,
  current_status       TEXT NOT NULL DEFAULT 'draft'
                         CHECK (current_status IN ('draft','pending_review','approved','scheduled','published','rejected')),
  scheduled_at         TIMESTAMPTZ,
  published_at         TIMESTAMPTZ,
  author_id            UUID NOT NULL REFERENCES persons(id),
  campaign_id          UUID REFERENCES campaigns(id),
  latest_approval_note TEXT,                       -- Ghi chú từ chối mới nhất
  reference_links      JSONB DEFAULT '[]',          -- [{url, label}]
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_status ON posts(current_status);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY posts_staff_select ON posts FOR SELECT
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM person_roles pr
      WHERE pr.person_id = auth.uid()
        AND pr.role_code IN ('co_leader', 'marketing_leader')
        AND pr.valid_until IS NULL
    )
  );

CREATE POLICY posts_staff_insert ON posts FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY posts_staff_update ON posts FOR UPDATE
  USING (
    (author_id = auth.uid() AND current_status IN ('draft', 'rejected'))
    OR EXISTS (
      SELECT 1 FROM person_roles pr
      WHERE pr.person_id = auth.uid()
        AND pr.role_code IN ('co_leader', 'marketing_leader')
        AND pr.valid_until IS NULL
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- POST_CHANNELS — Many-to-Many: Post <> Channel
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE post_channels (
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id),
  PRIMARY KEY (post_id, channel_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- POST_MEDIA — Ảnh và Video
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE post_media (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id          UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  media_type       TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  url              TEXT NOT NULL,             -- Cloudflare Stream URL
  thumbnail_url    TEXT,
  duration_seconds INTEGER,                   -- Chỉ cho video
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- POST_APPROVALS — Audit Trail duyệt bài (append-only)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE post_approvals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts(id),
  event_type  TEXT NOT NULL
                CHECK (event_type IN ('submitted_for_review','approved','rejected','revision_requested')),
  actor_id    UUID NOT NULL REFERENCES persons(id),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE post_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY post_approvals_select ON post_approvals FOR SELECT USING (TRUE);
CREATE POLICY post_approvals_insert ON post_approvals FOR INSERT WITH CHECK (TRUE);

-- ─────────────────────────────────────────────────────────────────────────────
-- ANALYTICS_CHANNEL_DATA — KPI theo kênh theo kỳ
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE analytics_channel_data (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id           UUID NOT NULL REFERENCES channels(id),
  period_type          TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
  period_start         DATE NOT NULL,
  period_end           DATE NOT NULL,
  reach                INTEGER,
  engagement_rate_pct  NUMERIC(5,2),
  lead_count           INTEGER,
  conversion_count     INTEGER,
  spend_vnd            INTEGER,
  data_source          TEXT NOT NULL DEFAULT 'manual'
                         CHECK (data_source IN ('manual','meta_ads_api','google_ads_api','tiktok_ads_api')),
  recorded_by          UUID REFERENCES persons(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (channel_id, period_type, period_start)  -- UPSERT key
);

-- ─────────────────────────────────────────────────────────────────────────────
-- BUDGET_ALLOCATIONS — Ngân sách theo kênh theo tháng
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE budget_allocations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id      UUID NOT NULL REFERENCES channels(id),
  month_start     DATE NOT NULL,              -- Phải là ngày 1 của tháng
  allocated_vnd   INTEGER NOT NULL,
  cpl_benchmark   INTEGER,                   -- CPL benchmark ngành (VNĐ/lead)
  created_by      UUID NOT NULL REFERENCES persons(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (channel_id, month_start)           -- UPSERT key
);

ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
-- Chỉ marketing_leader
CREATE POLICY budget_leader_only ON budget_allocations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM person_roles pr
      WHERE pr.person_id = auth.uid()
        AND pr.role_code = 'marketing_leader'
        AND pr.valid_until IS NULL
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- BRAND_HEALTH — NPS, Share of Voice, Brand Mentions
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE brand_health_entries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start          DATE NOT NULL UNIQUE,   -- Monday của tuần
  nps_score           NUMERIC(5,1),           -- -100 đến 100. <30 = cảnh báo đỏ
  share_of_voice_pct  NUMERIC(5,2),
  brand_mentions      INTEGER,
  sentiment_positive  INTEGER,
  sentiment_neutral   INTEGER,
  sentiment_negative  INTEGER,
  negative_topics     JSONB DEFAULT '[]',     -- [{topic, mention_count}]
  data_source         TEXT NOT NULL DEFAULT 'manual' CHECK (data_source IN ('manual', 'api_brand24')),
  recorded_by         UUID NOT NULL REFERENCES persons(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE brand_health_entries ENABLE ROW LEVEL SECURITY;
-- co_leader và marketing_leader xem + ghi
CREATE POLICY brand_health_access ON brand_health_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM person_roles pr
      WHERE pr.person_id = auth.uid()
        AND pr.role_code IN ('co_leader', 'marketing_leader')
        AND pr.valid_until IS NULL
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- CRISIS_PROTOCOLS — Crisis Protocol khi khủng hoảng thương hiệu
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE crisis_protocols (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT,
  steps_status     JSONB NOT NULL DEFAULT '[
    {"step": 1, "label": "Dừng tất cả quảng cáo đang chạy", "completed": false},
    {"step": 2, "label": "Soạn thảo phản hồi chính thức", "completed": false},
    {"step": 3, "label": "Publish phản hồi và theo dõi", "completed": false}
  ]',
  activated_by     UUID NOT NULL REFERENCES persons(id),
  is_resolved      BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- BRIEFS — Đặt việc Design & Editing
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE briefs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_type_code  TEXT NOT NULL CHECK (brief_type_code IN ('design', 'video_editing')),
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  size_format      TEXT,                      -- '1200x628, 1080x1080, 1080x1920'
  deadline         TIMESTAMPTZ NOT NULL,
  current_status   TEXT NOT NULL DEFAULT 'submitted'
                     CHECK (current_status IN ('submitted','in_progress','review','completed','cancelled')),
  deliverable_url  TEXT,                      -- Google Drive / Cloudflare link
  requested_by     UUID NOT NULL REFERENCES persons(id),
  assigned_to      UUID REFERENCES persons(id),  -- Design/Editing member
  post_id          UUID REFERENCES posts(id),     -- Optional link
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY briefs_select ON briefs FOR SELECT
  USING (
    requested_by = auth.uid()
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM person_roles pr
      WHERE pr.person_id = auth.uid()
        AND pr.role_code IN ('co_leader', 'marketing_leader')
        AND pr.valid_until IS NULL
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- BRIEF_STATUS_LOG — Audit Trail (append-only)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE brief_status_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id    UUID NOT NULL REFERENCES briefs(id),
  event_type  TEXT NOT NULL
                CHECK (event_type IN ('submitted','acknowledged','in_progress','review','completed','cancelled')),
  actor_id    UUID REFERENCES persons(id),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE brief_status_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY brief_log_select ON brief_status_log FOR SELECT USING (TRUE);
CREATE POLICY brief_log_insert ON brief_status_log FOR INSERT WITH CHECK (TRUE);

-- ─────────────────────────────────────────────────────────────────────────────
-- STORIES — Story Pipeline Học Viên
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE stories (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name      TEXT NOT NULL,
  student_avatar_url TEXT,
  ops_student_ref   TEXT,                    -- Soft reference ID học viên trong ops.nedu.vn
  course_name       TEXT NOT NULL,
  pain_point        TEXT NOT NULL,
  transformation    TEXT NOT NULL,
  icp_tags          TEXT[] NOT NULL DEFAULT '{}',  -- ['freelancer', 'burnout', 'career_change']
  current_status    TEXT NOT NULL DEFAULT 'pending_review'
                      CHECK (current_status IN ('pending_review','approved','deployed')),
  collected_by      UUID NOT NULL REFERENCES persons(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Story deployments — nhiều campaign có thể dùng cùng 1 story
CREATE TABLE story_deployments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id    UUID NOT NULL REFERENCES stories(id),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  post_id     UUID REFERENCES posts(id),
  deployed_by UUID NOT NULL REFERENCES persons(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (story_id, campaign_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- AMBASSADORS — Referral Loop
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE ambassadors (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ops_student_ref      TEXT NOT NULL UNIQUE,  -- ID học viên trong ops.nedu.vn
  display_name         TEXT NOT NULL,
  referral_code        TEXT NOT NULL UNIQUE,   -- 'KHOA-2024'
  total_referrals      INTEGER NOT NULL DEFAULT 0,
  converted_referrals  INTEGER NOT NULL DEFAULT 0,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS — In-app Notification
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id      UUID NOT NULL REFERENCES persons(id),
  notification_type TEXT NOT NULL
                      CHECK (notification_type IN (
                        'lead_new','lead_returned','post_approved','post_rejected',
                        'brief_completed','sla_alert','crisis_activated','budget_warning'
                      )),
  priority          TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('alert','normal')),
  title             TEXT NOT NULL,
  body              TEXT NOT NULL,
  entity_type       TEXT CHECK (entity_type IN ('lead','post','brief','campaign')),
  entity_id         UUID,
  is_read           BOOLEAN NOT NULL DEFAULT FALSE,
  read_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_own ON notifications FOR ALL
  USING (recipient_id = auth.uid());

-- Realtime: Enable cho table notifications
-- Chạy trong Supabase Dashboard → Database → Replication
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTIFICATION_LOG — Audit Trail gửi notification (append-only)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE notification_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id   UUID REFERENCES notifications(id),
  channel           TEXT NOT NULL CHECK (channel IN ('in_app','telegram','email')),
  status            TEXT NOT NULL CHECK (status IN ('sent','failed','skipped')),
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- OPERATIONAL_DOCS — 8 Tài liệu vận hành
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE operational_docs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_key      TEXT NOT NULL UNIQUE,           -- 'sop_lead', 'jd_staff', etc.
  title        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'not_started'
                 CHECK (status IN ('not_started','in_progress','completed')),
  file_url     TEXT,                           -- Google Drive link
  file_version TEXT,
  last_updated DATE,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

-- Seed 8 tài liệu vận hành
INSERT INTO operational_docs (doc_key, title, sort_order) VALUES
  ('sop_lead',         'SOP Phân loại Lead',              1),
  ('sop_content',      'SOP Quy trình tạo nội dung',      2),
  ('sop_approval',     'SOP Duyệt bài',                   3),
  ('jd_staff',         'JD Marketing Staff',              4),
  ('jd_co_leader',     'JD Co-Leader',                    5),
  ('tracker_lead',     'Lead Tracker Template',           6),
  ('tracker_content',  'Content Tracker Template',        7),
  ('brand_guideline',  'Brand Guideline Nedu',            8);
```

### Materialized View (Analytics)

```sql
-- Analytics summary — refresh daily hoặc khi data thay đổi
CREATE MATERIALIZED VIEW analytics_channel_summary AS
SELECT
  a.channel_id,
  c.label AS channel_label,
  c.color_hex AS channel_color,
  a.period_type,
  a.period_start,
  a.period_end,
  a.reach,
  a.engagement_rate_pct,
  a.lead_count,
  a.conversion_count,
  a.spend_vnd,
  b.allocated_vnd,
  b.cpl_benchmark,
  CASE
    WHEN a.lead_count > 0 AND a.spend_vnd > 0
    THEN a.spend_vnd / a.lead_count
    ELSE NULL
  END AS cpl_actual,
  CASE
    WHEN b.allocated_vnd > 0 AND a.spend_vnd IS NOT NULL
    THEN ROUND((a.spend_vnd::NUMERIC / b.allocated_vnd) * 100, 1)
    ELSE NULL
  END AS budget_used_pct,
  a.data_source
FROM analytics_channel_data a
JOIN channels c ON c.id = a.channel_id
LEFT JOIN budget_allocations b ON b.channel_id = a.channel_id
  AND b.month_start = date_trunc('month', a.period_start)::DATE
WITH DATA;

CREATE UNIQUE INDEX ON analytics_channel_summary(channel_id, period_type, period_start);
```

---

## 5. API Contract

**Đây là source of truth — KHÔNG được thay đổi khi build. Chỉ update khi có ADR mới.**

### Design Principles

- **Consumer-Driven:** mỗi endpoint shape phục vụ đúng 1 màn hình / 1 actor
- **CQRS:** GET không có side effects; POST/PATCH trigger domain events và trả về state mới
- **Event-Driven:** command endpoints ghi immutable events vào audit tables
- **Immutable History:** mọi transition chỉ INSERT vào event log, không UPDATE/DELETE

### Confirmed Design Decisions (owner confirmed tháng 4/2026)

- Lead sync: ops.nedu.vn push **webhook** sang Marketing Hub (realtime)
- Co-Leader scope: Leader và Co-Leader đều duyệt bài của **toàn bộ** Staff
- Brief receiver: Design/Editing team có **tài khoản riêng** trong hệ thống
- Analytics input: **tự động sync từ Ads API** (v1 fallback = manual nếu API chưa sẵn sàng)
- Export: **client-side** (frontend dùng library xlsx.js / jsPDF)
- Notification: **WebSocket realtime** (Supabase Realtime)
- Campaign owner: Leader và Co-Leader đều được tạo và move phase

### SLA Commitments

| Endpoint Group | p99 Latency | Rate Limit |
|---|---|---|
| Read — Dashboard | 200ms | 60 req/min/user |
| Read — List/Detail | 300ms | 100 req/min/user |
| Write — Commands | 500ms | 30 req/min/user |
| Analytics (agg) | 2000ms | 10 req/min/user |
| Webhook (system) | 500ms | 200 req/min/IP |

### Versioning Policy

- Breaking changes: tạo `/v2/` — KHÔNG modify `/v1/`
- Non-breaking additions: update `/v1/` với CHANGELOG
- Deprecation notice: minimum 6 tháng trước khi remove

### Auth Schemes

**BearerAuth** — Supabase JWT token:
1. Verify JWT signature bằng Supabase JWT secret (stateless)
2. Extract supabase_uid → lookup persons + person_roles (valid_until IS NULL)
3. Check role code against required roles
4. Check ownership (RLS là safety net thứ hai)

**WebhookHMAC** — Chỉ dùng cho webhook từ ops.nedu.vn:
- Header: `X-Ops-Signature`
- Format: `sha256=<hex_digest>`
- Secret: `OPS_WEBHOOK_SECRET` env var

### Error Response Shapes

```typescript
// Tất cả error responses
interface ErrorResponse {
  code: string;         // Machine-readable — consumer dùng code, KHÔNG dùng message
  message: string;      // Human-readable — có thể thay đổi theo version
  details?: object;
  request_id: string;
}

// Validation errors
interface ValidationErrorResponse extends ErrorResponse {
  violations: Array<{
    field: string;
    code: string;
    message: string;
  }>;
}
```

**HTTP Status codes:**
- `401` → `TOKEN_EXPIRED` — redirect /login
- `403` → `INSUFFICIENT_ROLE` hoặc `OWNERSHIP_VIOLATION`
- `404` → `RESOURCE_NOT_FOUND`
- `409` → Conflict với state hiện tại (ví dụ: `LEAD_ALREADY_PUSHED`)
- `422` → Business rule violation (ví dụ: `INVALID_WEEK_START`)
- `503` → Service dependency required (ví dụ: `TELEGRAM_NOT_CONFIGURED`)

### Endpoints — Full List

#### TODAY MODULE

```
GET  /api/v1/marketing/today/summary
  → TodaySummary (leads_pending, SLA alerts, posts_today, quick_leads)
  → Role: all
  → SLA: p99 200ms | Polling: 60s
```

#### LEADS MODULE

```
GET   /api/v1/marketing/leads
  → Lead[] + PaginationMeta
  → Query: status[], channel_code, assigned_to, sla_overdue_only, page, per_page
  → Role: Staff (own) | Co-Leader & Leader (all)

GET   /api/v1/marketing/leads/:lead_id
  → Lead + action_history
  → Role: Staff (own) | Co-Leader & Leader (all)

POST  /api/v1/marketing/leads/:lead_id/actions
  Body: { action_type: 'classify'|'push'|'reclassify', classification?, reason? }
  → Lead (state mới) + side_effects { events_fired[], ops_push_queued, notifications_queued[] }
  → 409 LEAD_ALREADY_PUSHED | INVALID_STATUS_TRANSITION
  → Side effects: async push sang ops, Telegram alert (optional)

POST  /api/v1/marketing/leads/sync   [WEBHOOK — HMAC auth]
  Body: { event_type: 'lead_created'|'lead_returned', ops_lead_id, full_name, phone_number,
          channel_code, utm_source, utm_medium?, utm_campaign?, assigned_to_person_id?, return_reason? }
  → { lead_id, action: 'created'|'updated' }
  → 401 INVALID_WEBHOOK_SIGNATURE
```

**Lead Status Machine:**
```
new → [classify] → hot | warm | cold | archived
hot → [push] → pushed
pushed → [returned by ops] → returned
returned → [reclassify] → hot | warm | cold | archived
```

#### POSTS MODULE

```
GET   /api/v1/marketing/posts
  → Post[] + PaginationMeta
  → Query: status[], campaign_id, channel_code, page, per_page
  → Role: Staff (own) | Co-Leader & Leader (all)

POST  /api/v1/marketing/posts
  Body: { caption, channel_codes[], reference_links[]?, campaign_id?, scheduled_at? }
  → 201 Post (status: 'draft')

GET   /api/v1/marketing/posts/:post_id
  → Post + approval_history

PATCH /api/v1/marketing/posts/:post_id
  Body: { caption?, channel_codes[]?, reference_links[]?, scheduled_at? }
  → Post (chỉ khi status IN 'draft'|'rejected')
  → 409 POST_NOT_EDITABLE | POST_ALREADY_PUBLISHED

POST  /api/v1/marketing/posts/:post_id/actions
  Body: { action_type: 'submit_review'|'approve'|'reject'|'schedule', notes?, scheduled_at? }
  → Post (state mới) + side_effects { notifications_queued[] }
  → 409 POST_NOT_PENDING_REVIEW | POST_NOT_APPROVED

POST  /api/v1/marketing/posts/:post_id/media
  Body: multipart/form-data { file }
  → 201 PostMedia { id, media_type, url, thumbnail_url, duration_seconds, sort_order }
  → 422 INVALID_MEDIA_FORMAT
```

**Post Status Machine:**
```
draft → [submit_review] → pending_review
pending_review → [approve] → approved
pending_review → [reject] → rejected
rejected → [edit] → draft (auto)
approved → [schedule] → scheduled
scheduled → [publish] → published (backend cron)
```

**Upload limits:** Image: JPG/PNG/WEBP max 10MB | Video: MP4/MOV max 500MB

#### CALENDAR MODULE

```
GET  /api/v1/marketing/calendar
  → Post[] (flat list, có scheduled_at trong date range)
  → Query: date_from (required), date_to (required), channel_code
  → Max range: 90 ngày
  → SLA: p99 1000ms
  → ADR-API-04: Flat list thay vì nested by day — consumer group client-side
```

#### CAMPAIGNS MODULE

```
GET   /api/v1/marketing/campaigns
  → Campaign[] + post_counts
  → Query: phase filter
  → Role: all

POST  /api/v1/marketing/campaigns
  Body: { title, description?, start_date?, end_date? }
  → 201 Campaign (phase: 'opening')
  → Role: co_leader | marketing_leader

GET   /api/v1/marketing/campaigns/:campaign_id
  → Campaign + posts[]

PATCH /api/v1/marketing/campaigns/:campaign_id/phase
  Body: { new_phase: 'build'|'close'|'cta'|'completed' }
  → Campaign (phase mới)
  → 409 INVALID_PHASE_TRANSITION (không được skip phase, không được quay ngược)
  → Role: co_leader | marketing_leader
```

**Campaign Phase Machine (one-way):**
```
opening → build → close → cta → completed
```

#### ANALYTICS MODULE

```
GET  /api/v1/marketing/analytics/summary
  → AnalyticsByChannel[] + meta { period_type, period_start, period_end }
  → Query: period_type (required), period_start (required)
  → Role: marketing_leader
  → SLA: p99 2000ms

POST /api/v1/marketing/analytics/entries
  Body: { channel_id, period_type, period_start, period_end, reach?, engagement_rate_pct?,
          lead_count?, conversion_count?, spend_vnd?, data_source? }
  → AnalyticsByChannel (UPSERT theo channel_id + period_type + period_start)
  → Role: marketing_staff | co_leader | marketing_leader
```

#### BRAND HEALTH MODULE

```
GET  /api/v1/marketing/brand-health
  → BrandHealthEntry[]
  → Query: weeks (default 4, max 52)
  → Role: co_leader | marketing_leader

POST /api/v1/marketing/brand-health
  Body: { week_start (Monday), nps_score?, share_of_voice_pct?, brand_mentions?,
          sentiment_positive?, sentiment_neutral?, sentiment_negative?,
          negative_topics[]?, data_source? }
  → BrandHealthEntry (UPSERT theo week_start)
  → 422 INVALID_WEEK_START (phải là Monday)
  → Role: marketing_leader

POST /api/v1/marketing/brand-health/crisis
  Body: { title, description? }
  → 201 CrisisProtocol
  → 409 CRISIS_ALREADY_ACTIVE
  → 503 TELEGRAM_NOT_CONFIGURED (Telegram là REQUIRED cho crisis)
  → Role: marketing_leader
  → Side effects: Telegram alert BẮTBUỘC + in-app tất cả Leader
```

**NPS Thresholds:**
- ≥ 50 → xanh (tốt)
- 30-49 → vàng (cần theo dõi)
- < 30 → đỏ (cảnh báo — trigger alert)

#### BUDGET MODULE

```
GET  /api/v1/marketing/budget/summary
  → BudgetSummary { total_allocated, total_spent, budget_used_pct, budget_warning,
                    total_leads, overall_cpl, by_channel[] }
  → Query: month_start (default = tháng hiện tại)
  → Role: marketing_leader
  → SLA: p99 2000ms

POST /api/v1/marketing/budget/allocations
  Body: { channel_id, month_start (ngày 1 của tháng), allocated_vnd, cpl_benchmark? }
  → { channel_id, month_start, allocated_vnd, cpl_benchmark } (UPSERT)
  → Role: marketing_leader
```

**Budget Warning:** `budget_used_pct >= 80` → trigger in-app alert cho Leader

#### BRIEFS MODULE

```
GET   /api/v1/marketing/briefs
  → Brief[] + PaginationMeta
  → Query: status[], brief_type, page, per_page
  → Role: Staff (own) | Design member (assigned) | Co-Leader & Leader (all)

POST  /api/v1/marketing/briefs
  Body: { brief_type_code, title, description, deadline, size_format?, post_id? }
  → 201 Brief (status: 'submitted') + side_effects { notifications_queued[] }
  → Required: brief_type_code, title, description, deadline

GET   /api/v1/marketing/briefs/:brief_id
  → Brief + status_history

POST  /api/v1/marketing/briefs/:brief_id/actions
  Body: { action_type: 'acknowledge'|'deliver'|'complete'|'request_revision'|'cancel',
          deliverable_url?, notes? }
  → Brief (state mới) + side_effects
  → 409 INVALID_BRIEF_TRANSITION
```

**Brief Status Machine:**
```
submitted → [acknowledge by design] → in_progress
in_progress → [deliver by design] → review
review → [complete by staff] → completed
review → [request_revision by staff] → in_progress
any → [cancel by requester] → cancelled
```

**Role actions:**
- `acknowledge`, `deliver`: design_member | video_editor
- `complete`, `request_revision`: marketing_staff | co_leader | marketing_leader
- `cancel`: marketing_staff (người tạo)

#### STORIES MODULE

```
GET   /api/v1/marketing/stories
  → Story[] + PaginationMeta
  → Query: status, icp_tag, page, per_page

POST  /api/v1/marketing/stories
  Body: { student_name, course_name, pain_point, transformation, icp_tags[],
          student_avatar_url?, ops_student_ref? }
  → 201 Story (status: 'pending_review')

POST  /api/v1/marketing/stories/:story_id/actions
  Body: { action_type: 'approve'|'deploy', campaign_id? (required for deploy), post_id? }
  → Story (state mới)
  → 409 STORY_ALREADY_DEPLOYED
```

#### REFERRAL MODULE

```
GET  /api/v1/marketing/referral/leads
  → Lead[] (utm_source = 'referral') + ambassador_display_name + PaginationMeta
  → Query: ambassador_id, page, per_page

GET  /api/v1/marketing/referral/ambassadors
  → Ambassador[] (sort by total_referrals DESC)
  → Query: limit (max 50), active_only
```

**Ambassador referral link format:**
`https://nedu.nhi.sg/?utm_source=referral&utm_campaign=ambassador-{ambassador_id}`

#### NOTIFICATIONS MODULE

```
GET   /api/v1/marketing/notifications
  → Notification[] + PaginationMeta + unread_count
  → Query: unread_only, page, per_page
  → SLA: p99 200ms

PATCH /api/v1/marketing/notifications/:notification_id/read
  → Notification (idempotent)
  → SLA: p99 200ms
```

**Realtime:** Subscribe Supabase Realtime channel `notifications:{user_id}` cho push.

#### SYSTEM MODULE

```
GET  /api/v1/marketing/channels
  → Channel[] (cached 1 giờ)
  → Query: active_only (default true)
  → SLA: p99 100ms

GET  /api/v1/marketing/docs
  → OperationalDoc[] + meta { total_count, completed_count, completion_pct }
```

### Outgoing Webhooks (Marketing Hub → ops.nedu.vn)

```
Event: leadPushedToConsultant
POST → ops.nedu.vn/webhook/lead-pushed
Body: { event_type: 'lead_pushed_from_marketing', ops_lead_id, pushed_by_name, pushed_at }
Delivery: async, retry 3 lần (1s, 5s, 30s backoff)
Idempotency: ops dùng ops_lead_id để detect duplicate
```

---

## 6. TypeScript Types

```typescript
// ─── Shared ───────────────────────────────────────────────────────────────────

export type UUID = string;

export interface PersonSummary {
  id: UUID;
  display_name: string;
  avatar_url: string | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
  next_cursor: string | null;
}

// ─── Channels ─────────────────────────────────────────────────────────────────

export interface Channel {
  id: UUID;
  code: string;
  label: string;
  color_hex: string;
  icon_name: string;
  platform: string;
  is_active: boolean;
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export type LeadStatus = 'new' | 'hot' | 'warm' | 'cold' | 'pushed' | 'returned' | 'archived';
export type LeadActionType = 'synced_from_ops' | 'assigned' | 'classified_hot' |
  'classified_warm' | 'classified_cold' | 'classified_trash' | 'pushed_to_consultant' |
  'returned_by_consultant' | 'reclassified' | 'archived';

export interface Lead {
  id: UUID;
  full_name: string;
  phone_number: string;
  message_preview: string | null;
  channel: { code: string; label: string; color_hex: string };
  utm_source: string;
  utm_medium: string | null;
  utm_campaign: string | null;
  current_status: LeadStatus;
  return_reason: string | null;
  assigned_to: PersonSummary | null;
  minutes_waiting: number;
  sla_overdue: boolean;              // true khi minutes_waiting > 15 && status === 'new'
  ops_synced_at: string;             // ISO datetime
  last_action_at: string | null;
  action_history?: LeadActionEvent[]; // Chỉ có trong GET /leads/:id
}

export interface LeadActionEvent {
  event_type: LeadActionType;
  actor_name: string | null;
  payload: object;
  created_at: string;
}

// ─── Today ────────────────────────────────────────────────────────────────────

export interface TodaySummary {
  leads_pending_count: number;
  leads_sla_overdue_count: number;
  posts_scheduled_today: number;
  posts_pending_review: number;
  unread_notification_count: number;
  alerts: Array<{
    alert_type: 'lead_sla_overdue' | 'post_unscheduled_soon';
    message: string;
    entity_type: 'lead' | 'post';
    entity_id: UUID;
    minutes_overdue: number | null;
  }>;
  quick_leads: Lead[];              // Tối đa 5 lead chờ classify
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export type PostStatus = 'draft' | 'pending_review' | 'approved' | 'scheduled' | 'published' | 'rejected';
export type PostActionType = 'submit_review' | 'approve' | 'reject' | 'schedule';

export interface PostMedia {
  id: UUID;
  media_type: 'image' | 'video';
  url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  sort_order: number;
}

export interface PostApprovalEvent {
  event_type: 'submitted_for_review' | 'approved' | 'rejected' | 'revision_requested';
  actor_name: string;
  notes: string | null;
  created_at: string;
}

export interface Post {
  id: UUID;
  caption: string;
  reference_links: Array<{ url: string; label: string }>;
  current_status: PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  author: PersonSummary;
  channels: Array<{ code: string; label: string; color_hex: string }>;
  campaign_id: UUID | null;
  campaign_title: string | null;
  media: PostMedia[];
  latest_approval_note: string | null;
  approval_history?: PostApprovalEvent[]; // Chỉ có trong GET /posts/:id
  created_at: string;
}

// ─── Campaigns ────────────────────────────────────────────────────────────────

export type CampaignPhase = 'opening' | 'build' | 'close' | 'cta' | 'completed';

export interface Campaign {
  id: UUID;
  title: string;
  description: string | null;
  current_phase: CampaignPhase;
  start_date: string | null;
  end_date: string | null;
  created_by: PersonSummary;
  post_counts: {
    total: number;
    published: number;
    scheduled: number;
    draft: number;
  };
  posts?: Post[];                   // Chỉ có trong GET /campaigns/:id
  created_at: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsByChannel {
  channel_id: UUID;
  channel_label: string;
  channel_color: string;
  period_type: 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  reach: number | null;
  engagement_rate_pct: number | null;
  lead_count: number | null;
  conversion_count: number | null;
  spend_vnd: number | null;
  allocated_vnd: number | null;
  cpl_actual: number | null;
  cpl_benchmark: number | null;
  budget_used_pct: number | null;   // >= 80 → hiển thị warning
  data_source: 'manual' | 'meta_ads_api' | 'google_ads_api' | 'tiktok_ads_api';
}

// ─── Brand Health ─────────────────────────────────────────────────────────────

export interface BrandHealthEntry {
  id: UUID;
  week_start: string;              // Monday
  nps_score: number | null;        // < 30 → warning đỏ
  share_of_voice_pct: number | null;
  brand_mentions: number | null;
  sentiment_positive: number | null;
  sentiment_neutral: number | null;
  sentiment_negative: number | null;
  negative_topics: Array<{ topic: string; mention_count: number }>;
  data_source: 'manual' | 'api_brand24';
  recorded_by_name: string;
  created_at: string;
}

export interface CrisisProtocol {
  id: UUID;
  title: string;
  description: string | null;
  activated_by_name: string;
  steps_status: Array<{
    step: number;
    label: string;
    completed: boolean;
    completed_at: string | null;
  }>;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

// ─── Budget ───────────────────────────────────────────────────────────────────

export interface BudgetSummary {
  month_start: string;
  total_allocated_vnd: number;
  total_spent_vnd: number;
  budget_used_pct: number;
  budget_warning: boolean;         // true khi >= 80%
  total_leads: number;
  overall_cpl: number | null;
  by_channel: AnalyticsByChannel[];
}

// ─── Briefs ───────────────────────────────────────────────────────────────────

export type BriefStatus = 'submitted' | 'in_progress' | 'review' | 'completed' | 'cancelled';
export type BriefActionType = 'acknowledge' | 'deliver' | 'complete' | 'request_revision' | 'cancel';

export interface BriefStatusEvent {
  event_type: BriefStatus;
  actor_name: string | null;
  notes: string | null;
  created_at: string;
}

export interface Brief {
  id: UUID;
  brief_type_code: 'design' | 'video_editing';
  brief_type_label: string;
  title: string;
  description: string;
  size_format: string | null;
  deadline: string;
  current_status: BriefStatus;
  deliverable_url: string | null;
  requested_by: PersonSummary;
  assigned_to: PersonSummary | null;
  post_id: UUID | null;
  status_history?: BriefStatusEvent[]; // Chỉ có trong GET /briefs/:id
  created_at: string;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export interface Story {
  id: UUID;
  student_name: string;
  student_avatar_url: string | null;
  course_name: string;
  pain_point: string;
  transformation: string;
  icp_tags: string[];
  current_status: 'pending_review' | 'approved' | 'deployed';
  deployed_to_campaigns: Array<{ campaign_id: UUID; campaign_title: string }>;
  collected_by: PersonSummary;
  created_at: string;
}

// ─── Referral ─────────────────────────────────────────────────────────────────

export interface Ambassador {
  id: UUID;
  display_name: string;
  referral_code: string;
  referral_link: string;           // Full URL với UTM params
  total_referrals: number;
  converted_referrals: number;
  is_active: boolean;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType = 'lead_new' | 'lead_returned' | 'post_approved' | 'post_rejected' |
  'brief_completed' | 'sla_alert' | 'crisis_activated' | 'budget_warning';

export interface Notification {
  id: UUID;
  notification_type: NotificationType;
  priority: 'alert' | 'normal';
  title: string;
  body: string;
  entity_type: 'lead' | 'post' | 'brief' | 'campaign' | null;
  entity_id: UUID | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// ─── Operational Docs ─────────────────────────────────────────────────────────

export interface OperationalDoc {
  id: UUID;
  doc_key: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  file_url: string | null;
  file_version: string | null;
  last_updated: string | null;
}
```

---

## 7. File Structure

### Backend

```
api.nedu.vn (Bun Modular Monolith)

src/
├── modules/
│   ├── today/
│   │   ├── today.routes.ts
│   │   ├── today.controller.ts
│   │   ├── today.service.ts
│   │   └── today.types.ts
│   ├── lead/
│   │   ├── lead.routes.ts
│   │   ├── lead.controller.ts
│   │   ├── lead.service.ts
│   │   ├── lead.repository.ts
│   │   ├── lead.schema.ts           # Zod validation
│   │   └── lead.types.ts
│   ├── post/
│   │   └── ...                      # Tương tự lead
│   ├── campaign/
│   │   └── ...
│   ├── analytics/
│   │   └── ...
│   ├── brand-health/
│   │   └── ...
│   ├── budget/
│   │   └── ...
│   ├── brief/
│   │   └── ...
│   ├── story/
│   │   └── ...
│   ├── referral/
│   │   └── ...
│   ├── notification/
│   │   └── ...
│   └── system/
│       ├── channels.routes.ts
│       └── docs.routes.ts
├── shared/
│   ├── config/
│   │   └── env.ts                   # Fail fast nếu thiếu required env
│   ├── middleware/
│   │   ├── auth.middleware.ts        # Verify Supabase JWT
│   │   ├── role.middleware.ts        # Check role permission
│   │   └── error.handler.ts
│   ├── db/
│   │   └── client.ts                # PostgreSQL connection pool
│   └── utils/
│       └── audit.ts                 # Helper ghi audit log
├── integrations/
│   ├── cloudflare/
│   │   └── stream.client.ts
│   ├── telegram/
│   │   └── bot.client.ts            # Optional — graceful disable nếu thiếu token
│   └── email/
│       └── email.client.ts          # Optional — SMTP
└── index.ts
```

### Frontend

```
space.nedu.vn (React SPA)

src/
├── modules/
│   ├── today/                       # Module Hôm nay (MH-001, MH-002, MH-003)
│   │   ├── components/
│   │   │   ├── TodayDashboard.tsx
│   │   │   ├── AlertStrip.tsx       # SLA alert 15 phút — màu cam/đỏ
│   │   │   └── LeadQuickActions.tsx # Hot/Warm/Cold/Rác buttons
│   │   ├── services/
│   │   │   └── today.service.ts
│   │   ├── hooks/
│   │   │   └── useTodaySummary.ts
│   │   └── pages/
│   │       └── TodayPage.tsx
│   ├── inbox/                       # Module Inbox & Lead (MH-010..MH-014)
│   │   ├── components/
│   │   │   ├── InboxList.tsx
│   │   │   ├── LeadCard.tsx
│   │   │   ├── LeadClassifyPanel.tsx
│   │   │   ├── LeadDetailDrawer.tsx
│   │   │   └── ReturnedLeadBanner.tsx # Banner vàng khi lead returned
│   │   └── pages/
│   │       └── InboxPage.tsx
│   ├── content/                     # Tạo & Duyệt nội dung (MH-020..MH-022)
│   │   ├── components/
│   │   │   ├── PostForm.tsx         # Caption, channel multi-select, media dropzone
│   │   │   ├── PostCard.tsx         # Badge status + approval note
│   │   │   ├── ApprovalQueue.tsx    # Co-Leader view
│   │   │   └── MediaUploader.tsx    # Dropzone cho ảnh/video
│   │   └── pages/
│   │       └── ContentPage.tsx
│   ├── calendar/                    # Lịch đăng bài (MH-030..MH-032)
│   │   ├── components/
│   │   │   ├── CalendarGrid.tsx     # 7-column grid, màu theo kênh
│   │   │   ├── PostSlot.tsx         # Slot bài trong ô ngày
│   │   │   └── ScheduleModal.tsx    # Modal tạo/edit bài với time picker
│   │   └── pages/
│   │       └── CalendarPage.tsx
│   ├── analytics/                   # Kết quả & KPI (MH-040..MH-042)
│   │   └── pages/
│   │       └── AnalyticsPage.tsx
│   ├── docs/                        # Hệ thống tài liệu (MH-050..MH-051)
│   │   └── pages/
│   │       └── DocsPage.tsx
│   ├── brand-health/                # Brand Health (MH-060..MH-062)
│   │   ├── components/
│   │   │   ├── NPSCard.tsx
│   │   │   ├── SentimentChart.tsx
│   │   │   └── CrisisModal.tsx      # Crisis Protocol steps
│   │   └── pages/
│   │       └── BrandHealthPage.tsx
│   ├── campaign/                    # Campaign View (MH-070..MH-071)
│   │   ├── components/
│   │   │   ├── CampaignKanban.tsx   # 4-column kanban board
│   │   │   └── CampaignCard.tsx
│   │   └── pages/
│   │       └── CampaignPage.tsx
│   ├── story/                       # Story Pipeline (MH-080..MH-082)
│   │   ├── components/
│   │   │   ├── StoryList.tsx
│   │   │   └── StoryCreateStepper.tsx # Stepper 3-4 bước
│   │   └── pages/
│   │       └── StoryPage.tsx
│   ├── budget/                      # Budget & ROI (MH-090..MH-092)
│   │   └── pages/
│   │       └── BudgetPage.tsx
│   ├── referral/                    # Referral Loop (MH-100..MH-102)
│   │   ├── components/
│   │   │   ├── AmbassadorLeaderboard.tsx
│   │   │   └── ReferralLinkPanel.tsx # Copy link với UTM
│   │   └── pages/
│   │       └── ReferralPage.tsx
│   └── brief/                       # Đặt việc (MH-110..MH-112)
│       ├── components/
│       │   ├── BriefDrawer.tsx      # Drawer form gửi brief
│       │   └── BriefTimeline.tsx    # Timeline status steps
│       └── pages/
│           └── BriefPage.tsx
├── shared/
│   ├── components/
│   │   ├── ui/                      # Button, Badge, Modal, Drawer, Toast...
│   │   ├── ProtectedRoute.tsx
│   │   ├── NotificationBell.tsx     # Bell icon + badge số chưa đọc
│   │   └── CommandPalette.tsx       # Cmd+K global (MH-131)
│   ├── config/
│   │   ├── api-client.ts            # Base HTTP client với auth header
│   │   ├── query-client.ts          # React Query setup
│   │   └── supabase.ts              # Supabase Auth SDK (login/logout/refresh only)
│   ├── stores/
│   │   ├── auth.store.ts            # User session, role (Zustand)
│   │   └── notification.store.ts    # Unread count (Zustand)
│   └── constants/
│       ├── channels.ts              # Fallback khi API chưa load
│       └── roles.ts
├── mocks/
│   ├── browser.ts
│   └── handlers/
│       ├── today.mock.ts
│       ├── lead.mock.ts
│       ├── post.mock.ts
│       └── ...                      # 1 file mock per module
├── routes/
│   ├── index.tsx
│   ├── protected.routes.tsx
│   └── public.routes.tsx
└── App.tsx                          # Global keydown listener cho keyboard shortcuts
```

---

## 8. Pages & Components

> **`[UI: cập nhật sau khi prototype HTML finalized]`**
>
> Prototype `marketing-hub-v8.html` đang được finalize. Developer sẽ nhận file HTML updated trước khi build UI. Mọi quyết định về layout, màu sắc, spacing sẽ được lấy từ prototype — không tự design.

### Quy tắc build UI (không thay đổi dù prototype chưa có)

1. **Mockup là source of truth** — pixel-perfect theo prototype HTML
2. **Không tự thêm feature** chưa có trong User Stories
3. **API fallback luôn có** — khi data loading, show skeleton; khi empty, show empty state
4. **Shared components không duplicate** — tất cả Button, Badge, Modal đều từ `src/shared/components/ui/`
5. **Color theo kênh** lấy từ `channel.color_hex` — không hardcode màu trong CSS
6. **Role-based render** — không show button/section cho role không có quyền

### Sidebar Navigation (theo role)

```
Marketing Staff:
  1 — Hôm nay
  2 — Inbox & Lead
  3 — Nội dung
  4 — Lịch đăng bài
  5 — Kết quả & KPI (read only)
  6 — Hệ thống tài liệu
     Đặt việc (Design/Editing)
     Referral
     Story Pipeline

Co-Leader: Tất cả của Staff + Campaign View + Brand Health

Marketing Leader: Tất cả + Budget & ROI
```

### Keyboard Shortcuts (MH-130, MH-131)

Global listener ở `App.tsx`:

| Phím | Hành động |
|---|---|
| `1` | Navigate → Hôm nay |
| `2` | Navigate → Inbox & Lead |
| `3` | Navigate → Nội dung |
| `4` | Navigate → Lịch đăng bài |
| `5` | Navigate → Kết quả & KPI |
| `6` | Navigate → Hệ thống tài liệu |
| `?` | Mở bảng shortcut |
| `Cmd+K` | Mở Command Palette |

---

## 9. User Stories — Full (35 Stories / 14 Modules)

### MODULE 1: HÔM NAY (Dashboard)

| ID | Vai trò | Tôi muốn... | Để... | Priority | Acceptance Criteria |
|---|---|---|---|---|---|
| MH-001 | Marketing Staff | xem tổng quan tất cả công việc cần làm trong ngày tại một màn hình duy nhất | tôi không bỏ sót lead hoặc bài đăng quan trọng | **Must Have** | Hiển thị: số lead chờ phân loại, tin nhắn chưa rep, bài đăng hôm nay. Có nút điều hướng trực tiếp đến từng mục |
| MH-002 | Marketing Staff | nhận cảnh báo nổi bật khi có khách chờ rep hơn 15 phút hoặc bài chưa được duyệt trước giờ đăng | tôi phản ứng kịp thời và không mất cơ hội | **Must Have** | Alert strip hiển thị màu cam/đỏ với tên khách và kênh. Nút 'Rep ngay' dẫn thẳng vào inbox. Alert tự ẩn khi đã xử lý |
| MH-003 | Marketing Staff | phân loại nhanh lead ngay tại màn hình Hôm nay bằng cách nhấn nút Hot/Warm/Cold/Rác | tôi tiết kiệm thời gian mà không cần mở từng màn hình riêng | **Must Have** | Lead card hiển thị tên, kênh, tin nhắn ngắn. Nhấn Hot thì tự động đẩy lead sang Tư vấn viên. Card biến mất khỏi danh sách sau khi phân loại |

### MODULE 2: INBOX & LEAD MANAGEMENT

| ID | Vai trò | Tôi muốn... | Để... | Priority | Acceptance Criteria |
|---|---|---|---|---|---|
| MH-010 | Marketing Staff | xem toàn bộ tin nhắn từ nhiều kênh (TikTok, Facebook, Zalo, YouTube) trong một inbox duy nhất | tôi không cần chuyển qua lại giữa nhiều app | **Must Have** | Inbox hiển thị tên, kênh nguồn, preview tin nhắn, thời gian. Sắp xếp theo thời gian chờ lâu nhất lên đầu. Đánh dấu màu theo trạng thái |
| MH-011 | Marketing Staff | phân loại lead thành Hot/Warm/Cold/Rác và đẩy lead Hot sang Tư vấn viên bằng một nút bấm | Tư vấn viên nhận được lead đúng lúc và đúng chất lượng | **Must Have** | Sau khi nhấn 'Đẩy sang TVV', lead chuyển trạng thái 'Đã push'. Hệ thống ghi nhận thời gian push. Lead không thể push lại lần 2 khi đã ở trạng thái đó |
| MH-012 | Marketing Staff | chat trực tiếp với khách trong cùng giao diện với quick reply gợi ý sẵn | tôi rep nhanh và nhất quán hơn | Should Have | Panel chat hiển thị lịch sử hội thoại. Có 3-5 gợi ý quick reply theo ngữ cảnh. Nhấn gợi ý thì tự điền vào ô nhập. Gửi bằng Enter hoặc nút Send |
| MH-013 | Marketing Staff | xem và xử lý lead bị Tư vấn viên trả về với lý do cụ thể | tôi hiểu vì sao lead bị trả và chỉnh sửa cách phân loại cho đúng hơn | **Must Have** | Lead trả về hiển thị banner màu vàng với lý do. Có gợi ý bước tiếp theo. Staff chọn lại phân loại hoặc đánh dấu Rác |
| MH-014 | Marketing Staff | lọc lead theo trạng thái (Hot, Warm, Cold, Rác, Đã push, Trả về) | tôi tìm được đúng nhóm lead cần xử lý | Should Have | Filter bar hiển thị số lượng mỗi nhóm. Nhấn filter thì danh sách cập nhật ngay lập tức. Có thể chọn nhiều filter cùng lúc |

### MODULE 3: TẠO & DUYỆT NỘI DUNG

| ID | Vai trò | Tôi muốn... | Để... | Priority | Acceptance Criteria |
|---|---|---|---|---|---|
| MH-020 | Marketing Staff | soạn bài viết với caption, chọn kênh đăng, upload ảnh/video và gắn link tham khảo | tôi chuẩn bị đủ thông tin trước khi gửi duyệt | **Must Have** | Form có: ô caption (textarea), chọn kênh (multi-select), dropzone upload media, thêm nhiều link. Nút 'Gửi duyệt' chỉ active khi đủ 4 trường bắt buộc: caption, channel_codes, (media optional nhưng validated) |
| MH-021 | Co-Leader | duyệt hoặc từ chối bài viết kèm ghi chú phản hồi | Marketing Staff biết chính xác cần chỉnh sửa gì | **Must Have** | Bài duyệt có trạng thái: Chờ duyệt / Đã duyệt / Từ chối. Co-Leader nhập ghi chú khi từ chối. Staff nhận thông báo khi có kết quả duyệt |
| MH-022 | Marketing Staff | xem trạng thái duyệt của từng bài (Nháp, Chờ duyệt, Đã duyệt, Đã đăng) | tôi theo dõi được tiến độ từng bài mà không cần hỏi lại Co-Leader | **Must Have** | Mỗi bài có badge trạng thái màu khác nhau. Nhấn vào bài để xem ghi chú phản hồi. Bài Đã duyệt mới hiển thị trên lịch đăng |

### MODULE 4: LỊCH ĐĂNG BÀI

| ID | Vai trò | Tôi muốn... | Để... | Priority | Acceptance Criteria |
|---|---|---|---|---|---|
| MH-030 | Marketing Staff | xem lịch đăng bài theo tháng với đầy đủ thông tin kênh, giờ đăng và trạng thái | tôi lên kế hoạch content tổng thể và không bị trùng lịch | **Must Have** | Lịch dạng grid 7 cột theo tuần. Mỗi ô ngày hiển thị bài đã lên lịch (màu theo kênh). Scroll được sang tháng trước/sau |
| MH-031 | Marketing Staff | nhấn vào ô ngày trống để tạo bài mới, hoặc nhấn bài có sẵn để chỉnh sửa | thao tác tạo và sửa bài nhanh trực tiếp từ lịch | **Must Have** | Nhấn ô trống mở modal tạo bài mới với ngày được điền sẵn. Nhấn bài hiện có mở modal chỉnh sửa với dữ liệu đã điền |
| MH-032 | Marketing Staff | lên lịch đăng bài với giờ cụ thể và kênh đăng | đội ngũ biết chính xác khi nào bài sẽ được đăng | **Must Have** | Modal tạo bài có time picker chọn giờ/phút. Chọn 1 hoặc nhiều kênh. Lưu xong bài xuất hiện ngay trên lịch với màu theo kênh |

### MODULE 5: KẾT QUẢ & ANALYTICS

| ID | Vai trò | Tôi muốn... | Để... | Priority | Acceptance Criteria |
|---|---|---|---|---|---|
| MH-040 | Marketing Leader | theo dõi reach, engagement rate, số lead và conversion theo từng kênh | tôi biết kênh nào đang hiệu quả để tập trung nguồn lực | **Must Have** | Dashboard hiển thị card số liệu mỗi kênh. Có chỉ số ER (%), reach, lead count. Cảnh báo màu đỏ khi chỉ số dưới ngưỡng tốt |
| MH-041 | Marketing Leader | chọn kỳ báo cáo (tuần, tháng) để xem dữ liệu theo giai đoạn | tôi so sánh hiệu suất theo thời gian | Should Have | Period selector: Tuần này, Tháng này, Tháng trước. Dữ liệu cập nhật ngay khi chọn. Hiển thị % tăng/giảm so với kỳ trước |
| MH-042 | Marketing Leader | xuất báo cáo analytics ra file Excel/PDF | tôi trình bày được với Founder trong buổi review hàng tuần | Should Have | Nút 'Xuất báo cáo' tải file gồm reach, ER, lead source, conversion. Tên file có tháng/năm. Hỗ trợ format Excel + PDF. **Note:** Client-side export dùng xlsx.js / jsPDF |

### MODULE 6: HỆ THỐNG TÀI LIỆU

| ID | Vai trò | Tôi muốn... | Để... | Priority | Acceptance Criteria |
|---|---|---|---|---|---|
| MH-050 | Marketing Staff | xem trạng thái hoàn thành của 8 tài liệu vận hành (SOP, JD, Tracker...) | tôi biết tài liệu nào còn thiếu cần ưu tiên làm | Should Have | Danh sách 8 tài liệu với badge trạng thái: Hoàn thành (xanh) / Đang làm (cam) / Chưa làm (xám). Thanh tiến độ tổng thể ở đầu trang |
| MH-051 | Marketing Staff | nhấn vào tài liệu để xem chi tiết hoặc mở file | tôi truy cập nhanh tài liệu cần dùng | Nice to Have | Nhấn vào card tài liệu mở link file (Google Drive). Hiển thị tên file, phiên bản, ngày cập nhật |

### MODULE 7: BRAND HEALTH

| ID | Vai trò | Tôi muốn... | Để... | Priority | Acceptance Criteria |
|---|---|---|---|---|---|
| MH-060 | Marketing Leader | theo dõi NPS Score, Share of Voice và Brand Mentions theo tuần | tôi phát hiện sớm dấu hiệu thương hiệu suy yếu để can thiệp | Should Have | 3 KPI card với màu cảnh báo (đỏ/vàng/xanh) theo ngưỡng. NPS < 30 hiển thị cảnh báo đỏ. Trend so với tuần/tháng trước |
| MH-061 | Marketing Leader | xem phân tích sentiment (tích cực/trung tính/tiêu cực) và các chủ đề tiêu cực đang được nhắc nhiều | tôi tạo content phù hợp để phản bác objection | Should Have | Bar chart sentiment 3 màu. Danh sách chủ đề tiêu cực có số mention và gợi ý phương án xử lý |
| MH-062 | Marketing Leader | kích hoạt Crisis Protocol khi có khủng hoảng thương hiệu | team phản ứng đúng thứ tự, không panick và không xử lý sai | Should Have | Nút 'Kích hoạt Crisis Mode' hiển thị quy trình 3 bước có thể tick hoàn thành. Gửi thông báo cho Leader khi được kích hoạt. **Telegram bắt buộc — không optional** |

### MODULE 8: CAMPAIGN VIEW

| ID | Vai trò | Tôi muốn... | Để... | Priority | Acceptance Criteria |
|---|---|---|---|---|---|
| MH-070 | Marketing Leader | quản lý chiến dịch theo 4 phase: Opening, Build, Close, CTA trên dạng kanban board | tôi nắm được tiến độ tổng thể của từng chiến dịch | Should Have | Board 4 cột theo phase. Mỗi campaign card hiển thị tên, phase hiện tại, thanh tiến độ. Kéo thả card giữa các cột để cập nhật phase. Không được skip phase, không được quay ngược |
| MH-071 | Marketing Leader | xem danh sách bài đăng của từng chiến dịch theo timeline | tôi đảm bảo mỗi bài đúng phase và đúng thứ tự | Should Have | Nhấn campaign card mở panel chi tiết với timeline bài đăng. Mỗi bài có trạng thái (Đã đăng/Lên lịch/Nháp) và giờ dự kiến |

### MODULE 9: STORY PIPELINE HỌC VIÊN

| ID | Vai trò | Tôi muốn... | Để... | Priority | Acceptance Criteria |
|---|---|---|---|---|---|
| MH-080 | Marketing Staff | quản lý testimonial và câu chuyện chuyển hoá của học viên theo trạng thái (Chờ duyệt / Đã duyệt / Đã deploy) | team có nguồn content thực tế chất lượng cao được dùng đúng lúc | Should Have | Danh sách story card với avatar, tên, khóa học, pain point, tags. Badge trạng thái theo màu. Lọc theo khóa học và trạng thái |
| MH-081 | Marketing Staff | tạo story mới qua form nhiều bước: thu thập thông tin học viên, pain point, transformation, ICP tags | dữ liệu story đầy đủ và có cấu trúc để dùng cho nhiều loại content | Should Have | Form dạng stepper 3-4 bước. Có bước xác nhận trước khi submit. Story sau khi tạo xuất hiện trong danh sách với trạng thái 'Chờ duyệt' |
| MH-082 | Marketing Staff | deploy story vào campaign hoặc bài đăng cụ thể với 1 click | story được sử dụng đúng mục đích và theo dõi được hiệu quả | Nice to Have | Nút Deploy mở dropdown chọn campaign. Sau khi deploy, story hiển thị badge campaign đã dùng. Có thể deploy vào nhiều campaign |

### MODULE 10: BUDGET & ROI

| ID | Vai trò | Tôi muốn... | Để... | Priority | Acceptance Criteria |
|---|---|---|---|---|---|
| MH-090 | Marketing Leader | xem tổng ngân sách đã dùng, Cost per Lead và ROI tháng hiện tại | tôi kiểm soát được hiệu quả chi phí marketing | Should Have | 3 KPI card với màu ngưỡng. CPL so với benchmark industry. ROI = (Doanh thu từ lead - Chi phí) / Chi phí × 100%. Cảnh báo khi vượt 80% budget |
| MH-091 | Marketing Leader | xem CPL (Cost per Lead) theo từng kênh và so sánh hiệu quả | tôi biết kênh nào đang lỗ để cắt giảm hoặc tối ưu | Should Have | Bảng hoặc chart CPL từng kênh. Sắp xếp từ thấp đến cao. Có benchmark ngành để so sánh. Màu đỏ khi CPL vượt benchmark |
| MH-092 | Marketing Leader | xuất báo cáo Budget & ROI ra Excel để lập ngân sách tháng sau | tôi có dữ liệu thực tế để thuyết phục Founder tăng hoặc tái phân bổ budget | Nice to Have | File Excel có sheet: Tổng hợp, Chi phí theo kênh, ROI theo campaign, Dự báo tháng sau. Tên file có tháng/năm. **Client-side export dùng xlsx.js** |

### MODULE 11: REFERRAL LOOP

| ID | Vai trò | Tôi muốn... | Để... | Priority | Acceptance Criteria |
|---|---|---|---|---|---|
| MH-100 | Marketing Staff | theo dõi danh sách lead đến từ kênh referral (alumni giới thiệu) | tôi ưu tiên xử lý nhóm lead chất lượng cao này trước | Should Have | Danh sách lead referral với tên người giới thiệu, conversion rate của nhóm. Hiển thị CPL referral so với kênh paid |
| MH-101 | Marketing Staff | xem bảng xếp hạng top ambassador và quản lý chương trình chăm sóc | tôi duy trì mối quan hệ với alumni giới thiệu nhiều và kích hoạt thêm người mới tham gia | Should Have | Leaderboard top 3 ambassador với số lượt giới thiệu và hoa hồng. Panel 'Chăm sóc' có checklist hành động cụ thể. Tick xong thì lưu trạng thái |
| MH-102 | Marketing Staff | copy link referral có UTM tracking riêng của từng ambassador | hệ thống tự ghi nhận đúng ambassador khi có người đăng ký qua link | Should Have | Nút 'Copy Link' tạo link có `utm_source=referral`, `utm_campaign=ambassador-{id}`. Toast xác nhận 'Đã copy'. Link hiển thị được trong panel ambassador |

### MODULE 12: ĐẶT VIỆC (DESIGN & EDITING)

| ID | Vai trò | Tôi muốn... | Để... | Priority | Acceptance Criteria |
|---|---|---|---|---|---|
| MH-110 | Marketing Staff | gửi brief thiết kế cho Design team ngay trong hệ thống với đủ 4 trường: loại, mô tả, kích thước, deadline | Design team nhận đủ thông tin và tôi theo dõi được tiến độ | Should Have | Drawer form có 4 trường bắt buộc. Nút 'Gửi brief' chỉ active khi điền đủ. Sau khi gửi hiển thị trạng thái 'Đang xử lý' và timeline các bước |
| MH-111 | Marketing Staff | gửi brief video cho Editing team với thông tin format (Reels/YT/Story) và deadline | Editing team ưu tiên đúng và giao file đúng hạn | Should Have | Drawer riêng cho Editing brief. Chọn format xuất. Tracking tiến độ theo bước: Nhận → Đang làm → Xem xét → Hoàn thành. Nhận thông báo khi có deliverable |
| MH-112 | Marketing Staff | xem lịch sử các brief đã gửi và trạng thái từng đơn | tôi không cần nhắn hỏi lại Design/Editing team về tiến độ | Nice to Have | Tab lịch sử trong drawer. Mỗi brief có timeline trạng thái. Có thể mở rộng xem ghi chú trao đổi. Deliverable được đính kèm khi hoàn thành |

### MODULE 13: HỆ THỐNG THÔNG BÁO

| ID | Vai trò | Tôi muốn... | Để... | Priority | Acceptance Criteria |
|---|---|---|---|---|---|
| MH-120 | Marketing Staff | nhận thông báo trong app khi có lead mới, bài được duyệt, brief hoàn thành hoặc lead được trả về | tôi không bỏ lỡ sự kiện quan trọng ngay cả khi đang ở tab khác | **Must Have** | Bell icon có badge số thông báo chưa đọc. Nhấn mở panel danh sách thông báo. Thông báo chưa đọc có nền xanh. Nhấn vào thông báo dẫn đến đúng màn hình |

### MODULE 14: PHÍM TẮT & UX

| ID | Vai trò | Tôi muốn... | Để... | Priority | Acceptance Criteria |
|---|---|---|---|---|---|
| MH-130 | Marketing Staff | sử dụng phím số 1-6 để chuyển nhanh giữa các tab chính | tôi làm việc nhanh hơn mà không cần dùng chuột nhiều | Nice to Have | Phím 1=Hôm nay, 2=Inbox, 3=Nội dung, 4=Lịch, 5=Kết quả, 6=Hệ thống. Có bảng shortcut hiển thị bằng phím ? |
| MH-131 | Marketing Staff | tìm kiếm lệnh và điều hướng nhanh bằng Cmd+K (Command Palette) | tôi không cần nhớ vị trí từng tính năng trong menu | Nice to Have | Cmd+K mở search box. Gõ tên tính năng/tab/action thì hiển thị gợi ý. Nhấn Enter hoặc click thực thi lệnh |
| MH-132 | Marketing Staff | xem hướng dẫn onboarding spotlight khi lần đầu sử dụng hệ thống | tôi hiểu nhanh các tính năng chính mà không cần đọc tài liệu dài | Nice to Have | Spotlight tour tự động chạy lần đầu vào app. Highlight từng thành phần UI với giải thích. Có thể bỏ qua. Không hiển thị lại sau khi đã xem |

---

## 10. Build Order (Sprint by Sprint)

### Sprint 1 — Foundation (Setup + Auth + Data Model)

**Goal:** Repo chạy được, auth hoạt động, DB connected.

```
Backend:
  [ ] Khởi tạo Bun project, cấu trúc module
  [ ] DB connection pool (postgres lib)
  [ ] env.ts — fail fast validation
  [ ] auth.middleware.ts — verify Supabase JWT
  [ ] role.middleware.ts — check role
  [ ] error.handler.ts — chuẩn format ErrorResponse

Database:
  [ ] Run migration: channels, leads, lead_actions
  [ ] Run migration: posts, post_channels, post_media, post_approvals
  [ ] Run migration: campaigns
  [ ] Run migration: analytics_channel_data, budget_allocations
  [ ] Run migration: brand_health_entries, crisis_protocols
  [ ] Run migration: briefs, brief_status_log
  [ ] Run migration: stories, story_deployments, ambassadors
  [ ] Run migration: notifications, notification_log, operational_docs
  [ ] Seed: channels table (6 kênh), operational_docs (8 tài liệu)
  [ ] Enable RLS trên tất cả bảng nhạy cảm
  [ ] Enable Supabase Realtime cho notifications table

Frontend:
  [ ] Khởi tạo React + TypeScript + TailwindCSS + Vite
  [ ] Cấu trúc thư mục theo spec
  [ ] Supabase Auth SDK setup (login/logout/refresh)
  [ ] api-client.ts — base HTTP client với Bearer token
  [ ] query-client.ts — React Query setup
  [ ] auth.store.ts — Zustand
  [ ] MSW setup — browser.ts + handler stubs
  [ ] Login page
  [ ] ProtectedRoute.tsx
  [ ] Sidebar navigation (all modules, hidden by role)
```

### Sprint 2 — Phase 1 Core: Today + Lead (Must Have)

**Goal:** Staff có thể vào app, thấy dashboard, phân loại lead.

```
Backend:
  [ ] GET /api/v1/marketing/today/summary
  [ ] GET /api/v1/marketing/leads (với RLS)
  [ ] GET /api/v1/marketing/leads/:id
  [ ] POST /api/v1/marketing/leads/:id/actions (classify + push)
  [ ] POST /api/v1/marketing/leads/sync (webhook HMAC)
  [ ] Telegram bot client (optional — graceful disable)
  [ ] Notification module — in-app notification INSERT + Supabase Realtime trigger

Frontend:
  [ ] MSW handlers: today.mock.ts, lead.mock.ts
  [ ] TodayPage.tsx
      - AlertStrip.tsx (SLA 15 phút)
      - LeadQuickActions.tsx (Hot/Warm/Cold/Rác buttons)
  [ ] InboxPage.tsx
      - InboxList.tsx + filter bar
      - LeadCard.tsx (channel color badge)
      - LeadDetailDrawer.tsx + action history
      - ReturnedLeadBanner.tsx (banner vàng)
  [ ] NotificationBell.tsx + realtime subscribe
```

### Sprint 3 — Phase 1 Core: Content + Calendar (Must Have)

**Goal:** Staff có thể soạn bài, Co-Leader duyệt, lịch hiển thị.

```
Backend:
  [ ] POST /api/v1/marketing/posts (create draft)
  [ ] GET /api/v1/marketing/posts (list với RLS)
  [ ] GET /api/v1/marketing/posts/:id
  [ ] PATCH /api/v1/marketing/posts/:id (edit draft/rejected)
  [ ] POST /api/v1/marketing/posts/:id/actions (submit/approve/reject/schedule)
  [ ] POST /api/v1/marketing/posts/:id/media (Cloudflare Stream upload)
  [ ] GET /api/v1/marketing/calendar
  [ ] GET /api/v1/marketing/channels (lookup)

Frontend:
  [ ] MSW handlers: post.mock.ts, calendar.mock.ts
  [ ] ContentPage.tsx
      - PostForm.tsx (caption, multi-select channel, media dropzone)
      - PostCard.tsx (badge status)
      - ApprovalQueue.tsx (Co-Leader view)
      - MediaUploader.tsx
  [ ] CalendarPage.tsx
      - CalendarGrid.tsx (7-column, màu theo kênh)
      - PostSlot.tsx
      - ScheduleModal.tsx (time picker)
```

### Sprint 4 — Phase 2: Analytics + Docs + Brand Health + Campaign + Brief

**Goal:** Leader có dashboard đầy đủ, briefs hoạt động.

```
Backend:
  [ ] GET + POST /api/v1/marketing/analytics/summary
  [ ] POST /api/v1/marketing/analytics/entries
  [ ] GET /api/v1/marketing/docs
  [ ] GET + POST /api/v1/marketing/brand-health
  [ ] POST /api/v1/marketing/brand-health/crisis
  [ ] GET + POST /api/v1/marketing/campaigns
  [ ] GET /api/v1/marketing/campaigns/:id
  [ ] PATCH /api/v1/marketing/campaigns/:id/phase
  [ ] GET + POST /api/v1/marketing/briefs
  [ ] GET /api/v1/marketing/briefs/:id
  [ ] POST /api/v1/marketing/briefs/:id/actions

Frontend:
  [ ] AnalyticsPage.tsx (KPI cards + period selector)
  [ ] DocsPage.tsx (8 tài liệu + progress bar)
  [ ] BrandHealthPage.tsx (NPS card, sentiment chart, crisis modal)
  [ ] CampaignPage.tsx (kanban 4 columns, drag-drop phase)
  [ ] BriefPage.tsx (drawer form + timeline steps)
```

### Sprint 5 — Phase 3: Story + Budget + Referral

```
Backend:
  [ ] GET + POST /api/v1/marketing/stories
  [ ] POST /api/v1/marketing/stories/:id/actions
  [ ] GET /api/v1/marketing/budget/summary
  [ ] POST /api/v1/marketing/budget/allocations
  [ ] GET /api/v1/marketing/referral/leads
  [ ] GET /api/v1/marketing/referral/ambassadors

Frontend:
  [ ] StoryPage.tsx (list + stepper form)
  [ ] BudgetPage.tsx (3 KPI cards + CPL chart)
  [ ] ReferralPage.tsx (leaderboard + copy link)
```

### Sprint 6 — UX Polish + Keyboard Shortcuts

```
Frontend:
  [ ] Global keydown listener ở App.tsx (phím 1-6, ?)
  [ ] CommandPalette.tsx (Cmd+K)
  [ ] Onboarding spotlight (MH-132)
  [ ] Client-side export: xlsx.js cho Analytics (MH-042) và Budget (MH-092)
  [ ] Empty states cho tất cả list screens
  [ ] Loading skeletons
  [ ] Error boundaries
```

---

## 11. Shared Components (không duplicate)

| Component | Dùng ở | Mô tả |
|---|---|---|
| `Button` | Toàn app | Variants: primary, secondary, ghost, danger |
| `Badge` | Lead status, Post status, Brief status | Color theo status |
| `Modal` | Schedule, Crisis, Campaign detail | Base modal với overlay |
| `Drawer` | Lead detail, Brief form | Slide-in từ phải |
| `Toast` | Copy link, Save success, Error | Auto-dismiss 3s |
| `Skeleton` | Tất cả list screens | Loading state |
| `EmptyState` | Tất cả list screens | Khi không có data |
| `ChannelBadge` | Inbox, Calendar, Posts | Màu từ `channel.color_hex` |
| `NotificationBell` | Header | Bell icon + badge count + realtime |
| `CommandPalette` | Global (App.tsx) | Cmd+K search |
| `ProtectedRoute` | routes/ | Redirect theo role |
| `AlertStrip` | TodayPage | SLA 15 phút — màu cam/đỏ |

---

## 12. Development Conventions

### Mock-First Development

Mỗi module: **build MSW mock handler trước, API thật sau.** Không để trang trắng.

```typescript
// mocks/handlers/lead.mock.ts
import { http, HttpResponse } from 'msw';

export const leadHandlers = [
  http.get('/api/v1/marketing/leads', () => {
    return HttpResponse.json({
      data: mockLeads,
      meta: { total: 2, page: 1, per_page: 20, has_next: false }
    });
  }),
];
```

### Commit Convention

Format: `type(scope): subject`

```
feat(lead): add hot/warm/cold classification with quick action buttons
feat(calendar): implement monthly view with channel color coding
fix(inbox): prevent double-push on hot lead
feat(notification): add 15-minute SLA alert for unresponded leads
```

### Branch Naming

```
feat/lead-classification-ui
feat/content-approval-flow
fix/calendar-modal-date-prefill
hotfix/lead-push-duplicate-bug
```

---

## 13. Câu lệnh mở đầu cho Claude Code

Sau khi có file này, paste vào Claude Code:

```
Đọc CLAUDE.md.

Build Marketing Hub (space.nedu.vn) theo đúng spec trong file này.
Bắt đầu Sprint 1: Foundation — setup repo, auth, DB migrations.
Tạo xong thì list ra tất cả file đã tạo.
Tôi confirm rồi mới qua Sprint 2.

Lưu ý:
- Mock-first: tạo MSW handlers trước khi viết API thật
- Không tự thêm feature ngoài spec
- API contract section 5 là frozen — không thay đổi
- UI section 8 có note [UI: cập nhật sau] — skip build UI cho đến khi có prototype file mới
```

---

## 14. Checklist Trước Khi Build

```
□ Tech stack: React + TypeScript + TailwindCSS + Bun + Supabase
□ Domain/repo: space.nedu.vn / nedu-marketing-hub
□ Auth: Supabase JWT, verify ở backend, KHÔNG gọi Supabase per-request
□ DB: Frontend không query Supabase trực tiếp — tất cả qua Backend API
□ Lead sync: webhook từ ops.nedu.vn với HMAC signature
□ Telegram: optional cho alerts, REQUIRED cho Crisis Protocol
□ Realtime: Supabase Realtime cho notifications table
□ Media: Cloudflare Stream — upload qua backend, không trực tiếp
□ Export: client-side (xlsx.js, jsPDF) — không server-side
□ Mock-first: MSW handler trước API thật
□ RLS: bật trên tất cả bảng nhạy cảm
□ 6 tầng architecture: tất cả đã được spec
□ Build order: Data Model → API → UI (theo Sprint)
□ API fallback: không để trang trắng — luôn có mock data
□ UI frozen: chờ prototype HTML finalized trước khi build UI layer
```

---

*CLAUDE.md · Marketing Hub · space.nedu.vn*
*NL-CLAUDE-MARKETING-HUB-001 v1.0 · NhiLe Holdings · Tháng 4/2026*
*Source documents: MARKETING-HUB-ARCHITECTURE-v1_0.md · MARKETING-HUB-NEDU-API-CONTRACT-v1_0.yaml · marketing-hub-user-story.docx v8 · Nedu_BigPicture_Marketing.html*
