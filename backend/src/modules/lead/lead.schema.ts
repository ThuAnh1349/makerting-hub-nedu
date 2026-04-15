/**
 * Zod validation schemas for the Lead module.
 *
 * Used by the controller layer to validate inbound request bodies
 * before passing data to the service layer.
 */

import { z } from "zod";

// ── Action schemas ────────────────────────────────────────────────────────────

export const ClassifyActionSchema = z.object({
  action_type: z.literal("classify"),
  classification: z.enum(["hot", "warm", "cold", "trash"]),
  reason: z.string().max(1000).optional(),
});

export const PushActionSchema = z.object({
  action_type: z.literal("push"),
});

export const ReclassifyActionSchema = z.object({
  action_type: z.literal("reclassify"),
  classification: z.enum(["hot", "warm", "cold", "archived"]),
  reason: z.string().max(1000).optional(),
});

/**
 * Discriminated union of all lead actions.
 * Validates the `action_type` field first, then the rest of the shape.
 */
export const LeadActionSchema = z.discriminatedUnion("action_type", [
  ClassifyActionSchema,
  PushActionSchema,
  ReclassifyActionSchema,
]);

export type ClassifyAction = z.infer<typeof ClassifyActionSchema>;
export type PushAction = z.infer<typeof PushActionSchema>;
export type ReclassifyAction = z.infer<typeof ReclassifyActionSchema>;
export type LeadAction = z.infer<typeof LeadActionSchema>;

// ── Webhook schema ────────────────────────────────────────────────────────────

/**
 * Body schema for the ops.nedu.vn → backend webhook.
 * Validated after HMAC signature verification.
 */
export const LeadSyncWebhookSchema = z.object({
  event_type: z.enum(["lead_created", "lead_returned"]),
  ops_lead_id: z.string().uuid(),
  full_name: z.string().min(1).max(255),
  phone_number: z.string().min(1).max(50),
  channel_code: z.string().min(1).max(50),
  utm_source: z.string().min(1).max(255),
  utm_medium: z.string().max(255).optional(),
  utm_campaign: z.string().max(255).optional(),
  assigned_to_person_id: z.string().uuid().optional(),
  return_reason: z.string().max(1000).optional(),
});

export type LeadSyncWebhookPayload = z.infer<typeof LeadSyncWebhookSchema>;

// ── List query schema ─────────────────────────────────────────────────────────

export const LeadListQuerySchema = z.object({
  status: z
    .string()
    .optional()
    .transform((val) =>
      val ? (val.split(",") as import("./lead.types.js").LeadStatus[]) : undefined
    ),
  channel_code: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
  sla_overdue_only: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  per_page: z
    .string()
    .optional()
    .transform((val) =>
      val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20
    ),
});

export type LeadListQuery = z.infer<typeof LeadListQuerySchema>;
