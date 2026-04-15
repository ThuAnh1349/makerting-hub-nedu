/**
 * Brand Health module route dispatcher.
 *
 * Matches:
 *   GET  /api/v1/marketing/brand-health
 *   POST /api/v1/marketing/brand-health
 *   POST /api/v1/marketing/brand-health/crisis
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import {
  handleGetBrandHealth,
  handleUpsertBrandHealth,
  handleActivateCrisis,
} from "./brand-health.controller.js";

const BASE = "/api/v1/marketing/brand-health";

/**
 * Brand Health route dispatcher.
 *
 * @returns Response if matched, null if no route matched.
 */
export async function brandHealthRoutes(
  req: Request,
  ctx: RequestContext
): Promise<Response | null> {
  const { method } = req;
  const { pathname } = ctx.url;

  // POST /api/v1/marketing/brand-health/crisis — must come before base POST match
  if (method === "POST" && pathname === `${BASE}/crisis`) {
    return handleActivateCrisis(ctx);
  }

  // GET /api/v1/marketing/brand-health
  if (method === "GET" && pathname === BASE) {
    return handleGetBrandHealth(ctx);
  }

  // POST /api/v1/marketing/brand-health
  if (method === "POST" && pathname === BASE) {
    return handleUpsertBrandHealth(ctx);
  }

  return null;
}
