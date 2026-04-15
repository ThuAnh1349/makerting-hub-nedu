-- ─────────────────────────────────────────────────────────────────────────────
-- CHANNELS — Kênh Marketing
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE channels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  color_hex   TEXT NOT NULL,
  icon_name   TEXT NOT NULL,
  platform    TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- ─────────────────────────────────────────────────────────────────────────────
-- MATERIALIZED VIEW — Analytics Channel Summary
-- ─────────────────────────────────────────────────────────────────────────────

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

-- Enable Supabase Realtime for notifications table
-- Run in Supabase Dashboard → Database → Replication:
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
