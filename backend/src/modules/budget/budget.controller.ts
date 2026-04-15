/**
 * Budget module controllers.
 *
 * handleGetBudgetSummary  — GET  /budget/summary      (marketing_leader only)
 * handleUpsertAllocation  — POST /budget/allocations  (marketing_leader only)
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import { BadRequestError } from "../../shared/middleware/error.handler.js";
import { BudgetQuerySchema, UpsertAllocationSchema } from "./budget.schema.js";
import { getBudgetSummary, upsertAllocation } from "./budget.service.js";

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

// ── handleGetBudgetSummary ─────────────────────────────────────────────────────

/**
 * GET /api/v1/marketing/budget/summary
 *
 * Query params: month_start (optional, defaults to first day of current month)
 * Role required: marketing_leader
 */
export async function handleGetBudgetSummary(ctx: RequestContext): Promise<Response> {
  const user = ctx.user!;

  if (!hasRole(user.roles, "marketing_leader")) {
    return forbiddenResponse(ctx.request_id);
  }

  const rawQuery = Object.fromEntries(ctx.url.searchParams.entries());
  const parsed = BudgetQuerySchema.safeParse(rawQuery);

  if (!parsed.success) {
    throw parsed.error;
  }

  const summary = await getBudgetSummary(parsed.data.month_start);

  return jsonOk({ data: summary, request_id: ctx.request_id });
}

// ── handleUpsertAllocation ─────────────────────────────────────────────────────

/**
 * POST /api/v1/marketing/budget/allocations
 *
 * Body: UpsertAllocationSchema
 * Role required: marketing_leader
 */
export async function handleUpsertAllocation(ctx: RequestContext): Promise<Response> {
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

  const parsed = UpsertAllocationSchema.safeParse(body);
  if (!parsed.success) {
    throw parsed.error;
  }

  const allocation = await upsertAllocation(parsed.data, user.id);

  return jsonOk({ data: allocation, request_id: ctx.request_id });
}
