/**
 * Post repository — all database access for the post module.
 *
 * RLS policy implemented in application layer:
 *   - staff: can only see/modify their own posts (author_id = userId)
 *   - co_leader, marketing_leader: see all posts
 *
 * All queries use parameterised placeholders to prevent SQL injection.
 */

import { db } from "../../shared/db/client.js";
import type { Post, PostFilters, PostMedia, PostApprovalEvent, PostStatus } from "./post.types.js";

// ── Row shapes ────────────────────────────────────────────────────────────────

interface PostRow {
  id: string;
  caption: string;
  reference_links: unknown;
  current_status: string;
  scheduled_at: string | null;
  published_at: string | null;
  author_id: string;
  author_display_name: string;
  author_avatar_url: string | null;
  campaign_id: string | null;
  campaign_title: string | null;
  latest_approval_note: string | null;
  created_at: string;
}

interface ChannelRow {
  post_id: string;
  code: string;
  label: string;
  color_hex: string;
}

interface MediaRow {
  id: string;
  post_id: string;
  media_type: string;
  url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  sort_order: number;
}

interface ApprovalRow {
  post_id: string;
  event_type: string;
  actor_name: string;
  notes: string | null;
  created_at: string;
}

// ── Mapping helpers ───────────────────────────────────────────────────────────

function mapApprovalRow(row: ApprovalRow): PostApprovalEvent {
  return {
    event_type: row.event_type as PostApprovalEvent["event_type"],
    actor_name: row.actor_name,
    notes: row.notes,
    created_at: new Date(row.created_at).toISOString(),
  };
}

function assemblePost(
  row: PostRow,
  channels: ChannelRow[],
  media: MediaRow[],
  approvals?: ApprovalRow[]
): Post {
  const postChannels = channels
    .filter((c) => c.post_id === row.id)
    .map((c) => ({ code: c.code, label: c.label, color_hex: c.color_hex }));

  const postMedia: PostMedia[] = media
    .filter((m) => m.post_id === row.id)
    .map((m) => ({
      id: m.id,
      media_type: m.media_type as "image" | "video",
      url: m.url,
      thumbnail_url: m.thumbnail_url,
      duration_seconds: m.duration_seconds,
      sort_order: m.sort_order,
    }));

  const post: Post = {
    id: row.id,
    caption: row.caption,
    reference_links: Array.isArray(row.reference_links)
      ? (row.reference_links as Array<{ url: string; label: string }>)
      : [],
    current_status: row.current_status as PostStatus,
    scheduled_at: row.scheduled_at
      ? new Date(row.scheduled_at).toISOString()
      : null,
    published_at: row.published_at
      ? new Date(row.published_at).toISOString()
      : null,
    author: {
      id: row.author_id,
      display_name: row.author_display_name,
      avatar_url: row.author_avatar_url,
    },
    channels: postChannels,
    campaign_id: row.campaign_id,
    campaign_title: row.campaign_title,
    media: postMedia,
    latest_approval_note: row.latest_approval_note,
    created_at: new Date(row.created_at).toISOString(),
  };

  if (approvals !== undefined) {
    post.approval_history = approvals.map(mapApprovalRow);
  }

  return post;
}

// ── RLS helper — builds author filter clause ──────────────────────────────────

function rlsClause(roles: string[], paramIndex: number): { sql: string; restricted: boolean } {
  const managementRoles = ["co_leader", "marketing_leader", "admin", "super_admin"];
  const isManager = roles.some((r) => managementRoles.includes(r));
  if (isManager) {
    return { sql: "", restricted: false };
  }
  return { sql: `AND p.author_id = $${paramIndex}`, restricted: true };
}

// ── findPosts ─────────────────────────────────────────────────────────────────

export async function findPosts(
  userId: string,
  roles: string[],
  filters: PostFilters
): Promise<{ rows: Post[]; total: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(100, Math.max(1, filters.per_page ?? 20));
  const offset = (page - 1) * perPage;

  const params: unknown[] = [];
  const conditions: string[] = ["p.deleted_at IS NULL"];

  // RLS
  const { sql: rlsSql, restricted } = rlsClause(roles, params.length + 1);
  if (restricted) {
    params.push(userId);
    conditions.push(rlsSql.replace("AND ", ""));
  }

  // Status filter
  if (filters.status && filters.status.length > 0) {
    params.push(filters.status);
    conditions.push(`p.current_status = ANY($${params.length})`);
  }

  // Campaign filter
  if (filters.campaign_id) {
    params.push(filters.campaign_id);
    conditions.push(`p.campaign_id = $${params.length}`);
  }

  // Channel filter
  if (filters.channel_code) {
    params.push(filters.channel_code);
    conditions.push(
      `EXISTS (
         SELECT 1 FROM post_channels pc2
         JOIN channels ch2 ON ch2.id = pc2.channel_id
         WHERE pc2.post_id = p.id AND ch2.code = $${params.length}
       )`
    );
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  // Count query
  const countSql = `
    SELECT COUNT(*) AS count
    FROM posts p
    ${whereClause}
  `;

  // Data query
  params.push(perPage, offset);
  const dataSql = `
    SELECT
      p.id,
      p.caption,
      p.reference_links,
      p.current_status,
      p.scheduled_at,
      p.published_at,
      p.author_id,
      per.display_name AS author_display_name,
      per.avatar_url AS author_avatar_url,
      p.campaign_id,
      camp.title AS campaign_title,
      p.latest_approval_note,
      p.created_at
    FROM posts p
    JOIN persons per ON per.id = p.author_id
    LEFT JOIN campaigns camp ON camp.id = p.campaign_id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const countParams = params.slice(0, params.length - 2);

  const [countResult, dataResult] = await Promise.all([
    db.query<{ count: string }>(countSql, countParams),
    db.query<PostRow>(dataSql, params),
  ]);

  const total = parseInt(countResult.rows[0]?.count ?? "0", 10);

  if (dataResult.rows.length === 0) {
    return { rows: [], total };
  }

  const postIds = dataResult.rows.map((r) => r.id);

  // Batch fetch channels and media for all posts
  const [channelResult, mediaResult] = await Promise.all([
    db.query<ChannelRow>(
      `SELECT pc.post_id, ch.code, ch.label, ch.color_hex
       FROM post_channels pc
       JOIN channels ch ON ch.id = pc.channel_id
       WHERE pc.post_id = ANY($1)`,
      [postIds]
    ),
    db.query<MediaRow>(
      `SELECT id, post_id, media_type, url, thumbnail_url, duration_seconds, sort_order
       FROM post_media
       WHERE post_id = ANY($1)
       ORDER BY sort_order ASC`,
      [postIds]
    ),
  ]);

  const posts = dataResult.rows.map((row) =>
    assemblePost(row, channelResult.rows, mediaResult.rows)
  );

  return { rows: posts, total };
}

// ── findPostById ──────────────────────────────────────────────────────────────

export async function findPostById(
  postId: string,
  userId: string,
  roles: string[]
): Promise<Post | null> {
  const managementRoles = ["co_leader", "marketing_leader", "admin", "super_admin"];
  const isManager = roles.some((r) => managementRoles.includes(r));

  const params: unknown[] = [postId];
  let authorFilter = "";
  if (!isManager) {
    params.push(userId);
    authorFilter = `AND p.author_id = $2`;
  }

  const { rows: postRows } = await db.query<PostRow>(
    `SELECT
       p.id,
       p.caption,
       p.reference_links,
       p.current_status,
       p.scheduled_at,
       p.published_at,
       p.author_id,
       per.display_name AS author_display_name,
       per.avatar_url AS author_avatar_url,
       p.campaign_id,
       camp.title AS campaign_title,
       p.latest_approval_note,
       p.created_at
     FROM posts p
     JOIN persons per ON per.id = p.author_id
     LEFT JOIN campaigns camp ON camp.id = p.campaign_id
     WHERE p.id = $1
       AND p.deleted_at IS NULL
       ${authorFilter}
     LIMIT 1`,
    params
  );

  if (postRows.length === 0) return null;

  const [channelResult, mediaResult, approvalResult] = await Promise.all([
    db.query<ChannelRow>(
      `SELECT pc.post_id, ch.code, ch.label, ch.color_hex
       FROM post_channels pc
       JOIN channels ch ON ch.id = pc.channel_id
       WHERE pc.post_id = $1`,
      [postId]
    ),
    db.query<MediaRow>(
      `SELECT id, post_id, media_type, url, thumbnail_url, duration_seconds, sort_order
       FROM post_media
       WHERE post_id = $1
       ORDER BY sort_order ASC`,
      [postId]
    ),
    db.query<ApprovalRow>(
      `SELECT
         pa.post_id,
         pa.decision AS event_type,
         per2.display_name AS actor_name,
         pa.comment AS notes,
         pa.created_at
       FROM post_approvals pa
       JOIN persons per2 ON per2.id = pa.actor_person_id
       WHERE pa.post_id = $1
       ORDER BY pa.created_at ASC`,
      [postId]
    ),
  ]);

  return assemblePost(postRows[0]!, channelResult.rows, mediaResult.rows, approvalResult.rows);
}

// ── createPost ────────────────────────────────────────────────────────────────

export async function createPost(
  authorId: string,
  data: {
    caption: string;
    channel_codes: string[];
    reference_links: Array<{ url: string; label: string }>;
    campaign_id?: string;
    scheduled_at?: string;
  }
): Promise<Post> {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");

    // 1. Insert the post
    const { rows: postRows } = await client.query<{ id: string }>(
      `INSERT INTO posts (
         author_id, caption, reference_links, current_status,
         campaign_id, scheduled_at, created_at, updated_at
       )
       VALUES ($1, $2, $3, 'draft', $4, $5, NOW(), NOW())
       RETURNING id`,
      [
        authorId,
        data.caption,
        JSON.stringify(data.reference_links),
        data.campaign_id ?? null,
        data.scheduled_at ?? null,
      ]
    );

    const postId = postRows[0]!.id;

    // 2. Resolve channel IDs from codes
    const { rows: channelRows } = await client.query<{ id: string; code: string }>(
      `SELECT id, code FROM channels WHERE code = ANY($1) AND is_active = true`,
      [data.channel_codes]
    );

    // 3. Insert post_channels rows
    for (const ch of channelRows) {
      await client.query(
        `INSERT INTO post_channels (post_id, channel_id) VALUES ($1, $2)`,
        [postId, ch.id]
      );
    }

    await client.query("COMMIT");

    // Fetch and return the fully assembled post
    const post = await findPostById(postId, authorId, ["co_leader"]); // use elevated role to bypass RLS for immediate read-back
    if (!post) throw new Error(`Post ${postId} not found after insert`);
    return post;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ── updatePost ────────────────────────────────────────────────────────────────

export async function updatePost(
  postId: string,
  data: {
    caption?: string;
    channel_codes?: string[];
    reference_links?: Array<{ url: string; label: string }>;
    scheduled_at?: string | null;
  }
): Promise<void> {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");

    // Build SET clause dynamically for only provided fields
    const setClauses: string[] = ["updated_at = NOW()"];
    const params: unknown[] = [];

    if (data.caption !== undefined) {
      params.push(data.caption);
      setClauses.push(`caption = $${params.length}`);
    }

    if (data.reference_links !== undefined) {
      params.push(JSON.stringify(data.reference_links));
      setClauses.push(`reference_links = $${params.length}`);
    }

    if ("scheduled_at" in data) {
      params.push(data.scheduled_at ?? null);
      setClauses.push(`scheduled_at = $${params.length}`);
    }

    if (setClauses.length > 1) {
      params.push(postId);
      await client.query(
        `UPDATE posts SET ${setClauses.join(", ")} WHERE id = $${params.length}`,
        params
      );
    }

    // Replace channels if provided
    if (data.channel_codes && data.channel_codes.length > 0) {
      await client.query(`DELETE FROM post_channels WHERE post_id = $1`, [postId]);

      const { rows: channelRows } = await client.query<{ id: string }>(
        `SELECT id FROM channels WHERE code = ANY($1) AND is_active = true`,
        [data.channel_codes]
      );

      for (const ch of channelRows) {
        await client.query(
          `INSERT INTO post_channels (post_id, channel_id) VALUES ($1, $2)`,
          [postId, ch.id]
        );
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ── updatePostStatus ──────────────────────────────────────────────────────────

export async function updatePostStatus(
  postId: string,
  status: PostStatus,
  extra?: {
    latest_approval_note?: string | null;
    scheduled_at?: string | null;
    published_at?: string | null;
  }
): Promise<void> {
  const setClauses: string[] = ["current_status = $1", "updated_at = NOW()"];
  const params: unknown[] = [status];

  if (extra?.latest_approval_note !== undefined) {
    params.push(extra.latest_approval_note);
    setClauses.push(`latest_approval_note = $${params.length}`);
  }

  if (extra?.scheduled_at !== undefined) {
    params.push(extra.scheduled_at);
    setClauses.push(`scheduled_at = $${params.length}`);
  }

  if (extra?.published_at !== undefined) {
    params.push(extra.published_at);
    setClauses.push(`published_at = $${params.length}`);
  }

  params.push(postId);
  await db.query(
    `UPDATE posts SET ${setClauses.join(", ")} WHERE id = $${params.length}`,
    params
  );
}

// ── insertMedia ───────────────────────────────────────────────────────────────

export async function insertMedia(
  postId: string,
  mediaData: {
    media_type: "image" | "video";
    url: string;
    thumbnail_url: string | null;
    duration_seconds: number | null;
    sort_order: number;
  }
): Promise<PostMedia> {
  const { rows } = await db.query<{
    id: string;
    media_type: string;
    url: string;
    thumbnail_url: string | null;
    duration_seconds: number | null;
    sort_order: number;
  }>(
    `INSERT INTO post_media (post_id, media_type, url, thumbnail_url, duration_seconds, sort_order, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING id, media_type, url, thumbnail_url, duration_seconds, sort_order`,
    [
      postId,
      mediaData.media_type,
      mediaData.url,
      mediaData.thumbnail_url,
      mediaData.duration_seconds,
      mediaData.sort_order,
    ]
  );

  const row = rows[0]!;
  return {
    id: row.id,
    media_type: row.media_type as "image" | "video",
    url: row.url,
    thumbnail_url: row.thumbnail_url,
    duration_seconds: row.duration_seconds,
    sort_order: row.sort_order,
  };
}

// ── getPostAuthorId ───────────────────────────────────────────────────────────

export async function getPostAuthorId(postId: string): Promise<string | null> {
  const { rows } = await db.query<{ author_id: string }>(
    `SELECT author_id FROM posts WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
    [postId]
  );
  return rows[0]?.author_id ?? null;
}

// ── getPostCurrentStatus ──────────────────────────────────────────────────────

export async function getPostCurrentStatus(postId: string): Promise<PostStatus | null> {
  const { rows } = await db.query<{ current_status: string }>(
    `SELECT current_status FROM posts WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
    [postId]
  );
  return (rows[0]?.current_status as PostStatus) ?? null;
}

// ── getPostMediaCount ─────────────────────────────────────────────────────────

export async function getPostMediaCount(postId: string): Promise<number> {
  const { rows } = await db.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM post_media WHERE post_id = $1`,
    [postId]
  );
  return parseInt(rows[0]?.count ?? "0", 10);
}

// ── getPersonsByRole ──────────────────────────────────────────────────────────

export async function getPersonsByRole(roleName: string): Promise<Array<{ id: string }>> {
  const { rows } = await db.query<{ id: string }>(
    `SELECT DISTINCT person_id AS id
     FROM person_roles
     WHERE role_name = $1 AND valid_until IS NULL`,
    [roleName]
  );
  return rows;
}
