/**
 * Referral module controllers.
 *
 * handleGetAmbassadors   — GET /referral/ambassadors
 * handleGetReferralLeads — GET /referral/leads
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import { BadRequestError } from "../../shared/middleware/error.handler.js";
import { getAmbassadors, getReferralLeads } from "./referral.service.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

function jsonOk(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// ── handleGetAmbassadors ───────────────────────────────────────────────────────

/**
 * GET /api/v1/marketing/referral/ambassadors
 *
 * Query params:
 *   limit       — max results (default: 50, max: 200)
 *   active_only — 'true' | 'false' (default: false)
 */
export async function handleGetAmbassadors(ctx: RequestContext): Promise<Response> {
  const params = ctx.url.searchParams;

  const rawLimit = params.get("limit");
  let limit = parsePositiveInt(rawLimit, 50);
  if (limit > 200) limit = 200;

  const activeOnly = params.get("active_only") === "true";

  const result = await getAmbassadors(limit, activeOnly);

  return jsonOk({ ...result, request_id: ctx.request_id });
}

// ── handleGetReferralLeads ─────────────────────────────────────────────────────

/**
 * GET /api/v1/marketing/referral/leads
 *
 * Query params:
 *   ambassador_id — optional UUID to filter leads by specific ambassador
 *   page          — 1-based page number (default: 1)
 *   per_page      — results per page (default: 20, max: 100)
 */
export async function handleGetReferralLeads(ctx: RequestContext): Promise<Response> {
  const params = ctx.url.searchParams;

  const ambassadorId = params.get("ambassador_id") ?? undefined;

  // Validate ambassador_id is a plausible UUID if provided.
  if (
    ambassadorId !== undefined &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      ambassadorId
    )
  ) {
    throw new BadRequestError("ambassador_id must be a valid UUID.");
  }

  const page = parsePositiveInt(params.get("page"), 1);
  let perPage = parsePositiveInt(params.get("per_page"), 20);
  if (perPage > 100) perPage = 100;

  const result = await getReferralLeads(ambassadorId, page, perPage);

  return jsonOk({ ...result, request_id: ctx.request_id });
}
