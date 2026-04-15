/**
 * Post module HTTP handlers.
 *
 * Routes:
 *   GET    /api/v1/marketing/posts              — list posts (RLS-aware)
 *   POST   /api/v1/marketing/posts              — create post
 *   GET    /api/v1/marketing/posts/:id          — get single post with approval history
 *   PATCH  /api/v1/marketing/posts/:id          — update draft/rejected post
 *   POST   /api/v1/marketing/posts/:id/actions  — state machine actions
 *   POST   /api/v1/marketing/posts/:id/media    — upload image/video attachment
 */

import type { RequestContext } from "../../shared/middleware/auth.middleware.js";
import {
  BadRequestError,
  NotFoundError,
} from "../../shared/middleware/error.handler.js";
import {
  CreatePostSchema,
  UpdatePostSchema,
  PostActionSchema,
  PostListQuerySchema,
} from "./post.schema.js";
import * as service from "./post.service.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function requirePostId(ctx: RequestContext): string {
  const id = ctx.params["id"];
  if (!id) throw new BadRequestError("Missing post id in URL.");
  return id;
}

// ── GET /api/v1/marketing/posts ───────────────────────────────────────────────

export async function handleListPosts(ctx: RequestContext): Promise<Response> {
  const user = ctx.user!;

  const rawParams = Object.fromEntries(ctx.url.searchParams.entries());
  const query = PostListQuerySchema.parse(rawParams);

  const page = query.page;
  const perPage = query.per_page;

  const { rows, total } = await service.findPosts(user.id, user.roles, {
    status: query.status as import("./post.types.js").PostStatus[] | undefined,
    campaign_id: query.campaign_id,
    channel_code: query.channel_code,
    page,
    per_page: perPage,
  });

  return json({
    data: rows,
    meta: {
      total,
      page,
      per_page: perPage,
      has_next: page * perPage < total,
      next_cursor: null, // offset-based pagination; cursor support future
    },
    request_id: ctx.request_id,
  });
}

// ── POST /api/v1/marketing/posts ──────────────────────────────────────────────

export async function handleCreatePost(ctx: RequestContext): Promise<Response> {
  const user = ctx.user!;

  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    throw new BadRequestError("Request body must be valid JSON.");
  }

  const data = CreatePostSchema.parse(body);
  const post = await service.createPost(user.id, data);

  return json({ data: post, request_id: ctx.request_id }, 201);
}

// ── GET /api/v1/marketing/posts/:id ──────────────────────────────────────────

export async function handleGetPost(
  ctx: RequestContext,
  postId: string
): Promise<Response> {
  const user = ctx.user!;

  const post = await service.getPostById(postId, user.id, user.roles);
  if (!post) throw new NotFoundError("Post", postId);

  return json({ data: post, request_id: ctx.request_id });
}

// ── PATCH /api/v1/marketing/posts/:id ────────────────────────────────────────

export async function handleUpdatePost(
  ctx: RequestContext,
  postId: string
): Promise<Response> {
  const user = ctx.user!;

  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    throw new BadRequestError("Request body must be valid JSON.");
  }

  const data = UpdatePostSchema.parse(body);
  const post = await service.updatePost(postId, user.id, user.roles, data);

  return json({ data: post, request_id: ctx.request_id });
}

// ── POST /api/v1/marketing/posts/:id/actions ─────────────────────────────────

export async function handlePostAction(
  ctx: RequestContext,
  postId: string
): Promise<Response> {
  const user = ctx.user!;

  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    throw new BadRequestError("Request body must be valid JSON.");
  }

  const action = PostActionSchema.parse(body);
  const post = await service.performAction(postId, user.id, user.roles, action);

  return json({ data: post, request_id: ctx.request_id });
}

// ── POST /api/v1/marketing/posts/:id/media ───────────────────────────────────

export async function handleUploadMedia(
  ctx: RequestContext,
  postId: string
): Promise<Response> {
  const user = ctx.user!;

  const contentType = ctx.request.headers.get("Content-Type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    throw new BadRequestError(
      "Content-Type must be multipart/form-data for media uploads."
    );
  }

  let formData: FormData;
  try {
    formData = await ctx.request.formData();
  } catch {
    throw new BadRequestError("Failed to parse multipart form data.");
  }

  const fileEntry = formData.get("file");
  if (!fileEntry || !(fileEntry instanceof Blob)) {
    throw new BadRequestError(
      "A file field named 'file' is required in the multipart form."
    );
  }

  const file = fileEntry as File;
  const filename = file instanceof File ? file.name : "upload";
  const fileContentType =
    (file instanceof File ? file.type : null) ||
    formData.get("content_type")?.toString() ||
    "application/octet-stream";

  const media = await service.uploadMedia(
    postId,
    user.id,
    user.roles,
    file,
    filename,
    fileContentType
  );

  return json({ data: media, request_id: ctx.request_id }, 201);
}
