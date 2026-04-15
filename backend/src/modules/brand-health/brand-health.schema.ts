/**
 * Zod validation schemas for the Brand Health module.
 */

import { z } from "zod";

export const BrandHealthQuerySchema = z.object({
  weeks: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : 4))
    .pipe(
      z
        .number()
        .int()
        .min(1, "weeks must be at least 1")
        .max(52, "weeks cannot exceed 52")
    ),
});

export const UpsertBrandHealthSchema = z
  .object({
    week_start: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "week_start must be a date in YYYY-MM-DD format"),
    nps_score: z.number().min(0).max(100).optional().nullable(),
    share_of_voice_pct: z.number().min(0).max(100).optional().nullable(),
    brand_mentions: z.number().int().nonnegative().optional().nullable(),
    sentiment_positive: z.number().int().nonnegative().optional().nullable(),
    sentiment_neutral: z.number().int().nonnegative().optional().nullable(),
    sentiment_negative: z.number().int().nonnegative().optional().nullable(),
    negative_topics: z
      .array(
        z.object({
          topic: z.string().min(1),
          mention_count: z.number().int().nonnegative(),
        })
      )
      .optional()
      .default([]),
    data_source: z.enum(["manual", "api_brand24"]).optional().default("manual"),
  })
  .superRefine((data, ctx) => {
    // week_start must be a Monday (getDay() === 1)
    const date = new Date(data.week_start);
    if (date.getDay() !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["week_start"],
        message: "week_start must be a Monday (YYYY-MM-DD of a Monday).",
      });
    }
  });

export const ActivateCrisisSchema = z.object({
  title: z.string().min(1, "title is required").max(255),
  description: z.string().max(2000).optional().nullable(),
});

export type BrandHealthQuery = z.infer<typeof BrandHealthQuerySchema>;
export type UpsertBrandHealthInput = z.infer<typeof UpsertBrandHealthSchema>;
export type ActivateCrisisInput = z.infer<typeof ActivateCrisisSchema>;
