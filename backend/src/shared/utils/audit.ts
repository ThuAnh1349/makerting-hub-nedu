/**
 * Audit event helpers.
 *
 * All audit tables are APPEND-ONLY. This module intentionally exposes only
 * INSERT operations — never UPDATE or DELETE — to preserve the immutable
 * audit trail required for compliance and debugging.
 *
 * Supported audit tables:
 *   - lead_actions        (CRM lead lifecycle events)
 *   - post_approvals      (content approval workflow steps)
 *   - brief_status_log    (creative brief status transitions)
 *   - notification_log    (outbound notification delivery records)
 */

import { db } from "../db/client.js";

// ── Table definitions ──────────────────────────────────────────────────────────

export type AuditTable =
  | "lead_actions"
  | "post_approvals"
  | "brief_status_log"
  | "notification_log";

// ── Per-table event shapes ────────────────────────────────────────────────────

export interface LeadActionEvent {
  lead_id: string;
  actor_person_id: string;
  action: string;
  previous_status?: string | null;
  new_status?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface PostApprovalEvent {
  post_id: string;
  actor_person_id: string;
  decision: "approved" | "rejected" | "revision_requested" | "submitted";
  comment?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface BriefStatusLogEvent {
  brief_id: string;
  actor_person_id: string;
  previous_status?: string | null;
  new_status: string;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface NotificationLogEvent {
  recipient_person_id: string;
  channel: "email" | "telegram" | "in_app" | "sms";
  template_key?: string | null;
  subject?: string | null;
  status: "sent" | "failed" | "skipped";
  error_message?: string | null;
  metadata?: Record<string, unknown> | null;
}

// ── Union discriminator type ───────────────────────────────────────────────────

type AuditEventMap = {
  lead_actions: LeadActionEvent;
  post_approvals: PostApprovalEvent;
  brief_status_log: BriefStatusLogEvent;
  notification_log: NotificationLogEvent;
};

// ── Core INSERT helper ────────────────────────────────────────────────────────

/**
 * Insert a single audit event row into the given audit table.
 *
 * This is the ONLY write operation permitted on audit tables.
 * Errors are caught and logged — audit failures must never crash
 * the primary business operation.
 *
 * @param tableName  One of the four supported audit tables
 * @param event      Typed payload matching the table schema
 * @returns          The inserted row's `id` on success, `null` on failure
 *
 * @example
 * await insertAuditEvent("lead_actions", {
 *   lead_id: "uuid-...",
 *   actor_person_id: ctx.user.id,
 *   action: "status_changed",
 *   previous_status: "new",
 *   new_status: "contacted",
 * });
 */
export async function insertAuditEvent<T extends AuditTable>(
  tableName: T,
  event: AuditEventMap[T]
): Promise<string | null> {
  // Validate table name against the allowlist to prevent SQL injection.
  const allowedTables: AuditTable[] = [
    "lead_actions",
    "post_approvals",
    "brief_status_log",
    "notification_log",
  ];

  if (!allowedTables.includes(tableName)) {
    console.error(`[Audit] Rejected write to disallowed table: "${tableName}"`);
    return null;
  }

  const columns = Object.keys(event as Record<string, unknown>);
  const values = Object.values(event as Record<string, unknown>);

  if (columns.length === 0) {
    console.error(`[Audit] Cannot insert empty event into "${tableName}"`);
    return null;
  }

  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
  const columnList = columns.join(", ");

  const sql = `
    INSERT INTO ${tableName} (${columnList}, created_at)
    VALUES (${placeholders}, NOW())
    RETURNING id
  `;

  try {
    const { rows } = await db.query<{ id: string }>(sql, values);
    return rows[0]?.id ?? null;
  } catch (err) {
    // Log but do NOT rethrow — audit failures are non-fatal.
    console.error(
      `[Audit] Failed to insert into "${tableName}":`,
      err instanceof Error ? err.message : err,
      { event }
    );
    return null;
  }
}

// ── Convenience wrappers ───────────────────────────────────────────────────────

/** Record a CRM lead lifecycle event. */
export function auditLeadAction(event: LeadActionEvent): Promise<string | null> {
  return insertAuditEvent("lead_actions", event);
}

/** Record a content post approval workflow step. */
export function auditPostApproval(event: PostApprovalEvent): Promise<string | null> {
  return insertAuditEvent("post_approvals", event);
}

/** Record a creative brief status transition. */
export function auditBriefStatus(event: BriefStatusLogEvent): Promise<string | null> {
  return insertAuditEvent("brief_status_log", event);
}

/** Record an outbound notification delivery attempt. */
export function auditNotification(event: NotificationLogEvent): Promise<string | null> {
  return insertAuditEvent("notification_log", event);
}
