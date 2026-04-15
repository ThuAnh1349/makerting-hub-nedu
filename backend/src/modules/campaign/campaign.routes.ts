/**
 * Campaign module route dispatcher.
 *
 * Matches:
 *   GET   /api/v1/marketing/campaigns
 *   POST  /api/v1/marketing/campaigns
 *   GET   /api/v1/marketing/campaigns/:id
 *   PATCH /api/v1/marketing/campaigns/:id/phase
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import {
  handleListCampaigns,
  handleCreateCampaign,
  handleGetCampaign,
  handleUpdatePhase,
} from "./campaign.controller.js";

const BASE = "/api/v1/marketing/campaigns";

// Pre-compiled patterns.
const CAMPAIGN_ID_PATTERN = new RegExp(`^${BASE}/([^/]+)$`);
const CAMPAIGN_PHASE_PATTERN = new RegExp(`^${BASE}/([^/]+)/phase$`);

/**
 * Campaign route dispatcher.
 *
 * @returns Response if matched, null if no route matched.
 */
export async function campaignRoutes(
  req: Request,
  ctx: RequestContext
): Promise<Response | null> {
  const { method } = req;
  const { pathname } = ctx.url;

  // PATCH /api/v1/marketing/campaigns/:id/phase — before :id match
  const phaseMatch = CAMPAIGN_PHASE_PATTERN.exec(pathname);
  if (method === "PATCH" && phaseMatch) {
    ctx.params["id"] = phaseMatch[1]!;
    return handleUpdatePhase(ctx);
  }

  // GET /api/v1/marketing/campaigns
  if (method === "GET" && pathname === BASE) {
    return handleListCampaigns(ctx);
  }

  // POST /api/v1/marketing/campaigns
  if (method === "POST" && pathname === BASE) {
    return handleCreateCampaign(ctx);
  }

  // GET /api/v1/marketing/campaigns/:id
  const idMatch = CAMPAIGN_ID_PATTERN.exec(pathname);
  if (method === "GET" && idMatch) {
    ctx.params["id"] = idMatch[1]!;
    return handleGetCampaign(ctx);
  }

  return null;
}
