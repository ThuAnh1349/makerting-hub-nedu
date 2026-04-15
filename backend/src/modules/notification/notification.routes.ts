/**
 * Notification module route dispatcher.
 *
 * Matches:
 *   GET   /api/v1/marketing/notifications
 *   PATCH /api/v1/marketing/notifications/:id/read
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import {
  handleListNotifications,
  handleMarkNotificationRead,
} from "./notification.controller.js";

const BASE = "/api/v1/marketing/notifications";

// Pre-compiled pattern for /:id/read
const READ_PATTERN = new RegExp(`^${BASE}/([^/]+)/read$`);

/**
 * Notification route dispatcher.
 *
 * @returns Response if matched, null to let the main router return 404.
 */
export async function notificationRoutes(
  req: Request,
  ctx: RequestContext
): Promise<Response | null> {
  const { method } = req;
  const { pathname } = ctx.url;

  // GET /api/v1/marketing/notifications
  if (method === "GET" && pathname === BASE) {
    return handleListNotifications(ctx);
  }

  // PATCH /api/v1/marketing/notifications/:id/read
  const readMatch = READ_PATTERN.exec(pathname);
  if (method === "PATCH" && readMatch) {
    ctx.params["id"] = readMatch[1]!;
    return handleMarkNotificationRead(ctx);
  }

  return null;
}
