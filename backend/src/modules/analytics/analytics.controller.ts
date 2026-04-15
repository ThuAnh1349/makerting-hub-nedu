/**
 * Analytics module controllers.
 *
 * handleGetSummary  — GET  /analytics/summary    (marketing_leader only)
 * handleUpsertEntry — POST /analytics/entries    (any marketing role)
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import {
  BadRequestError,
  AppError,
} from "../../shared/middleware/error.handler.js";
import { AnalyticsQuerySchema, UpsertAnalyticsSchema } from "./analytics.schema.js";
import { getSummary, upsertEntry } from "./analytics.service.js";

const MARKETING_ROLES = new Set([
  "marketing_leader",
  "co_leader",
  "staff",
  "design_member",
  "video_editor",
]);

function hasRole(roles: string[], ...required: string[]): boolean {
  return required.some((r) => roles.includes(r));
}

function forbiddenResponse(request_id: string): Response {
  return new Response(
    JSON.stringify({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
      request_id,
    }),
    { status: 403, headers: { "Content-Type": "application/json" } }
  );
}

function jsonOk(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ── handleGetSummary ──────────────────────────────────────────────────────────

/**
 * GET /api/v1/marketing/analytics/summary
 *
 * Query params: period_type, period_start
 * Role required: marketing_leader
 */
export async function handleGetSummary(ctx: RequestContext): Promise<Response> {
  const user = ctx.user!;

  if (!hasRole(user.roles, "marketing_leader")) {
    return forbiddenResponse(ctx.request_id);
  }

  const rawQuery = Object.fromEntries(ctx.url.searchParams.entries());
  const parsed = AnalyticsQuerySchema.safeParse(rawQuery);

  if (!parsed.success) {
    throw parsed.error;
  }

  const { period_type, period_start } = parsed.data;
  const data = await getSummary(period_type, period_start);

  return jsonOk({ data, request_id: ctx.request_id });
}

// ── handleUpsertEntry ──────────────────────────────────────────────────────────

/**
 * POST /api/v1/marketing/analytics/entries
 *
 * Body: UpsertAnalyticsSchema
 * Role required: any marketing role
 */
export async function handleUpsertEntry(ctx: RequestContext): Promise<Response> {
  const user = ctx.user!;

  const hasAnyMarketingRole = user.roles.some((r) => MARKETING_ROLES.has(r));
  if (!hasAnyMarketingRole) {
    return forbiddenResponse(ctx.request_id);
  }

  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    throw new BadRequestError("Request body must be valid JSON.");
  }

  const parsed = UpsertAnalyticsSchema.safeParse(body);
  if (!parsed.success) {
    throw parsed.error;
  }

  const entry = await upsertEntry(parsed.data);

  return jsonOk({ data: entry, request_id: ctx.request_id }, 200);
}
