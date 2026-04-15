/**
 * Budget service.
 *
 * getBudgetSummary   — compute monthly budget summary across channels
 * upsertAllocation   — insert or update a channel budget allocation
 */

import { db } from "../../shared/db/client.js";
import { createNotification } from "../notification/notification.service.js";
import type { AnalyticsByChannel } from "../analytics/analytics.types.js";
import type { BudgetSummary } from "./budget.types.js";
import type { UpsertAllocationInput } from "./budget.schema.js";

// ── Row shapes ─────────────────────────────────────────────────────────────────

interface ChannelBudgetRow {
  channel_id: string;
  channel_label: string;
  channel_color: string;
  period_start: string;
  period_end: string | null;
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

interface LeaderRow {
  person_id: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function toNum(v: string | null): number | null {
  return v !== null ? Number(v) : null;
}

async function getMarketingLeaders(): Promise<LeaderRow[]> {
  const { rows } = await db.query<LeaderRow>(
    `SELECT pr.person_id
     FROM person_roles pr
     JOIN persons p ON p.id = pr.person_id
     WHERE pr.role_name = 'marketing_leader'
       AND pr.valid_until IS NULL
       AND p.deleted_at IS NULL`
  );
  return rows;
}

// ── getBudgetSummary ──────────────────────────────────────────────────────────

/**
 * Compute monthly budget summary for a given month_start.
 *
 * Joins analytics_channel_data (monthly period) with budget_allocations.
 * If budget_used_pct >= 80%, fires a budget_warning notification to all leaders.
 */
export async function getBudgetSummary(monthStart: string): Promise<BudgetSummary> {
  // Fetch all channel data for the month.
  const { rows } = await db.query<ChannelBudgetRow>(
    `SELECT
       mc.id           AS channel_id,
       mc.label        AS channel_label,
       mc.color        AS channel_color,
       acd.period_start::text,
       acd.period_end::text,
       acd.reach,
       acd.engagement_rate_pct,
       acd.lead_count,
       acd.conversion_count,
       acd.spend_vnd,
       ba.allocated_vnd,
       acd.cpl_actual,
       ba.cpl_benchmark,
       CASE
         WHEN ba.allocated_vnd > 0
           THEN ROUND((COALESCE(acd.spend_vnd, 0) / ba.allocated_vnd) * 100, 2)
         ELSE NULL
       END             AS budget_used_pct,
       COALESCE(acd.data_source, 'manual') AS data_source
     FROM marketing_channels mc
     LEFT JOIN analytics_channel_data acd
       ON acd.channel_id = mc.id
      AND acd.period_type = 'monthly'
      AND acd.period_start = $1::date
     LEFT JOIN budget_allocations ba
       ON ba.channel_id = mc.id
      AND ba.month_start = $1::date
     WHERE mc.deleted_at IS NULL
     ORDER BY mc.label ASC`,
    [monthStart]
  );

  // Compute aggregates.
  let totalAllocated = 0;
  let totalSpent = 0;
  let totalLeads = 0;

  const byChannel: AnalyticsByChannel[] = rows.map((row) => {
    const allocated = toNum(row.allocated_vnd) ?? 0;
    const spent = toNum(row.spend_vnd) ?? 0;
    const leads = toNum(row.lead_count) ?? 0;

    totalAllocated += allocated;
    totalSpent += spent;
    totalLeads += leads;

    return {
      channel_id: row.channel_id,
      channel_label: row.channel_label,
      channel_color: row.channel_color,
      period_type: "monthly" as const,
      period_start: row.period_start ?? monthStart,
      period_end: row.period_end ?? "",
      reach: toNum(row.reach),
      engagement_rate_pct: toNum(row.engagement_rate_pct),
      lead_count: toNum(row.lead_count),
      conversion_count: toNum(row.conversion_count),
      spend_vnd: toNum(row.spend_vnd),
      allocated_vnd: toNum(row.allocated_vnd),
      cpl_actual: toNum(row.cpl_actual),
      cpl_benchmark: toNum(row.cpl_benchmark),
      budget_used_pct: toNum(row.budget_used_pct),
      data_source: row.data_source as AnalyticsByChannel["data_source"],
    };
  });

  const budgetUsedPct =
    totalAllocated > 0
      ? Math.round((totalSpent / totalAllocated) * 10000) / 100
      : 0;

  const budgetWarning = budgetUsedPct >= 80;

  const overallCpl =
    totalLeads > 0 && totalSpent > 0
      ? Math.round((totalSpent / totalLeads) * 100) / 100
      : null;

  // Fire budget warning notifications if threshold crossed.
  if (budgetWarning) {
    const leaders = await getMarketingLeaders();
    await Promise.allSettled(
      leaders.map((leader) =>
        createNotification(
          leader.person_id,
          "budget_warning",
          "alert",
          "Budget Warning: 80% Threshold Reached",
          `Monthly budget for ${monthStart} is ${budgetUsedPct}% consumed (${totalSpent.toLocaleString()} / ${totalAllocated.toLocaleString()} VND). Review channel spending.`
        )
      )
    );
  }

  return {
    month_start: monthStart,
    total_allocated_vnd: totalAllocated,
    total_spent_vnd: totalSpent,
    budget_used_pct: budgetUsedPct,
    budget_warning: budgetWarning,
    total_leads: totalLeads,
    overall_cpl: overallCpl,
    by_channel: byChannel,
  };
}

// ── upsertAllocation ──────────────────────────────────────────────────────────

/**
 * Insert or update a budget allocation for a channel + month.
 */
export async function upsertAllocation(
  data: UpsertAllocationInput,
  _userId: string
): Promise<{ channel_id: string; month_start: string; allocated_vnd: number; cpl_benchmark: number | null }> {
  const { channel_id, month_start, allocated_vnd, cpl_benchmark } = data;

  const { rows } = await db.query<{
    channel_id: string;
    month_start: string;
    allocated_vnd: string;
    cpl_benchmark: string | null;
  }>(
    `INSERT INTO budget_allocations (channel_id, month_start, allocated_vnd, cpl_benchmark, updated_at)
     VALUES ($1, $2::date, $3, $4, NOW())
     ON CONFLICT (channel_id, month_start)
     DO UPDATE SET
       allocated_vnd = EXCLUDED.allocated_vnd,
       cpl_benchmark = EXCLUDED.cpl_benchmark,
       updated_at    = NOW()
     RETURNING channel_id, month_start::text, allocated_vnd, cpl_benchmark`,
    [channel_id, month_start, allocated_vnd, cpl_benchmark ?? null]
  );

  const row = rows[0]!;
  return {
    channel_id: row.channel_id,
    month_start: row.month_start,
    allocated_vnd: Number(row.allocated_vnd),
    cpl_benchmark: row.cpl_benchmark !== null ? Number(row.cpl_benchmark) : null,
  };
}
