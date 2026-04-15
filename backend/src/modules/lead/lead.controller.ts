/**
 * Lead module HTTP handlers.
 *
 * Routes:
 *   GET  /api/v1/marketing/leads              — list with pagination & filters
 *   GET  /api/v1/marketing/leads/:id          — detail + action history
 *   POST /api/v1/marketing/leads/:id/actions  — classify / push / reclassify
 *   POST /api/v1/marketing/leads/sync         — webhook (no auth, HMAC only)
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import { BadRequestError } from "../../shared/middleware/error.handler.js";
import { LeadActionSchema, LeadListQuerySchema, LeadSyncWebhookSchema } from "./lead.schema.js";
import {
  classifyLead,
  listLeads,
  getLeadDetail,
  syncLeadFromWebhook,
} from "./lead.service.js";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ── GET /api/v1/marketing/leads ───────────────────────────────────────────────

export async function handleListLeads(ctx: RequestContext): Promise<Response> {
  const user = ctx.user!;

  // Parse query parameters via Zod.
  const rawParams = Object.fromEntries(ctx.url.searchParams.entries());
  const query = LeadListQuerySchema.parse(rawParams);

  const result = await listLeads(user.id, user.roles, {
    status: query.status,
    channel_code: query.channel_code,
    assigned_to: query.assigned_to,
    sla_overdue_only: query.sla_overdue_only,
    page: query.page,
    per_page: query.per_page,
  });

  return json({ ...result, request_id: ctx.request_id });
}

// ── GET /api/v1/marketing/leads/:id ──────────────────────────────────────────

export async function handleGetLead(ctx: RequestContext): Promise<Response> {
  const user = ctx.user!;
  const leadId = ctx.params["id"];
  if (!leadId) throw new BadRequestError("Missing lead id.");

  const lead = await getLeadDetail(leadId, user.id, user.roles);
  return json({ data: lead, request_id: ctx.request_id });
}

// ── POST /api/v1/marketing/leads/:id/actions ──────────────────────────────────

export async function handleLeadAction(ctx: RequestContext): Promise<Response> {
  const user = ctx.user!;
  const leadId = ctx.params["id"];
  if (!leadId) throw new BadRequestError("Missing lead id.");

  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    throw new BadRequestError("Request body must be valid JSON.");
  }

  const action = LeadActionSchema.parse(body);
  const updated = await classifyLead(leadId, user.id, user.roles, action);

  return json({ data: updated, request_id: ctx.request_id });
}

// ── POST /api/v1/marketing/leads/sync (webhook — no auth) ────────────────────

export async function handleLeadSync(
  ctx: RequestContext,
  rawBody: Uint8Array
): Promise<Response> {
  const signatureHeader =
    ctx.request.headers.get("X-Hub-Signature-256") ??
    ctx.request.headers.get("X-Webhook-Signature") ??
    "";

  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(rawBody));
  } catch {
    throw new BadRequestError("Request body must be valid JSON.");
  }

  const payload = LeadSyncWebhookSchema.parse(body);
  await syncLeadFromWebhook(payload, signatureHeader, rawBody);

  return json({ ok: true, request_id: ctx.request_id });
}
