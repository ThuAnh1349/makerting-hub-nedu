/**
 * Zod validation schemas for the Budget module.
 */

import { z } from "zod";

function firstDayOfCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export const BudgetQuerySchema = z.object({
  month_start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "month_start must be a date in YYYY-MM-DD format")
    .optional()
    .default(() => firstDayOfCurrentMonth()),
});

export const UpsertAllocationSchema = z
  .object({
    channel_id: z.string().uuid("channel_id must be a valid UUID"),
    month_start: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "month_start must be a date in YYYY-MM-DD format"),
    allocated_vnd: z.number().nonnegative("allocated_vnd must be non-negative"),
    cpl_benchmark: z.number().nonnegative().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // month_start must be the 1st of a month
    const date = new Date(data.month_start);
    if (date.getDate() !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["month_start"],
        message: "month_start must be the first day of a month (e.g. 2025-01-01).",
      });
    }
  });

export type BudgetQuery = z.infer<typeof BudgetQuerySchema>;
export type UpsertAllocationInput = z.infer<typeof UpsertAllocationSchema>;
