/**
 * Zod validation schemas for the Analytics module.
 */

import { z } from "zod";

export const AnalyticsQuerySchema = z.object({
  period_type: z.enum(["weekly", "monthly"]),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a date in YYYY-MM-DD format"),
});

export const UpsertAnalyticsSchema = z.object({
  // Required keys (conflict target)
  channel_id: z.string().uuid("channel_id must be a valid UUID"),
  period_type: z.enum(["weekly", "monthly"]),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a date in YYYY-MM-DD format"),

  // Optional metric fields
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a date in YYYY-MM-DD format").optional().nullable(),
  reach: z.number().int().nonnegative().optional().nullable(),
  engagement_rate_pct: z.number().min(0).max(100).optional().nullable(),
  lead_count: z.number().int().nonnegative().optional().nullable(),
  conversion_count: z.number().int().nonnegative().optional().nullable(),
  spend_vnd: z.number().nonnegative().optional().nullable(),
  allocated_vnd: z.number().nonnegative().optional().nullable(),
  cpl_actual: z.number().nonnegative().optional().nullable(),
  cpl_benchmark: z.number().nonnegative().optional().nullable(),
  budget_used_pct: z.number().min(0).max(100).optional().nullable(),
  data_source: z
    .enum(["manual", "meta_ads_api", "google_ads_api", "tiktok_ads_api"])
    .optional()
    .default("manual"),
});

export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;
export type UpsertAnalyticsInput = z.infer<typeof UpsertAnalyticsSchema>;
