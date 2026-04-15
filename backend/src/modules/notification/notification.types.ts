/**
 * Type definitions for the Notification module.
 */

// ── Enumerations ───────────────────────────────────────────────────────────────

export type NotificationType =
  | "lead_new"
  | "lead_returned"
  | "post_approved"
  | "post_rejected"
  | "brief_completed"
  | "sla_alert"
  | "crisis_activated"
  | "budget_warning";

export type NotificationPriority = "alert" | "normal";

export type NotificationEntityType = "lead" | "post" | "brief" | "campaign";

// ── Core entity ────────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  notification_type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  entity_type: NotificationEntityType | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// ── Paginated response ────────────────────────────────────────────────────────

export interface NotificationListResult {
  data: Notification[];
  unread_count: number;
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}
