/**
 * Budget module route dispatcher.
 *
 * Matches:
 *   GET  /api/v1/marketing/budget/summary
 *   POST /api/v1/marketing/budget/allocations
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import { handleGetBudgetSummary, handleUpsertAllocation } from "./budget.controller.js";

const BASE = "/api/v1/marketing/budget";

/**
 * Budget route dispatcher.
 *
 * @returns Response if matched, null if no route matched.
 */
export async function budgetRoutes(
  req: Request,
  ctx: RequestContext
): Promise<Response | null> {
  const { method } = req;
  const { pathname } = ctx.url;

  // GET /api/v1/marketing/budget/summary
  if (method === "GET" && pathname === `${BASE}/summary`) {
    return handleGetBudgetSummary(ctx);
  }

  // POST /api/v1/marketing/budget/allocations
  if (method === "POST" && pathname === `${BASE}/allocations`) {
    return handleUpsertAllocation(ctx);
  }

  return null;
}
