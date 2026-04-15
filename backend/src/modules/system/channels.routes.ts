/**
 * Channels system route.
 *
 * Route:
 *   GET /api/v1/marketing/channels
 *
 * Returns all active channels (or all channels when active_only=false).
 * Requires authentication (Bearer JWT) but caches aggressively — 1 hour.
 *
 * Channels are a lookup/reference table that rarely change.
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import { db } from "../../shared/db/client.js";

const CHANNELS_PATH = "/api/v1/marketing/channels";

interface ChannelRow {
  id: string;
  code: string;
  label: string;
  color_hex: string;
  is_active: boolean;
  sort_order: number;
}

function json(body: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

// ── Handler ───────────────────────────────────────────────────────────────────

async function handleGetChannels(ctx: RequestContext): Promise<Response> {
  const activeOnly = ctx.url.searchParams.get("active_only") !== "false";

  const params: unknown[] = [];
  let whereClause = "";

  if (activeOnly) {
    whereClause = "WHERE is_active = true";
  }

  const { rows } = await db.query<ChannelRow>(
    `SELECT id, code, label, color_hex, is_active, sort_order
     FROM channels
     ${whereClause}
     ORDER BY sort_order ASC, label ASC`,
    params.length > 0 ? params : undefined
  );

  return json(
    {
      data: rows,
      meta: {
        total: rows.length,
        active_only: activeOnly,
      },
      request_id: ctx.request_id,
    },
    200,
    {
      // Cache for 1 hour — channels change rarely
      "Cache-Control": "private, max-age=3600",
    }
  );
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

/**
 * Channels route dispatcher.
 *
 * @returns Response if matched, null to fall through to the main router.
 */
export async function channelsRoutes(
  req: Request,
  ctx: RequestContext
): Promise<Response | null> {
  const { method } = req;
  const { pathname } = ctx.url;

  if (method === "GET" && pathname === CHANNELS_PATH) {
    return handleGetChannels(ctx);
  }

  return null;
}
