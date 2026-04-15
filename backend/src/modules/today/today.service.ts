/**
 * Today Summary service.
 *
 * Aggregates counts, alerts, and quick-lead data for the dashboard.
 * Designed to be called on a 60-second polling interval from the frontend.
 */

import { db } from "../../shared/db/client.js";
import type { TodaySummary, TodayAlert } from "./today.types.js";
import type { Lead } from "../lead/lead.types.js";

// ── Role helpers ──────────────────────────────────────────────────────────────

/** Leaders see data across all assignees; staff see only their own. */
function isLeader(roles: string[]): boolean {
  return roles.some((r) =>
    ["co_leader", "marketing_leader", "admin", "super_admin"].includes(r)
  );
}

// ── Row shapes returned from SQL ──────────────────────────────────────────────

interface CountRow {
  count: string; // pg returns bigint as string
}

interface AlertLeadRow {
  id: string;
  full_name: string;
  channel_code: string;
  channel_label: string;
  minutes_waiting: string;
}

interface AlertPostRow {
  id: string;
  title: string | null;
  scheduled_at: string | null;
  minutes_until: string | null;
}

interface QuickLeadRow {
  id: string;
  full_name: string;
  phone_number: string;
  message_preview: string | null;
  channel_code: string;
  channel_label: string;
  channel_color_hex: string;
  utm_source: string;
  utm_medium: string | null;
  utm_campaign: string | null;
  current_status: string;
  return_reason: string | null;
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  assigned_to_avatar: string | null;
  minutes_waiting: string;
  sla_overdue: boolean;
  ops_synced_at: string;
  last_action_at: string | null;
}

// ── Main service function ─────────────────────────────────────────────────────

export async function getTodaySummary(
  userId: string,
  roles: string[]
): Promise<TodaySummary> {
  const leader = isLeader(roles);

  // Run all queries concurrently for minimum latency.
  const [
    pendingResult,
    slaResult,
    scheduledResult,
    reviewResult,
    unreadResult,
    alertLeadsResult,
    alertPostsResult,
    quickLeadsResult,
  ] = await Promise.all([
    // 1. leads_pending_count — new leads visible to requester
    db.query<CountRow>(
      leader
        ? `SELECT COUNT(*) AS count FROM leads WHERE current_status = 'new'`
        : `SELECT COUNT(*) AS count FROM leads WHERE current_status = 'new' AND assigned_to = $1`,
      leader ? [] : [userId]
    ),

    // 2. leads_sla_overdue_count — new leads waiting > 15 minutes
    db.query<CountRow>(
      leader
        ? `SELECT COUNT(*) AS count
           FROM leads
           WHERE current_status = 'new'
             AND ops_synced_at < NOW() - INTERVAL '15 minutes'`
        : `SELECT COUNT(*) AS count
           FROM leads
           WHERE current_status = 'new'
             AND ops_synced_at < NOW() - INTERVAL '15 minutes'
             AND assigned_to = $1`,
      leader ? [] : [userId]
    ),

    // 3. posts_scheduled_today
    db.query<CountRow>(
      `SELECT COUNT(*) AS count
       FROM posts
       WHERE scheduled_at::date = CURRENT_DATE
         AND current_status IN ('approved', 'scheduled')`
    ),

    // 4. posts_pending_review
    db.query<CountRow>(
      `SELECT COUNT(*) AS count
       FROM posts
       WHERE current_status = 'pending_review'`
    ),

    // 5. unread_notification_count
    db.query<CountRow>(
      `SELECT COUNT(*) AS count
       FROM notifications
       WHERE recipient_id = $1
         AND is_read = false`,
      [userId]
    ),

    // 6. Alert: leads SLA overdue (new, waiting > 15 min)
    db.query<AlertLeadRow>(
      leader
        ? `SELECT
             l.id,
             l.full_name,
             c.code AS channel_code,
             c.label AS channel_label,
             EXTRACT(EPOCH FROM (NOW() - l.ops_synced_at)) / 60 AS minutes_waiting
           FROM leads l
           JOIN channels c ON c.code = l.channel_code
           WHERE l.current_status = 'new'
             AND l.ops_synced_at < NOW() - INTERVAL '15 minutes'
           ORDER BY l.ops_synced_at ASC
           LIMIT 20`
        : `SELECT
             l.id,
             l.full_name,
             c.code AS channel_code,
             c.label AS channel_label,
             EXTRACT(EPOCH FROM (NOW() - l.ops_synced_at)) / 60 AS minutes_waiting
           FROM leads l
           JOIN channels c ON c.code = l.channel_code
           WHERE l.current_status = 'new'
             AND l.ops_synced_at < NOW() - INTERVAL '15 minutes'
             AND l.assigned_to = $1
           ORDER BY l.ops_synced_at ASC
           LIMIT 20`,
      leader ? [] : [userId]
    ),

    // 7. Alert: posts approved but unscheduled (scheduled_at IS NULL or within 4h)
    db.query<AlertPostRow>(
      `SELECT
         p.id,
         p.title,
         p.scheduled_at,
         CASE
           WHEN p.scheduled_at IS NOT NULL
             THEN EXTRACT(EPOCH FROM (p.scheduled_at - NOW())) / 60
           ELSE NULL
         END AS minutes_until
       FROM posts p
       WHERE p.current_status = 'approved'
         AND (
           p.scheduled_at IS NULL
           OR p.scheduled_at BETWEEN NOW() AND NOW() + INTERVAL '4 hours'
         )
       ORDER BY p.scheduled_at ASC NULLS FIRST
       LIMIT 20`
    ),

    // 8. Quick leads — top 5 new leads, oldest first
    db.query<QuickLeadRow>(
      leader
        ? `SELECT
             l.id,
             l.full_name,
             l.phone_number,
             l.message_preview,
             c.code    AS channel_code,
             c.label   AS channel_label,
             c.color_hex AS channel_color_hex,
             l.utm_source,
             l.utm_medium,
             l.utm_campaign,
             l.current_status,
             l.return_reason,
             p.id      AS assigned_to_id,
             p.display_name AS assigned_to_name,
             p.avatar_url   AS assigned_to_avatar,
             EXTRACT(EPOCH FROM (NOW() - l.ops_synced_at)) / 60 AS minutes_waiting,
             (l.ops_synced_at < NOW() - INTERVAL '15 minutes') AS sla_overdue,
             l.ops_synced_at,
             l.last_action_at
           FROM leads l
           JOIN channels c ON c.code = l.channel_code
           LEFT JOIN persons p ON p.id = l.assigned_to
           WHERE l.current_status = 'new'
           ORDER BY l.ops_synced_at ASC
           LIMIT 5`
        : `SELECT
             l.id,
             l.full_name,
             l.phone_number,
             l.message_preview,
             c.code    AS channel_code,
             c.label   AS channel_label,
             c.color_hex AS channel_color_hex,
             l.utm_source,
             l.utm_medium,
             l.utm_campaign,
             l.current_status,
             l.return_reason,
             p.id      AS assigned_to_id,
             p.display_name AS assigned_to_name,
             p.avatar_url   AS assigned_to_avatar,
             EXTRACT(EPOCH FROM (NOW() - l.ops_synced_at)) / 60 AS minutes_waiting,
             (l.ops_synced_at < NOW() - INTERVAL '15 minutes') AS sla_overdue,
             l.ops_synced_at,
             l.last_action_at
           FROM leads l
           JOIN channels c ON c.code = l.channel_code
           LEFT JOIN persons p ON p.id = l.assigned_to
           WHERE l.current_status = 'new'
             AND l.assigned_to = $1
           ORDER BY l.ops_synced_at ASC
           LIMIT 5`,
      leader ? [] : [userId]
    ),
  ]);

  // ── Build alerts array ───────────────────────────────────────────────────────

  const alerts: TodayAlert[] = [];

  for (const row of alertLeadsResult.rows) {
    const minutesOverdue = Math.round(parseFloat(row.minutes_waiting));
    alerts.push({
      alert_type: "lead_sla_overdue",
      message: `Lead "${row.full_name}" (${row.channel_label}) has been waiting ${minutesOverdue} minutes without action.`,
      entity_type: "lead",
      entity_id: row.id,
      minutes_overdue: minutesOverdue,
    });
  }

  for (const row of alertPostsResult.rows) {
    const label = row.title ?? row.id;
    const minutesUntil =
      row.minutes_until !== null ? Math.round(parseFloat(row.minutes_until)) : null;
    const message =
      row.scheduled_at === null
        ? `Approved post "${label}" has no scheduled time set.`
        : `Approved post "${label}" goes live in ${minutesUntil} minutes but may not be ready.`;

    alerts.push({
      alert_type: "post_unscheduled_soon",
      message,
      entity_type: "post",
      entity_id: row.id,
      minutes_overdue: minutesUntil !== null ? -minutesUntil : null,
    });
  }

  // ── Map quick leads to Lead shape ────────────────────────────────────────────

  const quickLeads: Lead[] = quickLeadsResult.rows.map((row) => ({
    id: row.id,
    full_name: row.full_name,
    phone_number: row.phone_number,
    message_preview: row.message_preview,
    channel: {
      code: row.channel_code,
      label: row.channel_label,
      color_hex: row.channel_color_hex,
    },
    utm_source: row.utm_source,
    utm_medium: row.utm_medium,
    utm_campaign: row.utm_campaign,
    current_status: row.current_status as Lead["current_status"],
    return_reason: row.return_reason,
    assigned_to:
      row.assigned_to_id !== null
        ? {
            id: row.assigned_to_id,
            display_name: row.assigned_to_name ?? "",
            avatar_url: row.assigned_to_avatar,
          }
        : null,
    minutes_waiting: Math.round(parseFloat(row.minutes_waiting)),
    sla_overdue: row.sla_overdue,
    ops_synced_at: row.ops_synced_at,
    last_action_at: row.last_action_at,
  }));

  return {
    leads_pending_count: parseInt(pendingResult.rows[0]?.count ?? "0", 10),
    leads_sla_overdue_count: parseInt(slaResult.rows[0]?.count ?? "0", 10),
    posts_scheduled_today: parseInt(scheduledResult.rows[0]?.count ?? "0", 10),
    posts_pending_review: parseInt(reviewResult.rows[0]?.count ?? "0", 10),
    unread_notification_count: parseInt(unreadResult.rows[0]?.count ?? "0", 10),
    alerts,
    quick_leads: quickLeads,
  };
}
