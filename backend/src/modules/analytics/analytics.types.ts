/**
 * Type definitions for the Analytics module.
 */

export interface AnalyticsByChannel {
  channel_id: string;
  channel_label: string;
  channel_color: string;
  period_type: "weekly" | "monthly";
  period_start: string;
  period_end: string;
  reach: number | null;
  engagement_rate_pct: number | null;
  lead_count: number | null;
  conversion_count: number | null;
  spend_vnd: number | null;
  allocated_vnd: number | null;
  cpl_actual: number | null;
  cpl_benchmark: number | null;
  budget_used_pct: number | null;
  data_source: "manual" | "meta_ads_api" | "google_ads_api" | "tiktok_ads_api";
}
