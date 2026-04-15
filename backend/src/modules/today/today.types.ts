/**
 * Type definitions for the Today / Dashboard Summary module.
 */

// Re-export Lead type from the lead module so callers can import from one place.
export type { Lead } from "../lead/lead.types.js";

// ── Alert ─────────────────────────────────────────────────────────────────────

export interface TodayAlert {
  alert_type: "lead_sla_overdue" | "post_unscheduled_soon";
  message: string;
  entity_type: "lead" | "post";
  entity_id: string;
  minutes_overdue: number | null;
}

// ── Summary ───────────────────────────────────────────────────────────────────

export interface TodaySummary {
  /** Leads with status = 'new' visible to the requesting user. */
  leads_pending_count: number;

  /** Leads with status = 'new' whose ops_synced_at is > 15 minutes ago. */
  leads_sla_overdue_count: number;

  /** Posts with scheduled_at on today's date and status in ('approved','scheduled'). */
  posts_scheduled_today: number;

  /** Posts with status = 'pending_review'. */
  posts_pending_review: number;

  /** Unread notifications for the requesting user. */
  unread_notification_count: number;

  /** Active system alerts requiring attention. */
  alerts: TodayAlert[];

  /**
   * Top 5 newest unhandled leads assigned to the requesting user
   * (or top 5 across all, for leaders).
   */
  quick_leads: import("../lead/lead.types.js").Lead[];
}
