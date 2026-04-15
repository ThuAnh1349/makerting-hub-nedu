/**
 * Today module route dispatcher.
 *
 * Matches:
 *   GET /api/v1/marketing/today/summary
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import { handleGetTodaySummary } from "./today.controller.js";

export async function todayRoutes(
  req: Request,
  ctx: RequestContext
): Promise<Response | null> {
  const { method } = req;
  const { pathname } = ctx.url;

  if (method === "GET" && pathname === "/api/v1/marketing/today/summary") {
    return handleGetTodaySummary(ctx);
  }

  // No match — let the main router return 404.
  return null;
}
