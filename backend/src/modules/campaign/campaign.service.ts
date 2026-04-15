/**
 * Campaign service.
 *
 * listCampaigns  — list all campaigns with optional phase filter + post counts
 * getCampaignById — campaign detail with posts
 * createCampaign  — insert new campaign
 * updatePhase     — advance campaign to next phase (strict one-way state machine)
 */

import { db } from "../../shared/db/client.js";
import { ConflictError, NotFoundError } from "../../shared/middleware/error.handler.js";
import { PHASE_ORDER } from "./campaign.schema.js";
import type { Campaign, CampaignPhase, Post } from "./campaign.types.js";
import type { CreateCampaignInput } from "./campaign.schema.js";

// ── Row shapes ─────────────────────────────────────────────────────────────────

interface CampaignRow {
  id: string;
  title: string;
  description: string | null;
  current_phase: string;
  start_date: string | null;
  end_date: string | null;
  created_by_id: string;
  created_by_name: string;
  created_by_avatar: string | null;
  total_posts: string;
  published_posts: string;
  scheduled_posts: string;
  draft_posts: string;
  created_at: string;
}

interface PostRow {
  id: string;
  title: string;
  status: string;
  platform: string | null;
  scheduled_at: string | null;
  created_at: string;
}

// ── Mappers ────────────────────────────────────────────────────────────────────

function mapCampaignRow(row: CampaignRow, posts?: Post[]): Campaign {
  const result: Campaign = {
    id: row.id,
    title: row.title,
    description: row.description,
    current_phase: row.current_phase as CampaignPhase,
    start_date: row.start_date,
    end_date: row.end_date,
    created_by: {
      id: row.created_by_id,
      display_name: row.created_by_name,
      avatar_url: row.created_by_avatar,
    },
    post_counts: {
      total: Number(row.total_posts),
      published: Number(row.published_posts),
      scheduled: Number(row.scheduled_posts),
      draft: Number(row.draft_posts),
    },
    created_at: new Date(row.created_at).toISOString(),
  };

  if (posts !== undefined) {
    result.posts = posts;
  }

  return result;
}

const CAMPAIGN_SELECT = `
  c.id,
  c.title,
  c.description,
  c.current_phase,
  c.start_date::text,
  c.end_date::text,
  p.id         AS created_by_id,
  p.display_name AS created_by_name,
  p.avatar_url   AS created_by_avatar,
  (SELECT COUNT(*) FROM posts WHERE campaign_id = c.id AND deleted_at IS NULL)                              AS total_posts,
  (SELECT COUNT(*) FROM posts WHERE campaign_id = c.id AND deleted_at IS NULL AND status = 'published')     AS published_posts,
  (SELECT COUNT(*) FROM posts WHERE campaign_id = c.id AND deleted_at IS NULL AND status = 'scheduled')     AS scheduled_posts,
  (SELECT COUNT(*) FROM posts WHERE campaign_id = c.id AND deleted_at IS NULL AND status = 'draft')         AS draft_posts,
  c.created_at
`;

// ── listCampaigns ─────────────────────────────────────────────────────────────

export async function listCampaigns(phaseFilter?: CampaignPhase): Promise<Campaign[]> {
  const params: unknown[] = [];
  const conditions: string[] = ["c.deleted_at IS NULL"];

  if (phaseFilter) {
    params.push(phaseFilter);
    conditions.push(`c.current_phase = $${params.length}`);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const { rows } = await db.query<CampaignRow>(
    `SELECT ${CAMPAIGN_SELECT}
     FROM campaigns c
     JOIN persons p ON p.id = c.created_by_id
     ${whereClause}
     ORDER BY c.created_at DESC`,
    params
  );

  return rows.map((row) => mapCampaignRow(row));
}

// ── getCampaignById ───────────────────────────────────────────────────────────

export async function getCampaignById(id: string): Promise<Campaign> {
  const { rows } = await db.query<CampaignRow>(
    `SELECT ${CAMPAIGN_SELECT}
     FROM campaigns c
     JOIN persons p ON p.id = c.created_by_id
     WHERE c.id = $1
       AND c.deleted_at IS NULL`,
    [id]
  );

  if (rows.length === 0) {
    throw new NotFoundError("Campaign", id);
  }

  // Fetch posts belonging to this campaign.
  const { rows: postRows } = await db.query<PostRow>(
    `SELECT id, title, status, platform, scheduled_at::text, created_at
     FROM posts
     WHERE campaign_id = $1
       AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [id]
  );

  const posts: Post[] = postRows.map((pr) => ({
    id: pr.id,
    title: pr.title,
    status: pr.status,
    platform: pr.platform,
    scheduled_at: pr.scheduled_at,
    created_at: new Date(pr.created_at).toISOString(),
  }));

  return mapCampaignRow(rows[0]!, posts);
}

// ── createCampaign ────────────────────────────────────────────────────────────

export async function createCampaign(
  data: CreateCampaignInput,
  createdById: string
): Promise<Campaign> {
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO campaigns (title, description, current_phase, start_date, end_date, created_by_id, created_at)
     VALUES ($1, $2, 'opening', $3::date, $4::date, $5, NOW())
     RETURNING id`,
    [
      data.title,
      data.description ?? null,
      data.start_date ?? null,
      data.end_date ?? null,
      createdById,
    ]
  );

  return getCampaignById(rows[0]!.id);
}

// ── updatePhase ───────────────────────────────────────────────────────────────

/**
 * Advance campaign phase by exactly one step forward.
 *
 * Phase order: opening → build → close → cta → completed
 *
 * Throws ConflictError('INVALID_PHASE_TRANSITION') if:
 *   - newPhase is the same as currentPhase
 *   - newPhase is a previous phase (reversal)
 *   - newPhase skips one or more phases
 */
export async function updatePhase(
  campaignId: string,
  newPhase: CampaignPhase,
  _userId: string,
  _roles: string[]
): Promise<Campaign> {
  // Fetch current campaign with lock.
  const { rows: lockRows } = await db.query<{ current_phase: string }>(
    `SELECT current_phase FROM campaigns WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
    [campaignId]
  );

  if (lockRows.length === 0) {
    throw new NotFoundError("Campaign", campaignId);
  }

  const currentPhase = lockRows[0]!.current_phase as CampaignPhase;
  const currentIdx = PHASE_ORDER.indexOf(currentPhase);
  const newIdx = PHASE_ORDER.indexOf(newPhase);

  // Validate: newPhase must be exactly one step forward.
  if (newIdx !== currentIdx + 1) {
    throw new ConflictError("INVALID_PHASE_TRANSITION", {
      current_phase: currentPhase,
      requested_phase: newPhase,
      allowed_next_phase: PHASE_ORDER[currentIdx + 1] ?? null,
    });
  }

  await db.query(
    `UPDATE campaigns SET current_phase = $1, updated_at = NOW() WHERE id = $2`,
    [newPhase, campaignId]
  );

  return getCampaignById(campaignId);
}
