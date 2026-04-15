/**
 * Notification module HTTP handlers.
 *
 * Routes:
 *   GET   /api/v1/marketing/notifications            — list (paginated)
 *   PATCH /api/v1/marketing/notifications/:id/read   — mark as read
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import { BadRequestError } from "../../shared/middleware/error.handler.js";
import { getNotifications, markAsRead } from "./notification.service.js";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ── GET /api/v1/marketing/notifications ──────────────────────────────────────

export async function handleListNotifications(
  ctx: RequestContext
): Promise<Response> {
  const user = ctx.user!;

  const unreadOnly = ctx.url.searchParams.get("unread_only") === "true";
  const page = Math.max(
    1,
    parseInt(ctx.url.searchParams.get("page") ?? "1", 10)
  );
  const perPage = Math.min(
    100,
    Math.max(1, parseInt(ctx.url.searchParams.get("per_page") ?? "20", 10))
  );

  const result = await getNotifications(user.id, unreadOnly, page, perPage);

  return json({ ...result, request_id: ctx.request_id });
}

// ── PATCH /api/v1/marketing/notifications/:id/read ───────────────────────────

export async function handleMarkNotificationRead(
  ctx: RequestContext
): Promise<Response> {
  const user = ctx.user!;
  const notificationId = ctx.params["id"];
  if (!notificationId) throw new BadRequestError("Missing notification id.");

  const updated = await markAsRead(notificationId, user.id);

  return json({ data: updated, request_id: ctx.request_id });
}
