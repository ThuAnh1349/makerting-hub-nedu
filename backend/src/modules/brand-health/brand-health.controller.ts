/**
 * Brand Health module controllers.
 *
 * handleGetBrandHealth   — GET  /brand-health         (co_leader | marketing_leader)
 * handleUpsertBrandHealth — POST /brand-health         (marketing_leader only)
 * handleActivateCrisis   — POST /brand-health/crisis   (marketing_leader only)
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import { BadRequestError } from "../../shared/middleware/error.handler.js";
import {
  BrandHealthQuerySchema,
  UpsertBrandHealthSchema,
  ActivateCrisisSchema,
} from "./brand-health.schema.js";
import {
  getBrandHealth,
  upsertBrandHealth,
  activateCrisis,
} from "./brand-health.service.js";

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

// ── handleGetBrandHealth ──────────────────────────────────────────────────────

/**
 * GET /api/v1/marketing/brand-health
 *
 * Query params: weeks (default 4, max 52)
 * Role required: co_leader or marketing_leader
 */
export async function handleGetBrandHealth(ctx: RequestContext): Promise<Response> {
  const user = ctx.user!;

  if (!hasRole(user.roles, "co_leader", "marketing_leader")) {
    return forbiddenResponse(ctx.request_id);
  }

  const rawQuery = Object.fromEntries(ctx.url.searchParams.entries());
  const parsed = BrandHealthQuerySchema.safeParse(rawQuery);

  if (!parsed.success) {
    throw parsed.error;
  }

  const entries = await getBrandHealth(parsed.data.weeks);

  return jsonOk({ data: entries, request_id: ctx.request_id });
}

// ── handleUpsertBrandHealth ───────────────────────────────────────────────────

/**
 * POST /api/v1/marketing/brand-health
 *
 * Body: UpsertBrandHealthSchema
 * Role required: marketing_leader
 */
export async function handleUpsertBrandHealth(ctx: RequestContext): Promise<Response> {
  const user = ctx.user!;

  if (!hasRole(user.roles, "marketing_leader")) {
    return forbiddenResponse(ctx.request_id);
  }

  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    throw new BadRequestError("Request body must be valid JSON.");
  }

  const parsed = UpsertBrandHealthSchema.safeParse(body);
  if (!parsed.success) {
    throw parsed.error;
  }

  const entry = await upsertBrandHealth(parsed.data, user.id);

  return jsonOk({ data: entry, request_id: ctx.request_id });
}

// ── handleActivateCrisis ──────────────────────────────────────────────────────

/**
 * POST /api/v1/marketing/brand-health/crisis
 *
 * Body: ActivateCrisisSchema
 * Role required: marketing_leader
 */
export async function handleActivateCrisis(ctx: RequestContext): Promise<Response> {
  const user = ctx.user!;

  if (!hasRole(user.roles, "marketing_leader")) {
    return forbiddenResponse(ctx.request_id);
  }

  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    throw new BadRequestError("Request body must be valid JSON.");
  }

  const parsed = ActivateCrisisSchema.safeParse(body);
  if (!parsed.success) {
    throw parsed.error;
  }

  const crisis = await activateCrisis(parsed.data, user.id);

  return jsonOk({ data: crisis, request_id: ctx.request_id }, 201);
}
