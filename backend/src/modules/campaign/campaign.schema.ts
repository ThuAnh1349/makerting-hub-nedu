/**
 * Zod validation schemas for the Campaign module.
 */

import { z } from "zod";
import type { CampaignPhase } from "./campaign.types.js";

export const PHASE_ORDER: CampaignPhase[] = [
  "opening",
  "build",
  "close",
  "cta",
  "completed",
];

export const CreateCampaignSchema = z.object({
  title: z.string().min(1, "title is required").max(255),
  description: z.string().max(5000).optional().nullable(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "start_date must be in YYYY-MM-DD format")
    .optional()
    .nullable(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "end_date must be in YYYY-MM-DD format")
    .optional()
    .nullable(),
});

export const UpdatePhaseSchema = z
  .object({
    new_phase: z.enum(["opening", "build", "close", "cta", "completed"]),
  })
  .superRefine((_data, _ctx) => {
    // Phase transition validation (opening → build → close → cta → completed)
    // is enforced in the service layer where we have the current phase from DB.
  });

export const CampaignListQuerySchema = z.object({
  phase: z
    .enum(["opening", "build", "close", "cta", "completed"])
    .optional(),
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;
export type UpdatePhaseInput = z.infer<typeof UpdatePhaseSchema>;
export type CampaignListQuery = z.infer<typeof CampaignListQuerySchema>;
