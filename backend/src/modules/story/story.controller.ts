/**
 * Story module controllers.
 *
 * handleListStories  — GET  /stories
 * handleCreateStory  — POST /stories      (201)
 * handleStoryAction  — POST /stories/:id/actions
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import { BadRequestError } from "../../shared/middleware/error.handler.js";
import {
  CreateStorySchema,
  StoryActionSchema,
  StoryListQuerySchema,
} from "./story.schema.js";
import {
  listStories,
  createStory,
  performStoryAction,
} from "./story.service.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

function jsonOk(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ── handleListStories ──────────────────────────────────────────────────────────

/**
 * GET /api/v1/marketing/stories
 *
 * Optional query params: status, icp_tag, page, per_page
 */
export async function handleListStories(ctx: RequestContext): Promise<Response> {
  const rawQuery = Object.fromEntries(ctx.url.searchParams.entries());
  const parsed = StoryListQuerySchema.safeParse(rawQuery);

  if (!parsed.success) {
    throw parsed.error;
  }

  const result = await listStories(parsed.data);

  return jsonOk({ ...result, request_id: ctx.request_id });
}

// ── handleCreateStory ──────────────────────────────────────────────────────────

/**
 * POST /api/v1/marketing/stories
 *
 * Body: CreateStorySchema
 * Returns 201 with created story.
 */
export async function handleCreateStory(ctx: RequestContext): Promise<Response> {
  const user = ctx.user!;

  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    throw new BadRequestError("Request body must be valid JSON.");
  }

  const parsed = CreateStorySchema.safeParse(body);
  if (!parsed.success) {
    throw parsed.error;
  }

  const story = await createStory(parsed.data, user.id);

  return jsonOk({ data: story, request_id: ctx.request_id }, 201);
}

// ── handleStoryAction ──────────────────────────────────────────────────────────

/**
 * POST /api/v1/marketing/stories/:id/actions
 *
 * Body: StoryActionSchema (discriminated union: approve | deploy)
 * Any authenticated user may deploy; approve requires co_leader / marketing_leader.
 */
export async function handleStoryAction(
  ctx: RequestContext,
  storyId: string
): Promise<Response> {
  const user = ctx.user!;

  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    throw new BadRequestError("Request body must be valid JSON.");
  }

  const parsed = StoryActionSchema.safeParse(body);
  if (!parsed.success) {
    throw parsed.error;
  }

  const story = await performStoryAction(storyId, user.id, user.roles, parsed.data);

  return jsonOk({ data: story, request_id: ctx.request_id });
}
