/**
 * Story module route dispatcher.
 *
 * Matches:
 *   GET  /api/v1/marketing/stories
 *   POST /api/v1/marketing/stories
 *   POST /api/v1/marketing/stories/:id/actions
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import {
  handleListStories,
  handleCreateStory,
  handleStoryAction,
} from "./story.controller.js";

const BASE = "/api/v1/marketing/stories";

// Matches /api/v1/marketing/stories/{uuid}/actions
const ACTIONS_RE = /^\/api\/v1\/marketing\/stories\/([^/]+)\/actions$/;

/**
 * Story route dispatcher.
 *
 * @returns Response if a route matched, null otherwise.
 */
export async function storyRoutes(
  req: Request,
  ctx: RequestContext
): Promise<Response | null> {
  const { method } = req;
  const { pathname } = ctx.url;

  // GET /api/v1/marketing/stories
  if (method === "GET" && pathname === BASE) {
    return handleListStories(ctx);
  }

  // POST /api/v1/marketing/stories
  if (method === "POST" && pathname === BASE) {
    return handleCreateStory(ctx);
  }

  // POST /api/v1/marketing/stories/:id/actions
  const actionsMatch = ACTIONS_RE.exec(pathname);
  if (method === "POST" && actionsMatch) {
    const storyId = actionsMatch[1]!;
    ctx.params = { ...ctx.params, id: storyId };
    return handleStoryAction(ctx, storyId);
  }

  return null;
}
