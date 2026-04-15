/**
 * Post module route dispatcher.
 *
 * Matches:
 *   GET    /api/v1/marketing/posts
 *   POST   /api/v1/marketing/posts
 *   GET    /api/v1/marketing/posts/:id
 *   PATCH  /api/v1/marketing/posts/:id
 *   POST   /api/v1/marketing/posts/:id/actions
 *   POST   /api/v1/marketing/posts/:id/media
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import {
  handleListPosts,
  handleCreatePost,
  handleGetPost,
  handleUpdatePost,
  handlePostAction,
  handleUploadMedia,
} from "./post.controller.js";

const BASE = "/api/v1/marketing/posts";

// Pre-compiled path patterns
const POST_ACTIONS_PATTERN = new RegExp(`^${BASE}/([^/]+)/actions$`);
const POST_MEDIA_PATTERN   = new RegExp(`^${BASE}/([^/]+)/media$`);
const POST_ID_PATTERN      = new RegExp(`^${BASE}/([^/]+)$`);

/**
 * Post route dispatcher.
 *
 * @returns Response if the path was matched, null to fall through to the main router.
 */
export async function postRoutes(
  req: Request,
  ctx: RequestContext
): Promise<Response | null> {
  const { method } = req;
  const { pathname } = ctx.url;

  // GET /api/v1/marketing/posts — list
  if (method === "GET" && pathname === BASE) {
    return handleListPosts(ctx);
  }

  // POST /api/v1/marketing/posts — create
  if (method === "POST" && pathname === BASE) {
    return handleCreatePost(ctx);
  }

  // POST /api/v1/marketing/posts/:id/actions
  const actionsMatch = POST_ACTIONS_PATTERN.exec(pathname);
  if (method === "POST" && actionsMatch) {
    const postId = actionsMatch[1]!;
    ctx.params["id"] = postId;
    return handlePostAction(ctx, postId);
  }

  // POST /api/v1/marketing/posts/:id/media
  const mediaMatch = POST_MEDIA_PATTERN.exec(pathname);
  if (method === "POST" && mediaMatch) {
    const postId = mediaMatch[1]!;
    ctx.params["id"] = postId;
    return handleUploadMedia(ctx, postId);
  }

  // GET /api/v1/marketing/posts/:id — detail
  const idMatchGet = POST_ID_PATTERN.exec(pathname);
  if (method === "GET" && idMatchGet) {
    const postId = idMatchGet[1]!;
    ctx.params["id"] = postId;
    return handleGetPost(ctx, postId);
  }

  // PATCH /api/v1/marketing/posts/:id — update
  const idMatchPatch = POST_ID_PATTERN.exec(pathname);
  if (method === "PATCH" && idMatchPatch) {
    const postId = idMatchPatch[1]!;
    ctx.params["id"] = postId;
    return handleUpdatePost(ctx, postId);
  }

  return null;
}
