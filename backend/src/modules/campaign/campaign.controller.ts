/**
 * Campaign module controllers.
 *
 * handleListCampaigns   — GET   /campaigns
 * handleCreateCampaign  — POST  /campaigns
 * handleGetCampaign     — GET   /campaigns/:id
 * handleUpdatePhase     — PATCH /campaigns/:id/phase
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import { BadRequestError, NotFoundError } from "../../shared/middleware/error.handler.js";
import {
  CreateCampaignSchema,
  UpdatePhaseSchema,
  CampaignListQuerySchema,
} from "./campaign.schema.js";
import {
  listCampaigns,
  getCampaignById,
  createCampaign,
  updatePhase,
} from "./campaign.service.js";
import type { CampaignPhase } from "./campaign.types.js";

const MARKETING_ROLES = new Set([
  "marketing_leader",
  "co_leader",
  "staff",
  "design_member",
  "video_editor",
]);

function hasAnyMarketingRole(roles: string[]): boolean {
  return roles.some((r) => MARKETING_ROLES.has(r));
}

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

// ── handleListCampaigns ───────────────────────────────────────────────────────

export async function handleListCampaigns(ctx: RequestContext): Promise<Response> {
  const user = ctx.user!;

  if (!hasAnyMarketingRole(user.roles)) {
    return forbiddenResponse(ctx.request_id);
  }

  const rawQuery = Object.fromEntries(ctx.url.searchParams.entries());
  const parsed = CampaignListQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    throw parsed.error;
  }

  const campaigns = await listCampaigns(parsed.data.phase as CampaignPhase | undefined);

  return jsonOk({ data: campaigns, request_id: ctx.request_id });
}

// ── handleCreateCampaign ──────────────────────────────────────────────────────

export async function handleCreateCampaign(ctx: RequestContext): Promise<Response> {
  const user = ctx.user!;

  // Only leaders and staff can create campaigns.
  if (!hasRole(user.roles, "marketing_leader", "co_leader", "staff")) {
    return forbiddenResponse(ctx.request_id);
  }

  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    throw new BadRequestError("Request body must be valid JSON.");
  }

  const parsed = CreateCampaignSchema.safeParse(body);
  if (!parsed.success) {
    throw parsed.error;
  }

  const campaign = await createCampaign(parsed.data, user.id);

  return jsonOk({ data: campaign, request_id: ctx.request_id }, 201);
}

// ── handleGetCampaign ─────────────────────────────────────────────────────────

export async function handleGetCampaign(ctx: RequestContext): Promise<Response> {
  const user = ctx.user!;

  if (!hasAnyMarketingRole(user.roles)) {
    return forbiddenResponse(ctx.request_id);
  }

  const id = ctx.params["id"];
  if (!id) {
    throw new NotFoundError("Campaign");
  }

  const campaign = await getCampaignById(id);

  return jsonOk({ data: campaign, request_id: ctx.request_id });
}

// ── handleUpdatePhase ─────────────────────────────────────────────────────────

export async function handleUpdatePhase(ctx: RequestContext): Promise<Response> {
  const user = ctx.user!;

  // Only leaders can advance campaign phase.
  if (!hasRole(user.roles, "marketing_leader", "co_leader")) {
    return forbiddenResponse(ctx.request_id);
  }

  const id = ctx.params["id"];
  if (!id) {
    throw new NotFoundError("Campaign");
  }

  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    throw new BadRequestError("Request body must be valid JSON.");
  }

  const parsed = UpdatePhaseSchema.safeParse(body);
  if (!parsed.success) {
    throw parsed.error;
  }

  const campaign = await updatePhase(id, parsed.data.new_phase, user.id, user.roles);

  return jsonOk({ data: campaign, request_id: ctx.request_id });
}
