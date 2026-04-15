/**
 * Operational Docs system route.
 *
 * Route:
 *   GET /api/v1/marketing/docs
 *
 * Returns all operational docs ordered by sort_order with
 * completion meta computed server-side.
 *
 * Requires authentication (Bearer JWT).
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import { db } from "../../shared/db/client.js";

const DOCS_PATH = "/api/v1/marketing/docs";

interface OperationalDocRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  url: string | null;
  category: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ── Handler ───────────────────────────────────────────────────────────────────

async function handleGetDocs(ctx: RequestContext): Promise<Response> {
  const { rows } = await db.query<OperationalDocRow>(
    `SELECT
       id,
       title,
       description,
       status,
       url,
       category,
       sort_order,
       created_at,
       updated_at
     FROM operational_docs
     ORDER BY sort_order ASC, title ASC`
  );

  const totalCount = rows.length;
  const completedCount = rows.filter((r) => r.status === "completed").length;
  const completionPct =
    totalCount > 0
      ? Math.round((completedCount / totalCount) * 100)
      : 0;

  return json({
    data: rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      url: r.url,
      category: r.category,
      sort_order: r.sort_order,
      created_at: new Date(r.created_at).toISOString(),
      updated_at: new Date(r.updated_at).toISOString(),
    })),
    meta: {
      total_count: totalCount,
      completed_count: completedCount,
      completion_pct: completionPct,
    },
    request_id: ctx.request_id,
  });
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

/**
 * Docs route dispatcher.
 *
 * @returns Response if matched, null to fall through to the main router.
 */
export async function docsRoutes(
  req: Request,
  ctx: RequestContext
): Promise<Response | null> {
  const { method } = req;
  const { pathname } = ctx.url;

  if (method === "GET" && pathname === DOCS_PATH) {
    return handleGetDocs(ctx);
  }

  return null;
}
