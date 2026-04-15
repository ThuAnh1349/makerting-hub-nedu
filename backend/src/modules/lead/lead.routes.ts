/**
 * Lead module route dispatcher.
 *
 * Matches:
 *   GET  /api/v1/marketing/leads
 *   GET  /api/v1/marketing/leads/:id
 *   POST /api/v1/marketing/leads/:id/actions
 *   POST /api/v1/marketing/leads/sync         (webhook — no auth required)
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import {
  handleListLeads,
  handleGetLead,
  handleLeadAction,
  handleLeadSync,
} from "./lead.controller.js";

const BASE = "/api/v1/marketing/leads";

// Pre-compiled patterns for path matching.
const LEAD_ID_PATTERN = new RegExp(`^${BASE}/([^/]+)$`);
const LEAD_ACTIONS_PATTERN = new RegExp(`^${BASE}/([^/]+)/actions$`);
const LEAD_SYNC_PATH = `${BASE}/sync`;

/**
 * Lead route dispatcher.
 *
 * @param req      Raw Bun Request
 * @param ctx      Populated RequestContext (params will be set here)
 * @param rawBody  Pre-read raw body bytes — required for webhook HMAC verification
 * @returns        Response if matched, null if not matched (let main router 404)
 */
export async function leadRoutes(
  req: Request,
  ctx: RequestContext,
  rawBody?: Uint8Array
): Promise<Response | null> {
  const { method } = req;
  const { pathname } = ctx.url;

  // POST /api/v1/marketing/leads/sync — webhook, no auth, must come before :id match
  if (method === "POST" && pathname === LEAD_SYNC_PATH) {
    return handleLeadSync(ctx, rawBody ?? new Uint8Array());
  }

  // GET /api/v1/marketing/leads — list
  if (method === "GET" && pathname === BASE) {
    return handleListLeads(ctx);
  }

  // POST /api/v1/marketing/leads/:id/actions
  const actionsMatch = LEAD_ACTIONS_PATTERN.exec(pathname);
  if (method === "POST" && actionsMatch) {
    ctx.params["id"] = actionsMatch[1]!;
    return handleLeadAction(ctx);
  }

  // GET /api/v1/marketing/leads/:id — detail
  const idMatch = LEAD_ID_PATTERN.exec(pathname);
  if (method === "GET" && idMatch) {
    ctx.params["id"] = idMatch[1]!;
    return handleGetLead(ctx);
  }

  return null;
}
