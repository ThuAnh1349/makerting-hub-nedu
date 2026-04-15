/**
 * Type definitions for the Budget module.
 */

import type { AnalyticsByChannel } from "../analytics/analytics.types.js";

export interface BudgetSummary {
  month_start: string;
  total_allocated_vnd: number;
  total_spent_vnd: number;
  budget_used_pct: number;
  budget_warning: boolean;
  total_leads: number;
  overall_cpl: number | null;
  by_channel: AnalyticsByChannel[];
}
