/**
 * Notification service.
 *
 * Handles creation, listing, and read-marking of in-app notifications.
 *
 * Supabase Realtime is triggered automatically by the INSERT into the
 * `notifications` table via a database trigger — no extra server-side
 * WebSocket push is needed here.
 */

import { db } from "../../shared/db/client.js";
import { auditNotification } from "../../shared/utils/audit.js";
import { NotFoundError } from "../../shared/middleware/error.handler.js";
import type {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationEntityType,
  NotificationListResult,
} from "./notification.types.js";

// ── Row shapes ─────────────────────────────────────────────────────────────────

interface NotificationRow {
  id: string;
  notification_type: string;
  priority: string;
  title: string;
  body: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface CountRow {
  count: string;
}

// ── Map DB row ────────────────────────────────────────────────────────────────

function mapRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    notification_type: row.notification_type as NotificationType,
    priority: row.priority as NotificationPriority,
    title: row.title,
    body: row.body,
    entity_type: (row.entity_type as NotificationEntityType) ?? null,
    entity_id: row.entity_id,
    is_read: row.is_read,
    read_at: row.read_at ? new Date(row.read_at).toISOString() : null,
    created_at: new Date(row.created_at).toISOString(),
  };
}

// ── createNotification ────────────────────────────────────────────────────────

/**
 * Insert a notification for a user and log the delivery attempt.
 *
 * The INSERT into `notifications` is sufficient to trigger Supabase Realtime
 * on the frontend — no explicit push from this service is required.
 *
 * @returns The new notification's id, or null if the insert failed.
 */
export async function createNotification(
  recipientId: string,
  type: NotificationType,
  priority: NotificationPriority,
  title: string,
  body: string,
  entityType?: NotificationEntityType,
  entityId?: string
): Promise<string | null> {
  try {
    const { rows } = await db.query<{ id: string }>(
      `INSERT INTO notifications (
         recipient_id, notification_type, priority, title, body,
         entity_type, entity_id,
         is_read, created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW())
       RETURNING id`,
      [
        recipientId,
        type,
        priority,
        title,
        body,
        entityType ?? null,
        entityId ?? null,
      ]
    );

    const notificationId = rows[0]?.id ?? null;

    // Log the delivery to notification_log (non-fatal).
    void auditNotification({
      recipient_person_id: recipientId,
      channel: "in_app",
      template_key: type,
      subject: title,
      status: notificationId ? "sent" : "failed",
      metadata: { entity_type: entityType, entity_id: entityId, notification_id: notificationId },
    });

    return notificationId;
  } catch (err) {
    console.error("[Notification] Failed to create notification:", err);
    void auditNotification({
      recipient_person_id: recipientId,
      channel: "in_app",
      template_key: type,
      subject: title,
      status: "failed",
      error_message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

// ── getNotifications ──────────────────────────────────────────────────────────

export async function getNotifications(
  userId: string,
  unreadOnly: boolean,
  page: number,
  perPage: number
): Promise<NotificationListResult> {
  page = Math.max(1, page);
  perPage = Math.min(100, Math.max(1, perPage));
  const offset = (page - 1) * perPage;

  const conditions = [`recipient_id = $1`];
  const params: unknown[] = [userId];

  if (unreadOnly) {
    conditions.push(`is_read = false`);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  // Run count and data queries in parallel.
  const [countResult, dataResult, unreadCountResult] = await Promise.all([
    db.query<CountRow>(
      `SELECT COUNT(*) AS count FROM notifications ${whereClause}`,
      params
    ),
    db.query<NotificationRow>(
      `SELECT id, notification_type, priority, title, body,
              entity_type, entity_id, is_read, read_at, created_at
       FROM notifications
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, perPage, offset]
    ),
    // Always return total unread regardless of filter.
    db.query<CountRow>(
      `SELECT COUNT(*) AS count FROM notifications WHERE recipient_id = $1 AND is_read = false`,
      [userId]
    ),
  ]);

  const total = parseInt(countResult.rows[0]?.count ?? "0", 10);

  return {
    data: dataResult.rows.map(mapRow),
    unread_count: parseInt(unreadCountResult.rows[0]?.count ?? "0", 10),
    pagination: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.ceil(total / perPage),
    },
  };
}

// ── markAsRead ────────────────────────────────────────────────────────────────

/**
 * Mark a single notification as read (idempotent — safe to call multiple times).
 *
 * @throws NotFoundError if the notification doesn't exist or belongs to another user.
 */
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<Notification> {
  const { rows } = await db.query<NotificationRow>(
    `UPDATE notifications
     SET is_read = true,
         read_at = COALESCE(read_at, NOW())
     WHERE id = $1
       AND recipient_id = $2
     RETURNING id, notification_type, priority, title, body,
               entity_type, entity_id, is_read, read_at, created_at`,
    [notificationId, userId]
  );

  if (rows.length === 0) {
    throw new NotFoundError("Notification", notificationId);
  }

  return mapRow(rows[0]!);
}
