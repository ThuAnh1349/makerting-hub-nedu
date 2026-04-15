/**
 * Analytics service.
 *
 * Provides summary reads from the analytics_channel_summary materialized view
 * and upsert capability for analytics_channel_data entries.
 */

import { db } from "../../shared/db/client.js";
import type { AnalyticsByChannel } from "./analytics.types.js";
import type { UpsertAnalyticsInput } from "./analytics.schema.js";

// ── Row shapes ─────────────────────────────────────────────────────────────────

interface AnalyticsSummaryRow {
  channel_id: string;
  channel_label: string;
  channel_color: string;
  period_type: string;
  period_start: string;
  period_end: string;
  reach: string | null;
  engagement_rate_pct: string | null;
  lead_count: string | null;
  conversion_count: string | null;
  spend_vnd: string | null;
  allocated_vnd: string | null;
  cpl_actual: string | null;
  cpl_benchmark: string | null;
  budget_used_pct: string | null;
  data_source: string;
}

function mapSummaryRow(row: AnalyticsSummaryRow): AnalyticsByChannel {
  return {
    channel_id: row.channel_id,
    channel_label: row.channel_label,
    channel_color: row.channel_color,
    period_type: row.period_type as "weekly" | "monthly",
    period_start: row.period_start,
    period_end: row.period_end,
    reach: row.reach !== null ? Number(row.reach) : null,
    engagement_rate_pct: row.engagement_rate_pct !== null ? Number(row.engagement_rate_pct) : null,
    lead_count: row.lead_count !== null ? Number(row.lead_count) : null,
    conversion_count: row.conversion_count !== null ? Number(row.conversion_count) : null,
    spend_vnd: row.spend_vnd !== null ? Number(row.spend_vnd) : null,
    allocated_vnd: row.allocated_vnd !== null ? Number(row.allocated_vnd) : null,
    cpl_actual: row.cpl_actual !== null ? Number(row.cpl_actual) : null,
    cpl_benchmark: row.cpl_benchmark !== null ? Number(row.cpl_benchmark) : null,
    budget_used_pct: row.budget_used_pct !== null ? Number(row.budget_used_pct) : null,
    data_source: row.data_source as AnalyticsByChannel["data_source"],
  };
}

// ── getSummary ─────────────────────────────────────────────────────────────────

/**
 * Read channel analytics summary from the materialized view
 * for a given period_type + period_start combination.
 */
export async function getSummary(
  periodType: "weekly" | "monthly",
  periodStart: string
): Promise<AnalyticsByChannel[]> {
  const { rows } = await db.query<AnalyticsSummaryRow>(
    `SELECT
       channel_id,
       channel_label,
       channel_color,
       period_type,
       period_start::text,
       period_end::text,
       reach,
       engagement_rate_pct,
       lead_count,
       conversion_count,
       spend_vnd,
       allocated_vnd,
       cpl_actual,
       cpl_benchmark,
       budget_used_pct,
       data_source
     FROM analytics_channel_summary
     WHERE period_type = $1
       AND period_start = $2::date
     ORDER BY channel_label ASC`,
    [periodType, periodStart]
  );

  return rows.map(mapSummaryRow);
}

// ── upsertEntry ────────────────────────────────────────────────────────────────

/**
 * Insert or update a single analytics_channel_data row.
 * Conflict target is (channel_id, period_type, period_start).
 * Returns the upserted row joined with channel info.
 */
export async function upsertEntry(data: UpsertAnalyticsInput): Promise<AnalyticsByChannel> {
  const {
    channel_id,
    period_type,
    period_start,
    period_end,
    reach,
    engagement_rate_pct,
    lead_count,
    conversion_count,
    spend_vnd,
    allocated_vnd,
    cpl_actual,
    cpl_benchmark,
    budget_used_pct,
    data_source,
  } = data;

  const { rows } = await db.query<AnalyticsSummaryRow>(
    `INSERT INTO analytics_channel_data (
       channel_id, period_type, period_start, period_end,
       reach, engagement_rate_pct, lead_count, conversion_count,
       spend_vnd, allocated_vnd, cpl_actual, cpl_benchmark,
       budget_used_pct, data_source,
       updated_at
     )
     VALUES ($1, $2, $3::date, $4::date, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
     ON CONFLICT (channel_id, period_type, period_start)
     DO UPDATE SET
       period_end          = EXCLUDED.period_end,
       reach               = EXCLUDED.reach,
       engagement_rate_pct = EXCLUDED.engagement_rate_pct,
       lead_count          = EXCLUDED.lead_count,
       conversion_count    = EXCLUDED.conversion_count,
       spend_vnd           = EXCLUDED.spend_vnd,
       allocated_vnd       = EXCLUDED.allocated_vnd,
       cpl_actual          = EXCLUDED.cpl_actual,
       cpl_benchmark       = EXCLUDED.cpl_benchmark,
       budget_used_pct     = EXCLUDED.budget_used_pct,
       data_source         = EXCLUDED.data_source,
       updated_at          = NOW()
     RETURNING
       acd.channel_id,
       (SELECT label  FROM marketing_channels WHERE id = acd.channel_id) AS channel_label,
       (SELECT color  FROM marketing_channels WHERE id = acd.channel_id) AS channel_color,
       acd.period_type,
       acd.period_start::text,
       acd.period_end::text,
       acd.reach,
       acd.engagement_rate_pct,
       acd.lead_count,
       acd.conversion_count,
       acd.spend_vnd,
       acd.allocated_vnd,
       acd.cpl_actual,
       acd.cpl_benchmark,
       acd.budget_used_pct,
       acd.data_source`,
    [
      channel_id,
      period_type,
      period_start,
      period_end ?? null,
      reach ?? null,
      engagement_rate_pct ?? null,
      lead_count ?? null,
      conversion_count ?? null,
      spend_vnd ?? null,
      allocated_vnd ?? null,
      cpl_actual ?? null,
      cpl_benchmark ?? null,
      budget_used_pct ?? null,
      data_source,
    ]
  );

  // The RETURNING clause aliases the table; re-query with JOIN for clean data.
  // Perform a follow-up SELECT joined with channels for the full shape.
  const { rows: joined } = await db.query<AnalyticsSummaryRow>(
    `SELECT
       acd.channel_id,
       mc.label  AS channel_label,
       mc.color  AS channel_color,
       acd.period_type,
       acd.period_start::text,
       acd.period_end::text,
       acd.reach,
       acd.engagement_rate_pct,
       acd.lead_count,
       acd.conversion_count,
       acd.spend_vnd,
       acd.allocated_vnd,
       acd.cpl_actual,
       acd.cpl_benchmark,
       acd.budget_used_pct,
       acd.data_source
     FROM analytics_channel_data acd
     JOIN marketing_channels mc ON mc.id = acd.channel_id
     WHERE acd.channel_id = $1
       AND acd.period_type = $2
       AND acd.period_start = $3::date`,
    [channel_id, period_type, period_start]
  );

  return mapSummaryRow(joined[0]!);
}
