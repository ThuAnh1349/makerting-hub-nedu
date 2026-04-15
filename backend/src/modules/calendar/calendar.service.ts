/**
 * Calendar service.
 *
 * Fetches posts that have a scheduled_at date within the requested
 * date range and have a status of 'approved', 'scheduled', or 'published'.
 *
 * Per ADR-API-04, the API returns a flat array — grouping by day is
 * performed client-side.
 */

import { db } from "../../shared/db/client.js";
import { BadRequestError } from "../../shared/middleware/error.handler.js";
import type { CalendarPost } from "./calendar.types.js";

const MAX_RANGE_DAYS = 90;
const CALENDAR_STATUSES = ["approved", "scheduled", "published"];

// ── Row shapes ─────────────────────────────────────────────────────────────────

interface CalendarPostRow {
  id: string;
  caption: string;
  current_status: string;
  scheduled_at: string;
  author_id: string;
  author_display_name: string;
  author_avatar_url: string | null;
  campaign_id: string | null;
  campaign_title: string | null;
}

interface CalendarChannelRow {
  post_id: string;
  code: string;
  label: string;
  color_hex: string;
}

// ── getCalendarPosts ──────────────────────────────────────────────────────────

/**
 * Return posts scheduled within [dateFrom, dateTo] (inclusive).
 *
 * @param dateFrom   ISO date string (YYYY-MM-DD or full datetime)
 * @param dateTo     ISO date string (YYYY-MM-DD or full datetime)
 * @param channelCode  Optional channel code filter
 */
export async function getCalendarPosts(
  dateFrom: string,
  dateTo: string,
  channelCode?: string
): Promise<CalendarPost[]> {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);

  if (isNaN(from.getTime())) {
    throw new BadRequestError(`Invalid date_from: "${dateFrom}"`);
  }
  if (isNaN(to.getTime())) {
    throw new BadRequestError(`Invalid date_to: "${dateTo}"`);
  }
  if (to < from) {
    throw new BadRequestError("date_to must be on or after date_from.");
  }

  const diffMs = to.getTime() - from.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays > MAX_RANGE_DAYS) {
    throw new BadRequestError(
      `Date range too large: ${Math.ceil(diffDays)} days. Maximum allowed is ${MAX_RANGE_DAYS} days.`
    );
  }

  const params: unknown[] = [CALENDAR_STATUSES, from.toISOString(), to.toISOString()];
  let channelFilter = "";

  if (channelCode) {
    params.push(channelCode);
    channelFilter = `
      AND EXISTS (
        SELECT 1 FROM post_channels pc2
        JOIN channels ch2 ON ch2.id = pc2.channel_id
        WHERE pc2.post_id = p.id AND ch2.code = $${params.length}
      )
    `;
  }

  const { rows: postRows } = await db.query<CalendarPostRow>(
    `SELECT
       p.id,
       p.caption,
       p.current_status,
       p.scheduled_at,
       p.author_id,
       per.display_name AS author_display_name,
       per.avatar_url   AS author_avatar_url,
       p.campaign_id,
       camp.title       AS campaign_title
     FROM posts p
     JOIN persons per ON per.id = p.author_id
     LEFT JOIN campaigns camp ON camp.id = p.campaign_id
     WHERE p.current_status = ANY($1)
       AND p.scheduled_at >= $2
       AND p.scheduled_at <= $3
       AND p.deleted_at IS NULL
       ${channelFilter}
     ORDER BY p.scheduled_at ASC`,
    params
  );

  if (postRows.length === 0) return [];

  const postIds = postRows.map((r) => r.id);

  const { rows: channelRows } = await db.query<CalendarChannelRow>(
    `SELECT pc.post_id, ch.code, ch.label, ch.color_hex
     FROM post_channels pc
     JOIN channels ch ON ch.id = pc.channel_id
     WHERE pc.post_id = ANY($1)`,
    [postIds]
  );

  // Build a map of postId → channels for O(1) lookup
  const channelMap = new Map<string, Array<{ code: string; label: string; color_hex: string }>>();
  for (const ch of channelRows) {
    const existing = channelMap.get(ch.post_id) ?? [];
    existing.push({ code: ch.code, label: ch.label, color_hex: ch.color_hex });
    channelMap.set(ch.post_id, existing);
  }

  return postRows.map((row): CalendarPost => ({
    id: row.id,
    caption: row.caption,
    current_status: row.current_status as CalendarPost["current_status"],
    scheduled_at: new Date(row.scheduled_at).toISOString(),
    channels: channelMap.get(row.id) ?? [],
    author: {
      id: row.author_id,
      display_name: row.author_display_name,
      avatar_url: row.author_avatar_url,
    },
    campaign_id: row.campaign_id,
    campaign_title: row.campaign_title,
  }));
}
