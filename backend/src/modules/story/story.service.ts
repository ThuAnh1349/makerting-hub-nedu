/**
 * Story service.
 *
 * listStories        — paginated list with optional status/icp_tag filter
 * createStory        — insert a new student story (status = 'pending_review')
 * performStoryAction — approve or deploy a story with role/state validation
 */

import { db } from "../../shared/db/client.js";
import {
  ConflictError,
  NotFoundError,
  BadRequestError,
} from "../../shared/middleware/error.handler.js";
import { createNotification } from "../notification/notification.service.js";
import type { Story, StoryListResult } from "./story.types.js";
import type { CreateStoryInput, StoryActionInput, StoryListQuery } from "./story.schema.js";

// ── Row shapes ─────────────────────────────────────────────────────────────────

interface StoryRow {
  id: string;
  student_name: string;
  student_avatar_url: string | null;
  course_name: string;
  pain_point: string;
  transformation: string;
  icp_tags: string[];
  current_status: "pending_review" | "approved" | "deployed";
  created_at: string;
  collected_by_id: string;
  collected_by_display_name: string;
  collected_by_avatar_url: string | null;
  ops_student_ref: string | null;
}

interface DeploymentRow {
  story_id: string;
  campaign_id: string;
  campaign_title: string;
}

interface CountRow {
  count: string;
}

// ── Map helpers ────────────────────────────────────────────────────────────────

function mapStoryRow(
  row: StoryRow,
  deployments: Array<{ campaign_id: string; campaign_title: string }>
): Story {
  return {
    id: row.id,
    student_name: row.student_name,
    student_avatar_url: row.student_avatar_url,
    course_name: row.course_name,
    pain_point: row.pain_point,
    transformation: row.transformation,
    icp_tags: Array.isArray(row.icp_tags) ? row.icp_tags : [],
    current_status: row.current_status,
    deployed_to_campaigns: deployments,
    collected_by: {
      id: row.collected_by_id,
      display_name: row.collected_by_display_name,
      avatar_url: row.collected_by_avatar_url,
    },
    created_at: new Date(row.created_at).toISOString(),
  };
}

async function fetchDeploymentsForStories(
  storyIds: string[]
): Promise<Map<string, Array<{ campaign_id: string; campaign_title: string }>>> {
  if (storyIds.length === 0) return new Map();

  const placeholders = storyIds.map((_, i) => `$${i + 1}`).join(", ");
  const { rows } = await db.query<DeploymentRow>(
    `SELECT sd.story_id, sd.campaign_id, c.title AS campaign_title
     FROM story_deployments sd
     JOIN campaigns c ON c.id = sd.campaign_id
     WHERE sd.story_id IN (${placeholders})`,
    storyIds
  );

  const map = new Map<string, Array<{ campaign_id: string; campaign_title: string }>>();
  for (const row of rows) {
    const existing = map.get(row.story_id) ?? [];
    existing.push({ campaign_id: row.campaign_id, campaign_title: row.campaign_title });
    map.set(row.story_id, existing);
  }
  return map;
}

// ── listStories ────────────────────────────────────────────────────────────────

/**
 * Returns a paginated list of stories.
 * Filters by status and/or icp_tag when provided.
 */
export async function listStories(
  filters: StoryListQuery
): Promise<StoryListResult> {
  const { status, icp_tag, page, per_page } = filters;

  const conditions: string[] = ["s.deleted_at IS NULL"];
  const params: unknown[] = [];

  if (status) {
    params.push(status);
    conditions.push(`s.current_status = $${params.length}`);
  }

  if (icp_tag) {
    params.push(icp_tag);
    conditions.push(`$${params.length} = ANY(s.icp_tags)`);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;
  const offset = (page - 1) * per_page;

  const [countResult, dataResult] = await Promise.all([
    db.query<CountRow>(
      `SELECT COUNT(*) AS count FROM stories s ${whereClause}`,
      params
    ),
    db.query<StoryRow>(
      `SELECT
         s.id,
         s.student_name,
         s.student_avatar_url,
         s.course_name,
         s.pain_point,
         s.transformation,
         s.icp_tags,
         s.current_status,
         s.created_at,
         s.ops_student_ref,
         p.id            AS collected_by_id,
         p.display_name  AS collected_by_display_name,
         p.avatar_url    AS collected_by_avatar_url
       FROM stories s
       JOIN persons p ON p.id = s.collected_by_person_id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, per_page, offset]
    ),
  ]);

  const total = parseInt(countResult.rows[0]?.count ?? "0", 10);
  const storyIds = dataResult.rows.map((r) => r.id);
  const deploymentsMap = await fetchDeploymentsForStories(storyIds);

  const data = dataResult.rows.map((row) =>
    mapStoryRow(row, deploymentsMap.get(row.id) ?? [])
  );

  return {
    data,
    meta: {
      total,
      page,
      per_page,
      has_next: page * per_page < total,
      next_cursor: page * per_page < total ? String(page + 1) : null,
    },
  };
}

// ── createStory ────────────────────────────────────────────────────────────────

/**
 * Insert a new story record with status = 'pending_review'.
 * Notifies all marketing leaders of the new story.
 */
export async function createStory(
  data: CreateStoryInput,
  collectedById: string
): Promise<Story> {
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO stories (
       student_name,
       student_avatar_url,
       course_name,
       pain_point,
       transformation,
       icp_tags,
       current_status,
       collected_by_person_id,
       ops_student_ref,
       created_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, 'pending_review', $7, $8, NOW())
     RETURNING id`,
    [
      data.student_name,
      data.student_avatar_url ?? null,
      data.course_name,
      data.pain_point,
      data.transformation,
      data.icp_tags,
      collectedById,
      data.ops_student_ref ?? null,
    ]
  );

  const storyId = rows[0]?.id;
  if (!storyId) {
    throw new Error("Story insert failed — no id returned.");
  }

  // Notify marketing leaders of the pending story.
  const { rows: leaderRows } = await db.query<{ person_id: string }>(
    `SELECT pr.person_id
     FROM person_roles pr
     JOIN persons p ON p.id = pr.person_id
     WHERE pr.role_name IN ('marketing_leader', 'co_leader')
       AND pr.valid_until IS NULL
       AND p.deleted_at IS NULL`
  );

  await Promise.allSettled(
    leaderRows.map((leader) =>
      createNotification(
        leader.person_id,
        "story_submitted",
        "info",
        "New Student Story Submitted",
        `A new story by "${data.student_name}" for "${data.course_name}" is awaiting review.`,
        "story",
        storyId
      )
    )
  );

  return getStoryById(storyId);
}

// ── getStoryById ───────────────────────────────────────────────────────────────

async function getStoryById(storyId: string): Promise<Story> {
  const { rows } = await db.query<StoryRow>(
    `SELECT
       s.id,
       s.student_name,
       s.student_avatar_url,
       s.course_name,
       s.pain_point,
       s.transformation,
       s.icp_tags,
       s.current_status,
       s.created_at,
       s.ops_student_ref,
       p.id            AS collected_by_id,
       p.display_name  AS collected_by_display_name,
       p.avatar_url    AS collected_by_avatar_url
     FROM stories s
     JOIN persons p ON p.id = s.collected_by_person_id
     WHERE s.id = $1
       AND s.deleted_at IS NULL`,
    [storyId]
  );

  const row = rows[0];
  if (!row) {
    throw new NotFoundError("Story", storyId);
  }

  const deploymentsMap = await fetchDeploymentsForStories([storyId]);
  return mapStoryRow(row, deploymentsMap.get(storyId) ?? []);
}

// ── performStoryAction ─────────────────────────────────────────────────────────

/**
 * Execute an approve or deploy action on a story.
 *
 * - approve: status must be 'pending_review' → 'approved'. Requires co_leader or marketing_leader.
 * - deploy:  status must be 'approved' → 'deployed'. Any authenticated user.
 *            Inserts a story_deployment row. Throws ConflictError on duplicate.
 */
export async function performStoryAction(
  storyId: string,
  actorId: string,
  roles: string[],
  action: StoryActionInput
): Promise<Story> {
  // Fetch current story state.
  const { rows: storyRows } = await db.query<{
    id: string;
    current_status: string;
    student_name: string;
    course_name: string;
  }>(
    `SELECT id, current_status, student_name, course_name
     FROM stories
     WHERE id = $1
       AND deleted_at IS NULL`,
    [storyId]
  );

  const story = storyRows[0];
  if (!story) {
    throw new NotFoundError("Story", storyId);
  }

  if (action.action_type === "approve") {
    // Role guard: co_leader or marketing_leader only.
    const hasApproveRole =
      roles.includes("co_leader") || roles.includes("marketing_leader");
    if (!hasApproveRole) {
      throw new BadRequestError(
        "FORBIDDEN: Only co_leader or marketing_leader can approve stories."
      );
    }

    // State guard.
    if (story.current_status !== "pending_review") {
      throw new BadRequestError(
        `Story cannot be approved from status "${story.current_status}". Expected "pending_review".`
      );
    }

    // Transition to approved.
    await db.query(
      `UPDATE stories
       SET current_status = 'approved',
           approved_by_person_id = $1,
           approved_at = NOW()
       WHERE id = $2`,
      [actorId, storyId]
    );

    // Notify the collector.
    const { rows: collectorRows } = await db.query<{ collected_by_person_id: string }>(
      `SELECT collected_by_person_id FROM stories WHERE id = $1`,
      [storyId]
    );
    const collectorId = collectorRows[0]?.collected_by_person_id;
    if (collectorId) {
      await createNotification(
        collectorId,
        "story_approved",
        "info",
        "Your Story Has Been Approved",
        `The story for "${story.student_name}" in "${story.course_name}" has been approved and is ready to deploy.`,
        "story",
        storyId
      );
    }
  } else if (action.action_type === "deploy") {
    // State guard.
    if (story.current_status !== "approved") {
      throw new BadRequestError(
        `Story cannot be deployed from status "${story.current_status}". Expected "approved".`
      );
    }

    // Insert deployment record; UNIQUE constraint on (story_id, campaign_id).
    try {
      await db.query(
        `INSERT INTO story_deployments (story_id, campaign_id, post_id, deployed_by_person_id, deployed_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [storyId, action.campaign_id, action.post_id ?? null, actorId]
      );
    } catch (err: unknown) {
      // PostgreSQL unique violation error code: 23505
      if (
        err instanceof Error &&
        "code" in err &&
        (err as { code: string }).code === "23505"
      ) {
        throw new ConflictError("STORY_ALREADY_DEPLOYED");
      }
      throw err;
    }

    // Transition to deployed.
    await db.query(
      `UPDATE stories
       SET current_status = 'deployed'
       WHERE id = $1
         AND current_status = 'approved'`,
      [storyId]
    );
  }

  return getStoryById(storyId);
}
