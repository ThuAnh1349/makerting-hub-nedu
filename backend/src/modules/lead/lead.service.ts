/**
 * Lead service — business logic for the Lead / CRM module.
 *
 * State machine:
 *   new  ──classify──►  hot | warm | cold | archived
 *   hot  ──push──►      pushed
 *   returned ──reclassify──►  hot | warm | cold | archived
 *
 * Side effects (non-blocking):
 *   - Ops webhook call on push (retry 3x: 1s / 5s / 30s backoff)
 *   - Telegram alert on hot classification or push
 *   - In-app notification to relevant users
 */

import { createHmac } from "crypto";
import { env } from "../../shared/config/env.js";
import {
  AppError,
  ConflictError,
  NotFoundError,
  BadRequestError,
} from "../../shared/middleware/error.handler.js";
import { auditLeadAction } from "../../shared/utils/audit.js";
import { sendMessage } from "../../integrations/telegram/bot.client.js";
import {
  findLeadById,
  findLeads,
  getLeadCurrentStatus,
  updateLeadStatus,
  insertLead,
  insertLeadAction,
  findLeadByOpsId,
} from "./lead.repository.js";
import {
  createNotification,
} from "../notification/notification.service.js";
import type { Lead, LeadFilters, LeadListResult, LeadStatus, LeadActionType } from "./lead.types.js";
import type { LeadAction, LeadSyncWebhookPayload } from "./lead.schema.js";

// ── Constants ─────────────────────────────────────────────────────────────────

const OPS_PUSH_WEBHOOK_URL =
  process.env["OPS_PUSH_WEBHOOK_URL"] ?? "https://ops.nedu.vn/api/leads/receive";

const RETRY_DELAYS_MS = [1_000, 5_000, 30_000] as const;

// ── State machine ─────────────────────────────────────────────────────────────

/** Maps classification string → LeadStatus stored in DB. */
function classificationToStatus(
  classification: "hot" | "warm" | "cold" | "trash" | "archived"
): LeadStatus {
  if (classification === "trash") return "archived";
  return classification as LeadStatus;
}

/** Maps classification to the audit action type. */
function classificationToActionType(
  classification: "hot" | "warm" | "cold" | "trash" | "archived"
): LeadActionType {
  const map: Record<string, LeadActionType> = {
    hot: "classified_hot",
    warm: "classified_warm",
    cold: "classified_cold",
    trash: "classified_trash",
    archived: "archived",
  };
  return map[classification] ?? "reclassified";
}

// ── Ops webhook push (fire-and-forget with retry) ─────────────────────────────

async function pushLeadToOps(leadId: string): Promise<void> {
  const body = JSON.stringify({ lead_id: leadId, timestamp: new Date().toISOString() });

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length + 1; attempt++) {
    try {
      const res = await fetch(OPS_PUSH_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": env.OPS_WEBHOOK_SECRET,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });

      if (res.ok) {
        console.log(`[Lead] Pushed lead ${leadId} to ops webhook (attempt ${attempt + 1}).`);
        return;
      }

      console.warn(
        `[Lead] Ops webhook returned ${res.status} for lead ${leadId} (attempt ${attempt + 1}).`
      );
    } catch (err) {
      console.warn(
        `[Lead] Ops webhook call failed for lead ${leadId} (attempt ${attempt + 1}):`,
        err instanceof Error ? err.message : err
      );
    }

    // Wait before next retry (no wait after last attempt).
    const delay = RETRY_DELAYS_MS[attempt];
    if (delay !== undefined) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.error(
    `[Lead] All ${RETRY_DELAYS_MS.length + 1} ops webhook attempts failed for lead ${leadId}.`
  );
}

// ── classifyLead ──────────────────────────────────────────────────────────────

export async function classifyLead(
  leadId: string,
  userId: string,
  roles: string[],
  action: LeadAction
): Promise<Lead> {
  // Load current lead state (RLS-aware via repository).
  const current = await getLeadCurrentStatus(leadId);
  if (!current) {
    throw new NotFoundError("Lead", leadId);
  }

  // ── State machine validation ───────────────────────────────────────────────

  if (action.action_type === "classify") {
    if (current.current_status !== "new") {
      throw new ConflictError(
        `Cannot classify a lead that is not in 'new' status (current: ${current.current_status}).`,
        { code: "INVALID_STATUS_TRANSITION" }
      );
    }
  } else if (action.action_type === "push") {
    if (current.current_status === "pushed") {
      throw new ConflictError("This lead has already been pushed to a consultant.", {
        code: "LEAD_ALREADY_PUSHED",
      });
    }
    if (current.current_status !== "hot") {
      throw new ConflictError(
        `Only 'hot' leads can be pushed to a consultant (current: ${current.current_status}).`,
        { code: "INVALID_STATUS_TRANSITION" }
      );
    }
  } else if (action.action_type === "reclassify") {
    if (current.current_status !== "returned") {
      throw new ConflictError(
        `Only 'returned' leads can be reclassified (current: ${current.current_status}).`,
        { code: "INVALID_STATUS_TRANSITION" }
      );
    }
  }

  // ── Determine new status and action type ──────────────────────────────────

  let newStatus: LeadStatus;
  let auditActionType: LeadActionType;
  const previousStatus = current.current_status;

  if (action.action_type === "classify") {
    newStatus = classificationToStatus(action.classification);
    auditActionType = classificationToActionType(action.classification);
  } else if (action.action_type === "push") {
    newStatus = "pushed";
    auditActionType = "pushed_to_consultant";
  } else {
    // reclassify
    newStatus = classificationToStatus(action.classification);
    auditActionType = "reclassified";
  }

  // ── Persist status change ─────────────────────────────────────────────────

  await updateLeadStatus(leadId, newStatus);

  // ── Audit record (non-fatal) ──────────────────────────────────────────────

  await Promise.allSettled([
    auditLeadAction({
      lead_id: leadId,
      actor_person_id: userId,
      action: auditActionType,
      previous_status: previousStatus,
      new_status: newStatus,
      notes:
        "reason" in action && action.reason ? action.reason : null,
      metadata: { action },
    }),

    insertLeadAction({
      lead_id: leadId,
      actor_person_id: userId,
      action: auditActionType,
      previous_status: previousStatus,
      new_status: newStatus,
      notes: "reason" in action && action.reason ? action.reason : null,
      metadata: { action },
    }),
  ]);

  // ── Side effects (fire and forget) ───────────────────────────────────────

  // Push to ops webhook asynchronously (do not await — non-blocking).
  if (action.action_type === "push") {
    void pushLeadToOps(leadId);
  }

  // Telegram alert for hot classification or push.
  if (newStatus === "hot" || newStatus === "pushed") {
    const alertText =
      newStatus === "hot"
        ? `🔥 <b>HOT LEAD</b> — Lead ID: <code>${leadId}</code> has been classified as Hot by ${userId}.`
        : `📤 <b>LEAD PUSHED</b> — Lead ID: <code>${leadId}</code> has been pushed to a consultant by ${userId}.`;
    void sendMessage(undefined, alertText);
  }

  // In-app notification for the assigned staff member (if any).
  if (current.assigned_to && current.assigned_to !== userId) {
    void createNotification(
      current.assigned_to,
      "lead_new",
      "normal",
      "Lead status updated",
      `A lead assigned to you has been updated to '${newStatus}'.`,
      "lead",
      leadId
    );
  }

  // ── Return updated lead ───────────────────────────────────────────────────

  const updated = await findLeadById(leadId, userId, roles);
  if (!updated) {
    throw new AppError("INTERNAL_ERROR", "Failed to reload lead after update.", 500);
  }
  return updated;
}

// ── listLeads ─────────────────────────────────────────────────────────────────

export async function listLeads(
  userId: string,
  roles: string[],
  filters: LeadFilters
): Promise<LeadListResult> {
  return findLeads(userId, roles, filters);
}

// ── getLeadDetail ─────────────────────────────────────────────────────────────

export async function getLeadDetail(
  leadId: string,
  userId: string,
  roles: string[]
): Promise<Lead> {
  const lead = await findLeadById(leadId, userId, roles);
  if (!lead) {
    throw new NotFoundError("Lead", leadId);
  }
  return lead;
}

// ── HMAC verification ─────────────────────────────────────────────────────────

function verifyWebhookSignature(rawBody: Uint8Array, signatureHeader: string): boolean {
  if (!signatureHeader.startsWith("sha256=")) return false;
  const provided = signatureHeader.slice(7);
  const expected = createHmac("sha256", env.OPS_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  // Constant-time comparison to prevent timing attacks.
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

// ── syncLeadFromWebhook ───────────────────────────────────────────────────────

export async function syncLeadFromWebhook(
  data: LeadSyncWebhookPayload,
  signatureHeader: string,
  rawBody: Uint8Array
): Promise<void> {
  // 1. Verify HMAC signature.
  if (!verifyWebhookSignature(rawBody, signatureHeader)) {
    throw new AppError("UNAUTHORIZED", "Invalid webhook signature.", 401);
  }

  if (data.event_type === "lead_created") {
    // 2a. UPSERT lead (idempotent via ops_lead_id unique constraint).
    const leadId = await insertLead({
      ops_lead_id: data.ops_lead_id,
      full_name: data.full_name,
      phone_number: data.phone_number,
      channel_code: data.channel_code,
      utm_source: data.utm_source,
      utm_medium: data.utm_medium ?? null,
      utm_campaign: data.utm_campaign ?? null,
      assigned_to: data.assigned_to_person_id ?? null,
    });

    // 3a. Audit insert.
    const systemActorId = data.assigned_to_person_id ?? "system";
    await Promise.allSettled([
      auditLeadAction({
        lead_id: leadId,
        actor_person_id: systemActorId,
        action: "synced_from_ops",
        previous_status: null,
        new_status: "new",
        notes: "Synced from ops.nedu.vn webhook",
        metadata: { ops_lead_id: data.ops_lead_id },
      }),
      insertLeadAction({
        lead_id: leadId,
        actor_person_id: systemActorId,
        action: "synced_from_ops",
        new_status: "new",
        metadata: { ops_lead_id: data.ops_lead_id },
      }),
    ]);

    // 4a. Notify assigned staff.
    if (data.assigned_to_person_id) {
      void createNotification(
        data.assigned_to_person_id,
        "lead_new",
        "normal",
        "New lead assigned to you",
        `A new lead from ${data.channel_code} has been assigned to you.`,
        "lead",
        leadId
      );
    }
  } else if (data.event_type === "lead_returned") {
    // 2b. Find existing lead by ops_lead_id.
    const existing = await findLeadByOpsId(data.ops_lead_id);
    if (!existing) {
      throw new NotFoundError("Lead (ops_lead_id)", data.ops_lead_id);
    }

    // 3b. Update status to 'returned'.
    await updateLeadStatus(existing.id, "returned", data.return_reason ?? null);

    // 4b. Audit record.
    const systemActorId = "system";
    await Promise.allSettled([
      auditLeadAction({
        lead_id: existing.id,
        actor_person_id: systemActorId,
        action: "returned_by_consultant",
        previous_status: "pushed",
        new_status: "returned",
        notes: data.return_reason ?? null,
        metadata: { ops_lead_id: data.ops_lead_id },
      }),
      insertLeadAction({
        lead_id: existing.id,
        actor_person_id: systemActorId,
        action: "returned_by_consultant",
        previous_status: "pushed",
        new_status: "returned",
        notes: data.return_reason ?? null,
        metadata: { ops_lead_id: data.ops_lead_id },
      }),
    ]);

    // 5b. Banner notification for assigned staff.
    if (existing.assigned_to) {
      void createNotification(
        existing.assigned_to,
        "lead_returned",
        "alert",
        "Lead returned by consultant",
        data.return_reason
          ? `A lead was returned with reason: ${data.return_reason}`
          : "A lead has been returned by the consultant and needs re-classification.",
        "lead",
        existing.id
      );
    }
  } else {
    throw new BadRequestError(`Unknown event_type in webhook payload.`);
  }
}
