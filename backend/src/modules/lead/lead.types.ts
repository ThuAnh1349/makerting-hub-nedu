/**
 * Type definitions for the Lead / CRM module.
 */

// ── Enumerations ───────────────────────────────────────────────────────────────

export type LeadStatus =
  | "new"
  | "hot"
  | "warm"
  | "cold"
  | "pushed"
  | "returned"
  | "archived";

export type LeadActionType =
  | "synced_from_ops"
  | "assigned"
  | "classified_hot"
  | "classified_warm"
  | "classified_cold"
  | "classified_trash"
  | "pushed_to_consultant"
  | "returned_by_consultant"
  | "reclassified"
  | "archived";

// ── Embedded shapes ────────────────────────────────────────────────────────────

export interface LeadChannel {
  code: string;
  label: string;
  color_hex: string;
}

export interface LeadAssignee {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

// ── Audit event ────────────────────────────────────────────────────────────────

export interface LeadActionEvent {
  event_type: LeadActionType;
  actor_name: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

// ── Core entity ────────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  full_name: string;
  phone_number: string;
  message_preview: string | null;
  channel: LeadChannel;
  utm_source: string;
  utm_medium: string | null;
  utm_campaign: string | null;
  current_status: LeadStatus;
  return_reason: string | null;
  assigned_to: LeadAssignee | null;
  minutes_waiting: number;
  sla_overdue: boolean;
  ops_synced_at: string;
  last_action_at: string | null;
  /** Populated only on detail endpoint, not list. */
  action_history?: LeadActionEvent[];
}

// ── Filter / pagination input ─────────────────────────────────────────────────

export interface LeadFilters {
  status?: LeadStatus[];
  channel_code?: string;
  assigned_to?: string;
  sla_overdue_only?: boolean;
  page?: number;
  per_page?: number;
}

// ── Paginated list result ─────────────────────────────────────────────────────

export interface LeadListResult {
  data: Lead[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}
