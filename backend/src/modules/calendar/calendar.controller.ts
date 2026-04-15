/**
 * Calendar module HTTP handler.
 *
 * Route:
 *   GET /api/v1/marketing/calendar
 *
 * Query parameters:
 *   date_from    (required) ISO date or datetime string — range start (inclusive)
 *   date_to      (required) ISO date or datetime string — range end (inclusive)
 *   channel_code (optional) Filter results to a specific channel
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import { BadRequestError } from "../../shared/middleware/error.handler.js";
import { getCalendarPosts } from "./calendar.service.js";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ── GET /api/v1/marketing/calendar ───────────────────────────────────────────

export async function handleGetCalendar(ctx: RequestContext): Promise<Response> {
  const params = ctx.url.searchParams;

  const dateFrom = params.get("date_from");
  const dateTo   = params.get("date_to");
  const channelCode = params.get("channel_code") ?? undefined;

  if (!dateFrom) {
    throw new BadRequestError("Query parameter 'date_from' is required.");
  }
  if (!dateTo) {
    throw new BadRequestError("Query parameter 'date_to' is required.");
  }

  // Normalise bare date strings (YYYY-MM-DD) to start/end of day in UTC
  const normFrom = normaliseDate(dateFrom, "start");
  const normTo   = normaliseDate(dateTo, "end");

  const from = new Date(normFrom);
  const to   = new Date(normTo);

  if (isNaN(from.getTime())) {
    throw new BadRequestError(`Invalid date_from: "${dateFrom}"`);
  }
  if (isNaN(to.getTime())) {
    throw new BadRequestError(`Invalid date_to: "${dateTo}"`);
  }
  if (to < from) {
    throw new BadRequestError("'date_to' must be on or after 'date_from'.");
  }

  const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 90) {
    throw new BadRequestError(
      `Date range too large (${Math.ceil(diffDays)} days). Maximum is 90 days.`
    );
  }

  const posts = await getCalendarPosts(normFrom, normTo, channelCode);

  return json({
    data: posts,
    meta: {
      date_from: normFrom,
      date_to: normTo,
      channel_code: channelCode ?? null,
      total: posts.length,
    },
    request_id: ctx.request_id,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * If the input is a bare YYYY-MM-DD date, expand to a full ISO UTC datetime.
 * If the input already contains a 'T', return as-is.
 */
function normaliseDate(input: string, bound: "start" | "end"): string {
  if (input.includes("T")) return input;
  // Bare date — set to start or end of UTC day
  return bound === "start"
    ? `${input}T00:00:00.000Z`
    : `${input}T23:59:59.999Z`;
}
