/**
 * Today Summary controller.
 *
 * GET /api/v1/marketing/today/summary
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import { getTodaySummary } from "./today.service.js";

export async function handleGetTodaySummary(ctx: RequestContext): Promise<Response> {
  const user = ctx.user!; // guaranteed by authMiddleware

  const summary = await getTodaySummary(user.id, user.roles);

  return new Response(JSON.stringify({ data: summary, request_id: ctx.request_id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
