/**
 * Analytics module route dispatcher.
 *
 * Matches:
 *   GET  /api/v1/marketing/analytics/summary
 *   POST /api/v1/marketing/analytics/entries
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import { handleGetSummary, handleUpsertEntry } from "./analytics.controller.js";

const BASE = "/api/v1/marketing/analytics";

/**
 * Analytics route dispatcher.
 *
 * @returns Response if matched, null if no route matched.
 */
export async function analyticsRoutes(
  req: Request,
  ctx: RequestContext
): Promise<Response | null> {
  const { method } = req;
  const { pathname } = ctx.url;

  // GET /api/v1/marketing/analytics/summary
  if (method === "GET" && pathname === `${BASE}/summary`) {
    return handleGetSummary(ctx);
  }

  // POST /api/v1/marketing/analytics/entries
  if (method === "POST" && pathname === `${BASE}/entries`) {
    return handleUpsertEntry(ctx);
  }

  return null;
}
