/**
 * Referral module route dispatcher.
 *
 * Matches:
 *   GET /api/v1/marketing/referral/ambassadors
 *   GET /api/v1/marketing/referral/leads
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import {
  handleGetAmbassadors,
  handleGetReferralLeads,
} from "./referral.controller.js";

const BASE = "/api/v1/marketing/referral";

/**
 * Referral route dispatcher.
 *
 * @returns Response if a route matched, null otherwise.
 */
export async function referralRoutes(
  req: Request,
  ctx: RequestContext
): Promise<Response | null> {
  const { method } = req;
  const { pathname } = ctx.url;

  // GET /api/v1/marketing/referral/ambassadors
  if (method === "GET" && pathname === `${BASE}/ambassadors`) {
    return handleGetAmbassadors(ctx);
  }

  // GET /api/v1/marketing/referral/leads
  if (method === "GET" && pathname === `${BASE}/leads`) {
    return handleGetReferralLeads(ctx);
  }

  return null;
}
