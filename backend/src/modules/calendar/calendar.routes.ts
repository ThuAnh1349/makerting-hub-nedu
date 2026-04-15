/**
 * Calendar module route dispatcher.
 *
 * Matches:
 *   GET /api/v1/marketing/calendar
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import { handleGetCalendar } from "./calendar.controller.js";

const CALENDAR_PATH = "/api/v1/marketing/calendar";

/**
 * Calendar route dispatcher.
 *
 * @returns Response if matched, null to fall through to the main router.
 */
export async function calendarRoutes(
  req: Request,
  ctx: RequestContext
): Promise<Response | null> {
  const { method } = req;
  const { pathname } = ctx.url;

  if (method === "GET" && pathname === CALENDAR_PATH) {
    return handleGetCalendar(ctx);
  }

  return null;
}
